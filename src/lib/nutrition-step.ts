/**
 * Raising or lowering a plan's calories WITHOUT rewriting the plan.
 *
 * Kade, 1 Sep 2026: *"everytime we make a diet adjustment i dont want the whole
 * diet changed only one change at a time."*
 *
 * Regenerating a plan to move one number replaces the client's whole week. She
 * has learned her breakfast; changing it for no reason she can see is how
 * adherence dies. Samantha is the live case: she is being stepped from ~1,409
 * toward ~1,900 over several weeks, so a regeneration per step would rewrite
 * her entire plan three or four times.
 *
 * This adds the calories to food she already has. Same meals, same foods, same
 * order. Only portions move, and only on the foods it says it moved.
 *
 * ── Why it records what it touched ──
 *
 * Kade also asked for the change to be highlighted so it is easy to spot. A
 * step that silently adjusts four numbers across a plan is impossible to audit
 * by eye, so every adjustment is recorded per food and the display marks them.
 */

import { normalizeMealAndDayTotals, type MealLike } from '@/lib/nutrition-validation'

export interface StepChange {
  meal_index: number
  food_index: number
  food_name: string
  field: 'protein_g' | 'carb_g' | 'fat_g'
  from: number
  to: number
}

export interface StepResult<T> {
  plan: T
  changes: StepChange[]
  /** Calories actually added or removed, which may fall short of the ask. */
  appliedKcal: number
  requestedKcal: number
  notes: string[]
}

const KCAL = { protein_g: 4, carb_g: 4, fat_g: 9 } as const

/**
 * A food only counts as a source of a macro when that macro is a real part of
 * it, judged by SHARE of the food's own calories rather than by raw grams.
 *
 * Without this the step happily added 8g of carbohydrate to three eggs, which
 * is arithmetically correct and nutritionally nonsense. Eggs carry 2g of carb
 * out of 215 kcal, under 4% of the food; a banana is 96% carbohydrate. Only
 * the second is somewhere you can put more carbohydrate.
 *
 * Same reasoning as the protein-vehicle test in nutrition-validation: share,
 * not dominance, and not a raw gram threshold.
 */
const MACRO_SHARE_FLOOR = 0.25

function carriesMacro(food: Record<string, unknown>, field: 'carb_g' | 'fat_g'): boolean {
  const p = typeof food.protein_g === 'number' ? food.protein_g : 0
  const c = typeof food.carb_g === 'number' ? food.carb_g : 0
  const f = typeof food.fat_g === 'number' ? food.fat_g : 0
  const total = p * 4 + c * 4 + f * 9
  if (total <= 0) return false
  const fromField = field === 'carb_g' ? c * 4 : f * 9
  return fromField / total >= MACRO_SHARE_FLOOR
}

/**
 * Move a plan's daily calories by `deltaKcal`, adjusting portions only.
 *
 * Carbohydrate first, then fat. Protein is never touched: it is the anchor the
 * whole plan is built around, and moving it changes the prescription rather
 * than the portion size.
 *
 * Spread evenly across the meals that already carry that macro, so no single
 * meal doubles while the rest stay still.
 */
export function applyCalorieStep<T extends { meals?: MealLike[]; estimated_calorie_band?: string | null }>(
  plan: T,
  deltaKcal: number,
): StepResult<T> {
  const notes: string[] = []
  const changes: StepChange[] = []
  const meals = plan.meals ?? []

  if (meals.length === 0) return { plan, changes, appliedKcal: 0, requestedKcal: deltaKcal, notes: ['plan has no meals'] }
  if (deltaKcal === 0) return { plan, changes, appliedKcal: 0, requestedKcal: 0, notes: ['no change requested'] }

  let remaining = deltaKcal
  const dir = deltaKcal > 0 ? 1 : -1

  for (const field of ['carb_g', 'fat_g'] as const) {
    if (Math.abs(remaining) < KCAL[field]) break

    // Every food that carries this macro, so the step spreads rather than piles.
    const targets: { mi: number; fi: number; food: Record<string, unknown> }[] = []
    meals.forEach((meal, mi) => {
      ;(meal.foods ?? []).forEach((food, fi) => {
        const rec = food as Record<string, unknown>
        const v = rec[field]
        if (typeof v === 'number' && v > 0 && carriesMacro(rec, field)) {
          targets.push({ mi, fi, food: rec })
        }
      })
    })
    if (targets.length === 0) {
      notes.push(`No food in this plan carries enough ${field === 'carb_g' ? 'carbohydrate' : 'fat'} to adjust it there.`)
      continue
    }

    const gramsNeeded = Math.abs(remaining) / KCAL[field]
    const perFood = Math.max(1, Math.round(gramsNeeded / targets.length))

    for (const t of targets) {
      if (Math.abs(remaining) < KCAL[field]) break
      const before = t.food[field] as number
      const step = Math.min(perFood, Math.floor(Math.abs(remaining) / KCAL[field]))
      if (step < 1) break
      // Never drive a food negative: reducing below zero would delete it, and
      // deleting a food is a different decision from resizing one.
      const after = dir > 0 ? before + step : Math.max(0, before - step)
      if (after === before) continue
      t.food[field] = after
      changes.push({
        meal_index: t.mi, food_index: t.fi,
        food_name: String(t.food.name ?? 'food'),
        field, from: before, to: after,
      })
      remaining -= (after - before) * KCAL[field]
    }
  }

  const applied = deltaKcal - remaining
  if (Math.abs(remaining) >= 10) {
    notes.push(`Fell ${Math.abs(Math.round(remaining))} kcal short of the ${deltaKcal > 0 ? 'increase' : 'reduction'} asked for. Nothing was forced; review whether a food needs adding or removing instead.`)
  }

  const normalised = normalizeMealAndDayTotals(plan)
  return { plan: normalised, changes, appliedKcal: Math.round(applied), requestedKcal: deltaKcal, notes }
}

/** Plain sentence for the coach, e.g. "Raised by 148 kcal across 4 foods." */
export function describeStep(result: StepResult<unknown>): string {
  if (result.changes.length === 0) return 'No change applied.'
  const dir = result.appliedKcal > 0 ? 'Raised' : 'Lowered'
  const foods = new Set(result.changes.map(c => `${c.meal_index}:${c.food_index}`)).size
  return `${dir} by ${Math.abs(result.appliedKcal)} kcal across ${foods} food${foods === 1 ? '' : 's'}.`
}
