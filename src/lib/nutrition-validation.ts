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
}

export interface NutritionValidationInput {
  meals: MealLike[]
  estimated_calorie_band: string | null
  protein_anchor_g: number
  bodyweight_kg: number | null
  entry_state: string
  medications: string | null
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
    if ((Number(m.protein_g) || 0) <= 0) {
      issues.push({ code: 'MEAL_NO_PROTEIN', message: `${name}: protein_g is zero or missing.` })
    }
  }

  // Protein anchor reconciliation. ±15g tolerance — strict enough to catch
  // undersized portion accidents (e.g., 70g delivered vs 115g target), loose
  // enough to allow the model's natural portion choices (eggs in 3s, 150g vs
  // 180g chicken etc.) without bouncing repeatedly.
  if (input.protein_anchor_g) {
    const diff = Math.abs(totals.protein_g - input.protein_anchor_g)
    if (diff > 15) {
      issues.push({
        code: 'PROTEIN_ANCHOR_MISMATCH',
        message: `Daily protein totals ${totals.protein_g}g but protein_anchor_g is ${input.protein_anchor_g}g (±15g allowed).`,
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
    for (const m of input.meals) {
      const mp = Number(m.protein_g) || 0
      const name = m.meal_name ?? 'meal'
      if (mp > 40) {
        issues.push({
          code: 'APPETITE_SUPPRESSED_PER_MEAL_PROTEIN_TOO_HIGH',
          message: `${name}: ${mp}g protein exceeds the 40g per-meal ceiling for appetite-suppressed clients. Redistribute across more meals.`,
        })
      }
    }
    if (suppression.has_stimulant && input.meals.length > 0) {
      const first = input.meals[0]
      const firstP = Number(first.protein_g) || 0
      const firstName = first.meal_name ?? 'first meal'
      if (firstP > 30) {
        issues.push({
          code: 'STIMULANT_FIRST_MEAL_PROTEIN_TOO_HIGH',
          message: `${firstName}: ${firstP}g protein is too high for the morning stimulant-suppression window. Cap at 30g and shift protein to later meals.`,
        })
      }
    }
  }

  // Daily safety floors. These are not target macros — they're minimums that
  // prevent dangerously under-fueled plans. The coach reviews the daily totals
  // on the dashboard and decides whether the resulting band is appropriate.
  // Stabilisation doctrine allows low carbs (3–4 g/kg max) — we floor at
  // 1.5 g/kg to prevent zero-carb accidents while respecting the doctrine.
  if (input.bodyweight_kg) {
    const bw = input.bodyweight_kg
    const carbFloor = Math.round(bw * 1.5)
    const fatFloor = Math.round(bw * 0.7)
    if (totals.carb_g < carbFloor) {
      issues.push({
        code: 'CARB_FLOOR_NOT_MET',
        message: `Daily carbs ${totals.carb_g}g is below the ${carbFloor}g safety floor (bodyweight ${bw}kg × 1.5 g/kg).`,
      })
    }
    if (totals.fat_g < fatFloor) {
      issues.push({
        code: 'FAT_FLOOR_NOT_MET',
        message: `Daily fat ${totals.fat_g}g is below the ${fatFloor}g safety floor (bodyweight ${bw}kg × 0.7 g/kg).`,
      })
    }
  }

  return { ok: issues.length === 0, issues, totals, band }
}
