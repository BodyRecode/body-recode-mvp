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
  type ActiveCareContext,
  type FeedbackCFFSContext,
  type PriorCheckinSummary,
  type PriorFeedbackSummary,
  type ProgramContext,
  type NutritionContext,
} from './weekly-checkin-feedback-prompt'
import { extractFirstJsonObject } from './extract-json'
import { AI_MODELS } from './ai-models'
import { currentBlockWeek, parsePrescribedSessions } from './workout-logging'
import { evaluateRpeCreep } from './rpe-creep-monitor'
import { getActiveConstraintManifest } from './recovery-state-machine'
import { RECOVERY_PROTOCOLS } from './recovery-protocols-seed'
import { SUPPLEMENT_SUBSTANCES } from './supplement-substances-seed'
import type { NutritionConstraintManifest, TrainingConstraintManifest } from './recovery-doctrine'

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

export interface GenerateFeedbackOptions {
  /**
   * Free-text steer the coach typed in the Draft with AI box before clicking
   * Generate (added 2026-08-17). Rendered as a highest-priority COACH
   * DIRECTION block at the end of the user prompt. The Inngest auto-response
   * worker never passes this: it fires on submission, before Kade has looked
   * at the check-in.
   */
  coachNotes?: string | null
}

export async function generateFeedbackDraft(
  admin: SupabaseClient,
  checkinId: string,
  options: GenerateFeedbackOptions = {}
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
  const [
    { data: client },
    { data: intake },
    { data: cffsRows },
    { data: priorRows },
    { data: program },
    { data: nutritionPlan },
    { data: priorFeedbackRows },
  ] = await Promise.all([
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
      .select('id, block_name, week_duration, generated_at, training_goal, training_frequency, conditioning, sessions')
      .eq('client_id', checkin.client_id)
      .eq('is_active', true)
      .maybeSingle(),
    admin
      .from('nutrition_plans')
      .select('plan_name, meal_frequency, protein_anchor_g, estimated_calorie_band, key_priorities, weekly_structure_notes')
      .eq('client_id', checkin.client_id)
      .eq('is_active', true)
      .maybeSingle(),
    // Prior coach responses, so next_focus can avoid re-prescribing the same
    // domain week after week (2026-08-17).
    admin
      .from('weekly_checkin_feedback')
      .select('next_focus, created_at, weekly_checkin_id, weekly_checkins!inner(week_number, form_type)')
      .eq('client_id', checkin.client_id)
      .neq('weekly_checkin_id', checkinId)
      // Only responses that already existed when this check-in landed, so a
      // regenerate on an older week doesn't get told about anchors from weeks
      // that came after it.
      .lte('created_at', checkin.submitted_at)
      .order('created_at', { ascending: false })
      .limit(3),
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

  // ── Training context ────────────────────────────────────────────────────
  // Pre-2026-08-17 this was block name only, while the nutrition block carried
  // meal frequency, protein, calories and priorities. The imbalance pushed
  // next_focus to nutrition nearly every week because it was the only domain
  // with a concrete prescription to prescribe against. Fill in the training
  // side: prescribed sessions, week-in-block, what was actually logged, and
  // the effort-drift read.
  const blockWeek = program?.generated_at ? currentBlockWeek(program.generated_at) : null

  let sessionsLoggedThisWeek: number | null = null
  let rpeCreepSummary: string | null = null
  if (program?.id && blockWeek) {
    const [{ count }, creep] = await Promise.all([
      admin
        .from('session_completions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', checkin.client_id)
        .eq('program_id', program.id)
        .eq('week_number_in_block', blockWeek),
      evaluateRpeCreep(admin as never, checkin.client_id, program.id, blockWeek),
    ])
    sessionsLoggedThisWeek = count ?? null
    if (creep.severity !== 'none' && creep.findings.length > 0) {
      const worst = creep.findings.slice(0, 3).map(f => `${f.exerciseName} running ${f.delta > 0 ? '+' : ''}${f.delta} above prescribed effort`)
      rpeCreepSummary = `${creep.severity} (${creep.creepingCount} exercise${creep.creepingCount === 1 ? '' : 's'} drifting): ${worst.join('; ')}`
    }
  }

  const programCtx: ProgramContext | null = program
    ? {
        blockName: program.block_name ?? null,
        weekInBlock: blockWeek,
        weekDuration: program.week_duration ?? null,
        rpeCreepSummary,
        trainingGoal: program.training_goal ?? null,
        sessionsPerWeek: program.training_frequency ?? null,
        conditioning: program.conditioning ?? null,
        // day_label already reads "Monday — Lower Stability Foundation".
        sessionDays: parsePrescribedSessions(program.sessions)
          .map(s => s.day_label)
          .filter(Boolean),
        sessionsLoggedThisWeek,
      }
    : null

  // ── What the client is already operating under ──────────────────────────
  // The RRS constraint governor (Layer 2) plus the two Layer 3 prescription
  // surfaces. Added 2026-08-17: the response was previously blind to all
  // three, so it could write "hold all three sessions" while RRS had the
  // client's training capped, or stay silent about protocols the client can
  // see in their own portal.
  const [rrsState, { data: protocolRows }, { data: supplementRows }] = await Promise.all([
    getActiveConstraintManifest(checkin.client_id),
    admin
      .from('recovery_protocol_assignments')
      .select('protocol_slug, coach_note')
      .eq('client_id', checkin.client_id)
      .eq('status', 'active'),
    admin
      .from('supplement_assignments')
      .select('substance_slug, coach_note')
      .eq('client_id', checkin.client_id)
      .eq('status', 'active'),
  ])

  const activeCare: ActiveCareContext = {
    rrs: rrsState
      ? {
          playbookName: rrsState.playbook.name,
          purpose: rrsState.playbook.purpose,
          daysActive: rrsState.state.days_active,
          trainingSummary: describeTrainingConstraints(rrsState.playbook.trainingConstraints),
          nutritionSummary: describeNutritionConstraints(rrsState.playbook.nutritionConstraints),
          prohibitions: rrsState.playbook.prohibitions,
        }
      : null,
    assignedProtocols: (protocolRows ?? []).flatMap(r => {
      const p = RECOVERY_PROTOCOLS.find(x => x.slug === r.protocol_slug)
      return p ? [{ name: p.name, category: p.category, coachNote: r.coach_note ?? null }] : []
    }),
    assignedSupplements: (supplementRows ?? []).flatMap(r => {
      const s = SUPPLEMENT_SUBSTANCES.find(x => x.slug === r.substance_slug)
      return s ? [{ name: s.name, coachNote: r.coach_note ?? null }] : []
    }),
  }

  const priorFeedback: PriorFeedbackSummary[] = (priorFeedbackRows ?? []).map(r => {
    // Supabase types the !inner join as an array or an object depending on
    // inference; normalise both shapes.
    const joined = r.weekly_checkins as unknown
    const row = (Array.isArray(joined) ? joined[0] : joined) as
      | { week_number?: number; form_type?: string }
      | null
      | undefined
    return {
      weekNumber: row?.week_number ?? null,
      formType: (row?.form_type as 'A' | 'B' | undefined) ?? null,
      nextFocus: r.next_focus,
    }
  })

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
    priorFeedback,
    activeCare,
    coachNotes: options.coachNotes ?? null,
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

    // Session-count grounding, the training-side twin of the meal-count check
    // above (2026-08-17). Once training became a first-class domain in the
    // prompt, drafts started quoting session counts, and the first test draft
    // said "four programmed sessions" against a 3-session program while
    // next_focus in the same draft correctly said three.
    //
    // A count is legitimate if it matches the prescription OR what the client
    // actually logged this block week. Anything else is invented.
    const sessionMismatches = programCtx?.sessionsPerWeek != null
      ? findSessionCountMismatches(
          [candidate.interpretation, candidate.reframe ?? '', candidate.next_focus],
          programCtx.sessionsPerWeek,
          programCtx.sessionsLoggedThisWeek
        )
      : []

    // Invented clock times (2026-08-17). The prompt is never given the
    // client's prescribed meal or session times, so any time-of-day in the
    // output was made up and lands as if it were their prescription.
    const clockTimes = findClockTimes([candidate.interpretation, candidate.reframe ?? '', candidate.next_focus])

    if (leakedTerms.length === 0 && mealMismatches.length === 0 && sessionMismatches.length === 0 && clockTimes.length === 0) {
      return { ok: true, draft: candidate, attempts }
    }

    totalLeaksSeen = Array.from(new Set([
      ...totalLeaksSeen,
      ...leakedTerms,
      ...mealMismatches.map(m => `meal-count:${m}`),
      ...sessionMismatches.map(m => `session-count:${m}`),
      ...clockTimes.map(t => `clock-time:${t}`),
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
      if (sessionMismatches.length > 0 && programCtx?.sessionsPerWeek != null) {
        correctionParts.push(
          `Session-count mismatch. Their ACTIVE PROGRAM prescribes ${programCtx.sessionsPerWeek} sessions per week${programCtx.sessionsLoggedThisWeek != null ? ` and they logged ${programCtx.sessionsLoggedThisWeek} this block week` : ''}. The draft used: ${sessionMismatches.map(m => `"${m}"`).join(', ')}. Every session count must be one of those two numbers. If you mean "they missed some", write it without a number.`
        )
      }
      if (clockTimes.length > 0) {
        correctionParts.push(
          `Invented clock times. The draft states these times of day: ${clockTimes.map(t => `"${t}"`).join(', ')}. You were never given this client's prescribed times, so those are made up and would reach the client as their schedule. Remove every one. Say "at your set times" or "the same times each day" instead.`
        )
      }
      conversation.push({
        role: 'user',
        content: `${correctionParts.join(' ')} Rewrite the entire JSON object correcting these. Return only the corrected JSON, no commentary.`,
      })
      lastError = `Leaked: ${leakedTerms.join(', ')}${mealMismatches.length ? `; meal-count: ${mealMismatches.join(', ')}` : ''}${sessionMismatches.length ? `; session-count: ${sessionMismatches.join(', ')}` : ''}${clockTimes.length ? `; clock-time: ${clockTimes.join(', ')}` : ''}`
    }
  }

  return {
    ok: false,
    error: `Could not produce a clean draft after ${MAX_ATTEMPTS} attempts (${totalLeaksSeen.length ? totalLeaksSeen.join(', ') : lastError ?? 'unknown'})`,
    leaks: totalLeaksSeen,
    attempts,
  }
}

/**
 * Turn an RRS training constraint manifest into plain statements the prompt
 * can reason against (2026-08-17).
 *
 * The manifest is numeric and coach-facing. The feedback model does not need
 * the numbers (they are banned from client-facing output anyway) — it needs to
 * know what the envelope will and will not permit, so next_focus does not ask
 * for load the system has already taken away.
 */
function describeTrainingConstraints(c: TrainingConstraintManifest): string[] {
  const out: string[] = []
  if (c.trainingRemovalDays) {
    out.push(`training is fully paused for ${c.trainingRemovalDays[0]} to ${c.trainingRemovalDays[1]} days. Do NOT write any session-based anchor.`)
  }
  if (c.sessionsRemovedPerWeek) {
    out.push(`${c.sessionsRemovedPerWeek[0]} to ${c.sessionsRemovedPerWeek[1]} sessions are being removed from the week. Do NOT write a "hold all your sessions" anchor.`)
  }
  if (c.sessionsPerWeekCap != null) {
    out.push(`sessions are capped at ${c.sessionsPerWeekCap} per week, below the normal prescription.`)
  }
  if (c.loadReductionPct) {
    out.push(`load is being reduced by ${c.loadReductionPct[0]} to ${c.loadReductionPct[1]} percent. The week is deliberately easier than usual.`)
  }
  if (c.sessionDurationPctCap != null) {
    out.push(`sessions are capped at ${c.sessionDurationPctCap} percent of normal duration.`)
  }
  if (c.progressionLocked) out.push('progression is locked. Do not frame the week as building or pushing.')
  if (c.conditioningBlocked) out.push('conditioning and cardio add-ons are blocked. Do NOT write a walking, running or extra-cardio anchor.')
  if (c.novelStimulusBlocked) out.push('no new training stimulus. Do not suggest trying anything new.')
  if (c.testingBlocked) out.push('no testing or output validation.')
  if (out.length === 0) out.push('no training restriction beyond the standard prescription.')
  return out
}

function describeNutritionConstraints(c: NutritionConstraintManifest): string[] {
  const out: string[] = []
  if (c.aggressiveDeficitBlocked) out.push('aggressive deficits are blocked. Do NOT write an eating-less or tightening anchor.')
  if (c.reactiveRestrictionBlocked) out.push('cutting food back because training dropped is blocked. If they mention doing that, it is a misread worth naming.')
  if (c.fuelRestrictionBlocked) out.push('fasting and fuel restriction are blocked. Do NOT write a fasting-window anchor.')
  if (c.proteinFloorRequired) out.push('protein must hold at baseline; it cannot drop.')
  if (c.carbohydrateSupportRequired) out.push('carbohydrate support must stay proportional to training.')
  if (out.length === 0) out.push('no nutrition restriction beyond the active plan.')
  return out
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
/**
 * Find times-of-day in the draft (2026-08-17).
 *
 * The prompt is never given the client's prescribed meal or session times, so
 * every clock time in the output is invented. Amanda W12 shipped "8am,
 * 12:30pm, 3:30pm, 7pm" against a plan that holds no times at all, which the
 * client would reasonably read as their schedule.
 *
 * Matches "8am", "8 am", "12:30pm", "07:00", "7.30pm". Requires either an
 * am/pm marker or a colon, so bare counts ("8 to 14 drinks", "4 meals") never
 * fire.
 */
function findClockTimes(texts: string[]): string[] {
  const hits: string[] = []
  const pattern = /\b(\d{1,2}[:.]\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))\b/gi
  for (const text of texts) {
    if (!text) continue
    let match: RegExpExecArray | null
    pattern.lastIndex = 0
    while ((match = pattern.exec(text)) !== null) {
      hits.push(match[0].trim())
    }
  }
  return Array.from(new Set(hits))
}

/**
 * Training twin of findMealCountMismatches (2026-08-17).
 *
 * Scans for "(N) sessions" / "(N) workouts" / "(N) gym sessions" and flags any
 * count that is neither the prescribed weekly frequency nor the number the
 * client actually logged this block week. Those are the only two numbers the
 * draft has evidence for; anything else is the model filling a gap.
 *
 * Deliberately does NOT match "runs", "walks" or other client-reported
 * activity: those counts come from the client's own free text and the program
 * has no prescription to check them against.
 */
function findSessionCountMismatches(
  texts: string[],
  prescribedPerWeek: number,
  loggedThisWeek: number | null
): string[] {
  const allowed = new Set<number>([prescribedPerWeek])
  if (loggedThisWeek != null) allowed.add(loggedThisWeek)

  const mismatches: string[] = []
  const pattern = /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:\w+\s+){0,2}?(sessions?|workouts?)\b/gi
  for (const text of texts) {
    if (!text) continue
    let match: RegExpExecArray | null
    pattern.lastIndex = 0
    while ((match = pattern.exec(text)) !== null) {
      const numToken = match[1].toLowerCase()
      const n = WORD_TO_NUMBER[numToken] ?? Number(numToken)
      if (!Number.isFinite(n)) continue
      if (allowed.has(n)) continue
      const start = Math.max(0, match.index - 20)
      const end = Math.min(text.length, match.index + match[0].length + 20)
      mismatches.push(text.slice(start, end).trim())
    }
  }
  return Array.from(new Set(mismatches))
}

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
