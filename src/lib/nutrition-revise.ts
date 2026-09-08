/**
 * Revise a client's LIVE nutrition plan by carrying it forward and applying
 * only what was named.
 *
 * ── Why this exists ──
 *
 * Kade, 8 Sep 2026: *"a regeneration should carry the current plan over and add
 * one change in, that's how it should be revised, we can't be changing the
 * whole plan every time, no client will follow that."*
 *
 * Until now there were two options and neither did that:
 *
 *   generate-nutrition   sends the brief to the model and gets a brand new day
 *                        back. Every food, every meal, rewritten. Correct for a
 *                        genuinely new phase, ruinous for "raise her carbs".
 *   copilot/edit-nutrition  does apply a minimal deterministic patch, and is
 *                        the right shape, but it only ever touches a DRAFT. It
 *                        cannot revise the plan a client is actually eating.
 *
 * So revising a live plan meant regenerating it, which is why Samantha's step
 * up from 1,409 kcal came back with her lunch moved to a different slot, her
 * salmon swapped for beef mince and her olive oil for tallow. None of that was
 * asked for. A client learns her plan; rewriting her week to change one number
 * destroys the thing that makes adherence possible and looks arbitrary to her.
 *
 * ── What this does ──
 *
 * Loads the active plan, applies the named operations to its meals through the
 * same deterministic patcher the co-pilot uses, recomputes macros from the
 * foods, and writes the result as a NEW draft plan. Everything not named is
 * carried across byte-identical. The live plan stays live until the coach
 * promotes the draft, so the client is never without one.
 *
 * ── What carries, and why ──
 *
 * Everything except the meals, the calorie band and the plan name. That
 * deliberately includes the client-facing reading and its published state: a
 * one-food change does not invalidate "why this plan", and nulling the reading
 * would pull it out of the client's portal until someone regenerated it. Where
 * a revision IS material enough to change the explanation, the coach
 * regenerates the reading, which is a visible act rather than a silent one.
 *
 * Supplements are deliberately NOT re-derived here. They carry with the rest of
 * the row. Changing the food must not change the supplements.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { applyNutritionEdits, type NutritionEditOp } from '@/lib/nutrition-patch'

export interface ReviseResult {
  ok: true
  newPlanId: string
  previousPlanId: string
  applied: string[]
  missed: string[]
  before: { kcal: number; protein: number; carbs: number; fat: number }
  after: { kcal: number; protein: number; carbs: number; fat: number }
}
export interface ReviseError {
  ok: false
  error: string
}

type Meal = Record<string, unknown>
const num = (m: Meal, k: string) => Number(m[k] ?? 0)

function totals(meals: Meal[]) {
  const protein = meals.reduce((n, m) => n + num(m, 'protein_g'), 0)
  const carbs = meals.reduce((n, m) => n + num(m, 'carb_g'), 0)
  const fat = meals.reduce((n, m) => n + num(m, 'fat_g'), 0)
  return { protein, carbs, fat, kcal: Math.round(protein * 4 + carbs * 4 + fat * 9) }
}

/**
 * Columns that must NOT be copied onto the new row: identity, lifecycle, and
 * anything recomputed from the meals.
 */
const NOT_CARRIED = new Set([
  'id',
  'created_at',
  'updated_at',
  'generated_at',
  'status',
  'is_active',
  'meals',
  'estimated_calorie_band',
  'plan_name',
  'last_review_at',
  'current_direction',
  'published_to_client_at',
  'published_to_client_by',
])

export async function reviseNutritionPlan(
  admin: SupabaseClient,
  clientId: string,
  input: {
    ops: NutritionEditOp[]
    /** What changed, in the coach's words. Recorded on the new plan. */
    changeNote: string
    /** Defaults to the current name with a revision marker appended. */
    planName?: string
  }
): Promise<ReviseResult | ReviseError> {
  if (!input.ops?.length) return { ok: false, error: 'No operations supplied. A revision must name at least one change.' }
  if (!input.changeNote?.trim()) return { ok: false, error: 'A revision must carry a note saying what changed and why.' }

  const { data: current, error: loadErr } = await admin
    .from('nutrition_plans')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle()

  if (loadErr) return { ok: false, error: `could not read the active plan: ${loadErr.message}` }
  if (!current) return { ok: false, error: 'This client has no active nutrition plan to revise.' }

  const beforeMeals = (current.meals as Meal[]) ?? []
  const before = totals(beforeMeals)

  const result = applyNutritionEdits(current.meals, input.ops)
  if (result.missed.length && !result.applied.length) {
    return { ok: false, error: `none of the operations could be applied: ${result.missed.join(' ')}` }
  }

  const afterMeals = result.meals as unknown as Meal[]
  const after = totals(afterMeals)

  const row: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(current)) {
    if (!NOT_CARRIED.has(k)) row[k] = v
  }

  const stamp = new Date().toISOString()
  const baseName = String(current.plan_name ?? 'Nutrition Plan').replace(/\s*\(rev \d+\)\s*$/i, '')
  const revMatch = String(current.plan_name ?? '').match(/\(rev (\d+)\)/i)
  const revNumber = revMatch ? Number(revMatch[1]) + 1 : 2

  Object.assign(row, {
    meals: afterMeals,
    estimated_calorie_band: result.calorieBand,
    plan_name: input.planName ?? `${baseName} (rev ${revNumber})`,
    generated_at: stamp,
    status: 'draft',
    is_active: false,
    last_review_at: null,
    current_direction: null,
    published_to_client_at: null,
    published_to_client_by: null,
    // Prepend the revision to the coach guidance so the record says what moved
    // and why, without losing the original brief.
    coach_guidance: [
      `REVISION ${stamp.slice(0, 10)}: ${input.changeNote.trim()}`,
      `Carried forward from "${current.plan_name}" with only the named change applied. Everything else is byte-identical: ${result.applied.join(' ')}`,
      '',
      String(current.coach_guidance ?? ''),
    ].join('\n').trim(),
  })

  const { data: created, error: insertErr } = await admin
    .from('nutrition_plans')
    .insert(row)
    .select('id')
    .single()

  if (insertErr || !created) {
    return { ok: false, error: `could not save the revised plan: ${insertErr?.message ?? 'no row returned'}` }
  }

  return {
    ok: true,
    newPlanId: created.id as string,
    previousPlanId: current.id as string,
    applied: result.applied,
    missed: result.missed,
    before,
    after,
  }
}
