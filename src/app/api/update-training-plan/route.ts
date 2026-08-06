import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Update Training Plan (allowlist single-field PATCH)
 *
 * Mirrors /api/update-program-reading. Used by the CoachGuidanceEditor on the
 * draft program view to persist standing coach guidance against the parent
 * training_plan (macro arc) — that guidance is then read by generate-program
 * on every Generate or Regenerate of any program linked to the arc.
 */
const ALLOWED_FIELDS = new Set([
  'coach_guidance',
  'macro_objective',
  'notes',
])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { training_plan_id, field, value } = await request.json()
  if (!training_plan_id) {
    return NextResponse.json({ error: 'Missing training_plan_id' }, { status: 400 })
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
    .from('training_plans')
    .update({ [field]: cleaned })
    .eq('id', training_plan_id)
    .select(`id, ${field}`)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ training_plan: data })
}
