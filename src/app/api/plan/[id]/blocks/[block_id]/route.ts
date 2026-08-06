import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; block_id: string }> }
) {
  const { block_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json()
  const allowed = ['block_name', 'progression_phase', 'phase_category', 'execution_arc', 'phase_objective', 'training_goal', 'week_duration', 'training_frequency', 'status', 'notes', 'program_id']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('plan_blocks').update(updates).eq('id', block_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; block_id: string }> }
) {
  const { id: plan_id, block_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const admin = createAdminClient()

  // Get position of block being deleted
  const { data: target } = await admin
    .from('plan_blocks')
    .select('position')
    .eq('id', block_id)
    .maybeSingle()

  const { error } = await admin.from('plan_blocks').delete().eq('id', block_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Resequence positions after the deleted block
  if (target) {
    const { data: after } = await admin
      .from('plan_blocks')
      .select('id, position')
      .eq('plan_id', plan_id)
      .gt('position', target.position)
      .order('position', { ascending: true })

    for (const b of after ?? []) {
      await admin.from('plan_blocks').update({ position: b.position - 1 }).eq('id', b.id)
    }
  }

  return NextResponse.json({ success: true })
}
