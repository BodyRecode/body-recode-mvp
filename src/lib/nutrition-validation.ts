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
    case 'FIRST_MEAL_PROTEIN_TOO_LOW':
      return `${issue.message} The daily total can be right while breakfast is starved — classically a light eggs-only first meal — which fragments amino-acid availability and, for reactive eaters, feeds later snacking. The engine needs to bring breakfast up; retrying with this feedback usually fixes it.`
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

/**
 * Deterministically shift protein into the day's FIRST meal until it carries
 * the highest protein of the main meals.
 *
 * Why this is code and not a prompt instruction: asking has failed on FIVE
 * consecutive generations for the same client, as a blocking error, as a
 * warning, and as prose spelling out target grams meal by meal. Breakfast came
 * back 19g, 37g, 45g, 33g and 26g against leaders of 38g, 48g, 48g, 62g and
 * 49g. The generator is reliable on structure and unreliable on arithmetic
 * distribution, so the distribution should not be asked for.
 *
 * How it works, and what it refuses to do:
 * - It RESCALES portions of protein-dominant foods. It never invents foods,
 *   never moves food between meals (chicken breast at breakfast), and never
 *   edits a food whose gram weight cannot be read from its name.
 * - The gram figure in the NAME is rewritten with the macros, because the plan
 *   is a document the client reads. A plan whose text disagrees with its own
 *   numbers is the failure this engine has been burned by before.
 * - Every donor gives exactly what the recipient takes, so the DAILY protein
 *   total is preserved.
 * - Portions are clamped to 0.6x-1.6x of what the model chose, so a plan can
 *   be nudged but not rewritten into something absurd.
 *
 * Returns the number of grams moved (0 = nothing needed or nothing safe).
 */
export function rebalanceFirstMealProtein(meals: MealLike[]): number {
  if (!Array.isArray(meals) || meals.length < 2) return 0

  // EVERY EATING WINDOW IS A MEAL (Kade, 2026-08-31). There are no snacks, so
  // no window is excluded from the comparison. The old /snack/i filter meant a
  // plan could satisfy "breakfast carries the most protein" while two larger
  // windows sat outside the comparison entirely — which is how a 24g breakfast
  // passed against a 50g dinner.
  const first = meals[0]
  if (!first) return 0

  const P = (m: MealLike) => Number(m.protein_g) || 0
  // Grams parsed from the food's name: "180g chicken breast", "Greek yoghurt (200g)".
  const gramsOf = (name: string): number | null => {
    const m = String(name).match(/(\d+(?:\.\d+)?)\s*g\b/i)
    if (!m) return null
    const g = parseFloat(m[1])
    return Number.isFinite(g) && g > 0 ? g : null
  }
  // A protein VEHICLE, not necessarily a protein-dominant food. Full-fat Greek
  // yoghurt carries more fat calories than protein calories, and is exactly what
  // you reach for to lift breakfast protein, so a strict "protein is the biggest
  // macro" test excludes the obvious candidate. Share-based instead: meaningful
  // absolute protein, and protein at least ~30% of the food's energy. That keeps
  // yoghurt, mince, chicken and eggs, and rejects almonds (15%), rice (7%),
  // banana (4%) and oils (0%).
  const proteinVehicle = (f: StructuredFood) => {
    const pg = Number(f.protein_g) || 0
    const kcal = pg * 4 + (Number(f.carb_g) || 0) * 4 + (Number(f.fat_g) || 0) * 9
    return pg >= 5 && kcal > 0 && (pg * 4) / kcal >= 0.3
  }
  const scaleFood = (f: StructuredFood, factor: number) => {
    const g = gramsOf(f.name)
    if (g === null) return false
    const newG = Math.round(g * factor)
    if (newG < 1) return false
    f.name = String(f.name).replace(/(\d+(?:\.\d+)?)(\s*g\b)/i, `${newG}$2`)
    f.protein_g = Math.round((Number(f.protein_g) || 0) * factor)
    f.carb_g = Math.round((Number(f.carb_g) || 0) * factor)
    f.fat_g = Math.round((Number(f.fat_g) || 0) * factor)
    return true
  }
  const recount = (m: MealLike) => {
    const fs = (m.foods ?? []) as StructuredFood[]
    m.protein_g = fs.reduce((s, f) => s + (Number(f.protein_g) || 0), 0)
    m.carb_g = fs.reduce((s, f) => s + (Number(f.carb_g) || 0), 0)
    m.fat_g = fs.reduce((s, f) => s + (Number(f.fat_g) || 0), 0)
  }

  let moved = 0
  for (let pass = 0; pass < 4; pass++) {
    const leader = meals.reduce((a, b) => (P(b) > P(a) ? b : a), meals[0])
    if (leader === first || P(first) >= P(leader)) break

    const need = Math.ceil((P(leader) - P(first)) / 2) + 1
    const donor = ((leader.foods ?? []) as StructuredFood[])
      .filter(f => proteinVehicle(f) && gramsOf(f.name) !== null)
      .sort((a, b) => (Number(b.protein_g) || 0) - (Number(a.protein_g) || 0))[0]
    const taker = ((first.foods ?? []) as StructuredFood[])
      .filter(f => proteinVehicle(f) && gramsOf(f.name) !== null)
      .sort((a, b) => (Number(b.protein_g) || 0) - (Number(a.protein_g) || 0))[0]
    if (!donor || !taker) break

    const donorP = Number(donor.protein_g) || 0
    const takerP = Number(taker.protein_g) || 0
    if (donorP <= 0 || takerP <= 0) break

    // Clamp both sides to 0.6x-1.6x so portions stay recognisable.
    const give = Math.min(need, donorP - Math.ceil(donorP * 0.6), Math.floor(takerP * 0.6))
    if (give < 2) break

    const okDonor = scaleFood(donor, (donorP - give) / donorP)
    const okTaker = scaleFood(taker, (takerP + give) / takerP)
    if (!okDonor || !okTaker) break

    recount(leader)
    recount(first)
    moved += give
  }
  return moved
}

/**
 * Deterministically trim a plan down into the coach's energy target by
 * reducing FAT-carrying foods.
 *
 * Same reasoning as rebalanceFirstMealProtein: the generator lands where it
 * lands (2,456 then 2,553 against a 2,300 then 2,400 ask) and asking it again
 * does not change that. What it cannot do is arithmetic to a target; what it
 * can do is write a sensible plan. So it writes, and this lands it.
 *
 * Fat is the right place to take it from. Protein has an anchor and carbohydrate
 * has a bodyweight safety floor, both of which will reject a plan that dips
 * under them, and for an endurance client the carbohydrate is the point. Fat is
 * the residual, and a 2,553 kcal plan for a 78kg client was carrying ~128g of it.
 *
 * Only trims. Never scales a plan UP to reach a target, because inventing food
 * to hit a number is not the same kind of act as removing a little oil.
 *
 * Returns kcal removed (0 = already inside, or nothing safe to trim).
 */
export function trimDayToKcalTarget(
  meals: MealLike[],
  target: { low: number; high: number }
): number {
  if (!Array.isArray(meals) || !meals.length) return 0
  const kcalOf = (m: MealLike) =>
    (Number(m.protein_g) || 0) * 4 + (Number(m.carb_g) || 0) * 4 + (Number(m.fat_g) || 0) * 9
  const dayKcal = () => meals.reduce((s, m) => s + kcalOf(m), 0)

  const start = dayKcal()
  if (start <= target.high) return 0
  // Aim just inside the ceiling rather than the midpoint: take the least that
  // does the job, so the plan stays as close to what the model intended.
  const aim = target.high - 25

  const gramsOf = (name: string): number | null => {
    const m = String(name).match(/(\d+(?:\.\d+)?)\s*g\b/i)
    if (!m) return null
    const g = parseFloat(m[1])
    return Number.isFinite(g) && g > 0 ? g : null
  }
  // Fat-carrying: fat is the dominant macro by energy. Oils, butter, avocado,
  // nuts, cooking fats. Deliberately excludes mince and yoghurt, whose protein
  // we are trying to keep.
  const fatCarrier = (f: StructuredFood) => {
    const fk = (Number(f.fat_g) || 0) * 9
    return fk > 0 && fk > (Number(f.protein_g) || 0) * 4 && fk > (Number(f.carb_g) || 0) * 4
  }
  const recount = (m: MealLike) => {
    const fs = (m.foods ?? []) as StructuredFood[]
    m.protein_g = fs.reduce((s, f) => s + (Number(f.protein_g) || 0), 0)
    m.carb_g = fs.reduce((s, f) => s + (Number(f.carb_g) || 0), 0)
    m.fat_g = fs.reduce((s, f) => s + (Number(f.fat_g) || 0), 0)
  }

  // PUREST fats first, biggest first within that. Trimming olive oil or butter
  // costs only fat; trimming almonds or avocado also costs protein and carbs,
  // and both of those have floors to respect. Taking the cut from the purest
  // source keeps the drift off the macros that matter.
  const fatShare = (f: StructuredFood) => {
    const fk = (Number(f.fat_g) || 0) * 9
    const k = fk + (Number(f.protein_g) || 0) * 4 + (Number(f.carb_g) || 0) * 4
    return k > 0 ? fk / k : 0
  }
  const candidates: { food: StructuredFood; meal: MealLike }[] = []
  for (const m of meals) {
    for (const f of ((m.foods ?? []) as StructuredFood[])) {
      if (fatCarrier(f) && gramsOf(f.name) !== null) candidates.push({ food: f, meal: m })
    }
  }
  candidates.sort((a, b) => {
    const pure = fatShare(b.food) - fatShare(a.food)
    if (Math.abs(pure) > 0.05) return pure
    return (Number(b.food.fat_g) || 0) - (Number(a.food.fat_g) || 0)
  })

  let removed = 0
  for (const { food, meal } of candidates) {
    if (dayKcal() <= aim) break
    const g = gramsOf(food.name)
    if (g === null) continue
    const fk = (Number(food.fat_g) || 0) * 9
    const pk = (Number(food.protein_g) || 0) * 4
    const ck = (Number(food.carb_g) || 0) * 4
    const foodKcal = fk + pk + ck
    if (foodKcal <= 0) continue

    const over = dayKcal() - aim
    // Never take more than 40% off any single food: a plan should look trimmed,
    // not gutted, and the client reads these portions.
    const maxCut = foodKcal * 0.4
    const cut = Math.min(over, maxCut)
    const factor = (foodKcal - cut) / foodKcal
    const newG = Math.round(g * factor)
    if (newG < 1 || factor >= 0.999) continue

    food.name = String(food.name).replace(/(\d+(?:\.\d+)?)(\s*g\b)/i, `${newG}$2`)
    food.protein_g = Math.round((Number(food.protein_g) || 0) * factor)
    food.carb_g = Math.round((Number(food.carb_g) || 0) * factor)
    food.fat_g = Math.round((Number(food.fat_g) || 0) * factor)
    recount(meal)
    removed += Math.round(cut)
  }
  return dayKcal() < start ? start - dayKcal() : 0
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
   * Coach-set daily energy target. When present, the plan's computed day total
   * must land inside it (plus a small rounding tolerance) or the plan is
   * rejected and retried.
   *
   * Nothing checked this before 2026-08-31. `estimated_calorie_band` is
   * RECOMPUTED from the meals the model wrote, so it always agreed with itself
   * and proved nothing. The engine's own target band is 85-100% of TDEE and far
   * too wide to hold a plan to a coaching decision: Cristobal's was 2,230-2,630
   * while the coach had asked for 2,300, so a 2,456 kcal plan sailed through.
   *
   * Coach-declared rather than inferred from the brief, so the instruction and
   * the check cannot disagree.
   */
  day_kcal_target?: { low: number; high: number } | null
  /**
   * Coach opt-in: require the day's first meal to carry the HIGHEST or
   * equal-highest protein of the main meals.
   *
   * NOT doctrine and deliberately off by default. "Do not leave breakfast
   * starved" is doctrine and the FIRST_MEAL_PROTEIN_TOO_LOW floor already
   * enforces it. "Breakfast must be the highest" is a stronger, per-client
   * instruction: it appears in Cristobal's brief and in no one else's, and as
   * of 2026-08-30 EVERY active client's plan breaks it, as does the corpus
   * fixture for a good standard plan. Turning one client's brief into a global
   * rule would silently rewrite three other people's plans.
   */
  first_meal_highest_protein?: boolean | null
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

  // First-meal (breakfast) protein FLOOR — non-suppressed clients only. The
  // anchor check above only constrains the DAILY total, so the engine could
  // (and repeatedly did across multiple regenerations) land the total
  // correctly while STARVING breakfast — a 19g eggs breakfast against 37-38g
  // later meals. A light first meal fragments amino-acid availability and, for
  // reactive eaters, feeds later snacking; prompt-level instruction proved
  // unreliable, so the first meal is floored here with a retry. Scoped to the
  // FIRST meal only (a lighter afternoon snack later in the day is legitimate,
  // so we do not floor every meal). Suppressed clients are EXEMPT: their first
  // meal is deliberately kept low (stimulant suppression peaks in the morning)
  // and is governed by the caps above, not this floor.
  if (input.protein_anchor_g && !suppression.any && input.meals.length > 0) {
    const perMealTarget = input.protein_anchor_g / input.meals.length
    const floor = Math.round(perMealTarget * 0.65)
    const first = input.meals[0]
    const firstP = Number(first.protein_g) || 0
    const firstName = first.meal_name ?? 'first meal'
    if (firstP < floor) {
      issues.push({
        code: 'FIRST_MEAL_PROTEIN_TOO_LOW',
        message: `${firstName}: ${firstP}g protein is below the ${floor}g floor for the day's first meal (target ~${Math.round(perMealTarget)}g across ${input.meals.length} meals). Do not leave breakfast the starved meal — bring its protein up.`,
      })
    }

    // 2026-08-30, OPT-IN ONLY (see first_meal_highest_protein). The floor above
    // stops breakfast being STARVED. It does not make it the anchor, and the
    // two are not the same requirement.
    //
    // Cristobal's briefs called breakfast-highest "a hard requirement, not a
    // preference" across four generations and it was met on NONE of them,
    // including the plan live with him: 19g vs 38g, then 37g vs 48g, then 45g
    // vs 48g. Every one cleared the floor comfortably and broke the rule. A
    // requirement enforced only in prose is a requirement that quietly does not
    // hold, so this is the same fix already applied to meal counts.
    //
    // Gated because it is a per-client instruction, not doctrine: every active
    // client's plan breaks it, and so does the corpus fixture for a good plan.
    // The regression corpus caught exactly that when it shipped ungated.
    //
    // Compared against MAIN meals only: a lighter afternoon snack is by design.
    // Suppressed clients stay exempt for the same reason they are exempt above,
    // their first meal is deliberately kept low.
    // EVERY EATING WINDOW IS A MEAL (Kade, 2026-08-31). Compared against ALL
    // windows, not a "main meals" subset. The old /snack/i exclusion let a plan
    // pass while larger windows sat outside the comparison: a 24g breakfast
    // cleared it against a 50g dinner because two windows were ignored.
    if (input.first_meal_highest_protein && input.meals.length > 1) {
      const highest = Math.max(...input.meals.map(m => Number(m.protein_g) || 0))
      if (firstP < highest) {
        const leader = input.meals.find(m => (Number(m.protein_g) || 0) === highest)
        issues.push({
          // WARNING, not error (fixed 2026-08-31, hours after shipping).
          // Shipped as blocking, which was wrong twice over: no plan any client
          // has ever had satisfies this rule, and the generator cannot reliably
          // hit it, so a rule that had never once been met became a hard stop
          // and nutrition regeneration failed outright. The floor check above
          // is the safety rule and stays blocking; "breakfast is the anchor" is
          // a quality preference and belongs in front of the coach, not in the
          // way of the plan.
          severity: 'warning',
          code: 'FIRST_MEAL_NOT_HIGHEST_PROTEIN',
          message: `${firstName}: ${firstP}g protein is below ${leader?.meal_name ?? 'a later meal'} at ${highest}g. The day's first meal must carry the HIGHEST or equal-highest protein of the main meals. Rebalance rather than bolting protein on top: bring ${firstName} up and bring ${leader?.meal_name ?? 'the heaviest meal'} down, so the daily total still lands on the anchor.`,
        })
      }
    }
  }

  // Coach-set daily energy target (2026-08-31). Blocking: a plan that misses
  // the coach's number by more than rounding is not the plan they asked for,
  // and the retry loop can act on a whole-day figure reliably.
  if (input.day_kcal_target && totals.kcal > 0) {
    const { low, high } = input.day_kcal_target
    const TOL = 60 // per-meal integer rounding across 4-5 meals
    if (totals.kcal < low - TOL || totals.kcal > high + TOL) {
      const dir = totals.kcal > high ? 'above' : 'below'
      const delta = totals.kcal > high ? totals.kcal - high : low - totals.kcal
      issues.push({
        code: 'DAY_KCAL_OUTSIDE_TARGET',
        message: `The day totals ${totals.kcal} kcal, ${delta} kcal ${dir} the coach's target of ${low}-${high}. Adjust portion sizes on the existing foods until the day lands inside the target. Do not add or remove meals.`,
      })
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
    // 2026-07-06 (revised): floor tolerance widened from ±25 to ±75 kcal after
    // observing that model output variance on 4-meal plans with integer-rounded
    // per-meal kcal is realistically ±50-75 kcal, not ±25. The first ±25 pass
    // let Amanda's 1898 kcal plan through but the model produced 1850-1880 kcal
    // on retries (three separate runs, three separate anchors) which still hit
    // TRANSITIONAL_FLOOR_NOT_MET. Clinically, 1825 vs 1900 kcal is a 4% delta
    // — inside normal day-to-day intake variance — so failing on rounding is
    // wrong. ±75 matches BRIDGE_CEILING_BUFFER (150) proportionally: floor
    // tolerance is half the ceiling buffer because floor undershoot is common
    // (portion rounding), ceiling overshoot is rare (model self-correcting).
    const FLOOR_TOLERANCE_KCAL = 75
    const ceilingKcal = override.floor_kcal + BRIDGE_CEILING_BUFFER
    if (totals.kcal < override.floor_kcal - FLOOR_TOLERANCE_KCAL) {
      issues.push({
        code: 'TRANSITIONAL_FLOOR_NOT_MET',
        message: `Daily kcal ${totals.kcal} is below the transitional floor of ${override.floor_kcal} kcal (tolerance ±${FLOOR_TOLERANCE_KCAL}) you set on this plan.`,
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
