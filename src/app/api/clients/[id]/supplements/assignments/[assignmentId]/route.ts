import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * PATCH { status?, coach_note? }
 *   Update a supplement assignment. Status transitions auto-stamp
 *   paused_at / completed_at.
 * DELETE - hard delete for cleanup only. Use pause/complete for
 *   soft removal.
 * Coach-authenticated.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ error: 'Coach only' }, { status: 403 })
  }

  const { id, assignmentId } = await params
  const body = await request.json().catch(() => ({}))

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.status === 'string') {
    if (!['active', 'paused', 'completed'].includes(body.status)) {
      return NextResponse.json({ error: 'status must be active | paused | completed' }, { status: 400 })
    }
    patch.status = body.status
    if (body.status === 'paused') patch.paused_at = new Date().toISOString()
    if (body.status === 'completed') patch.completed_at = new Date().toISOString()
    if (body.status === 'active') { patch.paused_at = null; patch.completed_at = null }
  }
  if (typeof body.coach_note === 'string') {
    const trimmed = body.coach_note.trim()
    patch.coach_note = trimmed.length > 0 ? trimmed : null
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('supplement_assignments')
    .update(patch)
    .eq('id', assignmentId)
    .eq('client_id', id)
    .select('*')
    .single()

  if (error) {
    console.error('supplement assignment update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, assignment: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ error: 'Coach only' }, { status: 403 })
  }

  const { id, assignmentId } = await params
  const admin = createAdminClient()

  const { error } = await admin
    .from('supplement_assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('client_id', id)

  if (error) {
    console.error('supplement assignment delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
