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
import { AI_MODELS } from './ai-models'

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
      // Operational tier: this is a coach-reviewed content draft (approval-gated
      // before it reaches a client), so per ai-models.ts it belongs on operational.
      // The 2026-07-29 promotion to clinical (claude-sonnet-5) broke JSON parsing
      // here — Sonnet wrapped the reply so extractFirstJsonObject failed 3x and no
      // draft was produced (silent since ~2 Aug). Haiku parsed cleanly before that.
      message = await anthropic.messages.create({
        model: AI_MODELS.operational,
        max_tokens: 2000,
        system: buildFeedbackSystemPrompt(),
        messages: conversation,
      })
    } catch (err) {
      return { ok: false, error: `AI error: ${err instanceof Error ? err.message : String(err)}`, leaks: totalLeaksSeen, attempts }
    }

    const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
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

    // Apply partner terminology substitutions post-generation. No-op for BR
    // (returns text unchanged). For Mode A+ tenants, rewrites "from => to"
    // pairs configured in doctrineParameters.
    const { applyPartnerTerminology, findPartnerBannedPhrase } = await import('./doctrine-parameters')
    candidate.interpretation = applyPartnerTerminology(candidate.interpretation)
    if (candidate.reframe) candidate.reframe = applyPartnerTerminology(candidate.reframe)
    candidate.next_focus = applyPartnerTerminology(candidate.next_focus)

    const leakedTerms = [
      ...findLeakedTerms(candidate.interpretation),
      ...(candidate.reframe ? findLeakedTerms(candidate.reframe) : []),
      ...findLeakedTerms(candidate.next_focus),
    ]

    // Partner-specific banned phrase check. Additive to the platform-wide list.
    const partnerBanned: string[] = []
    for (const field of [candidate.interpretation, candidate.reframe, candidate.next_focus]) {
      if (!field) continue
      const hit = findPartnerBannedPhrase(field)
      if (hit && !partnerBanned.includes(hit)) partnerBanned.push(hit)
    }
    if (partnerBanned.length > 0) leakedTerms.push(...partnerBanned)

    // Nutrition-prescription grounding: if the active plan has a meal
    // frequency, scan every field for "(N) meals" / "(N) snacks" patterns
    // and verify they match the plan exactly. Catches the case where the
    // prompt rule was followed in spirit but the model split the count into
    // "three meals plus one snack" or similar workarounds.
    //
    // Triggered by Amanda W7 (2026-06-23): next_focus said "three meals
    // plus one snack" against her 4-meal active plan. Ruby W6/W7 hit the
    // same pattern. The prompt rule alone wasn't enough.
    const mealMismatches = nutritionCtx?.mealFrequency != null
      ? findMealCountMismatches(
          [candidate.interpretation, candidate.reframe ?? '', candidate.next_focus],
          nutritionCtx.mealFrequency
        )
      : []

    if (leakedTerms.length === 0 && mealMismatches.length === 0) {
      return { ok: true, draft: candidate, attempts }
    }

    totalLeaksSeen = Array.from(new Set([
      ...totalLeaksSeen,
      ...leakedTerms,
      ...mealMismatches.map(m => `meal-count:${m}`),
    ].map(t => t.toLowerCase())))

    if (attempts < MAX_ATTEMPTS) {
      conversation.push({ role: 'assistant', content: jsonText })
      const correctionParts: string[] = []
      if (leakedTerms.length > 0) {
        correctionParts.push(`Internal terminology must not appear: ${leakedTerms.map(t => `"${t}"`).join(', ')}.`)
      }
      if (mealMismatches.length > 0 && nutritionCtx?.mealFrequency != null) {
        correctionParts.push(
          `Meal-count mismatch. Their ACTIVE NUTRITION PLAN prescribes ${nutritionCtx.mealFrequency} meals per day. The draft used: ${mealMismatches.map(m => `"${m}"`).join(', ')}. Every reference must say "${numberWord(nutritionCtx.mealFrequency)} meals" (or "${nutritionCtx.mealFrequency} meals") with NO snack split. Do NOT write "three meals plus one snack" — the plan calls all four eating windows meals.`
        )
      }
      conversation.push({
        role: 'user',
        content: `${correctionParts.join(' ')} Rewrite the entire JSON object correcting these. Return only the corrected JSON, no commentary.`,
      })
      lastError = `Leaked: ${leakedTerms.join(', ')}${mealMismatches.length ? `; meal-count: ${mealMismatches.join(', ')}` : ''}`
    }
  }

  return {
    ok: false,
    error: `Could not produce a clean draft after ${MAX_ATTEMPTS} attempts (${totalLeaksSeen.length ? totalLeaksSeen.join(', ') : lastError ?? 'unknown'})`,
    leaks: totalLeaksSeen,
    attempts,
  }
}

const WORD_TO_NUMBER: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}

/**
 * Scan output text for "(N) meals" or "(N) snacks" patterns and return any
 * fragments where the count doesn't match the expected meal frequency.
 *
 * Catches both numeric ("3 meals") and word ("three meals") forms, and
 * flags the snack-split workaround ("three meals plus one snack" when the
 * plan is 4) because every eating window the plan prescribes is a meal,
 * not "meals + snacks".
 *
 * Returns the offending fragments (max 80 chars) for the retry prompt to
 * quote back at the model.
 */
function findMealCountMismatches(texts: string[], expectedMeals: number): string[] {
  const mismatches: string[] = []
  // Matches: "3 meals", "three meals", "3 snacks", "two snacks" (case-insensitive)
  const pattern = /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s*(meals?|snacks?)\b/gi
  for (const text of texts) {
    if (!text) continue
    let match: RegExpExecArray | null
    pattern.lastIndex = 0
    while ((match = pattern.exec(text)) !== null) {
      const numToken = match[1].toLowerCase()
      const unitToken = match[2].toLowerCase()
      const n = WORD_TO_NUMBER[numToken] ?? Number(numToken)
      if (!Number.isFinite(n)) continue
      // Any snack mention is a violation: the plan doesn't distinguish
      // meals from snacks — every eating window is a meal.
      if (unitToken.startsWith('snack')) {
        const start = Math.max(0, match.index - 20)
        const end = Math.min(text.length, match.index + match[0].length + 20)
        mismatches.push(text.slice(start, end).trim())
        continue
      }
      // Meal mentions must match the prescribed frequency.
      if (n !== expectedMeals) {
        const start = Math.max(0, match.index - 20)
        const end = Math.min(text.length, match.index + match[0].length + 20)
        mismatches.push(text.slice(start, end).trim())
      }
    }
  }
  return Array.from(new Set(mismatches))
}
