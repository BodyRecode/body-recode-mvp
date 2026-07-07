import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { computeNutritionTotals, kcalFromMacros } from '@/lib/nutrition-validation'

/**
 * PATCH /api/nutrition-plans/[id]/meals
 *
 * Persist coach edits to the meals array of a nutrition plan. Body:
 *   { meals: Meal[] }
 *
 * Every field of every meal + food is coach-editable via the MealEditor
 * client component. Save flow: coach clicks Save on one meal → POST the
 * FULL meals array (with that one meal patched locally) → server writes
 * `meals` + recomputes `estimated_calorie_band` from the new totals.
 *
 * 2026-07-07: shipped after Amanda's Stage 2 plan needed manual meal
 * structure tweaks the engine can't yet produce cleanly. Coach edits stick
 * to nutrition_plans.meals; downstream generators still read the same
 * field, so subsequent regens use the coach-edited state as context.
 *
 * Auth: coach-only. Verified via isCoachEmail against the Supabase-auth
 * user's email. No client-facing surface.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !isCoachEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const meals = body?.meals
  if (!Array.isArray(meals) || meals.length === 0) {
    return NextResponse.json({ error: 'meals must be a non-empty array' }, { status: 400 })
  }

  // Structural validation: each meal must have foods array + meal_number
  // and each food must have name + numeric macros. Everything else is coach-
  // editable freeform. We intentionally do NOT re-run the full nutrition
  // validator here — coach edits explicitly override doctrine rules (e.g.,
  // coach can now set a meal above the 43g protein cap if they know why).
  // The validator remains authoritative for AI-generated plans; coach-edit
  // plans are the coach's judgment.
  for (const m of meals) {
    if (typeof m?.meal_number !== 'number') {
      return NextResponse.json({ error: 'each meal needs a meal_number' }, { status: 400 })
    }
    if (!Array.isArray(m.foods)) {
      return NextResponse.json({ error: `meal ${m.meal_number}: foods must be an array` }, { status: 400 })
    }
    for (const f of m.foods) {
      if (typeof f?.name !== 'string' || !f.name.trim()) {
        return NextResponse.json({ error: `meal ${m.meal_number}: every food needs a name` }, { status: 400 })
      }
      for (const k of ['protein_g', 'carb_g', 'fat_g'] as const) {
        if (typeof f[k] !== 'number' || !Number.isFinite(f[k]) || f[k] < 0) {
          return NextResponse.json({
            error: `meal ${m.meal_number} food "${f.name}": ${k} must be a non-negative number`,
          }, { status: 400 })
        }
      }
    }
  }

  const admin = createAdminClient()

  // Confirm the plan exists and this coach owns it (any coach can edit any
  // client's plan per current coach-auth model — no per-coach ownership yet).
  const { data: plan, error: planErr } = await admin
    .from('nutrition_plans')
    .select('id, client_id, meals')
    .eq('id', id)
    .maybeSingle()
  if (planErr || !plan) {
    return NextResponse.json({ error: 'Nutrition plan not found' }, { status: 404 })
  }

  // Recompute meal-level totals from the food sums so meal.protein_g etc.
  // stay coherent with the food rows. Coach-side totals shown in the editor
  // already do this; server enforces it too as source-of-truth.
  const normalisedMeals = meals.map(m => {
    const foodSum = m.foods.reduce(
      (acc: { p: number; c: number; f: number }, food: { protein_g: number; carb_g: number; fat_g: number }) => ({
        p: acc.p + Number(food.protein_g || 0),
        c: acc.c + Number(food.carb_g || 0),
        f: acc.f + Number(food.fat_g || 0),
      }),
      { p: 0, c: 0, f: 0 },
    )
    return {
      ...m,
      protein_g: Math.round(foodSum.p),
      carb_g: Math.round(foodSum.c),
      fat_g: Math.round(foodSum.f),
    }
  })

  // Daily totals + estimated_calorie_band recomputed from the coach-edited
  // meals. Downstream reads (Program Reading, next-block generator) use
  // this band, so it must stay consistent after every edit.
  const daily = computeNutritionTotals(normalisedMeals)
  const bandLow = Math.max(0, daily.kcal - 100)
  const bandHigh = daily.kcal + 100
  const estimatedBand = `${bandLow}–${bandHigh} kcal`

  const { data: updated, error: updateErr } = await admin
    .from('nutrition_plans')
    .update({
      meals: normalisedMeals,
      estimated_calorie_band: estimatedBand,
      last_review_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, meals, estimated_calorie_band')
    .single()
  if (updateErr) {
    console.error('[nutrition-plans PATCH meals] update error:', updateErr)
    return NextResponse.json({ error: `Failed to save meals: ${updateErr.message}` }, { status: 500 })
  }

  return NextResponse.json({
    plan: updated,
    daily_totals: {
      protein_g: daily.protein_g,
      carb_g: daily.carb_g,
      fat_g: daily.fat_g,
      kcal: kcalFromMacros(daily.protein_g, daily.carb_g, daily.fat_g),
    },
  })
}
