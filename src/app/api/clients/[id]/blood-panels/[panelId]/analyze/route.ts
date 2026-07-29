import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildCoachAnalysisSystemPrompt,
  buildCoachAnalysisUserPrompt,
  stripEmDashes,
  type BloodPanelExtraction,
  type BloodPanelCFFSContext,
  type BloodMarker,
} from '@/lib/blood-panel-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'
import { AI_MODELS } from '@/lib/ai-models'

/**
 * Generate the coach-facing Blood Panel Analysis for a specific panel. Reads
 * the already-transcribed markers (no file re-read) plus CFFS / medications /
 * active-plan context. Writes structured JSON to blood_panels.analysis and
 * advances status to 'analyzed'. Coach-gated; nothing reaches the client here.
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

  const admin = createAdminClient()

  const { data: panel } = await admin
    .from('blood_panels')
    .select('id, client_id, panel_summary, collected_on, lab_name, markers, gp_flags, extraction_meta, status, approved_for_plan')
    .eq('id', panelId)
    .eq('client_id', id)
    .maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Blood panel not found' }, { status: 404 })

  const markers = (panel.markers ?? []) as BloodMarker[]
  if (markers.length === 0) {
    return NextResponse.json(
      { error: 'No markers transcribed for this panel yet. Re-run extraction first, or upload a clearer copy.' },
      { status: 400 }
    )
  }

  const extraction: BloodPanelExtraction = {
    panel_summary: panel.panel_summary ?? 'Blood panel.',
    collected_on: panel.collected_on ?? null,
    lab_name: panel.lab_name ?? null,
    markers,
    gp_flags: (panel.gp_flags ?? []) as string[],
    unreadable: false,
    notes: (panel.extraction_meta as { notes?: string } | null)?.notes ?? null,
  }

  const [{ data: client }, { data: cffsRows }, { data: intakes }, { data: program }, { data: nutrition }] = await Promise.all([
    admin.from('clients').select('name, medications').eq('id', id).maybeSingle(),
    admin
      .from('cffs')
      .select('body_state_classification, client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items, generated_at, is_archived')
      .eq('client_id', id)
      .eq('is_archived', false)
      .order('generated_at', { ascending: false })
      .limit(1),
    admin
      .from('intakes')
      .select('date_of_birth, gender, full_name, primary_goal, desired_timeline')
      .eq('client_id', id)
      .order('submitted_at', { ascending: false })
      .limit(1),
    admin.from('programs').select('block_name').eq('client_id', id).eq('is_active', true).maybeSingle(),
    admin.from('nutrition_plans').select('plan_name').eq('client_id', id).eq('is_active', true).maybeSingle(),
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

  const intake = intakes?.[0] ?? null
  const firstName = client?.name?.split(' ')[0] ?? 'client'

  const userPrompt = buildCoachAnalysisUserPrompt({
    client: {
      firstName,
      fullName: intake?.full_name ?? client?.name ?? null,
      dateOfBirth: intake?.date_of_birth ?? null,
      gender: intake?.gender ?? null,
    },
    extraction,
    cffs,
    intake: intake ? { primary_goal: intake.primary_goal, desired_timeline: intake.desired_timeline } : null,
    medicationsText: client?.medications ?? null,
    activeProgramBlockName: program?.block_name ?? null,
    activeNutritionPlanName: nutrition?.plan_name ?? null,
  })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })

  let message
  try {
    message = await anthropic.messages.create({
      model: AI_MODELS.clinical,
      max_tokens: 4000,
      system: withTemporalContext(buildCoachAnalysisSystemPrompt()),
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Anthropic API error (blood panel analyze):', msg)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (!content || content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    return NextResponse.json(
      { error: `Could not parse analysis. AI returned: ${content.text.slice(0, 160)}` },
      { status: 500 }
    )
  }

  let parsed: { groups?: unknown; combined_picture?: unknown }
  try {
    parsed = JSON.parse(jsonText)
  } catch (err) {
    return NextResponse.json({ error: `Invalid JSON from AI: ${(err as Error).message}` }, { status: 500 })
  }

  if (!Array.isArray(parsed.groups)) {
    return NextResponse.json({ error: 'AI analysis missing required field: groups (array)' }, { status: 500 })
  }
  if (typeof parsed.combined_picture !== 'string') {
    return NextResponse.json({ error: 'AI analysis missing required field: combined_picture (string)' }, { status: 500 })
  }

  const analysis = stripEmDashes(parsed)
  const nowIso = new Date().toISOString()

  const { error: updateErr } = await admin
    .from('blood_panels')
    .update({
      analysis,
      analyzed_at: nowIso,
      // Only advance to 'analyzed' if not already approved (approval is terminal-ish).
      status: panel.approved_for_plan ? 'approved' : 'analyzed',
    })
    .eq('id', panelId)
  if (updateErr) {
    return NextResponse.json({ error: `Failed to save analysis: ${updateErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ analysis, analyzedAt: nowIso })
}
