import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { buildProgressCheckInviteEmail } from '@/lib/progress-check-invite-email'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'

/**
 * Resolve an open reassessment trigger.
 *
 * Two ways to close one, and both are explicit acts:
 *   send_progress_check  issues the reassessment and links it to the trigger
 *   dismiss              requires a written reason
 *
 * A trigger cannot be closed silently. That is the point of the whole mechanism:
 * before this existed, a regression signal could be computed, rendered, and
 * ignored without trace.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { triggerId, action, note } = await request.json().catch(() => ({}))
  if (!triggerId) return NextResponse.json({ error: 'Missing triggerId' }, { status: 400 })
  if (action !== 'send_progress_check' && action !== 'dismiss') {
    return NextResponse.json({ error: 'action must be send_progress_check or dismiss' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: trigger } = await admin
    .from('reassessment_triggers')
    .select('id, client_id, status, reason')
    .eq('id', triggerId)
    .maybeSingle()

  if (!trigger) return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
  if (trigger.status !== 'open') {
    return NextResponse.json({ error: `Trigger is already ${trigger.status}` }, { status: 409 })
  }

  // Ownership check against the coach's own client list, same guard as the
  // invitation route. The admin client bypasses RLS, so this must be explicit.
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email')
    .eq('id', trigger.client_id)
    .eq('coach_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  /* ── Dismiss ─────────────────────────────────────────────────────── */
  if (action === 'dismiss') {
    const reason = typeof note === 'string' ? note.trim() : ''
    // Deliberately mandatory. A dismissal without a reason is indistinguishable
    // from nobody looking, which is the failure this table exists to prevent.
    if (reason.length < 3) {
      return NextResponse.json({ error: 'A reason is required to dismiss a trigger.' }, { status: 400 })
    }
    const { error } = await admin
      .from('reassessment_triggers')
      .update({
        status: 'dismissed',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        resolution_note: reason,
      })
      .eq('id', triggerId)
      .eq('status', 'open')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'dismissed' })
  }

  /* ── Send a Progress Check ───────────────────────────────────────── */
  if (!client.email) {
    return NextResponse.json({ error: 'Client has no email address on file.' }, { status: 400 })
  }

  const { data: activeProgram } = await admin
    .from('programs')
    .select('id')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: check, error: insertErr } = await admin
    .from('progress_checks')
    .insert({ client_id: client.id, program_id: activeProgram?.id ?? null })
    .select('id, token')
    .single()

  if (insertErr || !check) {
    console.error('[reassessment resolve] progress check insert failed', insertErr)
    return NextResponse.json({ error: 'Failed to create Progress Check' }, { status: 500 })
  }

  const checkUrl = `${appUrl()}/progress-check/${check.token}`
  const firstName = (client.name ?? '').split(' ')[0] || 'there'
  const { subject, html } = buildProgressCheckInviteEmail({ firstName, checkUrl })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: sendErr } = await resend.emails.send({
    from: fromCoach(),
    to: client.email,
    bcc: COACH_BCC,
    subject,
    html,
  })
  if (sendErr) {
    console.error('[reassessment resolve] email failed', sendErr)
    return NextResponse.json({ error: sendErr.message, token: check.token }, { status: 500 })
  }

  await logClientCommunication(admin, {
    clientId: client.id,
    kind: 'progress_check_invite',
    subject,
    toAddress: client.email,
    sentBy: user.id,
    meta: { url: checkUrl, trigger: 'reassessment_trigger', reason: trigger.reason, triggerId },
  })

  const { error: updateErr } = await admin
    .from('reassessment_triggers')
    .update({
      status: 'actioned',
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      progress_check_id: check.id,
      resolution_note: typeof note === 'string' && note.trim() ? note.trim() : null,
    })
    .eq('id', triggerId)
    .eq('status', 'open')

  if (updateErr) {
    // The client already has the email. Report it rather than pretending it failed.
    console.error('[reassessment resolve] trigger update failed after send', updateErr)
    return NextResponse.json(
      { ok: true, status: 'actioned', warning: 'Progress Check sent but the trigger did not close. Refresh and dismiss it manually.' },
      { status: 200 }
    )
  }

  return NextResponse.json({ ok: true, status: 'actioned', url: checkUrl })
}
