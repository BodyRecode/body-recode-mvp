import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Update Nutrition Plan (allowlist single-field PATCH)
 *
 * Mirrors /api/update-training-plan. Used by the nutrition CoachGuidanceEditor
 * on the draft and active plan views to persist standing coach guidance
 * against the plan row itself. That guidance is then read by generate-nutrition
 * on every Generate or Regenerate of any plan for this client (carries forward
 * via inheritance from the most recent plan unless explicitly overridden).
 */
const ALLOWED_FIELDS = new Set([
  'coach_guidance',
])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { nutrition_plan_id, field, value } = await request.json()
  if (!nutrition_plan_id) {
    return NextResponse.json({ error: 'Missing nutrition_plan_id' }, { status: 400 })
  }
  if (typeof field !== 'string' || !ALLOWED_FIELDS.has(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }
  if (typeof value !== 'string' && value !== null) {
    return NextResponse.json({ error: 'Value must be a string or null' }, { status: 400 })
  }

  // Strip em dashes to honour the global content rule (see feedback_no_em_dashes).
  const cleaned = typeof value === 'string' ? value.replace(/—/g, ', ') : value

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('nutrition_plans')
    .update({ [field]: cleaned })
    .eq('id', nutrition_plan_id)
    .select(`id, ${field}`)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ nutrition_plan: data })
}
