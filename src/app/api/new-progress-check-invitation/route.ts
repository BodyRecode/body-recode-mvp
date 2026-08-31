import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { buildProgressCheckInviteEmail } from '@/lib/progress-check-invite-email'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'
import { evaluateProgressCheckReadiness, currentCoachingWeek } from '@/lib/progress-check-readiness'
import { lastCheckinWindowOpenMs } from '@/lib/weekly-checkin-questions'
import { blockFinalWeekStartMs } from '@/lib/block-window'

// Creates a Progress Check (delta re-assessment) invitation for a client and
// returns its token. The client completes it at /progress-check/{token}. One
// progress_checks row = one invitation + (once submitted) its answers.
//
// Optional programId / blockNumber tie the check to the block it belongs to,
// so the Progress Read generator (Phase 2) can pair it with that block's CFWS arc.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { clientId, programId, blockNumber, send, force } = await request.json().catch(() => ({}))
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  // Client must belong to this coach (same guard as the intake invitation).
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, coaching_started_at, onboarding_token')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const admin = createAdminClient()

  // Timing gate: after block-end, and after this week's check-in. Enforced here
  // rather than only in the UI so the block-end cron inherits the same rule the
  // day it is built. `force` is the coach's override.
  if (!force) {
    // "Has she checked in" is asked against the window that most recently
    // opened, not against her coaching week - the coaching week rolls over on
    // her own start day and would answer a different question.
    const windowOpenIso = new Date(lastCheckinWindowOpenMs()).toISOString()
    const [{ data: program }, { count: checkinsThisWindow }] = await Promise.all([
      programId
        ? admin.from('programs').select('generated_at, activated_at, week_duration').eq('id', programId).maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from('weekly_checkins')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .gte('submitted_at', windowOpenIso),
    ])

    const blockFinalWeekStartsAtMs = blockFinalWeekStartMs(program)

    const readiness = evaluateProgressCheckReadiness({
      coachingStartedAt: client.coaching_started_at ?? null,
      blockFinalWeekStartsAtMs,
      checkedInThisWindow: (checkinsThisWindow ?? 0) > 0,
    })
    if (!readiness.ready) {
      return NextResponse.json(
        { error: readiness.reason, blocker: readiness.blocker, canForce: true },
        { status: 409 },
      )
    }
  }
  const { data: row, error } = await admin
    .from('progress_checks')
    .insert({ client_id: clientId, program_id: programId ?? null, block_number: blockNumber ?? null })
    .select('token')
    .single()

  if (error || !row) {
    console.error('Progress Check invitation insert error:', error)
    return NextResponse.json({ error: 'Failed to create Progress Check' }, { status: 500 })
  }

  const checkUrl = `${appUrl()}/progress-check/${row.token}`

  // One-click send: create the invitation AND email the client the link.
  if (send) {
    if (!client.email) {
      return NextResponse.json({ error: 'Client has no email address on file. Copy the link and send it manually.', token: row.token }, { status: 400 })
    }
    const firstName = (client.name ?? '').split(' ')[0] || 'there'
    const portalUrl = `${appUrl()}/portal/${client.onboarding_token}`
    const { subject, html } = buildProgressCheckInviteEmail({ firstName, portalUrl })
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: sendErr } = await resend.emails.send({
      from: fromCoach(),
      to: client.email,
      bcc: COACH_BCC,
      subject,
      html,
    })
    if (sendErr) {
      console.error('Progress Check email error:', sendErr)
      return NextResponse.json({ error: sendErr.message, token: row.token }, { status: 500 })
    }
    await logClientCommunication(admin, {
      clientId,
      kind: 'progress_check_invite',
      subject,
      toAddress: client.email,
      sentBy: user.id,
      meta: { url: checkUrl, trigger: 'manual', programId: programId ?? null },
    })
    return NextResponse.json({ token: row.token, url: checkUrl, sent: true })
  }

  return NextResponse.json({ token: row.token, url: checkUrl })
}
