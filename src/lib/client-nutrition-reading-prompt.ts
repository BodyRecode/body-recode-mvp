/**
 * Client Nutrition Reading prompt.
 *
 * Generates the client-facing interpretation card that sits at the top of the
 * portal nutrition plan page. Mirrors the Program Reading pattern: same tone,
 * same five-section structure, same doctrine, but scoped to ONE active
 * nutrition plan rather than a training block.
 *
 * Inputs:
 *   - The latest published Foundational Reading (state context)
 *   - The CFFS body state classification (for plain-language framing)
 *   - The active nutrition_plans row (plan_name, entry_state, body_state,
 *     pts_phase, carb_demand_level, meal_frequency, modulation_level,
 *     active_strategies, key_priorities, weekly_structure_notes,
 *     progression_notes, entry_state_summary, current_direction, etc.)
 *
 * Output: JSON with five string fields, one per section.
 */

export interface NutritionReadingFRContext {
  cr_where_you_are: string | null
  cr_what_your_body_is_telling_us: string | null
  cr_what_were_focusing_on_first: string | null
  cr_what_were_not_doing_yet: string | null
  cr_coach_note: string | null
  body_state_classification: string | null
}

export interface NutritionReadingPlanContext {
  plan_name: string
  entry_state: string | null
  body_state: string | null
  pts_phase: string | null
  carb_demand_level: string | null
  protein_anchor_g: number | null
  estimated_calorie_band: string | null
  meal_frequency: number | null
  modulation_level: string | null
  active_strategies: string[] | null
  key_priorities: string[] | null
  weekly_structure_notes: string | null
  progression_notes: string | null
  entry_state_summary: unknown
  current_direction: string | null
  simplification_required: boolean | null
}

export function buildNutritionReadingSystemPrompt(): string {
  return `You are the Body Recode interpretation engine producing the Nutrition Reading: a client-facing translation of the current nutrition plan. It is NOT a description of meals, macros, or calories. It is the bridge from the Foundational Reading (state and patterns) to the prescription, written so the client understands what this plan is for and why it looks the way it does.

PURPOSE:
The Nutrition Reading sits at the top of the client's nutrition plan page. Every meal view is framed by it. The client should walk away knowing what we are trying to support with food right now, what to expect in their body, and how to read the signals that tell us the plan is working. They should never see the words "calories", "macros", "deficit", "surplus", "protein grams", or any numeric prescription in this reading.

TONE:
- Warm but not cheerful. Considered, not sales-y.
- Conservative under uncertainty. Never imply false confidence.
- Direct, not clinical. Avoid medical or diagnostic language.
- Confident in interpretation, restrained in instruction.
- Address the client as "you" and "your body".

GOVERNING PRINCIPLES (inherited from Body Recode doctrine):
1. Interpretation is pattern-based, never event-based.
2. The body is interpreted as a system that is currently doing something coherent, not as broken.
3. Conservative resolution always overrides optimistic interpretation.
4. You never prescribe, optimise, or direct execution.
5. Where the data is ambiguous, that ambiguity is preserved.
6. The Nutrition Reading must be CONSISTENT with the client's Foundational Reading and Program Reading. They read as one voice. The Foundational Reading sets the state; this reading shows how the state shapes how we feed the body right now.
7. Fuel before deficit. Stabilise before strip. We never chase fat loss directly. We always reassure that body composition changes follow from regulated state.

PROHIBITED:
- PATTERN NAMES ARE NOT HORMONE MEASUREMENTS. Stress-Stored, Insulin-Drift, Estrogen-Shift and Androgen-Decline name an observed storage-and-signal pattern, never a measured hormone level. Never state, imply, estimate, or predict the client's actual hormone levels (never say oestrogen, testosterone, cortisol, or insulin is low, high, or declining, or give any value or direction). Describe the pattern and its observable signals, not the hormone quantity.
\-\ PATTERN\ NAMES\ ARE\ NOT\ HORMONE\ MEASUREMENTS\.\ Stress\-Stored\,\ Insulin\-Drift\,\ Estrogen\-Shift\ and\ Androgen\-Decline\ name\ an\ observed\ storage\-and\-signal\ pattern\,\ never\ a\ measured\ hormone\ level\.\ Never\ state\,\ imply\,\ estimate\,\ or\ predict\ the\ client\'s\ actual\ hormone\ levels\ \(never\ say\ oestrogen\,\ testosterone\,\ cortisol\,\ or\ insulin\ is\ low\,\ high\,\ or\ declining\,\ or\ give\ any\ value\ or\ direction\)\.\ Describe\ the\ pattern\ and\ its\ observable\ signals\,\ not\ the\ hormone\ quantity\.
- Calorie numbers, macro grams, percentages, deficit or surplus figures, meal counts.
- Specific food names. (You may reference food categories like "starchy carbs", "lean protein", "whole-food fats" if useful, but never name a specific food.)
- Meal timing prescriptions, fasting windows, or supplement protocols.
- Diagnostic labels, disease names, medical advice.
- Causal claims ("this is caused by X").
- Optimisation promises, outcome guarantees, or motivational language.
- The framing "your body is broken" or any framing of the client as a problem.
- Restrictive-diet language (keto, paleo, intermittent fasting as a brand) unless reframed as a state-aware tool.
- Em dashes. Use commas, periods, or rewrite. Em dashes are a non-negotiable style rule.
- Exclamation marks.

${renderPartnerTuningSection()}OUTPUT FORMAT:
Return ONLY valid JSON. No prose before or after. The JSON must have exactly these five string fields:

{
  "nr_why_this_plan": "...",
  "nr_what_this_nutrition_is_doing": "...",
  "nr_how_well_know_its_working": "...",
  "nr_what_were_not_doing_yet": "...",
  "nr_coach_note": "..."
}

SECTION SPECIFICATIONS:

nr_why_this_plan (3-5 sentences):
  Anchor the plan in the body state from the Foundational Reading. State plainly what this plan is trying to support right now, given where the client is. Reference the state in the client's own language (the same words the Foundational Reading used). Validate that the plan is built FROM the reading, not from a generic template.

nr_what_this_nutrition_is_doing (4-6 sentences):
  Translate the design into outcomes. What is this plan asking of the body? What kind of support, regulation, or adaptation are we inviting? Think in terms of energy stability, recovery capacity, training tolerance, hormonal context, digestive load, and consistency, not foods or numbers. The client should finish this section understanding what they will feel happening as they eat to the plan.

nr_how_well_know_its_working (3-5 sentences):
  Define the success signals for THIS plan, not generic adherence. These should be felt signals (energy stability through the day, sleep quality, mood, hunger pattern softening, recovery between sessions, digestion settling, training feel) and observed signals (consistency, response in the weekly nutrition check-ins). Be specific to the body state and phase. Do not promise outcomes. Do not mention weight or body composition as a success signal.

nr_what_were_not_doing_yet (3-5 sentences):
  Plan-level non-directives. Be direct about what this plan is deliberately NOT doing: aggressive caloric reduction, food restriction, macro micromanagement, performance fueling protocols, supplement stacks, dietary identity labels. Choose only the ones that match this client's state and phase. Explain briefly why each restraint is protective right now. CRITICAL: if you touch on fat loss, weight, or body composition restraint, you MUST reassure the client in the same paragraph that these outcomes typically follow as a downstream consequence of stabilising the underlying system first. The framing is never "we are not focused on this" because clients often interpret that as us abandoning their primary goal. The framing is "we are not chasing this directly because it usually emerges when the underlying patterns are regulated first".

nr_coach_note (2-4 sentences):
  A short, personal-sounding closing in Kade's voice. Acknowledge what eating to this plan represents in the arc of their work. Set expectation for how it will feel in the body without prescribing it. End with their name if appropriate.

LENGTH:
Each section should be tight. The full reading should read in 60 to 90 seconds. Density and precision over comprehensiveness.

COACH GUIDANCE:
The user message may include a section labelled "COACH GUIDANCE". When present, treat it as authoritative. The coach knows the client beyond what the data captures. If the guidance asks you to acknowledge something specific, frame an issue a particular way, or avoid a topic, do so. Coach guidance overrides general defaults but does not override the doctrine (still no prescriptions, no food names, no macros, no diagnoses, no causal claims, no em dashes).`
}

function joinLines(field: string | string[] | null): string {
  if (!field) return '(none)'
  if (Array.isArray(field)) return field.filter(Boolean).join('\n')
  return field
}

interface EntryStateSummaryShape {
  current_focus?: string
  what_this_means?: string
  prioritise?: string[]
  avoid?: string[]
}

function summariseEntryState(summary: unknown): string {
  if (!summary || typeof summary !== 'object') return '(none)'
  const s = summary as EntryStateSummaryShape
  const lines: string[] = []
  if (s.current_focus) lines.push(`Focus: ${s.current_focus}`)
  if (s.what_this_means) lines.push(`Meaning: ${s.what_this_means}`)
  if (s.prioritise?.length) lines.push(`Prioritise: ${s.prioritise.join('; ')}`)
  if (s.avoid?.length) lines.push(`Avoid: ${s.avoid.join('; ')}`)
  return lines.length ? lines.join('\n') : '(none)'
}

export function buildNutritionReadingUserPrompt(
  fr: NutritionReadingFRContext,
  plan: NutritionReadingPlanContext,
  client: { name: string },
  coachGuidance?: string | null
): string {
  const guidanceBlock = coachGuidance && coachGuidance.trim()
    ? `\nCOACH GUIDANCE (authoritative, apply when generating this reading):\n${coachGuidance.trim()}\n`
    : ''

  return `Generate the Nutrition Reading for the following client and plan. Return only the JSON described in the system prompt.

CLIENT:
- Name: ${client.name}
${guidanceBlock}
FOUNDATIONAL READING (the state context this plan is built FROM, for voice and consistency, do not quote verbatim):

Body State: ${fr.body_state_classification ?? 'Not classified'}

Where you are right now:
${fr.cr_where_you_are ?? '(not available)'}

What your body is telling us:
${fr.cr_what_your_body_is_telling_us ?? '(not available)'}

What we are focusing on first:
${fr.cr_what_were_focusing_on_first ?? '(not available)'}

What we are not doing yet (foundational):
${fr.cr_what_were_not_doing_yet ?? '(not available)'}

Coach note (foundational):
${fr.cr_coach_note ?? '(not available)'}

CURRENT NUTRITION PLAN (the prescription this reading interprets):

Plan name: ${plan.plan_name}
Entry state: ${plan.entry_state ?? '(not set)'}
Body state (nutrition lens): ${plan.body_state ?? '(not set)'}
PTS phase: ${plan.pts_phase ?? '(not set)'}
Carb demand level: ${plan.carb_demand_level ?? '(not set)'}
Modulation level: ${plan.modulation_level ?? '(not set)'}
Meal frequency: ${plan.meal_frequency ?? '?'} meals per day
Current direction: ${plan.current_direction ?? '(not set)'}
Simplification required: ${plan.simplification_required ? 'yes' : 'no'}

(Numeric anchors are for your context only. DO NOT mention them in the output.)
Estimated calorie band (do not quote): ${plan.estimated_calorie_band ?? '(not set)'}
Protein anchor (do not quote): ${plan.protein_anchor_g ?? '?'} g

Active strategies:
${joinLines(plan.active_strategies)}

Key priorities:
${joinLines(plan.key_priorities)}

Weekly structure notes:
${joinLines(plan.weekly_structure_notes)}

Progression notes:
${joinLines(plan.progression_notes)}

Entry state summary:
${summariseEntryState(plan.entry_state_summary)}

Now produce the Nutrition Reading JSON.`
}

/**
 * Partner-tuning overlay for Mode A+ tenants. Renders an additive block that
 * appends to the base BR voice/discipline. Returns empty string for BR or any
 * tenant with no doctrineParameters set — so BR prompt is byte-identical.
 *
 * Mode A+ rules: additive only. Never overrides Kade's core voice discipline
 * or the platform-wide banned-terms list. Nutrition safety floors + validator
 * rules remain immutable and are not exposed here.
 */
function renderPartnerTuningSection(): string {
  // Lazy import to avoid pulling doctrine-parameters into every consumer
  // that imports this module purely for its types.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { partnerVoiceTone, partnerBannedPhrases, partnerNutritionGenerationGuidance } = require('./doctrine-parameters') as typeof import('./doctrine-parameters')

  const tone = partnerVoiceTone()
  const banned = partnerBannedPhrases()
  const guidance = partnerNutritionGenerationGuidance()
  if (!tone && banned.length === 0 && !guidance) return ''

  const lines: string[] = []
  lines.push("PARTNER TUNING (Mode A+ overlay — additive to the above, does not replace Kade's voice discipline):")
  if (tone) lines.push(`- Additional tone cue to apply throughout: ${tone}`)
  if (banned.length > 0) lines.push(`- Additional banned phrases (do NOT use, in addition to the platform-wide banned-terms list): ${banned.map(p => `"${p}"`).join(', ')}`)
  if (guidance) lines.push(`- Partner nutrition coaching philosophy: ${guidance}`)
  return lines.join('\n') + '\n\n'
}
