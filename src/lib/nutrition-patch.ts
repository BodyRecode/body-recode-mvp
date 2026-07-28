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

// Phase 7 — structural nutrition ops.
export type FoodShape = { name: string; protein_g?: number; carb_g?: number; fat_g?: number }
export type AddFoodOp = { kind: 'add_food'; meal_index: number; position?: number; food: FoodShape }
export type RemoveFoodOp = { kind: 'remove_food'; meal_index: number; food_index: number }
export type RemoveMealOp = { kind: 'remove_meal'; meal_index: number }
export type AddMealOp = { kind: 'add_meal'; meal: { meal_name?: string; foods?: FoodShape[] } }

export type NutritionEditOp = UpdateFoodOp | AddFoodOp | RemoveFoodOp | RemoveMealOp | AddMealOp

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
  const isIdx = (n: any) => Number.isInteger(Number(n)) && Number(n) >= 0
  const coerceFood = (f: any): FoodShape | null => {
    if (!f || typeof f !== 'object') return null
    const name = typeof f.name === 'string' ? f.name.trim() : ''
    if (!name) return null
    const out: FoodShape = { name }
    if (f.protein_g != null && !isNaN(Number(f.protein_g))) out.protein_g = Number(f.protein_g)
    if (f.carb_g != null && !isNaN(Number(f.carb_g))) out.carb_g = Number(f.carb_g)
    if (f.fat_g != null && !isNaN(Number(f.fat_g))) out.fat_g = Number(f.fat_g)
    return out
  }
  const ops: NutritionEditOp[] = []
  for (const o of raw) {
    if (!o || typeof o !== 'object') continue
    if (o.kind === 'update_food') {
      if (!isIdx(o.meal_index) || !isIdx(o.food_index)) continue
      const c = o.changes
      if (!c || typeof c !== 'object') continue
      const changes: UpdateFoodOp['changes'] = {}
      if (typeof c.name === 'string' && c.name.trim()) changes.name = c.name
      if (c.protein_g != null && !isNaN(Number(c.protein_g))) changes.protein_g = Number(c.protein_g)
      if (c.carb_g != null && !isNaN(Number(c.carb_g))) changes.carb_g = Number(c.carb_g)
      if (c.fat_g != null && !isNaN(Number(c.fat_g))) changes.fat_g = Number(c.fat_g)
      if (Object.keys(changes).length === 0) continue
      ops.push({ kind: 'update_food', meal_index: Number(o.meal_index), food_index: Number(o.food_index), changes })
    } else if (o.kind === 'add_food') {
      if (!isIdx(o.meal_index)) continue
      const food = coerceFood(o.food)
      if (!food) continue
      const op: AddFoodOp = { kind: 'add_food', meal_index: Number(o.meal_index), food }
      if (isIdx(o.position)) op.position = Number(o.position)
      ops.push(op)
    } else if (o.kind === 'remove_food') {
      if (!isIdx(o.meal_index) || !isIdx(o.food_index)) continue
      ops.push({ kind: 'remove_food', meal_index: Number(o.meal_index), food_index: Number(o.food_index) })
    } else if (o.kind === 'remove_meal') {
      if (!isIdx(o.meal_index)) continue
      ops.push({ kind: 'remove_meal', meal_index: Number(o.meal_index) })
    } else if (o.kind === 'add_meal') {
      const m = o.meal
      if (!m || typeof m !== 'object') continue
      const foods = Array.isArray(m.foods) ? m.foods.map(coerceFood).filter(Boolean) as FoodShape[] : []
      ops.push({ kind: 'add_meal', meal: { meal_name: typeof m.meal_name === 'string' ? m.meal_name : 'New Meal', foods } })
    }
  }
  return ops
}

// Apply ops to a DEEP COPY of meals (in-place edits, then inserts, then removals
// in DESCENDING index order, then meal-level add), then recompute meal totals +
// day band from the foods. Returns the new meals, the recomputed band, and logs.
export function applyNutritionEdits(meals: any, ops: NutritionEditOp[]): {
  meals: MealLike[]
  calorieBand: string | null
  applied: string[]
  missed: string[]
} {
  const next: any[] = Array.isArray(meals) ? JSON.parse(JSON.stringify(meals)) : []
  const applied: string[] = []
  const missed: string[] = []
  const byKind = <K extends NutritionEditOp['kind']>(k: K) => ops.filter(o => o.kind === k) as Extract<NutritionEditOp, { kind: K }>[]

  // update_food (in place)
  for (const op of byKind('update_food')) {
    const meal = next?.[op.meal_index]
    const food = meal?.foods?.[op.food_index]
    if (!meal || !Array.isArray(meal.foods) || food === undefined) { missed.push(`Could not find a food at meal ${op.meal_index}, position ${op.food_index}.`); continue }
    const cur = typeof food === 'string' ? { name: food } : { ...food }
    const before = cur.name ?? 'food'
    const c = op.changes
    if (c.name != null) cur.name = c.name
    if (c.protein_g != null) cur.protein_g = c.protein_g
    if (c.carb_g != null) cur.carb_g = c.carb_g
    if (c.fat_g != null) cur.fat_g = c.fat_g
    meal.foods[op.food_index] = cur
    applied.push(`Updated "${before}"${c.name && c.name !== before ? ` → "${c.name}"` : ''}.`)
  }

  // add_food (insert or append)
  for (const op of byKind('add_food')) {
    const meal = next?.[op.meal_index]
    if (!meal) { missed.push(`Could not add: no meal at index ${op.meal_index}.`); continue }
    if (!Array.isArray(meal.foods)) meal.foods = []
    const pos = op.position != null ? Math.min(op.position, meal.foods.length) : meal.foods.length
    meal.foods.splice(pos, 0, op.food)
    applied.push(`Added "${op.food.name}".`)
  }

  // remove_food — group per meal, remove DESCENDING food_index
  for (const op of byKind('remove_food').sort((a, b) => b.food_index - a.food_index)) {
    const arr = next?.[op.meal_index]?.foods
    if (!Array.isArray(arr) || op.food_index >= arr.length) { missed.push(`Could not remove: no food at meal ${op.meal_index}, position ${op.food_index}.`); continue }
    const removed = arr.splice(op.food_index, 1)[0]
    applied.push(`Removed "${typeof removed === 'string' ? removed : removed?.name ?? 'food'}".`)
  }

  // remove_meal — DESCENDING meal_index
  for (const op of byKind('remove_meal').sort((a, b) => b.meal_index - a.meal_index)) {
    if (op.meal_index >= next.length) { missed.push(`Could not remove: no meal at index ${op.meal_index}.`); continue }
    const removed = next.splice(op.meal_index, 1)[0]
    applied.push(`Removed the meal "${removed?.meal_name ?? 'meal'}".`)
  }

  // add_meal — append
  for (const op of byKind('add_meal')) {
    next.push(op.meal)
    applied.push(`Added a new meal "${op.meal.meal_name ?? 'meal'}".`)
  }

  // Recompute meal-level macros AND the day calorie band from the foods.
  const normalized = normalizeMealAndDayTotals({ meals: next as MealLike[], estimated_calorie_band: null })
  return {
    meals: (normalized.meals as MealLike[]) ?? (next as MealLike[]),
    calorieBand: normalized.estimated_calorie_band ?? null,
    applied,
    missed,
  }
}
