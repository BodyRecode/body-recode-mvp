import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildFeedbackSystemPrompt,
  buildFeedbackUserPrompt,
  stripEmDashes,
  findLeakedTerms,
  type FeedbackCFFSContext,
  type PriorCheckinSummary,
  type ProgramContext,
} from '@/lib/weekly-checkin-feedback-prompt'

/**
 * Generate a draft coach response for a weekly check-in.
 *
 * Mirrors the CFFS / Foundational Reading / Program Reading / Nutrition
 * Reading generator pattern: takes a check-in id, pulls all the context the
 * AI needs (CFFS, prior check-ins, active program, intake), calls Claude,
 * returns the JSON draft. Does NOT save or send. The coach reviews the draft
 * in the existing feedback form and approves by clicking Save + email.
 */
export const maxDuration = 300

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: checkinId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  // ── Pull the check-in ──────────────────────────────────────────────────
  const { data: checkin } = await admin
    .from('weekly_checkins')
    .select('id, client_id, week_number, form_type, submitted_at, responses')
    .eq('id', checkinId)
    .maybeSingle()

  if (!checkin) {
    return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
  }

  // ── Client facts (name + medications + dietary) ────────────────────────
  const { data: client } = await admin
    .from('clients')
    .select('id, name, medications')
    .eq('id', checkin.client_id)
    .maybeSingle()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Latest intake — for dietary context. The intakes table has no created_at
  // column on this schema, so order by submitted_at to pick the most recent.
  const { data: intake } = await admin
    .from('intakes')
    .select('dietary_restrictions, dietary_preferences')
    .eq('client_id', client.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Active CFFS ────────────────────────────────────────────────────────
  const { data: cffsRows } = await admin
    .from('cffs')
    .select(
      'body_state_classification, resolution_state, client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items, exposure_readiness_capacity, exposure_readiness_regulation, exposure_readiness_behaviour, generated_at, is_archived'
    )
    .eq('client_id', client.id)
    .eq('is_archived', false)
    .order('generated_at', { ascending: false })
    .limit(1)
  const cffsRow = cffsRows?.[0] ?? null
  const cffs: FeedbackCFFSContext | null = cffsRow
    ? {
        body_state_classification: cffsRow.body_state_classification,
        resolution_state: cffsRow.resolution_state,
        client_context_summary: cffsRow.client_context_summary,
        primary_patterns_and_signals: cffsRow.primary_patterns_and_signals,
        capacity_constraints_and_guardrails: cffsRow.capacity_constraints_and_guardrails,
        risk_flags_and_watch_items: cffsRow.risk_flags_and_watch_items,
        exposure_readiness_capacity: cffsRow.exposure_readiness_capacity,
        exposure_readiness_regulation: cffsRow.exposure_readiness_regulation,
        exposure_readiness_behaviour: cffsRow.exposure_readiness_behaviour,
      }
    : null

  // ── Prior check-ins (up to 4 most recent before this one) ──────────────
  const { data: priorRows } = await admin
    .from('weekly_checkins')
    .select('week_number, form_type, submitted_at, responses')
    .eq('client_id', client.id)
    .neq('id', checkinId)
    .lte('submitted_at', checkin.submitted_at)
    .order('submitted_at', { ascending: false })
    .limit(4)
  const priorCheckins: PriorCheckinSummary[] = (priorRows ?? []).map(r => ({
    weekNumber: r.week_number,
    formType: r.form_type as 'A' | 'B',
    submittedAt: r.submitted_at,
    responses: (r.responses ?? {}) as Record<string, string>,
  }))

  // ── Active program (block name + duration) ─────────────────────────────
  // Week-in-block left null intentionally: the programs table does not
  // store a block_start_week column on this schema, and the prompt
  // gracefully omits the line when weekInBlock is null.
  const { data: program } = await admin
    .from('programs')
    .select('block_name, week_duration, generated_at')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  const programCtx: ProgramContext | null = program
    ? {
        blockName: program.block_name ?? null,
        weekInBlock: null,
        weekDuration: program.week_duration ?? null,
        rpeCreepSummary: null,
      }
    : null

  // ── Build the prompts ──────────────────────────────────────────────────
  const firstName = client.name?.split(' ')[0] ?? 'there'
  const userPrompt = buildFeedbackUserPrompt({
    client: {
      firstName,
      medications: client.medications ?? null,
      dietaryRestrictions: intake?.dietary_restrictions ?? null,
      dietaryPreferences: intake?.dietary_preferences ?? null,
      readinessStatus: null,
      readinessDriftMessages: [],
    },
    cffs,
    thisCheckin: {
      weekNumber: checkin.week_number,
      formType: checkin.form_type as 'A' | 'B',
      submittedAt: checkin.submitted_at,
      responses: (checkin.responses ?? {}) as Record<string, string>,
    },
    priorCheckins,
    program: programCtx,
  })

  // ── Call Claude ────────────────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: buildFeedbackSystemPrompt(),
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Anthropic API error (feedback generate):', msg)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (!content || content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  // Match the first balanced JSON object in the response.
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json(
      { error: `Could not parse draft. AI returned: ${content.text.slice(0, 160)}` },
      { status: 500 }
    )
  }

  let parsed: { interpretation?: unknown; reframe?: unknown; next_focus?: unknown }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid JSON from AI: ${(err as Error).message}` },
      { status: 500 }
    )
  }

  if (typeof parsed.interpretation !== 'string' || !parsed.interpretation.trim()) {
    return NextResponse.json({ error: 'AI draft missing required field: interpretation' }, { status: 500 })
  }
  if (typeof parsed.next_focus !== 'string' || !parsed.next_focus.trim()) {
    return NextResponse.json({ error: 'AI draft missing required field: next_focus' }, { status: 500 })
  }
  // reframe must be string-or-null. Coerce other shapes to null.
  const reframeRaw = parsed.reframe
  const reframe: string | null =
    typeof reframeRaw === 'string' && reframeRaw.trim() && reframeRaw.trim().toLowerCase() !== 'null'
      ? reframeRaw
      : null

  const draft = stripEmDashes({
    interpretation: parsed.interpretation,
    reframe,
    next_focus: parsed.next_focus,
  })

  // Second line of defence against internal terminology slipping into client
  // text. The prompt already forbids these explicitly; if anything still
  // leaks, surface as a failure so the coach can regenerate rather than ship
  // a draft with "CFFS" / "spatial patterning" / etc. visible to the client.
  const leakedTerms = [
    ...findLeakedTerms(draft.interpretation),
    ...(draft.reframe ? findLeakedTerms(draft.reframe) : []),
    ...findLeakedTerms(draft.next_focus),
  ]
  if (leakedTerms.length > 0) {
    const unique = Array.from(new Set(leakedTerms.map(t => t.toLowerCase())))
    return NextResponse.json(
      {
        error: `Draft contained internal terminology the client would not understand (${unique.join(', ')}). Click Generate again to redraft.`,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ draft })
}
