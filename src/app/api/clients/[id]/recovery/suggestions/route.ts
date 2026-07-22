import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * POST { rrs_playbook_id, suggested_protocol_slugs, sbst_action? }
 *   Log that a suggestion banner was shown to the coach.
 *   Called once per page render when an active RRS state exists.
 *
 * PATCH { id, action_taken, assigned_protocol_slug?, dismissed_reason? }
 *   Log the coach's response - one-click assigned, dismissed, or sbst_removed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const email = (user.email ?? '').toLowerCase()
  if (!isCoachEmail(email)) return NextResponse.json({ error: 'Coach only' }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const rrsPlaybookId = typeof body.rrs_playbook_id === 'string' ? body.rrs_playbook_id : null
  const slugs = Array.isArray(body.suggested_protocol_slugs) ? body.suggested_protocol_slugs : null
  const sbstAction = typeof body.sbst_action === 'string' ? body.sbst_action : null

  if (!rrsPlaybookId || !slugs) {
    return NextResponse.json({ error: 'rrs_playbook_id and suggested_protocol_slugs required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('recovery_protocol_suggestions_log')
    .insert({
      client_id: id,
      rrs_playbook_id: rrsPlaybookId,
      suggested_protocol_slugs: slugs,
      sbst_action: sbstAction,
      coach_email: email,
    })
    .select('id')
    .single()

  if (error) {
    console.error('suggestion log insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, log_id: data.id })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ error: 'Coach only' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const logId = typeof body.id === 'string' ? body.id : null
  const actionTaken = typeof body.action_taken === 'string' ? body.action_taken : null
  const assignedSlug = typeof body.assigned_protocol_slug === 'string' ? body.assigned_protocol_slug : null
  const dismissedReason = typeof body.dismissed_reason === 'string' ? body.dismissed_reason : null

  if (!logId || !actionTaken) {
    return NextResponse.json({ error: 'id and action_taken required' }, { status: 400 })
  }
  if (!['assigned', 'dismissed', 'sbst_removed'].includes(actionTaken)) {
    return NextResponse.json({ error: 'action_taken must be assigned | dismissed | sbst_removed' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('recovery_protocol_suggestions_log')
    .update({
      action_taken: actionTaken,
      assigned_protocol_slug: assignedSlug,
      dismissed_reason: dismissedReason,
      actioned_at: new Date().toISOString(),
    })
    .eq('id', logId)
    .eq('client_id', id)

  if (error) {
    console.error('suggestion log update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
