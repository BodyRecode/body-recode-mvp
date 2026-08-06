import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildClientReadingSystemPrompt,
  buildClientReadingUserPrompt,
  stripEmDashes,
  findLeakedTerms,
  type BloodPanelExtraction,
  type BloodPanelCFFSContext,
  type BloodMarker,
} from '@/lib/blood-panel-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'
import { AI_MODELS } from '@/lib/ai-models'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Generate the client-facing Blood Panel Reading for a panel. Requires the
 * coach analysis to exist first (it is the reference material). Writes JSON to
 * blood_panels.reading. Does NOT publish — the coach clicks Publish separately.
 * Auto-retries up to 3 times if the draft leaks internal jargon, same pattern
 * as the medications + weekly-checkin readings.
 */
export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; panelId: string }> }
) {
  const { id, panelId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const admin = createAdminClient()

  const { data: panel } = await admin
    .from('blood_panels')
    .select('id, client_id, panel_summary, collected_on, lab_name, markers, gp_flags, extraction_meta, analysis, approved_for_plan')
    .eq('id', panelId)
    .eq('client_id', id)
    .maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Blood panel not found' }, { status: 404 })

  if (!panel.analysis) {
    return NextResponse.json(
      { error: 'Generate the coach Blood Panel Analysis first. The reading translates from it.' },
      { status: 400 }
    )
  }

  const markers = (panel.markers ?? []) as BloodMarker[]
  const extraction: BloodPanelExtraction = {
    panel_summary: panel.panel_summary ?? 'Blood panel.',
    collected_on: panel.collected_on ?? null,
    lab_name: panel.lab_name ?? null,
    markers,
    gp_flags: (panel.gp_flags ?? []) as string[],
    unreadable: false,
    notes: null,
  }

  const [{ data: client }, { data: cffsRows }, { data: intake }] = await Promise.all([
    admin.from('clients').select('name').eq('id', id).maybeSingle(),
    admin
      .from('cffs')
      .select('body_state_classification, client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items, generated_at, is_archived')
      .eq('client_id', id)
      .eq('is_archived', false)
      .order('generated_at', { ascending: false })
      .limit(1),
    admin.from('intakes').select('date_of_birth, gender').eq('client_id', id).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const cffsRow = cffsRows?.[0] ?? null
  const cffs: BloodPanelCFFSContext | null = cffsRow
    ? {
        body_state_classification: cffsRow.body_state_classification,
        client_context_summary: cffsRow.client_context_summary,
        primary_patterns_and_signals: cffsRow.primary_patterns_and_signals,
        capacity_constraints_and_guardrails: cffsRow.capacity_constraints_and_guardrails,
        risk_flags_and_watch_items: cffsRow.risk_flags_and_watch_items,
      }
    : null

  const firstName = client?.name?.split(' ')[0] ?? 'there'

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })

  const conversation: { role: 'user' | 'assistant'; content: string }[] = [
    {
      role: 'user',
      content: buildClientReadingUserPrompt({
        client: { firstName, fullName: client?.name ?? null, dateOfBirth: intake?.date_of_birth ?? null, gender: intake?.gender ?? null },
        extraction,
        coachAnalysis: panel.analysis,
        cffs,
      }),
    },
  ]

  const REQUIRED = ['bp_what_we_saw', 'bp_why_it_matters', 'bp_how_we_account_for_it', 'bp_what_to_watch'] as const
  let reading: Record<string, string> | null = null
  let leaksSeen: string[] = []
  let lastError: string | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: AI_MODELS.clinical,
        max_tokens: 3000,
        system: withTemporalContext(buildClientReadingSystemPrompt()),
        messages: conversation,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Anthropic API error (blood panel reading):', msg)
      return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
    }

    const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
    if (!content || content.type !== 'text') { lastError = 'Unexpected response from AI'; continue }
    const jsonText = extractFirstJsonObject(content.text)
    if (!jsonText) { lastError = `Could not parse: ${content.text.slice(0, 160)}`; continue }
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonText)
    } catch (err) {
      lastError = `Invalid JSON: ${(err as Error).message}`; continue
    }
    const missing = REQUIRED.filter(k => typeof parsed[k] !== 'string' || !(parsed[k] as string).trim())
    if (missing.length > 0) { lastError = `Missing required fields: ${missing.join(', ')}`; continue }

    const candidate = stripEmDashes({
      bp_what_we_saw: parsed.bp_what_we_saw,
      bp_why_it_matters: parsed.bp_why_it_matters,
      bp_how_we_account_for_it: parsed.bp_how_we_account_for_it,
      bp_what_to_watch: parsed.bp_what_to_watch,
    } as Record<string, string>)

    const allText = REQUIRED.map(k => candidate[k]).join(' ')
    const leaks = findLeakedTerms(allText)
    if (leaks.length === 0) { reading = candidate; break }
    leaksSeen = Array.from(new Set([...leaksSeen, ...leaks].map(t => t.toLowerCase())))
    if (attempt < 3) {
      conversation.push({ role: 'assistant', content: jsonText })
      conversation.push({
        role: 'user',
        content: `That draft contained internal terminology the client has never seen. These terms must not appear: ${leaks.map(t => `"${t}"`).join(', ')}. Rewrite the entire JSON object using ONLY plain client-facing words. Return only the corrected JSON.`,
      })
      lastError = `Leaked: ${leaks.join(', ')}`
    }
  }

  if (!reading) {
    return NextResponse.json(
      { error: `Could not produce a clean reading after 3 attempts (${leaksSeen.length ? leaksSeen.join(', ') : lastError ?? 'unknown'}). Try again.` },
      { status: 500 }
    )
  }

  const nowIso = new Date().toISOString()
  const { error: updateErr } = await admin
    .from('blood_panels')
    .update({ reading, reading_generated_at: nowIso })
    .eq('id', panelId)
  if (updateErr) {
    return NextResponse.json({ error: `Failed to save reading: ${updateErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ reading, generatedAt: nowIso })
}
