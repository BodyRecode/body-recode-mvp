import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { withTemporalContext, deadlineConstraint, parseTimelineToDate, weeksUntil } from '@/lib/temporal-context'
import { clampMacroArcToDoctrine, allowedPhasesForBodyState, type MacroBlock } from '@/lib/macro-arc-doctrine'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { AI_MODELS } from '@/lib/ai-models'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json()
  return runSuggestPlanInternal(body)
}

/**
 * Internal entrypoint. Same reason as the other four: a server-side script can
 * run this for one client without a browser session. Added 2026-09-01.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runSuggestPlanInternal(body: any): Promise<NextResponse> {
  const { client_id, coach_guidance } = body ?? {}
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })
  const guidance = typeof coach_guidance === 'string' ? coach_guidance.trim() : ''

  const admin = createAdminClient()

  const [
    { data: client },
    { data: cffs },
    { data: intake },
    { data: baseline },
    { data: activeProgram },
    { data: nutritionPlan },
    { data: existingPlans },
  ] = await Promise.all([
    admin.from('clients').select('id, name, coaching_started_at, medications').eq('id', client_id).maybeSingle(),
    admin.from('cffs').select('body_state_classification, resolution_state, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, capacity_constraints_and_guardrails, primary_patterns_and_signals, client_context_summary').eq('client_id', client_id).eq('is_archived', false).maybeSingle(),
    admin.from('intakes').select('id, date_of_birth, gender, primary_goal, secondary_goals, desired_timeline, subjective_motivator, training_days_available, injury_location_current, injury_primary_concern, training_responses, sleep_responses, stress_responses, fat_map_responses, submitted_at').eq('client_id', client_id).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('baselines').select('bodyweight_kg, captured_at').eq('client_id', client_id).order('captured_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('programs').select('block_name, progression_phase, training_goal, training_frequency, week_duration, generated_at').eq('client_id', client_id).eq('is_active', true).maybeSingle(),
    admin.from('nutrition_plans').select('entry_state, carb_demand_level, modulation_level').eq('client_id', client_id).eq('is_active', true).maybeSingle(),
    admin.from('training_plans').select('plan_name, macro_objective, created_at').eq('client_id', client_id).order('created_at', { ascending: false }).limit(3),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // The prompt used to list all four phases as valid and say only that
  // "Remediation clients start with restoration". The model read that as
  // permission to end on intensification or realization, and the clamp caught it
  // every single generation. Name the permitted phases for THIS client instead,
  // so the arc comes back correct rather than corrected.
  const permittedPhases = allowedPhasesForBodyState(cffs?.body_state_classification ?? null)
  const forbiddenPhases = (['restoration', 'accumulation', 'intensification', 'realization'] as const)
    .filter(ph => !permittedPhases.includes(ph))
  const phasePermission = `
PHASES PERMITTED FOR THIS CLIENT (body state: ${cffs?.body_state_classification ?? 'unknown'})
ALLOWED: ${permittedPhases.join(' | ')}${forbiddenPhases.length ? `
FORBIDDEN — do not use, do not name in a block title, do not describe in a block's wording: ${forbiddenPhases.join(' | ')}` : ''}

This is a hard gate derived from body state, not a preference. A client in
Remediation has not earned intensification by virtue of a block elapsing. If the
arc feels like it needs a phase that is not on the allowed list, the answer is a
longer accumulation block, not a forbidden phase wearing a different name.

Do not smuggle forbidden work in through wording either. A block labelled
accumulation whose notes prescribe threshold work, RPE 7+, "performance
expression" or "walk simulation" is an intensification block with the label
changed, and it will be rejected.
`

  const systemPrompt = `You are the Body Recode™ Macro Plan Suggestion Engine. You read a client's current state and suggest a sequenced macro training arc — a series of meso blocks that govern training direction over months.

You are a suggestion engine. The coach reviews and approves before anything is activated.

COACH GUIDANCE (CONTEXT-LEVEL STEER): the user message may include a section labelled "COACH GUIDANCE". When present, treat it as the coach's authoritative intent for THIS client and THIS arc. It overrides engine-default conservatism that doctrine permits (e.g. how soon the client's goal is introduced, block emphasis, phase durations and frequencies within their ranges, whether to peak or stay hypertrophy-leaning). It CANNOT break doctrine: readiness gates, the never-skip phase order (Restoration -> Accumulation -> Intensification -> Realization), phase-appropriate goals, and frequency ceilings still hold. If guidance conflicts with a safety gate, follow the gate and note the tension in overall_rationale.

═══════════════════════════════════════
CROSS-PILLAR AUTHORITY ORDER (governs all arc design decisions)
═══════════════════════════════════════
1. RRS (Recovery and Regulation) — overrides all. Red regulation or capacity = restoration entry mandatory.
2. Fat Map Method — body state classification constrains arc ambition
3. BIRS — behaviour and identity limits complexity and phase pace
4. PTS — training demand (you are designing within this pillar)
5. HABNS — nutrition context only; inform each block but do not prescribe

═══════════════════════════════════════
PHASE INTENT FRAMEWORK (use to select each block's phase)
═══════════════════════════════════════
CAPACITY RESTORATION (restoration)
Intent: Stabilise system, restore tolerance, reduce fatigue, restore recovery margin, re-establish consistency.
Mandate: Performance progression explicitly deprioritised.
Training goal: capacity only. Frequency: 2–3x/week max.
Required entry point if: any Red readiness signal, active injury domain, remediation body state.

CAPACITY BUILDING (accumulation)
Intent: Expand tolerance to load. Gradual exposure increase. Conservative and reversible progression only.
Training goal: capacity or strength (conservative). Frequency: 3–4x/week.
Permitted after: demonstrated stability in restoration; no active escalation flags; Amber or above readiness.

PERFORMANCE EXPRESSION (intensification or realization)
Intent: Allow existing capacity to surface. Expression of strength or output. Does not build new capacity.
Training goal: strength or hypertrophy. Frequency: 3–5x/week.
Permitted after: all readiness gates cleared; sustained accumulation demonstrated; no active flags; Green readiness.

CONSOLIDATION (accumulation at maintenance)
Intent: Preserve adaptations, prevent regression, reinforce habits. Change intentionally limited.
Use: between phases, after realization, managing external stress.

═══════════════════════════════════════
READINESS GATE RULES (block phase advancement if any present)
═══════════════════════════════════════
Do not sequence an arc that skips Restoration if:
- Any readiness signal is Red
- Active injury or escalation flags present
- Recovery debt or sympathetic masking present
- Schedule or behaviour readiness compromised

Accumulation cannot precede demonstrated stability.
Intensification cannot precede completed and stable accumulation.
Phase sequence is NEVER skipped — Restoration → Accumulation → Intensification → Realization.

DEFAULT STATE IS STABILITY. Progression is permissioned, not assumed.

═══════════════════════════════════════
MACRO ARC DESIGN RULES
═══════════════════════════════════════
- Arc must reflect current body state. Remediation clients start with restoration regardless of goals.
- Each block: 4–12 weeks (restore longer, accumulate moderate, express shorter)
- Total arc: 12–24 weeks typical
- Nutrition context is QUALITATIVE and INFORM-ONLY. NEVER state calorie targets, energy deficits/surpluses (e.g. "300–500 kcal deficit"), or gram macros in any block. Body composition and energy balance are the nutrition engine's job, not the training arc's. If a block's intent relates to body composition, describe the training role only (e.g. "supports lean mass retention") and leave the numbers to nutrition.
- Training frequency must respect constraint level and schedule readiness per block
- Do not prescribe hypertrophy as goal in restoration blocks
- CONDITIONING / RUNNING INTENSITY BY PHASE: in Restoration, any running or conditioning is EASY / aerobic / conversational ONLY — no tempo, threshold, interval, repeat, or strides work, regardless of the client's running background. Intensity re-enters no earlier than Accumulation, and only once readiness gates permit. Scaling a client's running means cutting the hard sessions first (intervals, tempo, long runs), keeping easy volume. This holds even when a block also reduces total running volume.
- Each block must logically follow from the prior block's expected outcome

ARC ARITHMETIC — CHECK THIS BEFORE YOU ANSWER
- When there is a dated event, the block week_durations MUST sum to EXACTLY the number of weeks available. Add them up. If the total is wrong, change a block length until it is right.
- The final block before a dated event is a taper. It MUST have progression_phase = "restoration" and training_goal = "capacity". Not "accumulation at maintenance", not "consolidation" wearing an accumulation label. A block that reduces load IS restoration, and restoration is always available whatever the body state. Do not reason that because intensification is forbidden the block must stay accumulation; step DOWN, not sideways.
- That taper MUST be at least 2 weeks. One week does not clear accumulated fatigue.
- The taper block absorbs any part-week between the last full block and the event date, so the arc finishes ON the event, never days before it.
- No block is shorter than 2 weeks.
${phasePermission}

═══════════════════════════════════════
ENUM VALUES — STRICTLY ENFORCED
═══════════════════════════════════════
progression_phase MUST be exactly one of: accumulation | intensification | realization | restoration
- "Consolidation" / "Maintenance" → progression_phase: "accumulation" + phase_objective: "Consolidation and Stability"
- "Deload" / "Recovery" → progression_phase: "restoration"
- "Performance Expression" → progression_phase: "realization"
NEVER use 'consolidation', 'maintenance', 'deload' as progression_phase values. They are phase objectives, not phases.

training_goal MUST be exactly one of: strength | hypertrophy | capacity

OUTPUT FORMAT — return ONLY valid JSON, no markdown:
{
  "plan_name": "string",
  "plan_name_reason": "string",
  "macro_objective": "string — 1 sentence direction statement",
  "macro_objective_reason": "string",
  "overall_rationale": "string — 3-4 sentences: what current state drives the arc entry point, what phase sequence is designed and why, what readiness signals constrain the design, and what success looks like across the arc",
  "blocks": [
    {
      "block_name": "string",
      "progression_phase": "accumulation|intensification|realization|restoration",
      "training_goal": "strength|hypertrophy|capacity",
      "week_duration": number,
      "execution_arc": "short|mid|long",
      "phase_category": "Accumulation-Oriented|Intensification-Oriented|Consolidation-Oriented|Recovery-Dominant|Exposure-Management",
      "phase_objective": "Capacity Restoration|Capacity Building|Performance Expression|Consolidation and Stability",
      "phase_intent": "string — one sentence in your own words on what this block is actually for. This is the free-text field; phase_category and phase_objective are fixed vocabularies and must be one of the listed values exactly.",
      "implied_frequency": number,
      "nutrition_context": "string — brief note on how nutrition entry state should align with this block's demand",
      "block_rationale": "string — why this block in this position, what readiness gate permits or requires it, and what signal would change it"
    }
  ]
}`

  const contextLines: string[] = []

  // Coach guidance first, so it frames every downstream choice (mirrors the
  // program generator's placement). Overrides engine-default conservatism
  // within doctrine, never the safety gates.
  if (guidance) {
    contextLines.push(`COACH GUIDANCE (apply throughout — the coach's intent for this arc; overrides engine-default conservatism within doctrine, never the safety gates):\n${guidance}\n`)
  }

  if (client.medications) {
    contextLines.push(`MEDICATIONS (CRITICAL — hormonal-class drugs shape recovery capacity, load tolerance, and arc pace; non-hormonal drugs may constrain exercise selection, signal interpretation, or pace of progression):\n${client.medications}\n`)
  }

  if (cffs) {
    contextLines.push(`CFFS — CURRENT BODY STATE`)
    contextLines.push(`Body State: ${cffs.body_state_classification}`)
    contextLines.push(`Resolution: ${cffs.resolution_state}`)
    contextLines.push(`Capacity Readiness: ${cffs.exposure_readiness_capacity}`)
    contextLines.push(`Schedule Readiness: ${cffs.exposure_readiness_schedule}`)
    contextLines.push(`Regulation Readiness: ${cffs.exposure_readiness_regulation}`)
    contextLines.push(`Behaviour Readiness: ${cffs.exposure_readiness_behaviour}`)
    if (cffs.capacity_constraints_and_guardrails) contextLines.push(`Constraints: ${cffs.capacity_constraints_and_guardrails}`)
    if (cffs.primary_patterns_and_signals) contextLines.push(`Patterns: ${cffs.primary_patterns_and_signals}`)
    if (cffs.client_context_summary) contextLines.push(`Context: ${cffs.client_context_summary}`)
  } else {
    contextLines.push(`No CFFS available — use conservative defaults.`)
  }

  // Bodyweight is captured on baseline (the intakes table has no flat
  // bodyweight column). Age derived from date_of_birth; sex from gender.
  const ageFromDob = intake?.date_of_birth
    ? Math.floor((Date.now() - new Date(intake.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  if (intake) {
    contextLines.push(`\nINTAKE CONTEXT`)
    if (baseline?.bodyweight_kg) contextLines.push(`Bodyweight: ${baseline.bodyweight_kg}kg (from baseline ${baseline.captured_at?.slice(0, 10) ?? ''})`)
    if (ageFromDob) contextLines.push(`Age: ${ageFromDob}`)
    if (intake.gender) contextLines.push(`Sex: ${intake.gender}`)
    if (intake.primary_goal) contextLines.push(`Primary goal: ${intake.primary_goal}`)
    if (intake.secondary_goals) contextLines.push(`Secondary goals: ${intake.secondary_goals}`)
    if (intake.desired_timeline) contextLines.push(`Desired timeline: ${intake.desired_timeline}`)
    if (intake.subjective_motivator) contextLines.push(`What's driving this: ${intake.subjective_motivator}`)
    if (intake.training_days_available) contextLines.push(`Training days available: ${intake.training_days_available}`)
    if (intake.injury_location_current) contextLines.push(`Current injuries: ${intake.injury_location_current}`)
    if (intake.injury_primary_concern) contextLines.push(`Primary injury concern: ${intake.injury_primary_concern}`)
    if (intake.training_responses) contextLines.push(`Training response blob (tr_01..tr_30, scale 0-4): ${JSON.stringify(intake.training_responses)}`)
    if (intake.sleep_responses) contextLines.push(`Sleep response blob (scale 0-4): ${JSON.stringify(intake.sleep_responses)}`)
    if (intake.stress_responses) contextLines.push(`Stress response blob (scale 0-4): ${JSON.stringify(intake.stress_responses)}`)
    if (intake.fat_map_responses) contextLines.push(`Fat Map response blob (fm_01..fm_25, scale 0-4): ${JSON.stringify(intake.fat_map_responses)}`)
  } else if (baseline?.bodyweight_kg) {
    contextLines.push(`\nINTAKE CONTEXT`)
    contextLines.push(`Foundational intake not yet submitted.`)
    contextLines.push(`Bodyweight (from baseline): ${baseline.bodyweight_kg}kg`)
  }

  // Dated goal, resolved server-side so the model is handed arithmetic rather
  // than being asked to infer a calendar it cannot see.
  const deadline = deadlineConstraint(intake?.desired_timeline)
  const deadlineDate = parseTimelineToDate(intake?.desired_timeline)
  const deadlineWeeks = deadlineDate ? weeksUntil(deadlineDate) : null

  if (activeProgram) {
    contextLines.push(`\nCURRENT ACTIVE PROGRAM`)
    contextLines.push(`${activeProgram.block_name} — ${activeProgram.progression_phase}, ${activeProgram.training_goal}, ${activeProgram.training_frequency}x/week, ${activeProgram.week_duration} weeks`)
  }

  if (nutritionPlan) {
    contextLines.push(`\nNUTRITION STATE`)
    contextLines.push(`Entry State: ${nutritionPlan.entry_state}`)
    contextLines.push(`Carb Demand: ${nutritionPlan.carb_demand_level}`)
    contextLines.push(`Modulation: ${nutritionPlan.modulation_level}`)
  }

  if (existingPlans && existingPlans.length > 0) {
    contextLines.push(`\nPREVIOUS PLANS`)
    existingPlans.forEach(p => contextLines.push(`- ${p.plan_name}: ${p.macro_objective || 'No objective'}`))
  }

  contextLines.push(`\nSuggest a macro training arc for this client. Design 3–5 meso blocks appropriate to current state. If Remediation/Red signals present, begin conservative. Return valid JSON only.`)

  // Retry loop + truncation guard (2026-07-11), matching generate-cffs.
  // Previously single-shot at 6000 tokens with no truncation detection, so a
  // large multi-block macro arc could truncate mid-object and surface the
  // opaque "Could not parse suggestion" error. Now: 12k cap, max_tokens
  // detection, empty-content guard, blocks-present check, 3 attempts.
  const MAX_TOKENS = 12000
  let suggestion = null
  let lastError = 'unknown error'

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: AI_MODELS.structural,
        max_tokens: MAX_TOKENS,
        system: withTemporalContext(systemPrompt),
        messages: [{
          role: 'user',
          // A dated goal leads, before any other context. Previously it sat as
          // one soft line among fifteen, formatted identically to "Sex: Female",
          // and the arc that came back finished seven weeks after the event.
          content: [deadline, contextLines.join('\n')].filter(Boolean).join('\n\n'),
        }],
      })
    } catch (err) {
      lastError = `AI error: ${err instanceof Error ? err.message : String(err)}`
      console.error(`[suggest-plan] Anthropic API error (attempt ${attempt}/3):`, lastError)
      continue
    }

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      lastError = `AI returned no text content (stop_reason=${message.stop_reason})`
      console.warn(`[suggest-plan] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    if (message.stop_reason === 'max_tokens') {
      lastError = `AI output was truncated at the ${MAX_TOKENS}-token limit`
      console.warn(`[suggest-plan] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    const jsonText = extractFirstJsonObject(textBlock.text)
    if (!jsonText) {
      lastError = `Could not locate a JSON object in AI output: ${textBlock.text.slice(0, 200)}`
      console.warn(`[suggest-plan] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    let candidate
    try {
      candidate = JSON.parse(jsonText)
    } catch (err) {
      lastError = `JSON parse failed: ${(err as Error).message}`
      console.warn(`[suggest-plan] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    if (!Array.isArray(candidate.blocks) || candidate.blocks.length === 0) {
      lastError = 'AI output contained no plan blocks'
      console.warn(`[suggest-plan] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    suggestion = candidate
    break
  }

  if (!suggestion) {
    console.error('[suggest-plan] generation failed after 3 attempts:', lastError)
    return NextResponse.json(
      { error: `Plan suggestion failed after 3 attempts (${lastError}). Please try again.` },
      { status: 500 }
    )
  }

  // Normalise enum values that Claude sometimes gets wrong. The DB CHECK
  // constraints only accept a fixed set of progression_phase values; any
  // other label (e.g. 'consolidation', 'maintenance', 'deload') needs to
  // map back to the closest canonical phase. Per doctrine:
  //   - 'consolidation' / 'maintenance' → 'accumulation' (accumulation at
  //     maintenance load), with the original concept preserved in
  //     phase_objective.
  //   - 'deload' → 'restoration' (recovery-protective intent).
  const VALID_PHASES = new Set(['accumulation', 'intensification', 'realization', 'restoration'])
  const VALID_GOALS = new Set(['strength', 'hypertrophy', 'capacity'])
  const PHASE_REMAP: Record<string, string> = {
    consolidation: 'accumulation',
    maintenance: 'accumulation',
    deload: 'restoration',
    recovery: 'restoration',
    expression: 'realization',
    'performance expression': 'realization',
  }
  if (Array.isArray(suggestion.blocks)) {
    for (const b of suggestion.blocks) {
      const phase = String(b.progression_phase ?? '').toLowerCase().trim()
      if (!VALID_PHASES.has(phase) && PHASE_REMAP[phase]) {
        const original = b.progression_phase
        b.progression_phase = PHASE_REMAP[phase]
        if (!b.phase_objective) {
          b.phase_objective = original.charAt(0).toUpperCase() + original.slice(1)
        }
      } else if (!VALID_PHASES.has(phase)) {
        // Unknown value falls back to RESTORATION, not accumulation. Adding
        // load is never the safe default: if we cannot tell what the model
        // meant, the conservative reading is the correct one. The clamp below
        // will not promote it, which is the intended behaviour.
        b.progression_phase = 'restoration'
      }
      const goal = String(b.training_goal ?? '').toLowerCase().trim()
      if (!VALID_GOALS.has(goal)) b.training_goal = 'capacity'
    }
  }

  // Deterministic doctrine clamp. Everything above is normalisation of the
  // model's labels; this is enforcement. generate-program has had
  // clampProgramToDoctrine from the start and suggest-plan had nothing, so a
  // macro arc went to the coach exactly as the model wrote it. In a
  // white-label system there is no one reading every arc before it ships.
  const clamped = clampMacroArcToDoctrine(suggestion.blocks as MacroBlock[], {
    bodyState: cffs?.body_state_classification ?? null,
    weeksAvailable: deadlineWeeks,
    knownEventFacts: null,
  })
  suggestion.blocks = clamped.blocks
  if (clamped.notes.length || clamped.warnings.length) {
    console.log(
      `[suggest-plan] doctrine clamp: ${clamped.notes.length} correction(s), ` +
      `${clamped.warnings.length} warning(s) for client ${String(client_id).slice(0, 8)}`
    )
  }

  return NextResponse.json({
    suggestion,
    doctrine: { corrections: clamped.notes, warnings: clamped.warnings },
  })
}
