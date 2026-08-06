import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

const ALLOWED_FIELDS = new Set([
  'nr_why_this_plan',
  'nr_what_this_nutrition_is_doing',
  'nr_how_well_know_its_working',
  'nr_what_were_not_doing_yet',
  'nr_coach_note',
  'nr_coach_guidance',
])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  if (!(await isCoachUser(user))) return forbidden()

  const { plan_id, field, value } = await request.json()
  if (!plan_id) {
    return NextResponse.json({ error: 'Missing plan_id' }, { status: 400 })
  }
  if (typeof field !== 'string' || !ALLOWED_FIELDS.has(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }
  if (typeof value !== 'string' && value !== null) {
    return NextResponse.json({ error: 'Value must be a string or null' }, { status: 400 })
  }

  // Strip em dashes from any inline edits to honour the content rule.
  const cleaned = typeof value === 'string' ? value.replace(/—/g, ', ') : value

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('nutrition_plans')
    .update({ [field]: cleaned })
    .eq('id', plan_id)
    .select(`id, ${field}`)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ plan: data })
}
