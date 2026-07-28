// Coach Co-Pilot — Phase 5 surgical nutrition-draft edits.
//
// Mirror of program-patch.ts for nutrition. The co-pilot proposes a MINIMAL
// structured patch (which food, by meal/food index, and the new macros) and
// this module applies it DETERMINISTICALLY to the draft plan's meals, then
// recomputes the meal totals + daily calorie band from the foods via the SAME
// normaliser the generator uses. So a food swap can't silently desync the
// macros, and everything the coach did not name stays put.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { normalizeMealAndDayTotals, type MealLike } from '@/lib/nutrition-validation'

export type UpdateFoodOp = {
  kind: 'update_food'
  meal_index: number
  food_index: number
  changes: {
    name?: string
    protein_g?: number
    carb_g?: number
    fat_g?: number
  }
}

export type NutritionEditOp = UpdateFoodOp

// Render meals with explicit Meal/Food indices so the model can target exactly.
export function renderMealsIndexed(meals: any): string {
  if (!Array.isArray(meals) || meals.length === 0) return '(no meals)'
  const out: string[] = []
  meals.forEach((m: any, mi: number) => {
    const macros = [
      m?.protein_g != null ? `P ${m.protein_g}g` : null,
      m?.carb_g != null ? `C ${m.carb_g}g` : null,
      m?.fat_g != null ? `F ${m.fat_g}g` : null,
    ].filter(Boolean).join(' / ')
    out.push(`Meal ${mi} "${m?.meal_name ?? 'Meal'}"${macros ? ` — ${macros}` : ''}`)
    ;(m?.foods ?? []).forEach((f: any, fi: number) => {
      if (typeof f === 'string') { out.push(`   Food ${fi}: ${f}`); return }
      const fm = [
        f?.protein_g != null ? `P ${f.protein_g}` : null,
        f?.carb_g != null ? `C ${f.carb_g}` : null,
        f?.fat_g != null ? `F ${f.fat_g}` : null,
      ].filter(Boolean).join('/')
      out.push(`   Food ${fi}: ${f?.name ?? 'food'}${fm ? ` (${fm})` : ''}`)
    })
  })
  return out.join('\n')
}

// Validate + coerce raw ops from the model. Malformed ops are dropped.
export function validateNutritionEditOps(raw: any): NutritionEditOp[] {
  if (!Array.isArray(raw)) return []
  const ops: NutritionEditOp[] = []
  for (const o of raw) {
    if (!o || typeof o !== 'object' || o.kind !== 'update_food') continue
    const mi = Number(o.meal_index), fi = Number(o.food_index)
    if (!Number.isInteger(mi) || !Number.isInteger(fi) || mi < 0 || fi < 0) continue
    const c = o.changes
    if (!c || typeof c !== 'object') continue
    const changes: UpdateFoodOp['changes'] = {}
    if (typeof c.name === 'string' && c.name.trim()) changes.name = c.name
    if (c.protein_g != null && !isNaN(Number(c.protein_g))) changes.protein_g = Number(c.protein_g)
    if (c.carb_g != null && !isNaN(Number(c.carb_g))) changes.carb_g = Number(c.carb_g)
    if (c.fat_g != null && !isNaN(Number(c.fat_g))) changes.fat_g = Number(c.fat_g)
    if (Object.keys(changes).length === 0) continue
    ops.push({ kind: 'update_food', meal_index: mi, food_index: fi, changes })
  }
  return ops
}

// Apply ops to a DEEP COPY of meals, then recompute meal totals + day band from
// the foods. Returns the new meals, the recomputed calorie band, and logs.
export function applyNutritionEdits(meals: any, ops: NutritionEditOp[]): {
  meals: MealLike[]
  calorieBand: string | null
  applied: string[]
  missed: string[]
} {
  const next: any[] = Array.isArray(meals) ? JSON.parse(JSON.stringify(meals)) : []
  const applied: string[] = []
  const missed: string[] = []

  for (const op of ops) {
    const meal = next?.[op.meal_index]
    const food = meal?.foods?.[op.food_index]
    if (!meal || !Array.isArray(meal.foods) || food === undefined) {
      missed.push(`Could not find a food at meal ${op.meal_index}, position ${op.food_index}.`)
      continue
    }
    // Normalise a bare-string food into an object so macros can be attached.
    const cur = typeof food === 'string' ? { name: food } : { ...food }
    const before = cur.name ?? 'food'
    const c = op.changes
    if (c.name != null) cur.name = c.name
    if (c.protein_g != null) cur.protein_g = c.protein_g
    if (c.carb_g != null) cur.carb_g = c.carb_g
    if (c.fat_g != null) cur.fat_g = c.fat_g
    meal.foods[op.food_index] = cur
    const renamed = c.name && c.name !== before
    applied.push(`Updated "${before}"${renamed ? ` → "${c.name}"` : ''}.`)
  }

  // Recompute meal-level macros AND the day calorie band from the foods, using
  // the same normaliser the generator uses (single source of truth).
  const normalized = normalizeMealAndDayTotals({ meals: next as MealLike[], estimated_calorie_band: null })
  return {
    meals: (normalized.meals as MealLike[]) ?? (next as MealLike[]),
    calorieBand: normalized.estimated_calorie_band ?? null,
    applied,
    missed,
  }
}
