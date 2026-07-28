import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildCoachAnalysisSystemPrompt,
  buildCoachAnalysisUserPrompt,
  stripEmDashes,
  type MedicationsCFFSContext,
} from '@/lib/medications-analysis-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'

/**
 * Generate the coach-facing Medications Analysis for a client. Writes the
 * structured JSON to clients.medications_analysis. Coach is the approval
 * gate by virtue of clicking Regenerate; nothing is sent to the client by
 * this endpoint (the client reading is a separate generate + publish step).
 */
export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, medications, medications_updated_at')
    .eq('id', id)
    .maybeSingle()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const medsText = (client.medications ?? '').trim()
  if (!medsText) {
    // Empty meds → write the empty-state structure directly, skip the AI call.
    const empty = { medications: [], combined_picture: 'No medications recorded for this client.' }
    const nowIso = new Date().toISOString()
    await admin
      .from('clients')
      .update({ medications_analysis: empty, medications_analyzed_at: nowIso })
      .eq('id', id)
    return NextResponse.json({ analysis: empty, analyzedAt: nowIso, skippedAi: true })
  }

  // Pull context: latest active CFFS + latest intake + active program/nutrition.
  const [{ data: cffsRows }, { data: intakes }, { data: program }, { data: nutrition }] = await Promise.all([
    admin
      .from('cffs')
      .select('body_state_classification, client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items, generated_at, is_archived')
      .eq('client_id', id)
      .eq('is_archived', false)
      .order('generated_at', { ascending: false })
      .limit(1),
    admin
      .from('intakes')
      .select('date_of_birth, gender, occupation, full_name, primary_goal, desired_timeline, training_responses, nutrition_responses, sleep_responses, stress_responses')
      .eq('client_id', id)
      .order('submitted_at', { ascending: false })
      .limit(1),
    admin
      .from('programs')
      .select('block_name')
      .eq('client_id', id)
      .eq('is_active', true)
      .maybeSingle(),
    admin
      .from('nutrition_plans')
      .select('plan_name')
      .eq('client_id', id)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const cffsRow = cffsRows?.[0] ?? null
  const cffs: MedicationsCFFSContext | null = cffsRow
    ? {
        body_state_classification: cffsRow.body_state_classification,
        client_context_summary: cffsRow.client_context_summary,
        primary_patterns_and_signals: cffsRow.primary_patterns_and_signals,
        capacity_constraints_and_guardrails: cffsRow.capacity_constraints_and_guardrails,
        risk_flags_and_watch_items: cffsRow.risk_flags_and_watch_items,
      }
    : null

  const intake = intakes?.[0] ?? null
  const firstName = client.name?.split(' ')[0] ?? 'client'
  const fullName = intake?.full_name ?? client.name ?? null

  const userPrompt = buildCoachAnalysisUserPrompt({
    client: {
      firstName,
      fullName,
      dateOfBirth: intake?.date_of_birth ?? null,
      gender: intake?.gender ?? null,
      occupation: intake?.occupation ?? null,
    },
    medicationsText: medsText,
    cffs,
    intake,
    activeProgramBlockName: program?.block_name ?? null,
    activeNutritionPlanName: nutrition?.plan_name ?? null,
  })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })

  // Token-budget strategy: start at 8000, retry once at 16000 if the model
  // hits max_tokens. Amanda's W6 stack (Vyvanse + Brintellix + GLP-1 +
  // estradiol patches + lysine) was the trigger — 4000 was tight, the
  // model truncated mid-object, extractFirstJsonObject correctly returned
  // null, and the error message just showed the truncated prefix. Larger
  // stacks need more room.
  async function callModel(maxTokens: number) {
    return anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: withTemporalContext(buildCoachAnalysisSystemPrompt()),
      messages: [{ role: 'user', content: userPrompt }],
    })
  }

  let message
  try {
    message = await callModel(8000)
    if (message.stop_reason === 'max_tokens') {
      console.warn('[medications-analyze] hit max_tokens at 8000, retrying at 16000')
      message = await callModel(16000)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Anthropic API error (medications analyze):', msg)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (!content || content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    // Distinguish "model truncated" from "model emitted garbage" — the
    // coach-facing error message is very different.
    const truncated = message.stop_reason === 'max_tokens'
    const usage = `(in=${message.usage?.input_tokens ?? '?'}, out=${message.usage?.output_tokens ?? '?'})`
    const detail = truncated
      ? `Model truncated at 16000 tokens ${usage}. This medication stack is unusually large. Open a code change to raise the cap.`
      : `Model returned non-JSON or unbalanced output ${usage}. First 160 chars: ${content.text.slice(0, 160)}`
    console.error('[medications-analyze] parse failed:', detail)
    return NextResponse.json({ error: `Could not parse analysis. ${detail}` }, { status: 500 })
  }

  let parsed: { medications?: unknown; combined_picture?: unknown }
  try {
    parsed = JSON.parse(jsonText)
  } catch (err) {
    return NextResponse.json({ error: `Invalid JSON from AI: ${(err as Error).message}` }, { status: 500 })
  }

  if (!Array.isArray(parsed.medications)) {
    return NextResponse.json({ error: 'AI analysis missing required field: medications (array)' }, { status: 500 })
  }
  if (typeof parsed.combined_picture !== 'string') {
    return NextResponse.json({ error: 'AI analysis missing required field: combined_picture (string)' }, { status: 500 })
  }

  const analysis = stripEmDashes(parsed)
  const nowIso = new Date().toISOString()

  const { error: updateErr } = await admin
    .from('clients')
    .update({ medications_analysis: analysis, medications_analyzed_at: nowIso })
    .eq('id', id)
  if (updateErr) {
    return NextResponse.json({ error: `Failed to save analysis: ${updateErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ analysis, analyzedAt: nowIso })
}
