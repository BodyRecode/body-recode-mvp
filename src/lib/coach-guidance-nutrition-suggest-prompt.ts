// Nutrition Coach Guidance Suggest — prompt builders.
//
// Mirrors src/lib/coach-guidance-suggest-prompt.ts (program side), but tuned
// for the HABNS nutrition engine. Generated text is dropped verbatim into
// `nutrition_plans.coach_guidance` and read by generate-nutrition on every
// Generate / Regenerate. Authority bounds come from nutrition-prompt.ts
// (COACH GUIDANCE — CONTEXT-LEVEL OVERRIDE).

export type NutritionGuidanceIntent =
  | 'simplify'
  | 'push_demand'
  | 'add_flexibility'
  | 'restructure_meals'

export type NutritionGuidanceLever =
  | 'meal_count'
  | 'protein_distribution'
  | 'food_friction'
  | 'food_variety'
  | 'timing'

export interface NutritionGuidanceClientContext {
  name: string
  body_state: string | null
  cffs_summary: string | null
  primary_patterns: string | null
  capacity_constraints: string | null
  risk_flags: string | null
  medications: string | null
  dietary_restrictions: string | null
  dietary_preferences: string | null
  typical_day_eating: string | null
  eating_context: string | null
  current_plan_guidance: string | null
}

export function buildNutritionGuidanceSuggestSystemPrompt(): string {
  return `You write COACH GUIDANCE text for the Body Recode HABNS nutrition generator. Your output is dropped verbatim into the nutrition_plans.coach_guidance field and is read by the nutrition engine on every Generate / Regenerate.

THE FIELD'S AUTHORITY (do not violate):
- Coach guidance MAY override engine-default conservatism within doctrine: meal frequency within doctrine ranges, food selection bias within the dietary framework, substitution generosity, weekly_structure_notes day-by-day rigidity, sample-foods culture / cuisine bias, what_not_to_change additions or removals where they reflect the client's stated reality.
- Coach guidance MAY NOT override: appetite-suppression hard rules (meal_frequency >= 4 for stimulant / GLP-1 / SSRI / SNRI clients, per-meal protein caps), validator bodyweight-derived calorie and protein floors, dietary RESTRICTIONS or PREFERENCES from intake, RRS recovery-state constraint manifests, transitional override gating, HABNS first principles.

THE ENGINE RECOGNISES THESE PHRASES. Use them when the lever matches:
- "travelling" / "away for X weeks" / "no kitchen" -> portable food bias, restaurant-resolvable options, loosened timing rigidity
- "compresses to two meals" / "skips lunch" / "fasted morning" -> meal frequency may compress to stated count if doctrine allows
- "post-illness" / "appetite reduced" / "regulation impaired" -> de-escalate to stabilisation framing, soften portion language with "if appetite allows"
- "wants more flexibility" / "less rigid" -> expand substitution_options, loosen execution_rules from "must" to "aim for"
- "small protein anchor" / "low-friction meal" / "no-cook snack" -> design the named meal as a low-prep protein anchor with no cooking required
- "bias toward [cuisine]" / "Halal" / "South Asian foundation" -> direct food-selection bias within the dietary framework

OUTPUT FORMAT:
- 3 to 6 short paragraphs separated by blank lines.
- Each paragraph: 1-2 sentences.
- Use the recognised phrases above where the chosen levers match.
- Plain prose. No headings. No bullet markers. No markdown.
- Reference ONE short clause about the client's signal pattern or behavioural reality to ground the guidance.
- End with a single sentence starting "Why: " that names the observed signal or behavioural pattern justifying the call.
- No em dashes. Use commas, semicolons, or two sentences instead.
- No emojis.

TONE:
- Direct, coach-to-coach. Imperative voice. Specific structure when the lever permits ("Meal 4 designed as a no-cook 20g protein anchor", "Loosen execution_rules to 'aim for' across all meal-timing language"). Avoid vibes ("more flexible", "easier").

CONFLICT HANDLING:
- If the coach intent ("push demand" / "compress meals") conflicts with a safety-relevant doctrine rule (appetite-suppression meal-count floor, per-meal protein ceiling, validator calorie floor, dietary restriction), keep the lever language but add one sentence noting the floor: "Hold meal_frequency at >= 4 for appetite-suppression doctrine; the simplification applies within that floor." Doctrine wins on safety-relevant variables; surface the partial-application as part of the guidance.

You are paid to be specific. Generic guidance is wasted.`
}

export function buildNutritionGuidanceSuggestUserPrompt(args: {
  intent: NutritionGuidanceIntent
  levers: NutritionGuidanceLever[]
  coach_note: string | null
  client: NutritionGuidanceClientContext
}): string {
  const intentLine =
    args.intent === 'simplify' ? 'Simplify execution. Reduce friction, prep load, complexity. The plan should land in the client\'s actual life.'
    : args.intent === 'push_demand' ? 'Push the demand. Client has capacity for more structure or higher nutrient density within doctrine.'
    : args.intent === 'add_flexibility' ? 'Add flexibility. Loosen rigidity in substitutions, timing, and execution language without changing the macro architecture.'
    : 'Restructure the meal architecture. Change meal count, timing, or anchor pattern; keep total macros within doctrine.'

  const leverLines = args.levers.length
    ? args.levers.map(l => {
        switch (l) {
          case 'meal_count': return '- Meal count (frequency, anchor pattern)'
          case 'protein_distribution': return '- Protein distribution (per-meal protein architecture)'
          case 'food_friction': return '- Food friction (prep, cooking, complexity load)'
          case 'food_variety': return '- Food variety (substitution generosity, cuisine bias)'
          case 'timing': return '- Timing (meal positioning, peri-workout, day-type adjustments)'
        }
      }).join('\n')
    : '- (none specified; coach chose intent only)'

  const ctx = args.client
  const lines: string[] = [
    `INTENT: ${intentLine}`,
    '',
    'LEVERS TO ADJUST:',
    leverLines,
    '',
    args.coach_note ? `COACH NOTE: ${args.coach_note}` : 'COACH NOTE: (none)',
    '',
    'CLIENT CONTEXT:',
    `Name: ${ctx.name}`,
    `Body state: ${ctx.body_state ?? '(none recorded)'}`,
  ]
  if (ctx.medications) lines.push('', 'Medications (relevant for appetite-suppression rules):', ctx.medications)
  if (ctx.dietary_restrictions) lines.push('', 'Dietary restrictions (hard constraint):', ctx.dietary_restrictions)
  if (ctx.dietary_preferences) lines.push('', 'Dietary preferences (framework constraint):', ctx.dietary_preferences)
  if (ctx.typical_day_eating) lines.push('', "Typical day's eating (baseline):", ctx.typical_day_eating)
  if (ctx.eating_context) lines.push('', 'Eating environment / context:', ctx.eating_context)
  if (ctx.cffs_summary) lines.push('', 'CFFS summary:', ctx.cffs_summary)
  if (ctx.primary_patterns) lines.push('', 'Primary patterns and signals:', ctx.primary_patterns)
  if (ctx.capacity_constraints) lines.push('', 'Capacity constraints and guardrails:', ctx.capacity_constraints)
  if (ctx.risk_flags) lines.push('', 'Risk flags and watch items:', ctx.risk_flags)
  if (ctx.current_plan_guidance) lines.push('', 'Current coach guidance on this plan:', ctx.current_plan_guidance)
  lines.push(
    '',
    'Write the coach guidance text now. Plain prose, 3-6 short paragraphs, no headings, end with "Why: ...". Output only the guidance text; no preamble, no quotes.'
  )
  return lines.join('\n')
}
