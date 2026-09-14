/**
 * What a one-change revision of a LIVE nutrition plan would do, before anything
 * is saved.
 *
 * reviseNutritionPlan (nutrition-revise.ts) was built on 8 Sep 2026 and nothing
 * ever called it. This is the other half: the coach sees exactly which foods
 * change, the day's calories and macros before and after, and anything the
 * change would break, then decides. Two things are checked in code rather than
 * trusted to the model:
 *
 *   ONE VARIABLE (Kade, 1 and 7 Sep). The macro that moved most is the change.
 *   If another macro also moves by more than SIDE_EFFECT_G, or the meal count
 *   changes, or a food is renamed rather than resized, the coach is told.
 *
 *   NEW SAFETY ISSUES. The plan is run through the same validator the generator
 *   uses, before and after. Only issues the change INTRODUCES are reported, so a
 *   plan that already had one does not block every future adjustment. Applying a
 *   revision with new issues requires the coach to accept them explicitly.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { applyNutritionEdits, renderMealsIndexed, validateNutritionEditOps, type NutritionEditOp } from '@/lib/nutrition-patch'
import { NUTRITION_EDIT_SYSTEM_LIVE } from '@/lib/nutrition-edit-prompt'
import { reviseNutritionPlan } from '@/lib/nutrition-revise'
import { generateGovernedJson } from '@/lib/governed-generation'
import { withTemporalContext } from '@/lib/temporal-context'
import { AI_MODELS } from '@/lib/ai-models'
import { computeNutritionTotals, validateNutritionPlan, humaniseValidationIssue, type MealLike } from '@/lib/nutrition-validation'

/** A macro moving this many grams as a side effect of the named change is expected, not a second change. */
export const SIDE_EFFECT_G = 8

type Totals = { kcal: number; protein: number; carbs: number; fat: number }

export interface RevisionPreview {
  planId: string
  planName: string
  before: Totals
  after: Totals
  applied: string[]
  missed: string[]
  /** Plain lines: which foods and meals changed. */
  changes: string[]
  /** One-variable warnings. */
  warnings: string[]
  /** Validator issues the change would introduce, in plain words. */
  newIssues: string[]
}

function toTotals(meals: MealLike[]): Totals {
  const t = computeNutritionTotals(meals)
  return { protein: t.protein_g, carbs: t.carb_g, fat: t.fat_g, kcal: t.kcal }
}

const foodName = (f: unknown) => (typeof f === 'string' ? f : String((f as { name?: string })?.name ?? ''))
const foodMacros = (f: unknown) => {
  const o = (f ?? {}) as { protein_g?: number; carb_g?: number; fat_g?: number }
  return `${Math.round(Number(o.protein_g) || 0)}/${Math.round(Number(o.carb_g) || 0)}/${Math.round(Number(o.fat_g) || 0)}`
}
/**
 * The food without its quantity, so a resize is not mistaken for a swap. Plans
 * write quantities in several places: "White rice (150g)", "260g white rice
 * (cooked)", "1 banana, medium (~120g)". Tested against a real plan 14 Sep 2026,
 * where the first version only handled the first form and called a rice resize
 * a swap.
 */
export const baseFood = (name: string) => name
  .toLowerCase()
  .replace(/\([^)]*\d[^)]*\)/g, ' ')                                       // (150g), (~120g), (2 tbsp)
  .replace(/~?\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|tbsp|tsp|cups?|slices?|x|pieces?)?\b/g, ' ') // 260g, 1, 2 tbsp
  .replace(/\b(?:extra[- ]large|x-?large|small|medium|large|half|whole)\b/g, ' ')    // "banana, medium" -> "banana, large" is a resize
  .replace(/[~,]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

export function diffMeals(beforeMeals: MealLike[], afterMeals: MealLike[]): { changes: string[]; renamed: number } {
  const changes: string[] = []
  let renamed = 0
  const n = Math.max(beforeMeals.length, afterMeals.length)
  for (let i = 0; i < n; i++) {
    const b = beforeMeals[i], a = afterMeals[i]
    const label = String((a ?? b)?.meal_name ?? `Meal ${i + 1}`)
    if (!b) { changes.push(`${label}: new meal added`); continue }
    if (!a) { changes.push(`${label}: meal removed`); continue }
    const bf = (b.foods ?? []) as unknown[], af = (a.foods ?? []) as unknown[]
    const bSet = new Map(bf.map(x => [baseFood(foodName(x)), foodName(x)]))
    const aSet = new Map(af.map(x => [baseFood(foodName(x)), foodName(x)]))
    const bMacro = new Map(bf.map(x => [baseFood(foodName(x)), foodMacros(x)]))
    const aMacro = new Map(af.map(x => [baseFood(foodName(x)), foodMacros(x)]))
    for (const [k, name] of aSet) {
      const was = bSet.get(k)
      if (!was) changes.push(`${label}: added ${name}`)
      else if (was !== name) changes.push(`${label}: ${was} → ${name}`)
      // Same name, different macros: a resize the name does not show.
      else if (bMacro.get(k) !== aMacro.get(k)) changes.push(`${label}: ${name} adjusted (protein/carbs/fat ${bMacro.get(k)} → ${aMacro.get(k)}g)`)
    }
    for (const [k, name] of bSet) if (!aSet.has(k)) changes.push(`${label}: removed ${name}`)
    const added = [...aSet.keys()].filter(k => !bSet.has(k)).length
    const removed = [...bSet.keys()].filter(k => !aSet.has(k)).length
    renamed += Math.min(added, removed)
  }
  return { changes, renamed }
}

export async function previewNutritionRevision(admin: SupabaseClient, clientId: string, ops: NutritionEditOp[]): Promise<{ ok: true; preview: RevisionPreview } | { ok: false; error: string }> {
  const [{ data: plan }, { data: client }, { data: baseline }] = await Promise.all([
    admin.from('nutrition_plans').select('*').eq('client_id', clientId).eq('is_active', true).maybeSingle(),
    admin.from('clients').select('medications').eq('id', clientId).maybeSingle(),
    admin.from('baselines').select('bodyweight_kg').eq('client_id', clientId).order('captured_at', { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
  ])
  if (!plan) return { ok: false, error: 'This client has no active nutrition plan to revise.' }

  const beforeMeals = (plan.meals ?? []) as MealLike[]
  const result = applyNutritionEdits(beforeMeals, ops)
  const afterMeals = result.meals as MealLike[]

  const validate = (meals: MealLike[], band: string | null) => validateNutritionPlan({
    meals,
    estimated_calorie_band: band,
    protein_anchor_g: Number(plan.protein_anchor_g) || 0,
    bodyweight_kg: baseline?.bodyweight_kg ?? null,
    entry_state: String(plan.entry_state ?? ''),
    medications: client?.medications ?? null,
    carb_demand_level: (String(plan.carb_demand_level ?? '').toLowerCase() || null) as 'low' | 'moderate' | 'high' | null,
    transitional_override: plan.transitional_override_active ? { active: true, floor_kcal: Number(plan.transitional_override_floor_kcal) || 0 } : null,
  })
  const beforeCodes = new Set(validate(beforeMeals, plan.estimated_calorie_band).issues.map(i => i.code))
  const newIssues = validate(afterMeals, result.calorieBand).issues.filter(i => !beforeCodes.has(i.code)).map(humaniseValidationIssue)

  const before = toTotals(beforeMeals)
  const after = toTotals(afterMeals)
  const { changes, renamed } = diffMeals(beforeMeals, afterMeals)

  const warnings: string[] = []
  const deltas = (['protein', 'carbs', 'fat'] as const).map(k => ({ k, d: after[k] - before[k] }))
  const main = [...deltas].sort((x, y) => Math.abs(y.d) - Math.abs(x.d))[0]
  const others = deltas.filter(x => x.k !== main.k && Math.abs(x.d) > SIDE_EFFECT_G)
  if (main && Math.abs(main.d) > 0 && others.length) {
    warnings.push(`More than one thing moves: ${main.k} ${main.d > 0 ? '+' : ''}${main.d}g, and ${others.map(o => `${o.k} ${o.d > 0 ? '+' : ''}${o.d}g`).join(', ')}.`)
  }
  if (beforeMeals.length !== afterMeals.length) warnings.push(`The number of meals changes from ${beforeMeals.length} to ${afterMeals.length}.`)
  if (renamed > 0) warnings.push(`${renamed} food${renamed === 1 ? ' is' : 's are'} swapped for a different food, not just resized.`)
  if (!changes.length) warnings.push('Nothing in the plan would actually change.')

  return {
    ok: true,
    preview: {
      planId: plan.id, planName: plan.plan_name ?? 'Nutrition plan',
      before, after, applied: result.applied, missed: result.missed, changes, warnings, newIssues,
    },
  }
}

/**
 * The coach's words become a minimal set of edits against the live plan, plus a
 * preview. Nothing is saved.
 */
export async function proposeNutritionRevision(admin: SupabaseClient, clientId: string, instruction: string): Promise<
  { ok: true; operations: NutritionEditOp[]; summary: string; preview: RevisionPreview | null } | { ok: false; status: number; error: string }
> {
  const { data: plan } = await admin.from('nutrition_plans')
    .select('id, plan_name, entry_state, carb_demand_level, protein_anchor_g, meals')
    .eq('client_id', clientId).eq('is_active', true).maybeSingle()
  if (!plan) return { ok: false, status: 404, error: 'This client has no active nutrition plan to revise.' }
  const [{ data: client }, { data: intake }] = await Promise.all([
    admin.from('clients').select('medications').eq('id', clientId).maybeSingle(),
    admin.from('intakes').select('dietary_restrictions, dietary_preferences').eq('client_id', clientId).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const result = await generateGovernedJson({
    tag: `[nutrition revise ${clientId.slice(0, 8)}]`,
    model: AI_MODELS.clinical,
    system: withTemporalContext(NUTRITION_EDIT_SYSTEM_LIVE),
    maxTokens: 8000,
    timeBudgetMs: 4 * 60_000,
    userContent: [{
      type: 'text',
      text: `LIVE NUTRITION PLAN: ${plan.plan_name} (entry state ${plan.entry_state}, carb demand ${plan.carb_demand_level}, protein anchor ${plan.protein_anchor_g}g)
Dietary restrictions: ${intake?.dietary_restrictions || 'none recorded'}
Dietary preferences: ${intake?.dietary_preferences || 'none recorded'}
Medications: ${client?.medications || 'none recorded'}

MEALS (indexed, use these exact indices):
${renderMealsIndexed(plan.meals)}

COACH INSTRUCTION:
${instruction}

Return ONLY the JSON described in your instructions.`,
    }],
    validate: c => (Array.isArray(c.operations) && typeof c.summary === 'string' ? null : 'missing operations or summary'),
  })
  if (!result.ok) return { ok: false, status: 502, error: `Could not work out the change (${result.error}). Try rephrasing.` }

  const operations = validateNutritionEditOps(result.value.operations)
  const summary = String(result.value.summary ?? '').trim()
  if (!operations.length) return { ok: true, operations, summary, preview: null }
  const pv = await previewNutritionRevision(admin, clientId, operations)
  if (!pv.ok) return { ok: false, status: 400, error: pv.error }
  return { ok: true, operations, summary, preview: pv.preview }
}

/** Re-preview on the server and write the revision as a new draft. */
export async function applyNutritionRevision(admin: SupabaseClient, clientId: string, input: { operations: unknown; changeNote: string; acceptIssues: boolean }): Promise<
  { ok: true; newPlanId: string; applied: string[]; missed: string[] } | { ok: false; status: number; error: string; newIssues?: string[] }
> {
  const operations = validateNutritionEditOps(input.operations)
  const changeNote = String(input.changeNote ?? '').trim()
  if (!operations.length) return { ok: false, status: 400, error: 'No valid changes to apply.' }
  if (!changeNote) return { ok: false, status: 400, error: 'Add a note saying what changed and why.' }

  // One draft at a time: a second would leave the page showing one of two.
  const { count: drafts } = await admin.from('nutrition_plans').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'draft')
  if (drafts) return { ok: false, status: 409, error: 'There is already a draft plan. Approve or discard it first.' }

  // The browser's copy of the preview is never trusted.
  const pv = await previewNutritionRevision(admin, clientId, operations)
  if (!pv.ok) return { ok: false, status: 400, error: pv.error }
  if (pv.preview.newIssues.length && input.acceptIssues !== true) {
    return { ok: false, status: 422, error: 'This change would introduce a problem the plan did not have. Review it and confirm to continue.', newIssues: pv.preview.newIssues }
  }

  const r = await reviseNutritionPlan(admin, clientId, { ops: operations, changeNote })
  if (!r.ok) return { ok: false, status: 400, error: r.error }
  return { ok: true, newPlanId: r.newPlanId, applied: r.applied, missed: r.missed }
}
