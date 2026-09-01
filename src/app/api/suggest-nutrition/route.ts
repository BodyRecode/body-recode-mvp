import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  detectAppetiteSuppression,
  PER_MEAL_PROTEIN_CAP,
  STIMULANT_FIRST_MEAL_PROTEIN_CAP,
  MIN_MEAL_COUNT_WHEN_SUPPRESSED,
} from '@/lib/nutrition-validation'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { resolveHeightCm, heightPromptLine } from '@/lib/client-height'
import { withTemporalContext } from '@/lib/temporal-context'
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
  return runSuggestNutritionInternal(body)
}

/**
 * Internal entrypoint. Same reason as the other three: a server-side script can
 * run this for one client without a browser session.
 *
 * Added 2026-09-01 while diagnosing a "Failed to load suggestion" the coach hit
 * on Samantha. That message is the PAGE's fallback for a response it could not
 * parse, which means the route threw before it could return its own detailed
 * error. Without a way to run this outside the browser there was no way to see
 * the real one.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runSuggestNutritionInternal(body: any): Promise<NextResponse> {
  const { client_id } = body ?? {}
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const admin = createAdminClient()

  const [
    { data: client },
    { data: cffs },
    { data: intake },
    { data: baseline },
    { data: previousPlans },
    { data: activeProgram },
    { data: recentReviews },
    { data: currentPlanBlock },
  ] = await Promise.all([
    admin.from('clients').select('id, name, medications, height_cm, height_recorded_at, height_source').eq('id', client_id).maybeSingle(),
    admin.from('cffs').select('*').eq('client_id', client_id).eq('is_archived', false).maybeSingle(),
    admin.from('intakes')
      .select('id, date_of_birth, gender, primary_goal, secondary_goals, desired_timeline, subjective_motivator, training_days_available, injury_location_current, injury_location_history, injury_primary_concern, injury_aggravating_movements, fat_map_responses, training_responses, nutrition_responses, schedule_responses, sleep_responses, stress_responses, supplement_responses, dietary_restrictions, dietary_preferences, typical_day_eating, meals_per_day, fluid_intake, caffeine_intake, alcohol_intake, eating_context, submitted_at')
      .eq('client_id', client_id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('baselines')
      .select('bodyweight_kg, height_cm, waist_cm, hips_cm, chest_cm, captured_at')
      .eq('client_id', client_id)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('nutrition_plans')
      .select('plan_name, entry_state, carb_demand_level, generated_at')
      .eq('client_id', client_id)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(3),
    admin.from('programs')
      .select('block_name, progression_phase, training_goal, training_frequency, week_duration')
      .eq('client_id', client_id)
      .eq('is_active', true)
      .maybeSingle(),
    admin.from('nutrition_reviews')
      .select('direction, signal_category, adherence_confirmed, signals_noted, reviewed_at')
      .eq('client_id', client_id)
      .order('reviewed_at', { ascending: false })
      .limit(5),
    // The macro arc, which exists BEFORE any program is generated from it.
    // Without this the engine saw "no training program", estimated the client's
    // training load from intake, and set carb demand off a number that
    // contradicted the arc the coach had just approved.
    admin.from('plan_blocks')
      .select('position, block_name, progression_phase, training_goal, week_duration, training_frequency, status, training_plans!inner(plan_name, status)')
      .eq('client_id', client_id)
      .eq('training_plans.status', 'active')
      .in('status', ['in_progress', 'planned'])
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  // Bodyweight is captured on the baseline submission (not the intake — the
  // intakes table doesn't carry a flat bodyweight column). Pull from there.
  const bodyweightKg = baseline?.bodyweight_kg ?? null
  // Height, so an energy estimate is possible at all. Every BMR equation needs
  // it and it was captured nowhere until 2026-07-30, which is why the engine
  // could only ever report the calories its own meals happened to contain and
  // never say whether that total suited the person eating it.
  //
  // Read through the resolver, not off the baseline: from 2026-08-17 the coach
  // can enter a height directly on the client record, which is the only source
  // for the clients who have never submitted a baseline.
  const resolvedHeight = resolveHeightCm({
    clientHeightCm: client?.height_cm,
    clientHeightRecordedAt: client?.height_recorded_at ?? null,
    clientHeightSource: client?.height_source ?? null,
    baselineHeightCm: baseline?.height_cm,
    baselineCapturedAt: baseline?.captured_at ?? null,
  })
  const bodyweightSource = baseline?.bodyweight_kg
    ? `baseline (${baseline.captured_at?.slice(0, 10) ?? 'date unknown'})`
    : null

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const contextParts: string[] = []
  contextParts.push(`CLIENT: ${client.name}`)

  if (client.medications) {
    contextParts.push(`\nMEDICATIONS (CRITICAL — may include hormonal-class drugs that modulate protein synthesis and recovery, or non-hormonal drugs that affect appetite, hydration, electrolyte balance, or energy partitioning):\n${client.medications}`)
  }

  if (cffs) {
    contextParts.push(`
CFFS — FOUNDATIONAL SYNTHESIS:
- Body state classification: ${cffs.body_state_classification}
- Resolution state: ${cffs.resolution_state}
- Capacity readiness: ${cffs.exposure_readiness_capacity}
- Schedule readiness: ${cffs.exposure_readiness_schedule}
- Regulation readiness: ${cffs.exposure_readiness_regulation}
- Behaviour readiness: ${cffs.exposure_readiness_behaviour}
- Capacity constraints and guardrails: ${cffs.capacity_constraints_and_guardrails}
- Risk flags and watch items: ${cffs.risk_flags_and_watch_items}
- Tensions and trade-offs: ${cffs.tensions_and_trade_offs}
- Primary patterns and signals: ${cffs.primary_patterns_and_signals}
- Client context summary: ${cffs.client_context_summary}`)
  } else {
    contextParts.push(`\nCFFS: Not available. Apply conservative Stabilisation defaults.`)
  }

  // Body composition + intake context. Bodyweight is critical for protein
  // anchor — emit it from whichever source has it (baseline is the canonical
  // capture point; intake doesn't carry weight as a flat column).
  // Age derived from date_of_birth; sex from gender.
  const ageFromDob = intake?.date_of_birth
    ? Math.floor((Date.now() - new Date(intake.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const intakeLines: string[] = []
  intakeLines.push(`- Bodyweight: ${bodyweightKg ? `${bodyweightKg}kg${bodyweightSource ? ` (from ${bodyweightSource})` : ''}` : 'Not provided'}`)
  intakeLines.push(`- ${heightPromptLine(resolvedHeight)}`)
  intakeLines.push(`- Age: ${ageFromDob ?? 'Not provided'}`)
  intakeLines.push(`- Sex: ${intake?.gender || 'Not provided'}`)
  if (baseline?.waist_cm || baseline?.hips_cm || baseline?.chest_cm) {
    const meas: string[] = []
    if (baseline.waist_cm) meas.push(`waist ${baseline.waist_cm}cm`)
    if (baseline.hips_cm) meas.push(`hips ${baseline.hips_cm}cm`)
    if (baseline.chest_cm) meas.push(`chest ${baseline.chest_cm}cm`)
    intakeLines.push(`- Baseline measurements: ${meas.join(', ')}`)
  }
  if (intake) {
    intakeLines.push(`- Primary goal: ${intake.primary_goal || 'Not provided'}`)
    if (intake.secondary_goals) intakeLines.push(`- Secondary goals: ${intake.secondary_goals}`)
    if (intake.desired_timeline) intakeLines.push(`- Desired timeline: ${intake.desired_timeline}`)
    if (intake.subjective_motivator) intakeLines.push(`- What's driving this: ${intake.subjective_motivator}`)
    if (intake.training_days_available) intakeLines.push(`- Training days available: ${intake.training_days_available}`)
    if (intake.injury_location_current) intakeLines.push(`- Current injuries: ${intake.injury_location_current}`)
    if (intake.injury_location_history) intakeLines.push(`- Injury history: ${intake.injury_location_history}`)
    if (intake.injury_primary_concern) intakeLines.push(`- Primary injury concern: ${intake.injury_primary_concern}`)
    if (intake.injury_aggravating_movements) intakeLines.push(`- Aggravating movements: ${intake.injury_aggravating_movements}`)
    if (intake.nutrition_responses) intakeLines.push(`- Nutrition response blob (nut_01..nut_25, scale 0-4): ${JSON.stringify(intake.nutrition_responses)}`)
    if (intake.sleep_responses) intakeLines.push(`- Sleep response blob (slp_01..slp_NN, scale 0-4): ${JSON.stringify(intake.sleep_responses)}`)
    if (intake.stress_responses) intakeLines.push(`- Stress response blob (str_01..str_NN, scale 0-4): ${JSON.stringify(intake.stress_responses)}`)
    if (intake.supplement_responses) intakeLines.push(`- Supplement response blob (sup_01..sup_NN, scale 0-4): ${JSON.stringify(intake.supplement_responses)}`)
    if (intake.training_responses) intakeLines.push(`- Training response blob (tr_01..tr_30, scale 0-4): ${JSON.stringify(intake.training_responses)}`)
  } else {
    intakeLines.push(`- Foundational intake: not yet submitted (using baseline data only).`)
  }
  contextParts.push(`\nINTAKE CONTEXT:\n${intakeLines.join('\n')}`)

  // Dietary context: free-text answers from Section D. Critical for designing
  // a plan the client can actually adopt. Restrictions are hard constraints
  // (allergies / intolerances / medical). Preferences are framework / cultural
  // constraints. Typical day is the baseline we design FROM. Eating context
  // shapes adherence design (cooking, family meals, travel, takeaway habits).
  if (intake) {
    const dietaryLines: string[] = []
    if (intake.dietary_restrictions) dietaryLines.push(`Allergies / intolerances / medical restrictions (HARD CONSTRAINT — never violate):\n${intake.dietary_restrictions}`)
    if (intake.dietary_preferences) dietaryLines.push(`Personal, cultural, or religious avoidances / dietary framework (HARD CONSTRAINT):\n${intake.dietary_preferences}`)
    if (intake.typical_day_eating) dietaryLines.push(`Typical day's eating (BASELINE — design FROM this, not against it):\n${intake.typical_day_eating}`)
    if (intake.meals_per_day) dietaryLines.push(`Meals/snacks per day (current eating frequency baseline):\n${intake.meals_per_day}`)
    if (intake.fluid_intake) dietaryLines.push(`Daily fluids (water + other drinks; factor caloric drinks into energy):\n${intake.fluid_intake}`)
    if (intake.caffeine_intake) dietaryLines.push(`Daily caffeine (serves + timing):\n${intake.caffeine_intake}`)
    if (intake.alcohol_intake) dietaryLines.push(`Alcohol intake (caloric + recovery load; design realistically, do not moralise):\n${intake.alcohol_intake}`)
    if (intake.eating_context) dietaryLines.push(`Eating environment context:\n${intake.eating_context}`)
    if (dietaryLines.length > 0) {
      contextParts.push(`\nDIETARY CONTEXT (free-text from Section D — what the client actually eats, cannot eat, will not eat):\n\n${dietaryLines.join('\n\n')}`)
    }
  }

  if (activeProgram) {
    contextParts.push(`
ACTIVE TRAINING PROGRAM:
- Block: ${activeProgram.block_name}
- Phase: ${activeProgram.progression_phase}
- Goal: ${activeProgram.training_goal}
- Frequency: ${activeProgram.training_frequency}x/week
- Duration: ${activeProgram.week_duration} weeks`)
  } else if (currentPlanBlock) {
    // An approved arc is a real training prescription even before the sessions
    // are written. Saying "none" here invites the model to invent a frequency.
    const tp = currentPlanBlock.training_plans as unknown as { plan_name?: string } | null
    contextParts.push(`
NO PROGRAM GENERATED YET, BUT THE CLIENT HAS AN APPROVED MACRO ARC.
Use the current block below as the training context. Do NOT estimate training
frequency from intake or availability: the coach has already decided it.
- Arc: ${tp?.plan_name ?? 'active plan'}
- Current block: ${currentPlanBlock.position}. ${currentPlanBlock.block_name}
- Phase: ${currentPlanBlock.progression_phase}
- Goal: ${currentPlanBlock.training_goal}
- Frequency: ${currentPlanBlock.training_frequency}x/week (this is the prescribed figure, use it)
- Duration: ${currentPlanBlock.week_duration} weeks`)
  } else {
    contextParts.push(`\nACTIVE TRAINING PROGRAM: None, and no approved macro arc. Client is not currently on a training program.`)
  }

  if (previousPlans && previousPlans.length > 0) {
    contextParts.push(`
PREVIOUS NUTRITION PLANS:
${previousPlans.map((p, i) =>
  `${i + 1}. ${p.plan_name} — Entry State: ${p.entry_state}, Carb Demand: ${p.carb_demand_level} — ${new Date(p.generated_at).toLocaleDateString('en-AU')}`
).join('\n')}`)
  } else {
    contextParts.push(`\nPREVIOUS NUTRITION PLANS: None. This is the client's first nutrition plan.`)
  }

  if (recentReviews && recentReviews.length > 0) {
    const directionLabel: Record<string, string> = { progress: 'Making progress', hold: 'Staying steady', rebuild: 'Struggling' }
    const signalLabel: Record<string, string> = {
      under_fuelling: 'Under-fuelled', over_fuelling: 'Over-fuelled',
      recovery_constraint: 'Recovery issues', adherence_constraint: 'Hard to stick to', neutral_stable: 'Feeling good',
    }
    contextParts.push(`
RECENT NUTRITION CHECK-IN HISTORY (most recent first — use this to understand how the client has been responding to the nutrition plan):
${recentReviews.map((r, i) => {
  const signals = r.signal_category ? r.signal_category.split(',').map((s: string) => signalLabel[s.trim()] ?? s.trim()).join(', ') : 'Not specified'
  return `${i + 1}. Direction: ${directionLabel[r.direction] ?? r.direction} | Followed plan: ${r.adherence_confirmed ? 'Yes' : 'No'} | What they noticed: ${signals}${r.signals_noted ? ` | Notes: ${r.signals_noted}` : ''}`
}).join('\n')}

If the most recent direction is Rebuild, the client is struggling with the current plan. Do not escalate demands. If multiple consecutive Rebuild entries exist, consider reducing complexity, adjusting macros, or simplifying meal structure.`)
  }

  const systemPrompt = `You are the Body Recode™ Nutrition Prescription Intelligence Layer. Your role is to analyse a client's full context and produce a governed nutrition prescription suggestion — with clear reasoning for every field — before nutrition generation begins.

You operate under the Body Recode™ Cross-Pillar Priority Hierarchy:
1. RRS (Recovery and Regulation) — overrides everything
2. Fat Map Method — metabolic constraint authority
3. BIRS — complexity and pace limits
4. PTS — training demand informs carbohydrate demand only

ACTIVITY LEVEL — DESCRIBE THE WHOLE DAY, NOT THE TRAINING
activity_level multiplies their BMR to estimate energy requirement, so it is the
single biggest number in the calorie calculation. One step either way moves the
target by roughly 200 kcal a day, more than any other input.

  sedentary          Desk work, drives everywhere, little walking, no training.
  lightly_active     Desk work with some walking, or 1-3 sessions and otherwise still.
  moderately_active  On their feet part of the day, or 3-5 sessions, or walks/cycles for transport.
  very_active        Physical job, or 6+ sessions, or high daily ambulation ON TOP OF training.
  extremely_active   Manual labour plus training, or an endurance block with real weekly volume.

Read the whole day. Non-exercise movement usually outweighs training, so
training frequency alone is a poor proxy. A client with no car who walks and
cycles everywhere is at least moderately active even at 2 sessions a week; a
client who drives to the gym 4 times a week and sits the rest of the time may
only be lightly active. Look for commute, occupation, and whether they carry
daily ambulation the intake never asked about.
5. HABNS — nutrition execution (you are advising within this pillar)

ENTRY STATE SELECTION RULES:
- stabilisation: instability present, constraint load high, recovery impaired, or uncertainty high. Carbs: Low only. No modulation.
- training_support: stable + training demand present + manageable constraints + functional recovery. Carbs: Moderate. Restricted modulation.
- high_output_support: consistent stability + minimal constraints + strong recovery + low uncertainty. Carbs: High. Full modulation.
- recovery_reset: fatigue accumulation, declining recovery, degraded signals, regression under load. Carbs: Low. No modulation.
Priority order if conflict: recovery_reset → stabilisation → training_support → high_output_support

PROTEIN ANCHOR RULES:
- Calculate from bodyweight only (not goal weight, not lean mass estimation without data)
- Stabilisation/Recovery Reset: 1.6–1.8g per kg bodyweight
- Training Support: 1.8–2.0g per kg bodyweight
- High Output Support: 2.0–2.2g per kg bodyweight
- Round to nearest 5g
- If bodyweight unknown: use moderate default with noted uncertainty

CARBOHYDRATE DEMAND LEVEL RULES:
- Must respect entry state ceiling
- Stabilisation / Recovery Reset → low only
- Training Support → moderate (high only if training frequency ≥4 and strong recovery)
- High Output Support → high

MEAL FREQUENCY RULES:
- Stabilisation: 3–4 meals (simplicity priority)
- Training Support: 3–5 meals
- High Output Support: 4–5 meals
- Must be realistic for the client's lifestyle context

For each field, give the recommended value AND a plain-language reason grounded in the client's actual data.
Be honest about uncertainty — if data is missing, say so and give the conservative default.

Output valid JSON only — no markdown, no commentary:
{
  "plan_name": "string — descriptive name e.g. Foundation Nutrition — Training Support Phase",
  "plan_name_reason": "string",
  "entry_state": "stabilisation|training_support|high_output_support|recovery_reset",
  "entry_state_reason": "string",
  "body_state": "remediation|optimisation|post_optimisation",
  "body_state_reason": "string",
  "pts_phase": "string — the current block's phase. Only say 'No active program' when there is neither a program NOR an approved macro arc.",
  "pts_phase_reason": "string",
  "constraint_level": "low|moderate|high",
  "constraint_level_reason": "string",
  "recovery_status": "stable|impaired|strong",
  "recovery_status_reason": "string",
  "uncertainty_level": "low|moderate|high",
  "uncertainty_level_reason": "string",
  "protein_anchor_g": number,
  "protein_anchor_g_reason": "string",
  "carb_demand_level": "low|moderate|high",
  "carb_demand_level_reason": "string",
  "meal_frequency": number,
  "meal_frequency_reason": "string",
  "training_days_per_week": number,
  "training_days_per_week_reason": "string",
  "activity_level": "sedentary|lightly_active|moderately_active|very_active|extremely_active",
  "activity_level_reason": "string",
  "food_exclusions": ["string"],
  "food_exclusions_reason": "string",
  "overall_rationale": "string — 2–3 sentences summarising the overall prescription logic and what it is trying to achieve for this client right now"
}`

  // Retry loop + truncation guard (2026-07-11), matching generate-cffs.
  // Previously single-shot at 6000 tokens with no truncation detection. Now:
  // 12k cap, max_tokens detection, empty-content guard, entry_state present
  // check, 3 attempts.
  const MAX_TOKENS = 12000
  let suggestion = null
  let lastError = 'unknown error'

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: AI_MODELS.clinical,
        max_tokens: MAX_TOKENS,
        system: withTemporalContext(systemPrompt),
        messages: [{ role: 'user', content: contextParts.join('\n') + '\n\nGenerate the nutrition prescription suggestion. JSON only.' }],
      })
    } catch (err) {
      lastError = `AI error: ${err instanceof Error ? err.message : String(err)}`
      console.error(`[suggest-nutrition] Anthropic API error (attempt ${attempt}/3):`, lastError)
      continue
    }

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      lastError = `AI returned no text content (stop_reason=${message.stop_reason})`
      console.warn(`[suggest-nutrition] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    if (message.stop_reason === 'max_tokens') {
      lastError = `AI output was truncated at the ${MAX_TOKENS}-token limit`
      console.warn(`[suggest-nutrition] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    const jsonText = extractFirstJsonObject(textBlock.text)
    if (!jsonText) {
      lastError = `Could not locate a JSON object in AI output: ${textBlock.text.slice(0, 200)}`
      console.warn(`[suggest-nutrition] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    let candidate
    try {
      candidate = JSON.parse(jsonText)
    } catch (err) {
      lastError = `JSON parse failed: ${(err as Error).message}`
      console.warn(`[suggest-nutrition] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    if (typeof candidate.entry_state !== 'string' || !candidate.entry_state.trim()) {
      lastError = 'AI output missing entry_state'
      console.warn(`[suggest-nutrition] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    suggestion = candidate
    break
  }

  if (!suggestion) {
    console.error('[suggest-nutrition] generation failed after 3 attempts:', lastError)
    return NextResponse.json(
      { error: `Nutrition suggestion failed after 3 attempts (${lastError}). Please try again.` },
      { status: 500 }
    )
  }

  // Deterministic protein anchor when bodyweight is known. Haiku tends to
  // default to ~85g (the "no-data" fallback) even when the prompt has the
  // bodyweight, so don't trust it for the math. Multiplier scales with the
  // entry state per doctrine.
  if (bodyweightKg) {
    const state = String(suggestion.entry_state ?? '').toLowerCase()
    const multiplier =
      state.includes('high_output') || state.includes('high output') ? 2.0
      : state.includes('training_support') || state.includes('training support') ? 1.9
      : 1.7  // stabilisation / recovery_reset / default
    const computed = Math.round(bodyweightKg * multiplier)
    const aiValue = Number(suggestion.protein_anchor_g)
    // Override only if the AI produced something obviously off (default 85,
    // or below the bodyweight × 1.4 floor). Otherwise trust the AI.
    const floor = Math.round(bodyweightKg * 1.4)
    if (!aiValue || aiValue < floor) {
      suggestion.protein_anchor_g = computed
      suggestion.protein_anchor_g_reason = `Computed from bodyweight ${bodyweightKg}kg × ${multiplier} (entry state: ${suggestion.entry_state}). Original AI suggestion (${aiValue || 'missing'}) overridden — fell below the bodyweight × 1.4 floor.`
    }
  }

  // Pre-flight: bump meal_frequency to the minimum that's mathematically
  // feasible under the appetite-suppression hard rules. Without this, the
  // suggest engine defaults to 4 meals — fine for most clients, but for a
  // stimulant client with anchor > 150g (e.g. Amanda at 165g) the validator
  // rejects 4 meals because the per-meal caps cannot accommodate it.
  // Math uses the shared validator constants so this stays in sync if caps move.
  //   stimulant:               meals = ceil((anchor − first_cap) / per_meal_cap) + 1
  //   non-stimulant suppressant: meals = ceil(anchor / per_meal_cap)
  //   no suppression:          leave the AI's suggestion alone
  const suppression = detectAppetiteSuppression(client.medications)
  if (suppression.any) {
    const anchor = Number(suggestion.protein_anchor_g) || 0
    const aiMeals = Number(suggestion.meal_frequency) || 4
    let minMeals: number
    if (suppression.has_stimulant) {
      minMeals = Math.max(MIN_MEAL_COUNT_WHEN_SUPPRESSED, Math.ceil((anchor - STIMULANT_FIRST_MEAL_PROTEIN_CAP) / PER_MEAL_PROTEIN_CAP) + 1)
    } else {
      minMeals = Math.max(MIN_MEAL_COUNT_WHEN_SUPPRESSED, Math.ceil(anchor / PER_MEAL_PROTEIN_CAP))
    }
    if (aiMeals < minMeals) {
      const classes = [
        suppression.has_stimulant && 'stimulant',
        suppression.has_glp1 && 'GLP-1',
        suppression.has_serotonergic && 'SSRI/SNRI',
      ].filter(Boolean).join(' + ')
      suggestion.meal_frequency = minMeals
      suggestion.meal_frequency_reason = `Set to ${minMeals} (was ${aiMeals}) because client is on ${classes} medication. The appetite-suppression hard rules cap protein per meal at ${PER_MEAL_PROTEIN_CAP}g${suppression.has_stimulant ? ` (${STIMULANT_FIRST_MEAL_PROTEIN_CAP}g for the first meal if stimulant)` : ''}, so the anchor of ${anchor}g requires at least ${minMeals} meals to distribute without violating the per-meal cap. ${suggestion.meal_frequency_reason || ''}`.trim()
    }
  }

  return NextResponse.json({ suggestion, medications: client.medications ?? null })
}
