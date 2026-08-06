import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export const maxDuration = 300

/**
 * Regenerate Nutrition Plan
 *
 * Single-click regeneration of an existing nutrition plan (draft or active)
 * for a client. Lifts all coach-chosen primary inputs from the stored plan
 * row, re-derives training_days_per_week from the latest intake, and forwards
 * to /api/generate-nutrition. coach_guidance is read inside generate-nutrition
 * automatically — guidance the coach edited via the inline editor before
 * clicking Regenerate steers this call.
 *
 * generate-nutrition replaces any prior draft for the client, so we do not
 * need to delete here.
 *
 * Body: { nutrition_plan_id: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { nutrition_plan_id } = await request.json()
  if (!nutrition_plan_id) {
    return NextResponse.json({ error: 'Missing nutrition_plan_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Lift the stored coach-chosen primary inputs from the plan row. constraint /
  // recovery / uncertainty levels are stored too — we reuse them on regen so
  // the coach's prior rationale persists; if they need a fresh derivation,
  // they go back to the prescription form.
  const { data: plan, error: planErr } = await admin
    .from('nutrition_plans')
    .select('id, client_id, plan_name, entry_state, body_state, pts_phase, protein_anchor_g, carb_demand_level, meal_frequency, constraint_level, recovery_status, uncertainty_level, transitional_override_active, transitional_override_floor_kcal, transitional_override_justification')
    .eq('id', nutrition_plan_id)
    .maybeSingle()

  if (planErr || !plan) {
    return NextResponse.json({ error: 'Nutrition plan not found' }, { status: 404 })
  }

  // Latest intake — gives us training_days_available + dietary context that
  // generate-nutrition reads on its own. Same lookup pattern as the form.
  const { data: latestIntake } = await admin
    .from('intakes')
    .select('id, training_days_available')
    .eq('client_id', plan.client_id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const body = {
    client_id: plan.client_id,
    plan_name: plan.plan_name,
    entry_state: plan.entry_state,
    body_state: plan.body_state,
    pts_phase: plan.pts_phase,
    constraint_level: plan.constraint_level,
    recovery_status: plan.recovery_status,
    uncertainty_level: plan.uncertainty_level,
    protein_anchor_g: plan.protein_anchor_g,
    carb_demand_level: plan.carb_demand_level,
    meal_frequency: plan.meal_frequency,
    training_days_per_week: latestIntake?.training_days_available ?? 3,
    food_exclusions: [],
    transitional_override_active: plan.transitional_override_active ?? false,
    transitional_override_floor_kcal: plan.transitional_override_floor_kcal ?? null,
    transitional_override_justification: plan.transitional_override_justification ?? null,
    // coach_guidance intentionally omitted — generate-nutrition inherits it
    // from the most recent plan, which is the row the inline editor just saved.
  }

  // Forward to /api/generate-nutrition preserving the auth cookie so the
  // inner route sees the same authenticated session.
  const origin = request.nextUrl.origin
  const cookie = request.headers.get('cookie') ?? ''
  const res = await fetch(`${origin}/api/generate-nutrition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({ error: 'Unparseable response from generate-nutrition' }))
  return NextResponse.json(data, { status: res.status })
}
