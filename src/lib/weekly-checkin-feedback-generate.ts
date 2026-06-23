/**
 * Pure-function generator for the Weekly Check-In Coach Feedback draft.
 * Extracted from the API route so the Inngest auto-response worker can call
 * it without a Supabase auth session.
 *
 * Input: checkin id + the admin Supabase client.
 * Output: a clean three-field draft, OR a structured error describing the
 *         failure (parse error, missing fields, jargon leak after retries).
 *
 * Does NOT save, does NOT email. Both side effects live with the caller.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildFeedbackSystemPrompt,
  buildFeedbackUserPrompt,
  stripEmDashes,
  findLeakedTerms,
  type FeedbackCFFSContext,
  type PriorCheckinSummary,
  type ProgramContext,
  type NutritionContext,
} from './weekly-checkin-feedback-prompt'
import { extractFirstJsonObject } from './extract-json'

export interface GenerateFeedbackSuccess {
  ok: true
  draft: { interpretation: string; reframe: string | null; next_focus: string }
  attempts: number
}

export interface GenerateFeedbackFailure {
  ok: false
  error: string
  leaks: string[]
  attempts: number
}

export type GenerateFeedbackResult = GenerateFeedbackSuccess | GenerateFeedbackFailure

const MAX_ATTEMPTS = 3

export async function generateFeedbackDraft(
  admin: SupabaseClient,
  checkinId: string
): Promise<GenerateFeedbackResult> {
  // ── Pull check-in ──────────────────────────────────────────────────────
  const { data: checkin } = await admin
    .from('weekly_checkins')
    .select('id, client_id, week_number, form_type, submitted_at, responses')
    .eq('id', checkinId)
    .maybeSingle()
  if (!checkin) {
    return { ok: false, error: 'Check-in not found', leaks: [], attempts: 0 }
  }

  // ── Client + intake + CFFS + prior + program in parallel ───────────────
  const [{ data: client }, { data: intake }, { data: cffsRows }, { data: priorRows }, { data: program }, { data: nutritionPlan }] = await Promise.all([
    admin.from('clients').select('id, name, medications').eq('id', checkin.client_id).maybeSingle(),
    admin
      .from('intakes')
      .select('dietary_restrictions, dietary_preferences, alcohol_intake')
      .eq('client_id', checkin.client_id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('cffs')
      .select(
        'body_state_classification, resolution_state, client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items, exposure_readiness_capacity, exposure_readiness_regulation, exposure_readiness_behaviour, generated_at, is_archived'
      )
      .eq('client_id', checkin.client_id)
      .eq('is_archived', false)
      .order('generated_at', { ascending: false })
      .limit(1),
    admin
      .from('weekly_checkins')
      .select('week_number, form_type, submitted_at, responses')
      .eq('client_id', checkin.client_id)
      .neq('id', checkinId)
      .lte('submitted_at', checkin.submitted_at)
      .order('submitted_at', { ascending: false })
      .limit(4),
    admin
      .from('programs')
      .select('block_name, week_duration, generated_at')
      .eq('client_id', checkin.client_id)
      .eq('is_active', true)
      .maybeSingle(),
    admin
      .from('nutrition_plans')
      .select('plan_name, meal_frequency, protein_anchor_g, estimated_calorie_band, key_priorities, weekly_structure_notes')
      .eq('client_id', checkin.client_id)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  if (!client) {
    return { ok: false, error: 'Client not found', leaks: [], attempts: 0 }
  }

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

  const priorCheckins: PriorCheckinSummary[] = (priorRows ?? []).map(r => ({
    weekNumber: r.week_number,
    formType: r.form_type as 'A' | 'B',
    submittedAt: r.submitted_at,
    responses: (r.responses ?? {}) as Record<string, string>,
  }))

  const programCtx: ProgramContext | null = program
    ? {
        blockName: program.block_name ?? null,
        weekInBlock: null,
        weekDuration: program.week_duration ?? null,
        rpeCreepSummary: null,
      }
    : null

  const nutritionCtx: NutritionContext | null = nutritionPlan
    ? {
        planName: nutritionPlan.plan_name ?? null,
        mealFrequency: nutritionPlan.meal_frequency ?? null,
        proteinAnchorG: nutritionPlan.protein_anchor_g ?? null,
        estimatedCalorieBand: nutritionPlan.estimated_calorie_band ?? null,
        keyPriorities: Array.isArray(nutritionPlan.key_priorities) ? nutritionPlan.key_priorities : null,
        weeklyStructureNotes: nutritionPlan.weekly_structure_notes ?? null,
      }
    : null

  const firstName = client.name?.split(' ')[0] ?? 'there'
  const userPrompt = buildFeedbackUserPrompt({
    client: {
      firstName,
      medications: client.medications ?? null,
      dietaryRestrictions: intake?.dietary_restrictions ?? null,
      dietaryPreferences: intake?.dietary_preferences ?? null,
      alcoholBaseline: intake?.alcohol_intake ?? null,
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
    nutrition: nutritionCtx,
  })

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'ANTHROPIC_API_KEY not configured', leaks: [], attempts: 0 }
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })

  const conversation: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: userPrompt },
  ]
  let attempts = 0
  let lastError: string | null = null
  let totalLeaksSeen: string[] = []

  while (attempts < MAX_ATTEMPTS) {
    attempts++
    let message
    try {
      message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: buildFeedbackSystemPrompt(),
        messages: conversation,
      })
    } catch (err) {
      return { ok: false, error: `AI error: ${err instanceof Error ? err.message : String(err)}`, leaks: totalLeaksSeen, attempts }
    }

    const content = message.content[0]
    if (!content || content.type !== 'text') {
      lastError = 'Unexpected response from AI'
      continue
    }

    const jsonText = extractFirstJsonObject(content.text)
    if (!jsonText) {
      lastError = `Could not parse draft. AI returned: ${content.text.slice(0, 160)}`
      continue
    }

    let parsed: { interpretation?: unknown; reframe?: unknown; next_focus?: unknown }
    try {
      parsed = JSON.parse(jsonText)
    } catch (err) {
      lastError = `Invalid JSON from AI: ${(err as Error).message}`
      continue
    }

    if (typeof parsed.interpretation !== 'string' || !parsed.interpretation.trim()) {
      lastError = 'AI draft missing required field: interpretation'
      continue
    }
    if (typeof parsed.next_focus !== 'string' || !parsed.next_focus.trim()) {
      lastError = 'AI draft missing required field: next_focus'
      continue
    }

    const reframeRaw = parsed.reframe
    const reframe: string | null =
      typeof reframeRaw === 'string' && reframeRaw.trim() && reframeRaw.trim().toLowerCase() !== 'null'
        ? reframeRaw
        : null

    const candidate = stripEmDashes({
      interpretation: parsed.interpretation,
      reframe,
      next_focus: parsed.next_focus,
    })

    const leakedTerms = [
      ...findLeakedTerms(candidate.interpretation),
      ...(candidate.reframe ? findLeakedTerms(candidate.reframe) : []),
      ...findLeakedTerms(candidate.next_focus),
    ]

    if (leakedTerms.length === 0) {
      return { ok: true, draft: candidate, attempts }
    }

    totalLeaksSeen = Array.from(new Set([...totalLeaksSeen, ...leakedTerms].map(t => t.toLowerCase())))
    if (attempts < MAX_ATTEMPTS) {
      conversation.push({ role: 'assistant', content: jsonText })
      conversation.push({
        role: 'user',
        content: `That draft contained internal terminology the client has never seen and that the system will reject. Specifically these terms must not appear: ${leakedTerms.map(t => `"${t}"`).join(', ')}. Rewrite the entire JSON object using ONLY plain client-facing words to express the same idea. Return only the corrected JSON, no commentary.`,
      })
      lastError = `Leaked: ${leakedTerms.join(', ')}`
    }
  }

  return {
    ok: false,
    error: `Could not produce a clean draft after ${MAX_ATTEMPTS} attempts (${totalLeaksSeen.length ? totalLeaksSeen.join(', ') : lastError ?? 'unknown'})`,
    leaks: totalLeaksSeen,
    attempts,
  }
}
