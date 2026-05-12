import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { plan_id, action } = await request.json()
  if (!plan_id) {
    return NextResponse.json({ error: 'Missing plan_id' }, { status: 400 })
  }
  if (action !== 'publish' && action !== 'unpublish') {
    return NextResponse.json({ error: 'action must be publish or unpublish' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: plan, error: planErr } = await admin
    .from('nutrition_plans')
    .select('id, nutrition_reading_generated_at')
    .eq('id', plan_id)
    .single()

  if (planErr || !plan) {
    return NextResponse.json({ error: 'Nutrition plan not found' }, { status: 404 })
  }

  if (action === 'publish' && !plan.nutrition_reading_generated_at) {
    return NextResponse.json(
      { error: 'Generate the reading before publishing' },
      { status: 400 }
    )
  }

  const { data: updated, error: updateErr } = await admin
    .from('nutrition_plans')
    .update({
      nutrition_reading_published_at: action === 'publish' ? new Date().toISOString() : null,
    })
    .eq('id', plan_id)
    .select('id, nutrition_reading_published_at')
    .single()

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ plan: updated })
}
