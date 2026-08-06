import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  // Verify the plan exists and is active
  const { data: plan } = await admin
    .from('nutrition_plans')
    .select('id, client_id, status')
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle()

  if (!plan) return NextResponse.json({ error: 'Active nutrition plan not found' }, { status: 404 })

  const {
    adherence_confirmed,
    signal_category,
    signal_strength,
    days_under_observation,
    signals_noted,
    direction,
    adjustment_level,
    adjustment_applied,
    variable_changed,
    deload_triggered,
    reset_triggered,
    recovery_mode_triggered,
    coach_notes,
  } = body

  if (!direction) return NextResponse.json({ error: 'direction required' }, { status: 400 })

  // Doctrine gate: no adjustment without adherence confirmation
  if (!adherence_confirmed && adjustment_level && adjustment_level !== 'behavioural') {
    return NextResponse.json({
      error: 'Doctrine violation: adjustment cannot proceed without adherence confirmed. Fix compliance before changing nutrition.'
    }, { status: 422 })
  }

  // Doctrine gate: time qualification
  const minDays = { behavioural: 0, structural: 5, nutritional: 7, advanced: 10 }
  const requiredDays = adjustment_level ? minDays[adjustment_level as keyof typeof minDays] ?? 7 : 0
  if (adjustment_level && days_under_observation !== undefined && days_under_observation < requiredDays) {
    return NextResponse.json({
      error: `Doctrine violation: ${adjustment_level} adjustment requires minimum ${requiredDays} days of observation. Current: ${days_under_observation} days.`
    }, { status: 422 })
  }

  // Save the review record
  const { error: reviewError } = await admin
    .from('nutrition_reviews')
    .insert({
      nutrition_plan_id: id,
      client_id: plan.client_id,
      adherence_confirmed: adherence_confirmed ?? false,
      signal_category: signal_category || null,
      signal_strength: signal_strength || null,
      days_under_observation: days_under_observation || null,
      signals_noted: signals_noted || null,
      direction,
      adjustment_level: adjustment_level || null,
      adjustment_applied: adjustment_applied || null,
      variable_changed: variable_changed || null,
      deload_triggered: deload_triggered ?? false,
      reset_triggered: reset_triggered ?? false,
      recovery_mode_triggered: recovery_mode_triggered ?? false,
      coach_notes: coach_notes || null,
    })

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })

  // Update plan's current direction and last review timestamp
  const { error: updateError } = await admin
    .from('nutrition_plans')
    .update({
      current_direction: direction,
      last_review_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ ok: true, direction })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await params
  const admin = createAdminClient()

  const { data: reviews, error } = await admin
    .from('nutrition_reviews')
    .select('*')
    .eq('nutrition_plan_id', id)
    .order('reviewed_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews })
}
