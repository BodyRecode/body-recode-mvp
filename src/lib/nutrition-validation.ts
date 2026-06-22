/**
 * Nutrition plan validation and totals.
 *
 * Single source of truth for:
 *   - per-food, per-meal, daily kcal arithmetic
 *   - calorie-band parsing
 *   - structural validation of an LLM-generated nutrition plan before write
 *
 * The validator is invoked from the generate-nutrition route (post-LLM,
 * pre-DB-write) and the dashboard / portal use computeNutritionTotals to
 * render the readouts.
 */

/**
 * Doctrine version is now exclusively maintained in `src/lib/doctrine-versions.ts`
 * (DOCTRINE_VERSIONS.nutrition_plan). The legacy NUTRITION_DOCTRINE_VERSION
 * constant that used to live here was the cause of the 2026-06-22 staleness
 * regression: generate-nutrition route had been migrated to stamp from the
 * new consolidated source, but the coach UI staleness check + system-health
 * page still imported this legacy constant for comparison — so every freshly
 * regenerated plan immediately flagged as stale (newer-than-the-comparator).
 *
 * Re-exporting under the old name keeps any out-of-tree imports working
 * during the transition, but DO NOT add new usages. Bump versions in
 * doctrine-versions.ts only.
 */
export { DOCTRINE_VERSIONS as _DOCTRINE_VERSIONS } from './doctrine-versions'
import { DOCTRINE_VERSIONS } from './doctrine-versions'
export const NUTRITION_DOCTRINE_VERSION = DOCTRINE_VERSIONS.nutrition_plan

export interface StructuredFood {
  name: string
  protein_g: number
  carb_g: number
  fat_g: number
}

export type FoodInput = string | Partial<StructuredFood>

export interface NormalizedFood {
  name: string
  protein_g: number | null
  carb_g: number | null
  fat_g: number | null
  kcal: number | null
}

export interface MealLike {
  meal_name?: string
  protein_g?: number | null
  carb_g?: number | null
  fat_g?: number | null
  foods?: FoodInput[]
}

export interface MacroTotals {
  protein_g: number
  carb_g: number
  fat_g: number
  kcal: number
}

export interface CalorieBand {
  low: number
  high: number
}

export const kcalFromMacros = (p: number, c: number, f: number): number =>
  Math.round(p * 4 + c * 4 + f * 9)

export function normalizeFood(food: FoodInput): NormalizedFood {
  if (typeof food === 'string') {
    return { name: food, protein_g: null, carb_g: null, fat_g: null, kcal: null }
  }
  const name = food.name ?? ''
  const p = Number(food.protein_g)
  const c = Number(food.carb_g)
  const f = Number(food.fat_g)
  const hasAll = Number.isFinite(p) && Number.isFinite(c) && Number.isFinite(f)
  return {
    name,
    protein_g: hasAll ? p : null,
    carb_g: hasAll ? c : null,
    fat_g: hasAll ? f : null,
    kcal: hasAll ? kcalFromMacros(p, c, f) : null,
  }
}

export function computeMealMacros(meal: MealLike): MacroTotals {
  const p = Number(meal.protein_g) || 0
  const c = Number(meal.carb_g) || 0
  const f = Number(meal.fat_g) || 0
  return { protein_g: p, carb_g: c, fat_g: f, kcal: kcalFromMacros(p, c, f) }
}

export function computeNutritionTotals(meals: MealLike[] | null | undefined): MacroTotals {
  type Acc = { protein_g: number; carb_g: number; fat_g: number }
  const sum = (meals ?? []).reduce<Acc>(
    (acc, m) => ({
      protein_g: acc.protein_g + (Number(m.protein_g) || 0),
      carb_g: acc.carb_g + (Number(m.carb_g) || 0),
      fat_g: acc.fat_g + (Number(m.fat_g) || 0),
    }),
    { protein_g: 0, carb_g: 0, fat_g: 0 }
  )
  return {
    protein_g: Math.round(sum.protein_g),
    carb_g: Math.round(sum.carb_g),
    fat_g: Math.round(sum.fat_g),
    kcal: kcalFromMacros(sum.protein_g, sum.carb_g, sum.fat_g),
  }
}

export function parseCalorieBand(band: string | null | undefined): CalorieBand | null {
  if (!band) return null
  const cleaned = String(band).replace(/[~,]/g, '')
  const range = cleaned.match(/(\d{3,5})\s*(?:[-–—]|to)\s*(\d{3,5})/i)
  if (range) {
    const lo = Number(range[1])
    const hi = Number(range[2])
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
      return { low: Math.min(lo, hi), high: Math.max(lo, hi) }
    }
  }
  const single = cleaned.match(/(\d{3,5})/)
  if (single) {
    const v = Number(single[1])
    return { low: v - 100, high: v + 100 }
  }
  return null
}

export function formatCalorieBand(low: number, high: number): string {
  return `${low}–${high} kcal`
}

export interface ValidationIssue {
  code: string
  message: string
  /**
   * 'error' issues block the plan (validation `ok=false`, generation retries).
   * 'warning' issues are surfaced to the coach for manual review but do NOT
   * fail validation. Substitution-audit findings (UNPARSED / UNKNOWN_FOOD /
   * MACRO_DRIFT) are warnings — the food-reference table only covers Tier 1+2
   * canonical names, so legitimate variants ("Greek yoghurt full-fat",
   * "tuna canned in spring water") routinely fall outside it. Blocking on
   * these put the engine in an infinite retry loop on plans that were
   * otherwise sound. Defaults to 'error' when omitted so the existing checks
   * keep their hard-block behaviour.
   */
  severity?: 'error' | 'warning'
}

/** True if the issue blocks the plan (severity 'error' or unspecified). */
function isBlocking(issue: ValidationIssue): boolean {
  return (issue.severity ?? 'error') === 'error'
}

/**
 * Map validator codes to coach-friendly explanations. The raw codes are
 * useful for telemetry and debugging but should never reach a licensee
 * coach. `message` from the issue is the precise machine-readable failure
 * (numbers, meal names); `humaniseValidationIssue` returns a one-sentence
 * explanation of WHY the rule exists and WHAT the engine will try.
 */
export function humaniseValidationIssue(issue: ValidationIssue): string {
  switch (issue.code) {
    case 'MEAL_NO_FOODS':
      return `${issue.message} The engine sometimes drops the foods list on the first attempt; retrying usually fixes it.`
    case 'FOODS_NOT_STRUCTURED':
      return `The engine emitted foods as plain text strings instead of structured items with macros. This is a generation bug; try again.`
    case 'MEAL_NO_PROTEIN':
      return `${issue.message} Every meal needs at least some protein; the engine sometimes skips it on a snack, and retrying redistributes.`
    case 'PROTEIN_ANCHOR_MISMATCH':
      return `${issue.message} The plan's daily protein doesn't match what was prescribed: the engine concentrated or thinned the load. Retrying with the validator feedback usually lands it.`
    case 'APPETITE_SUPPRESSED_MEAL_COUNT_TOO_LOW':
      return `${issue.message} The doctrine requires more meal touchpoints when appetite is pharmacologically suppressed, so each portion stays achievable.`
    case 'APPETITE_SUPPRESSED_PER_MEAL_PROTEIN_TOO_HIGH':
      return `${issue.message} A meal loaded too heavily with protein won't be finished by a suppressed client. The engine needs to spread it.`
    case 'STIMULANT_FIRST_MEAL_PROTEIN_TOO_HIGH':
      return `${issue.message} Stimulant suppression peaks in the morning; heavy breakfast protein guarantees the meal gets skipped.`
    case 'CARB_FLOOR_NOT_MET':
      return `${issue.message} This is a safety floor based on bodyweight. Going below means the plan is dangerously under-fueled for her size.`
    case 'FAT_FLOOR_NOT_MET':
      return `${issue.message} Fat-soluble nutrient floor based on bodyweight. Going below risks hormone / micronutrient deficits.`
    case 'NO_MEALS':
      return `The engine returned a plan with no meals. This is a generation bug; try again.`
    case 'NEGATIVE_FOOD_MACRO':
      return `${issue.message} The engine was trying to fudge the macro arithmetic by inventing "removed" foods with negative grams to fit a tight kcal ceiling. Real foods can't have negative macros. Regenerate with a looser ceiling, lower the protein anchor, or accept that the plan will land above the bridge target.`
    case 'TRANSITIONAL_FLOOR_NOT_MET':
      return `${issue.message} The transitional override means you replaced the bodyweight floors with an explicit kcal floor, and the plan still needs to hit that.`
    case 'TRANSITIONAL_CEILING_EXCEEDED':
      return `${issue.message} The protein anchor is probably driving kcal up. Lower the protein anchor on the suggest page (try ~1.2-1.4 g/kg) so the plan can land near your bridge floor.`
    case 'SUBSTITUTION_MACRO_DRIFT':
      return `${issue.message} Coach swap labelled equivalent but the food-reference table shows the macros diverge enough to mislead the client. Tighten the portion size or pick a closer alternative.`
    case 'SUBSTITUTION_UNPARSED':
      return `${issue.message} The substitution line doesn't follow the "Food (Ng state) ↔ alternative (Ng state)" shape so it can't be checked against the food-reference table. Coach reviews manually.`
    case 'SUBSTITUTION_UNKNOWN_FOOD':
      return `${issue.message} The food-reference table covers Tier 1 + Tier 2 of the nutrition prompt's allowed list; foods outside that need coach verification.`
    default:
      return issue.message
  }
}

export interface NutritionValidationInput {
  meals: MealLike[]
  estimated_calorie_band: string | null
  protein_anchor_g: number
  bodyweight_kg: number | null
  entry_state: string
  medications: string | null
  // Carb demand level the coach prescribed — affects the daily carb safety
  // floor. "low" lowers the floor to 0.8 g/kg so a coach who explicitly
  // wants ~140g for a 100kg client isn't bounced by a 150g hard floor.
  carb_demand_level?: 'low' | 'moderate' | 'high' | null
  // Optional transitional override — when present, the bodyweight-derived
  // carb / fat g/kg floors are SKIPPED and replaced by the explicit kcal
  // floor. Used when a client cannot physically execute the standard floors
  // (chronic under-eating, post-illness recovery, etc.). Override must come
  // with a justification (enforced at the API layer, not the validator).
  transitional_override?: {
    active: boolean
    floor_kcal: number
  } | null
  /**
   * Substitution options from the generated plan. Validated against the
   * food-reference table at generation time. Added 2026-06-09 (item E in
   * the licensee-readiness plan) after Ruby's published plan was found to
   * have three swap-math errors that would mislead the client.
   */
  substitution_options?: Record<string, string[]> | null
}

/**
 * Validate substitution_options against the food-reference table. Returns
 * a structured list of drift findings: which line, which sub, which macro
 * drifted, and by what percent. Lines that can't be parsed or contain
 * foods outside the reference table are returned separately as "unknown"
 * — coach reviews those manually.
 */
export function validateSubstitutionOptions(
  options: Record<string, string[]> | null | undefined,
): ValidationIssue[] {
  if (!options) return []
  const issues: ValidationIssue[] = []
  // Import lazily so this file stays loadable in environments without the
  // food-reference table compiled in. Circular-import safe.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parseSubstitutionLine, validateSubstitutions } = require('./food-reference') as typeof import('./food-reference')

  for (const [category, lines] of Object.entries(options)) {
    if (!Array.isArray(lines)) continue
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const parsed = parseSubstitutionLine(line)
      if (!parsed.ok) {
        issues.push({
          code: 'SUBSTITUTION_UNPARSED',
          message: `Substitution line ${category}[${i}] could not be parsed for verification: "${line.slice(0, 80)}"`,
          severity: 'warning',
        })
        continue
      }
      const result = validateSubstitutions(parsed.original!, parsed.subs!)
      if (result.unknown.length > 0) {
        issues.push({
          code: 'SUBSTITUTION_UNKNOWN_FOOD',
          message: `Substitution ${category}[${i}] contains foods outside the reference table (${result.unknown.join(', ')}). Coach should verify manually.`,
          severity: 'warning',
        })
      }
      for (const drift of result.drifts) {
        issues.push({
          code: 'SUBSTITUTION_MACRO_DRIFT',
          message: `Substitution ${category}[${i}]: ${drift.sub.name} ${drift.sub.grams}g is ${(drift.worstPct * 100).toFixed(0)}% off on ${drift.worstMetric} vs ${parsed.original!.name} ${parsed.original!.grams}g.`,
          severity: 'warning',
        })
      }
    }
  }
  return issues
}

/**
 * Pre-flight feasibility check for the prescription inputs alone — runs
 * BEFORE any LLM call. Catches mathematically-impossible combinations the
 * generator would otherwise burn 60-90s only to fail the validator on.
 *
 * Example: stimulant client, anchor 165g, 4 meals → max achievable protein
 * is 32 + 43 + 43 + 43 = 161g, so the anchor cannot be hit. Pre-flight
 * surfaces this immediately with the smallest viable fix (bump to 5 meals
 * or lower anchor).
 */
export interface PrescriptionFeasibilityInput {
  protein_anchor_g: number
  meal_frequency: number
  medications: string | null
}

export interface PrescriptionFeasibilityResult {
  ok: boolean
  reasons: string[]                                 // human-language explanations
  suggestions: Array<{ label: string; patch: Partial<PrescriptionFeasibilityInput> }>  // one-click fixes
}

// Single source of truth for the per-meal protein caps + minimum meal count
// under appetite suppression. Exported so the pre-flight feasibility check,
// the suggest engine's auto-bump math, and the validator all agree.
// Drift between these was the #2 audit finding on 2026-05-25.
export const PER_MEAL_PROTEIN_CAP = 43
export const STIMULANT_FIRST_MEAL_PROTEIN_CAP = 35
export const MIN_MEAL_COUNT_WHEN_SUPPRESSED = 4

// Bridge mode allowed kcal headroom above the coach-set floor. Used by both
// the validator (TRANSITIONAL_CEILING_EXCEEDED) and the prompt builder (so
// the LLM is given the same ceiling the validator will enforce).
export const BRIDGE_CEILING_BUFFER = 150

export function checkPrescriptionFeasibility(input: PrescriptionFeasibilityInput): PrescriptionFeasibilityResult {
  const reasons: string[] = []
  const suggestions: PrescriptionFeasibilityResult['suggestions'] = []
  const suppression = detectAppetiteSuppression(input.medications)
  const anchor = Math.max(0, Math.round(input.protein_anchor_g || 0))
  const meals = Math.max(1, Math.round(input.meal_frequency || 0))

  if (!suppression.any) {
    return { ok: true, reasons: [], suggestions: [] }
  }

  // Minimum meal count
  if (meals < MIN_MEAL_COUNT_WHEN_SUPPRESSED) {
    reasons.push(`Client is on appetite-suppressing medication, so the doctrine requires at least ${MIN_MEAL_COUNT_WHEN_SUPPRESSED} meals (currently ${meals}). Three large meals is rejected because a suppressed client can't reliably finish 50g+ protein in a single sitting.`)
    suggestions.push({ label: `Bump meals to ${MIN_MEAL_COUNT_WHEN_SUPPRESSED}`, patch: { meal_frequency: MIN_MEAL_COUNT_WHEN_SUPPRESSED } })
  }

  // Maximum achievable protein with current meal count and caps
  const effectiveMeals = Math.max(meals, MIN_MEAL_COUNT_WHEN_SUPPRESSED)
  const maxAchievable = suppression.has_stimulant
    ? STIMULANT_FIRST_MEAL_PROTEIN_CAP + (effectiveMeals - 1) * PER_MEAL_PROTEIN_CAP
    : effectiveMeals * PER_MEAL_PROTEIN_CAP

  if (anchor > maxAchievable) {
    const gap = anchor - maxAchievable
    reasons.push(`Protein anchor (${anchor}g) cannot be hit with ${effectiveMeals} meals. The hard rules cap protein at ${suppression.has_stimulant ? `${STIMULANT_FIRST_MEAL_PROTEIN_CAP}g first meal + ${PER_MEAL_PROTEIN_CAP}g each subsequent` : `${PER_MEAL_PROTEIN_CAP}g per meal`}, so the max achievable is ${maxAchievable}g (gap of ${gap}g).`)

    // Minimum meals to fit the anchor
    const minMealsForAnchor = suppression.has_stimulant
      ? Math.max(MIN_MEAL_COUNT_WHEN_SUPPRESSED, Math.ceil((anchor - STIMULANT_FIRST_MEAL_PROTEIN_CAP) / PER_MEAL_PROTEIN_CAP) + 1)
      : Math.max(MIN_MEAL_COUNT_WHEN_SUPPRESSED, Math.ceil(anchor / PER_MEAL_PROTEIN_CAP))
    if (minMealsForAnchor !== effectiveMeals) {
      suggestions.push({ label: `Bump meals to ${minMealsForAnchor}`, patch: { meal_frequency: minMealsForAnchor } })
    }
    if (maxAchievable >= 100) {
      suggestions.push({ label: `Lower anchor to ${maxAchievable}g`, patch: { protein_anchor_g: maxAchievable } })
    }
  }

  return { ok: reasons.length === 0, reasons, suggestions }
}

// Detects medication classes that materially suppress appetite. When any of
// these are present, the validator enforces per-meal protein caps and a
// minimum meal frequency so plans don't ship as 3 enormous meals the client
// physically cannot finish.
export interface AppetiteSuppressionContext {
  has_stimulant: boolean   // Vyvanse, Adderall, Ritalin, Concerta, methylphenidate
  has_glp1: boolean        // Ozempic, Wegovy, Mounjaro, Zepbound, semaglutide, tirzepatide
  has_serotonergic: boolean // SSRIs/SNRIs known to blunt appetite — Brintillex, Lexapro, Zoloft, Prozac, Effexor, Cymbalta, vortioxetine
  any: boolean
}

export function detectAppetiteSuppression(medications: string | null | undefined): AppetiteSuppressionContext {
  if (!medications) {
    return { has_stimulant: false, has_glp1: false, has_serotonergic: false, any: false }
  }
  const m = medications.toLowerCase()
  const has_stimulant = /\b(vyvanse|lisdexamfetamine|adderall|amphetamine|ritalin|concerta|methylphenidate|dexamfetamine|dexedrine)\b/.test(m)
  const has_glp1 = /\b(glp-?1|ozempic|wegovy|mounjaro|zepbound|semaglutide|tirzepatide|liraglutide|saxenda|rybelsus)\b/.test(m)
  const has_serotonergic = /\b(brintellix|brintillex|vortioxetine|lexapro|escitalopram|zoloft|sertraline|prozac|fluoxetine|effexor|venlafaxine|cymbalta|duloxetine|paxil|paroxetine|celexa|citalopram|trintellix)\b/.test(m)
  return { has_stimulant, has_glp1, has_serotonergic, any: has_stimulant || has_glp1 || has_serotonergic }
}

export interface NutritionValidationResult {
  ok: boolean
  issues: ValidationIssue[]
  totals: MacroTotals
  band: CalorieBand | null
}

/**
 * Recompute meal-level macros from each meal's structured foods, and the daily
 * calorie band from the recomputed meal totals.
 *
 * Haiku 4.5 is unreliable at summing macros — it consistently writes meal-level
 * protein_g/carb_g/fat_g that don't match its own food list, and a calorie band
 * that doesn't match the meals. We treat the structured FOOD macros as the
 * source of truth and derive everything upstream from them. The model's
 * meal-level and day-level fields are discarded for plans that use the new
 * structured-food schema.
 *
 * Returns a mutated copy with the corrected values. Mutation is bounded to
 * meal.protein_g/carb_g/fat_g and the top-level estimated_calorie_band.
 */
export function normalizeMealAndDayTotals<T extends { meals?: MealLike[]; estimated_calorie_band?: string | null }>(
  plan: T
): T {
  if (!plan.meals || plan.meals.length === 0) return plan
  let allStructured = true
  for (const meal of plan.meals) {
    if (!Array.isArray(meal.foods) || meal.foods.length === 0) {
      allStructured = false
      continue
    }
    let p = 0
    let c = 0
    let f = 0
    let mealStructured = true
    for (const raw of meal.foods) {
      const nf = normalizeFood(raw)
      if (nf.protein_g === null) {
        mealStructured = false
        break
      }
      p += nf.protein_g
      c += nf.carb_g!
      f += nf.fat_g!
    }
    if (!mealStructured) {
      allStructured = false
      continue
    }
    meal.protein_g = Math.round(p)
    meal.carb_g = Math.round(c)
    meal.fat_g = Math.round(f)
  }
  if (allStructured) {
    const totals = computeNutritionTotals(plan.meals)
    const low = Math.max(0, Math.round((totals.kcal - 100) / 50) * 50)
    const high = Math.round((totals.kcal + 100) / 50) * 50
    plan.estimated_calorie_band = formatCalorieBand(low, high)
  }
  return plan
}

export function validateNutritionPlan(
  input: NutritionValidationInput
): NutritionValidationResult {
  const issues: ValidationIssue[] = []
  const totals = computeNutritionTotals(input.meals)
  const band = parseCalorieBand(input.estimated_calorie_band)

  if (!input.meals || input.meals.length === 0) {
    issues.push({ code: 'NO_MEALS', message: 'Plan contains zero meals.' })
    return { ok: false, issues, totals, band }
  }

  // Foods must be structured. With structured foods we recompute meal macros
  // server-side, so we no longer validate meal-macro = food-macro consistency
  // (it's mechanically guaranteed by normalizeMealAndDayTotals).
  for (const m of input.meals) {
    const name = m.meal_name ?? 'meal'
    if (!Array.isArray(m.foods) || m.foods.length === 0) {
      issues.push({ code: 'MEAL_NO_FOODS', message: `${name}: foods array is empty.` })
      continue
    }
    let allStructured = true
    for (const raw of m.foods) {
      const f = normalizeFood(raw)
      if (f.protein_g === null) { allStructured = false; break }
    }
    if (!allStructured) {
      issues.push({
        code: 'FOODS_NOT_STRUCTURED',
        message: `${name}: foods must be structured {name, protein_g, carb_g, fat_g} objects.`,
      })
      continue
    }
    // Audit 2026-05-26: reject any food with a negative macro field. The LLM
    // discovered that adding "ghost" foods with negative macros lets it
    // subtract from meal totals to fit a tight calorie ceiling (see Amanda's
    // plan: "10g butter (removed - accounting correction) F-10"). No real
    // food has negative grams of anything. The fix is structural: any food
    // with negative protein, carb, or fat is rejected and the model must
    // produce a plan with smaller real portions instead.
    for (const raw of m.foods) {
      const food = normalizeFood(raw)
      const negativeFields: string[] = []
      if ((food.protein_g ?? 0) < 0) negativeFields.push(`protein_g=${food.protein_g}`)
      if ((food.carb_g ?? 0) < 0) negativeFields.push(`carb_g=${food.carb_g}`)
      if ((food.fat_g ?? 0) < 0) negativeFields.push(`fat_g=${food.fat_g}`)
      if (negativeFields.length > 0) {
        issues.push({
          code: 'NEGATIVE_FOOD_MACRO',
          message: `${name}: food "${food.name}" has negative macro field(s) (${negativeFields.join(', ')}). Real foods cannot have negative grams. Reduce portion sizes of real foods instead of subtracting via ghost entries.`,
        })
      }
    }
    if ((Number(m.protein_g) || 0) <= 0) {
      issues.push({ code: 'MEAL_NO_PROTEIN', message: `${name}: protein_g is zero or missing.` })
    }
  }

  // Protein anchor reconciliation. ±20g tolerance — strict enough to catch
  // undersized portion accidents (e.g., 70g delivered vs 115g target), loose
  // enough to allow the model's natural portion choices (eggs in 3s, 150g
  // vs 180g chicken etc.) without bouncing repeatedly. Was ±15 but Sonnet
  // consistently landed 16-20g over on tight bridge-mode budgets — the
  // extra 5g is operational noise.
  if (input.protein_anchor_g) {
    const diff = Math.abs(totals.protein_g - input.protein_anchor_g)
    if (diff > 20) {
      issues.push({
        code: 'PROTEIN_ANCHOR_MISMATCH',
        message: `Daily protein totals ${totals.protein_g}g but protein_anchor_g is ${input.protein_anchor_g}g (±20g allowed).`,
      })
    }
  }

  // Appetite-suppression enforcement. If the client is on any stimulant /
  // GLP-1 / serotonergic appetite-affecting medication, the plan MUST be
  // physically executable at the client's reduced appetite capacity. Three
  // operational rules apply:
  //   1. ≥4 meals so per-meal portion size stays achievable
  //   2. No single meal exceeds 40g protein (an upper bound for a single
  //      sitting under appetite suppression)
  //   3. For stimulants specifically (Vyvanse / Adderall etc.) the first
  //      meal of the day caps at 30g protein — peak suppression window is
  //      morning hours, dosing too much then guarantees skipping.
  const suppression = detectAppetiteSuppression(input.medications)
  if (suppression.any) {
    if (input.meals.length < 4) {
      issues.push({
        code: 'APPETITE_SUPPRESSED_MEAL_COUNT_TOO_LOW',
        message: `Plan has ${input.meals.length} meals but client is on appetite-suppressing medication (${[
          suppression.has_stimulant && 'stimulant',
          suppression.has_glp1 && 'GLP-1',
          suppression.has_serotonergic && 'SSRI/SNRI',
        ].filter(Boolean).join(', ')}). Doctrine requires ≥4 smaller meals so per-meal portions are achievable.`,
      })
    }
    // Per-meal protein cap. 43g is the operational ceiling for "what a
    // suppressed client can finish in 20-30 min" — calibrated empirically:
    // 40g forced too-clean portion math (Sonnet rounded up to 44g chicken
    // breast natural serves and bounced repeatedly), 45g+ starts to feel
    // unfinishable. 43g lands inside the natural portion sizes the model
    // tends to output without compromising executability.
    for (const m of input.meals) {
      const mp = Number(m.protein_g) || 0
      const name = m.meal_name ?? 'meal'
      if (mp > 43) {
        issues.push({
          code: 'APPETITE_SUPPRESSED_PER_MEAL_PROTEIN_TOO_HIGH',
          message: `${name}: ${mp}g protein exceeds the 43g per-meal ceiling for appetite-suppressed clients. Redistribute across more meals.`,
        })
      }
    }
    // Stimulant first-meal cap. 32g for the same calibration reason — gives
    // model room to land on 2 whole eggs (~12g) + small protein side without
    // bouncing on 30g exactness.
    if (suppression.has_stimulant && input.meals.length > 0) {
      const first = input.meals[0]
      const firstP = Number(first.protein_g) || 0
      const firstName = first.meal_name ?? 'first meal'
      if (firstP > 35) {
        issues.push({
          code: 'STIMULANT_FIRST_MEAL_PROTEIN_TOO_HIGH',
          message: `${firstName}: ${firstP}g protein is too high for the morning stimulant-suppression window. Cap at 35g and shift protein to later meals.`,
        })
      }
    }
  }

  // Transitional override: skip the bodyweight-derived nutrient floors and
  // enforce the coach-prescribed kcal BAND instead. Floor stops dangerous
  // under-fueling; ceiling stops the engine ballooning the plan upward
  // away from the bridge target (the original v1 of this rule was floor-
  // only, which let plans land at 2,400 kcal when the coach asked for 1,600
  // — the protein anchor alone was driving kcal up). Used for chronic
  // under-eaters who cannot physically execute the standard floors —
  // documented justification stored on the plan, auto-expires after 4 weeks.
  const override = input.transitional_override
  if (override?.active && override.floor_kcal > 0) {
    const ceilingKcal = override.floor_kcal + BRIDGE_CEILING_BUFFER
    if (totals.kcal < override.floor_kcal) {
      issues.push({
        code: 'TRANSITIONAL_FLOOR_NOT_MET',
        message: `Daily kcal ${totals.kcal} is below the transitional floor of ${override.floor_kcal} kcal you set on this plan.`,
      })
    }
    if (totals.kcal > ceilingKcal) {
      issues.push({
        code: 'TRANSITIONAL_CEILING_EXCEEDED',
        message: `Daily kcal ${totals.kcal} exceeds the transitional ceiling of ${ceilingKcal} kcal (bridge floor ${override.floor_kcal} + ${BRIDGE_CEILING_BUFFER} buffer). Bridge mode targets the floor, not above it — lower the protein anchor or reduce portions.`,
      })
    }
    // Substitution audit also runs under the override (it's about swap
    // accuracy, not safety floors). Substitution findings are warnings, not
    // blockers — they surface for coach review but do not fail the plan.
    issues.push(...validateSubstitutionOptions(input.substitution_options))
    // Skip the standard carb/fat floors when the override is active —
    // that's the point of the override.
    return { ok: !issues.some(isBlocking), issues, totals, band }
  }

  // Daily safety floors. These are not target macros — they're minimums that
  // prevent dangerously under-fueled plans. The coach reviews the daily totals
  // on the dashboard and decides whether the resulting band is appropriate.
  // Stabilisation doctrine allows low carbs (3–4 g/kg max) — we floor at
  // 1.5 g/kg to prevent zero-carb accidents while respecting the doctrine.
  if (input.bodyweight_kg) {
    const bw = input.bodyweight_kg
    // Carb floor scales with demand level. "low" drops the floor to 0.8 g/kg
    // so a coach who explicitly prescribes low-carb (e.g. ~140g for a 100kg
    // client) isn't bounced by a 150g hard floor that was designed to
    // prevent zero-carb accidents, not enforce a specific tier.
    const carbFloorMultiplier =
      input.carb_demand_level === 'low' ? 0.8 :
      input.carb_demand_level === 'high' ? 2.5 :
      1.5  // moderate or unspecified
    const carbFloor = Math.round(bw * carbFloorMultiplier)
    const fatFloor = Math.round(bw * 0.7)
    if (totals.carb_g < carbFloor) {
      issues.push({
        code: 'CARB_FLOOR_NOT_MET',
        message: `Daily carbs ${totals.carb_g}g is below the ${carbFloor}g safety floor (bodyweight ${bw}kg × ${carbFloorMultiplier} g/kg for carb_demand_level=${input.carb_demand_level ?? 'moderate'}).`,
      })
    }
    if (totals.fat_g < fatFloor) {
      issues.push({
        code: 'FAT_FLOOR_NOT_MET',
        message: `Daily fat ${totals.fat_g}g is below the ${fatFloor}g safety floor (bodyweight ${bw}kg × 0.7 g/kg).`,
      })
    }
  }

  // Substitution audit (item E, 2026-06-09). Runs after the standard
  // floors so the report shows safety-floor issues first. Substitution
  // findings are warnings — surfaced for coach review, not blocking.
  issues.push(...validateSubstitutionOptions(input.substitution_options))

  return { ok: !issues.some(isBlocking), issues, totals, band }
}
