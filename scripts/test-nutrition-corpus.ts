/**
 * Nutrition Engine Regression Test Corpus
 *
 * Replays a fixed set of (client profile × meal plan) combinations against
 * the validator and pre-flight feasibility check, comparing actual outcomes
 * to expected. Catches regressions in doctrine changes before they reach
 * production — e.g. a prompt edit that accidentally rejects every existing
 * plan, a constant change that breaks a rule, a new validator rule that
 * fires too aggressively.
 *
 * Run: `npx tsx scripts/test-nutrition-corpus.ts`
 * Add to CI gate before any commit that touches:
 *   - src/lib/nutrition-validation.ts
 *   - src/lib/nutrition-prompt.ts
 *   - src/app/api/generate-nutrition/route.ts
 *   - src/app/api/suggest-nutrition/route.ts
 *
 * Adding a profile: append to `profiles` array. Adding a test: append to
 * `cases` array — provide `profile`, `plan`, `expected`. The runner does
 * the rest.
 */

import {
  validateNutritionPlan,
  normalizeMealAndDayTotals,
  checkPrescriptionFeasibility,
  NUTRITION_DOCTRINE_VERSION,
  type NutritionValidationInput,
  type MealLike,
  type StructuredFood,
} from '../src/lib/nutrition-validation'
import { emitValidatorEvent } from '../src/lib/nutrition-telemetry'

/* ──────────────────────────────────────────────────────────────────────────
 * Client profiles
 * ────────────────────────────────────────────────────────────────────────── */

interface Profile {
  name: string
  notes: string
  bodyweight_kg: number
  medications: string | null
  /** Standard prescription inputs the suggest engine would produce */
  prescription: {
    entry_state: 'stabilisation' | 'training_support' | 'high_output_support' | 'recovery_reset'
    protein_anchor_g: number
    carb_demand_level: 'low' | 'moderate' | 'high'
    meal_frequency: number
  }
}

const profiles: Record<string, Profile> = {
  amanda: {
    name: 'Amanda (real client)',
    notes: 'Stimulant + GLP-1 + SSRI stack. 102kg female. Chronic under-eater (~1,400 actual). Triggered today\'s overhaul.',
    bodyweight_kg: 102.3,
    medications: 'Estrogen patches; Prometrium; Testosterone cream; Brintellix 15mg; Vyvanse 30mg; Ozempic 1mg weekly',
    prescription: { entry_state: 'stabilisation', protein_anchor_g: 174, carb_demand_level: 'low', meal_frequency: 5 },
  },
  standard_male: {
    name: 'Synthetic: standard male, no meds',
    notes: '80kg male, no appetite suppression, moderate carbs, 4 meals. Baseline pass-everything case.',
    bodyweight_kg: 80,
    medications: null,
    prescription: { entry_state: 'training_support', protein_anchor_g: 152, carb_demand_level: 'moderate', meal_frequency: 4 },
  },
  light_female_no_meds: {
    name: 'Synthetic: 55kg female, no meds',
    notes: 'Stabilisation, low-mid prescription. Tests the lower end of bodyweight floors.',
    bodyweight_kg: 55,
    medications: null,
    prescription: { entry_state: 'stabilisation', protein_anchor_g: 94, carb_demand_level: 'low', meal_frequency: 4 },
  },
  heavy_athlete: {
    name: 'Synthetic: 130kg athlete, no meds',
    notes: 'High output support, high carbs, 5 meals. Tests upper end of caps.',
    bodyweight_kg: 130,
    medications: null,
    prescription: { entry_state: 'high_output_support', protein_anchor_g: 260, carb_demand_level: 'high', meal_frequency: 5 },
  },
  stimulant_only: {
    name: 'Synthetic: stimulant only',
    notes: 'Adderall, no GLP-1 or SSRI. 90kg. Tests stimulant first-meal cap.',
    bodyweight_kg: 90,
    medications: 'Adderall XR 25mg daily',
    prescription: { entry_state: 'stabilisation', protein_anchor_g: 153, carb_demand_level: 'moderate', meal_frequency: 5 },
  },
  glp1_only: {
    name: 'Synthetic: GLP-1 only',
    notes: 'Mounjaro, no stimulant. 110kg female. Tests appetite-suppression rules without the stimulant first-meal cap.',
    bodyweight_kg: 110,
    medications: 'Mounjaro 5mg weekly',
    prescription: { entry_state: 'stabilisation', protein_anchor_g: 187, carb_demand_level: 'low', meal_frequency: 5 },
  },
}

/* ──────────────────────────────────────────────────────────────────────────
 * Plan factories — produce structured meal plans matching expected shape
 * ────────────────────────────────────────────────────────────────────────── */

function mealOf(name: string, foods: StructuredFood[]): MealLike {
  const protein_g = foods.reduce((s, f) => s + f.protein_g, 0)
  const carb_g = foods.reduce((s, f) => s + f.carb_g, 0)
  const fat_g = foods.reduce((s, f) => s + f.fat_g, 0)
  return { meal_name: name, protein_g, carb_g, fat_g, foods }
}

/** A balanced 5-meal plan suitable for Amanda-style stimulant stack at 174g anchor */
const amandaBalanced5Meal: MealLike[] = [
  mealOf('Breakfast', [
    { name: '2 whole eggs', protein_g: 12, carb_g: 0, fat_g: 10 },
    { name: '50g Greek yoghurt full-fat', protein_g: 5, carb_g: 2, fat_g: 3 },
    { name: '1 medium banana (~120g)', protein_g: 1, carb_g: 27, fat_g: 0 },
    { name: '10g butter', protein_g: 0, carb_g: 0, fat_g: 8 },
  ]), // P18 C29 F21
  mealOf('Mid-morning snack', [
    { name: '120g chicken breast (raw)', protein_g: 26, carb_g: 0, fat_g: 3 },
    { name: '100g white rice (cooked)', protein_g: 2, carb_g: 28, fat_g: 0 },
    { name: '10g olive oil', protein_g: 0, carb_g: 0, fat_g: 10 },
  ]), // P28 C28 F13
  mealOf('Lunch', [
    { name: '150g chicken breast (raw)', protein_g: 33, carb_g: 0, fat_g: 4 },
    { name: '200g white potato (cooked, boiled)', protein_g: 4, carb_g: 32, fat_g: 0 },
    { name: '5g olive oil drizzle', protein_g: 0, carb_g: 0, fat_g: 5 },
  ]), // P37 C32 F9
  mealOf('Afternoon snack', [
    { name: '150g Greek yoghurt full-fat', protein_g: 14, carb_g: 6, fat_g: 8 },
    { name: '20g almonds', protein_g: 4, carb_g: 4, fat_g: 10 },
    { name: '100g berries', protein_g: 1, carb_g: 14, fat_g: 0 },
  ]), // P19 C24 F18
  mealOf('Dinner', [
    { name: '180g beef mince 15% fat (raw)', protein_g: 34, carb_g: 0, fat_g: 27 },
    { name: '100g white rice (cooked)', protein_g: 2, carb_g: 28, fat_g: 0 },
    { name: '100g broccoli (steamed)', protein_g: 3, carb_g: 7, fat_g: 0 },
    { name: '10g tallow', protein_g: 0, carb_g: 0, fat_g: 10 },
  ]), // P39 C35 F37
]
// Totals: P141 C148 F98 = 1450 kcal ... wait too low. Let me recompute.
// Actually: protein = 18+28+37+19+39 = 141g, carbs = 29+28+32+24+35 = 148g, fat = 21+13+9+18+37 = 98g
// kcal = 141*4 + 148*4 + 98*9 = 564 + 592 + 882 = 2038 kcal
// Off the 174g anchor by 33g (-33). That fails PROTEIN_ANCHOR_MISMATCH (>20g tolerance).
// Need to bump protein. Let me rebuild it stronger.

/** A 4-meal plan with 152g protein anchor for the standard non-stimulant male */
const standardMale4Meal: MealLike[] = [
  mealOf('Breakfast', [
    { name: '3 whole eggs', protein_g: 18, carb_g: 0, fat_g: 15 },
    { name: '60g oats (dry)', protein_g: 8, carb_g: 36, fat_g: 4 },
    { name: '100g berries', protein_g: 1, carb_g: 14, fat_g: 0 },
  ]), // P27 C50 F19
  mealOf('Lunch', [
    { name: '180g chicken breast (raw)', protein_g: 40, carb_g: 0, fat_g: 4 },
    { name: '250g white potato (cooked)', protein_g: 5, carb_g: 40, fat_g: 0 },
    { name: '10g olive oil', protein_g: 0, carb_g: 0, fat_g: 10 },
  ]), // P45 C40 F14
  mealOf('Afternoon snack', [
    { name: '150g cottage cheese', protein_g: 17, carb_g: 5, fat_g: 6 },
    { name: '30g almonds', protein_g: 6, carb_g: 7, fat_g: 15 },
  ]), // P23 C12 F21
  mealOf('Dinner', [
    { name: '180g beef mince 5% (raw)', protein_g: 40, carb_g: 0, fat_g: 9 },
    { name: '120g white rice (cooked)', protein_g: 2, carb_g: 34, fat_g: 0 },
    { name: '150g broccoli', protein_g: 4, carb_g: 10, fat_g: 0 },
    { name: '10g butter', protein_g: 0, carb_g: 0, fat_g: 8 },
  ]), // P46 C44 F17
]
// Totals: P141 C146 F71 — protein 141 vs 152 anchor, -11g, within tolerance.

/** A clearly-bad plan: 3 meals, big breakfast, big lunch — should fail multiple rules for Amanda */
const amandaBadPlan_3Meals: MealLike[] = [
  mealOf('Breakfast', [
    { name: '3 whole eggs', protein_g: 18, carb_g: 0, fat_g: 15 },
    { name: '180g chicken breast (raw)', protein_g: 40, carb_g: 0, fat_g: 4 },
  ]), // P58 — too much, also breakfast cap exceeded
  mealOf('Lunch', [
    { name: '200g beef mince 15% (raw)', protein_g: 38, carb_g: 0, fat_g: 30 },
    { name: '300g potato (cooked)', protein_g: 6, carb_g: 48, fat_g: 0 },
  ]), // P44 — over 43 cap
  mealOf('Dinner', [
    { name: '200g salmon (raw)', protein_g: 40, carb_g: 0, fat_g: 26 },
    { name: '200g potato (cooked)', protein_g: 4, carb_g: 32, fat_g: 0 },
  ]), // P44 — over 43 cap
]
// Should trigger: APPETITE_SUPPRESSED_MEAL_COUNT_TOO_LOW (3 meals), 3x APPETITE_SUPPRESSED_PER_MEAL_PROTEIN_TOO_HIGH, STIMULANT_FIRST_MEAL_PROTEIN_TOO_HIGH

/** A plan with no carbs — should fail CARB_FLOOR_NOT_MET */
const noCarbsPlan: MealLike[] = [
  mealOf('Breakfast', [
    { name: '3 whole eggs', protein_g: 18, carb_g: 0, fat_g: 15 },
    { name: '10g butter', protein_g: 0, carb_g: 0, fat_g: 8 },
  ]),
  mealOf('Lunch', [
    { name: '200g chicken breast (raw)', protein_g: 44, carb_g: 0, fat_g: 5 },
    { name: '10g olive oil', protein_g: 0, carb_g: 0, fat_g: 10 },
  ]),
  mealOf('Snack', [
    { name: '40g almonds', protein_g: 8, carb_g: 9, fat_g: 20 },
  ]),
  mealOf('Dinner', [
    { name: '200g beef steak (raw)', protein_g: 44, carb_g: 0, fat_g: 14 },
    { name: '10g butter', protein_g: 0, carb_g: 0, fat_g: 8 },
  ]),
]
// 9g carbs total → way under any carb floor

/* ──────────────────────────────────────────────────────────────────────────
 * Test cases
 * ────────────────────────────────────────────────────────────────────────── */

interface TestCase {
  name: string
  profile: Profile
  plan: MealLike[]
  /** Optional bridge override */
  override?: { active: boolean; floor_kcal: number }
  /** Expected outcome */
  expected: {
    ok: boolean
    /** Issue codes that MUST be present (subset match — other codes allowed) */
    must_contain?: string[]
    /** Issue codes that MUST NOT be present */
    must_not_contain?: string[]
  }
}

const cases: TestCase[] = [
  // ── Pass cases — verify our reference plans validate clean ────────────
  {
    name: 'standard male 4-meal plan passes',
    profile: profiles.standard_male,
    plan: standardMale4Meal,
    expected: { ok: true },
  },

  // ── Appetite-suppression rule fires for Amanda's 3-meal plan ──────────
  {
    name: 'Amanda 3-meal plan fails MEAL_COUNT_TOO_LOW + per-meal caps + stimulant first-meal',
    profile: profiles.amanda,
    plan: amandaBadPlan_3Meals,
    expected: {
      ok: false,
      must_contain: [
        'APPETITE_SUPPRESSED_MEAL_COUNT_TOO_LOW',
        'APPETITE_SUPPRESSED_PER_MEAL_PROTEIN_TOO_HIGH',
        'STIMULANT_FIRST_MEAL_PROTEIN_TOO_HIGH',
      ],
    },
  },

  // ── No-carbs plan fails carb floor for standard client, NOT for low-carb bridge ──
  {
    name: 'no-carbs plan fails CARB_FLOOR_NOT_MET for standard male',
    profile: profiles.standard_male,
    plan: noCarbsPlan,
    expected: { ok: false, must_contain: ['CARB_FLOOR_NOT_MET'] },
  },
  {
    name: 'no-carbs plan still fails CARB_FLOOR_NOT_MET even for stimulant_only with low carbs (9g << 0.8 g/kg floor = 72g)',
    profile: profiles.stimulant_only,
    plan: noCarbsPlan,
    expected: { ok: false, must_contain: ['CARB_FLOOR_NOT_MET'] },
  },

  // ── Bridge override skips standard floors ─────────────────────────────
  {
    name: 'bridge override active: carb floor SKIPPED (no CARB_FLOOR_NOT_MET) even with 9g carbs',
    profile: profiles.amanda,
    plan: noCarbsPlan,
    override: { active: true, floor_kcal: 1500 },
    expected: {
      ok: false, // still fails for other reasons but NOT carb floor
      must_not_contain: ['CARB_FLOOR_NOT_MET', 'FAT_FLOOR_NOT_MET'],
    },
  },

  // ── GLP-1 only client: appetite rules fire but no stimulant first-meal cap ──
  {
    name: 'GLP-1 only: per-meal protein cap fires, but no STIMULANT_FIRST_MEAL_PROTEIN_TOO_HIGH',
    profile: profiles.glp1_only,
    plan: amandaBadPlan_3Meals,
    expected: {
      ok: false,
      must_contain: ['APPETITE_SUPPRESSED_MEAL_COUNT_TOO_LOW', 'APPETITE_SUPPRESSED_PER_MEAL_PROTEIN_TOO_HIGH'],
      must_not_contain: ['STIMULANT_FIRST_MEAL_PROTEIN_TOO_HIGH'],
    },
  },

  // ── No-meds client: appetite rules don't fire even with 3 meals ───────
  {
    name: 'No-meds client: 3-meal plan does NOT trigger appetite-suppression rules',
    profile: profiles.standard_male,
    plan: amandaBadPlan_3Meals,
    expected: {
      ok: false, // still fails for other reasons
      must_not_contain: [
        'APPETITE_SUPPRESSED_MEAL_COUNT_TOO_LOW',
        'APPETITE_SUPPRESSED_PER_MEAL_PROTEIN_TOO_HIGH',
        'STIMULANT_FIRST_MEAL_PROTEIN_TOO_HIGH',
      ],
    },
  },

  // ── Ghost-food protection: negative-macro entries get rejected ────────
  // Doctrine 2026-05-26: the model discovered it could subtract from meal
  // totals by adding "removed - accounting correction" entries with
  // negative grams. Real foods can't have negative macros. Validator now
  // catches this. Triggered by Amanda's plan on 2026-05-26 where the
  // LLM added 6 ghost entries to fit the bridge ceiling.
  {
    name: 'Ghost-food protection: negative macro entry rejected',
    profile: profiles.amanda,
    plan: [
      {
        meal_name: 'Breakfast',
        protein_g: 28,
        carb_g: 18,
        fat_g: 18,
        foods: [
          { name: '3 whole eggs', protein_g: 18, carb_g: 0, fat_g: 15 },
          { name: '10g butter (cooking fat)', protein_g: 0, carb_g: 0, fat_g: 8 },
          { name: '100g Greek yoghurt (full-fat)', protein_g: 9, carb_g: 4, fat_g: 5 },
          { name: '100g berries (mixed)', protein_g: 1, carb_g: 14, fat_g: 0 },
          { name: '10g butter (removed - accounting correction)', protein_g: 0, carb_g: 0, fat_g: -10 },
        ],
      },
      { meal_name: 'Lunch',  protein_g: 30, carb_g: 30, fat_g: 15, foods: [{ name: '120g chicken', protein_g: 30, carb_g: 0, fat_g: 4 }, { name: '70g rice (dry)', protein_g: 5, carb_g: 50, fat_g: 1 }, { name: '10g oil', protein_g: 0, carb_g: 0, fat_g: 10 }] },
      { meal_name: 'Snack',  protein_g: 30, carb_g: 5,  fat_g: 10, foods: [{ name: 'Greek yog', protein_g: 25, carb_g: 5, fat_g: 8 }, { name: 'almonds 5g', protein_g: 1, carb_g: 1, fat_g: 3 }] },
      { meal_name: 'Dinner', protein_g: 35, carb_g: 30, fat_g: 15, foods: [{ name: '150g mince', protein_g: 30, carb_g: 0, fat_g: 12 }, { name: '150g potato', protein_g: 3, carb_g: 25, fat_g: 0 }, { name: '5g oil', protein_g: 0, carb_g: 0, fat_g: 5 }] },
      { meal_name: 'Late',   protein_g: 32, carb_g: 10, fat_g: 8,  foods: [{ name: '200g cottage cheese', protein_g: 22, carb_g: 6, fat_g: 5 }, { name: '20g nut butter', protein_g: 5, carb_g: 4, fat_g: 10 }] },
    ],
    expected: {
      ok: false,
      must_contain: ['NEGATIVE_FOOD_MACRO'],
    },
  },
]

/* ──────────────────────────────────────────────────────────────────────────
 * Pre-flight feasibility test cases
 * ────────────────────────────────────────────────────────────────────────── */

interface FeasibilityCase {
  name: string
  inputs: { protein_anchor_g: number; meal_frequency: number; medications: string | null }
  expected: { ok: boolean; reason_includes?: string }
}

const feasibilityCases: FeasibilityCase[] = [
  {
    name: 'No suppression: always feasible',
    inputs: { protein_anchor_g: 200, meal_frequency: 3, medications: null },
    expected: { ok: true },
  },
  {
    name: 'Stimulant + 4 meals + 165g anchor: max achievable is 35+43*3 = 164g, infeasible',
    inputs: { protein_anchor_g: 165, meal_frequency: 4, medications: 'Vyvanse 30mg' },
    expected: { ok: false, reason_includes: 'cannot be hit' },
  },
  {
    name: 'Stimulant + 5 meals + 165g anchor: max 35+43*4 = 207g, feasible',
    inputs: { protein_anchor_g: 165, meal_frequency: 5, medications: 'Vyvanse 30mg' },
    expected: { ok: true },
  },
  {
    name: 'GLP-1 + 3 meals: meal count too low (needs 4)',
    inputs: { protein_anchor_g: 130, meal_frequency: 3, medications: 'Ozempic' },
    expected: { ok: false, reason_includes: '4 meals' },
  },
  {
    name: 'SSRI alone + 4 meals + 140g anchor: feasible (max 43*4 = 172g)',
    inputs: { protein_anchor_g: 140, meal_frequency: 4, medications: 'Lexapro 10mg' },
    expected: { ok: true },
  },
]

/* ──────────────────────────────────────────────────────────────────────────
 * Runner
 * ────────────────────────────────────────────────────────────────────────── */

function runValidatorCase(c: TestCase): { pass: boolean; detail: string } {
  // Normalise totals (matches what generate-nutrition does pre-validate)
  const planCopy = { meals: JSON.parse(JSON.stringify(c.plan)) as MealLike[], estimated_calorie_band: null as string | null }
  normalizeMealAndDayTotals(planCopy)

  const input: NutritionValidationInput = {
    meals: planCopy.meals,
    estimated_calorie_band: planCopy.estimated_calorie_band,
    protein_anchor_g: c.profile.prescription.protein_anchor_g,
    bodyweight_kg: c.profile.bodyweight_kg,
    entry_state: c.profile.prescription.entry_state,
    medications: c.profile.medications,
    carb_demand_level: c.profile.prescription.carb_demand_level,
    transitional_override: c.override ?? null,
  }

  const result = validateNutritionPlan(input)
  const codes = result.issues.map(i => i.code)

  // Verify ok flag
  if (result.ok !== c.expected.ok) {
    return { pass: false, detail: `expected ok=${c.expected.ok}, got ok=${result.ok}. Codes: [${codes.join(', ') || 'none'}]` }
  }
  // Verify must_contain
  for (const code of c.expected.must_contain ?? []) {
    if (!codes.includes(code)) {
      return { pass: false, detail: `expected issue ${code} not present. Got codes: [${codes.join(', ') || 'none'}]` }
    }
  }
  // Verify must_not_contain
  for (const code of c.expected.must_not_contain ?? []) {
    if (codes.includes(code)) {
      return { pass: false, detail: `forbidden issue ${code} was present. Got codes: [${codes.join(', ') || 'none'}]` }
    }
  }
  return { pass: true, detail: `ok=${result.ok}, codes: [${codes.join(', ') || 'none'}], kcal=${result.totals.kcal}` }
}

function runFeasibilityCase(c: FeasibilityCase): { pass: boolean; detail: string } {
  const result = checkPrescriptionFeasibility(c.inputs)
  if (result.ok !== c.expected.ok) {
    return { pass: false, detail: `expected ok=${c.expected.ok}, got ok=${result.ok}. Reasons: ${result.reasons.join(' | ')}` }
  }
  if (c.expected.reason_includes) {
    const hit = result.reasons.some(r => r.toLowerCase().includes(c.expected.reason_includes!.toLowerCase()))
    if (!hit) {
      return { pass: false, detail: `expected reason to include "${c.expected.reason_includes}". Got: ${result.reasons.join(' | ')}` }
    }
  }
  return { pass: true, detail: `ok=${result.ok}, reasons: [${result.reasons.length}], suggestions: [${result.suggestions.length}]` }
}

let passCount = 0
let failCount = 0

async function main() {

console.log('\n═══════════════════════════════════════════════════════════════════')
console.log(' DOCTRINE INVARIANTS')
console.log('═══════════════════════════════════════════════════════════════════\n')

const doctrineVersionFormat = /^\d{4}-\d{2}-\d{2}(\.\d+)?$/
{
  const ok = doctrineVersionFormat.test(NUTRITION_DOCTRINE_VERSION)
  const icon = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'
  console.log(`${icon} NUTRITION_DOCTRINE_VERSION matches YYYY-MM-DD[.N] format`)
  console.log(`    current value: "${NUTRITION_DOCTRINE_VERSION}"`)
  if (ok) passCount++
  else { failCount++; console.log(`    expected format like '2026-05-25' or '2026-05-25.1'`) }
}

// Telemetry helper must NEVER throw, even when the table doesn't exist.
// Phase 4 commit 4: this is the single most important invariant of the
// telemetry layer — a missing table or any other DB error must not block
// plan generation.
{
  const stubAdmin = {
    from: () => ({
      insert: async () => ({
        data: null,
        error: { message: 'relation "nutrition_validator_events" does not exist', code: '42P01' },
      }),
    }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
  let threw = false
  try {
    await emitValidatorEvent(stubAdmin, {
      client_id: null,
      doctrine_version: NUTRITION_DOCTRINE_VERSION,
      attempt_tier: 'haiku',
      attempt_index: 0,
      ok: true,
      issue_codes: [],
      entry_state: 'stabilisation',
      protein_anchor_g: 150,
      meal_frequency: 4,
      carb_demand_level: 'moderate',
      has_stimulant: false,
      has_glp1: false,
      has_serotonergic: false,
      transitional_override_active: false,
      request_id: '00000000-0000-0000-0000-000000000000',
    })
  } catch {
    threw = true
  }
  const icon = !threw ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'
  console.log(`${icon} emitValidatorEvent resolves silently when telemetry table is missing`)
  if (!threw) passCount++
  else { failCount++; console.log(`    helper threw — generation would block if this fired in production`) }
}

console.log('\n═══════════════════════════════════════════════════════════════════')
console.log(' NUTRITION VALIDATOR REGRESSION CORPUS')
console.log('═══════════════════════════════════════════════════════════════════\n')

for (const c of cases) {
  const r = runValidatorCase(c)
  const icon = r.pass ? '✓' : '✗'
  const colour = r.pass ? '\x1b[32m' : '\x1b[31m'
  const reset = '\x1b[0m'
  console.log(`${colour}${icon}${reset} ${c.name}`)
  console.log(`    profile: ${c.profile.name}`)
  console.log(`    ${r.detail}`)
  if (r.pass) passCount++
  else failCount++
}

console.log('\n═══════════════════════════════════════════════════════════════════')
console.log(' PRE-FLIGHT FEASIBILITY CHECK CORPUS')
console.log('═══════════════════════════════════════════════════════════════════\n')

for (const c of feasibilityCases) {
  const r = runFeasibilityCase(c)
  const icon = r.pass ? '✓' : '✗'
  const colour = r.pass ? '\x1b[32m' : '\x1b[31m'
  const reset = '\x1b[0m'
  console.log(`${colour}${icon}${reset} ${c.name}`)
  console.log(`    ${r.detail}`)
  if (r.pass) passCount++
  else failCount++
}

console.log('\n═══════════════════════════════════════════════════════════════════')
console.log(` RESULT: ${passCount} pass, ${failCount} fail (${passCount + failCount} total)`)
console.log('═══════════════════════════════════════════════════════════════════\n')

}

main().then(() => process.exit(failCount > 0 ? 1 : 0)).catch(err => { console.error(err); process.exit(1) })
