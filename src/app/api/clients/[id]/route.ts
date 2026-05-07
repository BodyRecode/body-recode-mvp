import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const allowed = ['coaching_started_at', 'package', 'active', 'phone', 'subscription_link_send_at', 'subscription_link_sent_at', 'hormonal_support']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Stamp hormonal_support_updated_at when the regimen actually changes so
  // downstream prescriptions can detect staleness.
  if ('hormonal_support' in updates) {
    updates.hormonal_support_updated_at = new Date().toISOString()
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  // Get program and nutrition plan IDs first for cascading child records
  const [{ data: programs }, { data: nutritionPlans }] = await Promise.all([
    admin.from('programs').select('id').eq('client_id', id),
    admin.from('nutrition_plans').select('id').eq('client_id', id),
  ])

  const programIds = (programs || []).map((p: { id: string }) => p.id)
  const planIds = (nutritionPlans || []).map((p: { id: string }) => p.id)

  // Null out the lead reference to this client
  await admin.from('leads').update({ converted_to_client_id: null }).eq('converted_to_client_id', id)

  // Delete child records of programs and plans
  await Promise.all([
    programIds.length > 0
      ? admin.from('program_reviews').delete().in('program_id', programIds)
      : Promise.resolve(),
    planIds.length > 0
      ? admin.from('nutrition_reviews').delete().in('plan_id', planIds)
      : Promise.resolve(),
  ])

  // Delete client-level records in parallel
  await Promise.all([
    admin.from('programs').delete().eq('client_id', id),
    admin.from('nutrition_plans').delete().eq('client_id', id),
    admin.from('cffs').delete().eq('client_id', id),
    admin.from('cfws').delete().eq('client_id', id),
    admin.from('weekly_checkins').delete().eq('client_id', id),
    admin.from('baselines').delete().eq('client_id', id),
    admin.from('intake_invitations').delete().eq('client_id', id),
    admin.from('macro_plans').delete().eq('client_id', id),
  ])

  // Now delete the client
  const { error } = await admin.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
