/**
 * GET /api/cron/progress-check-invites
 *
 * Daily Vercel cron. Sends the block-end Progress Check to any active client
 * whose block has reached its end and whose weekly check-in for the most
 * recent window is in.
 *
 * This is the piece the whole milestone was waiting on. Until now the invite
 * was a button on the client's Training page, visible only once the block had
 * run its weeks - so a milestone was missed by not opening the right page in
 * the right week. On 27 Aug an audit found four of six active clients due or
 * overdue, one of them by seven weeks.
 *
 * Gates are the shared ones (src/lib/progress-check-readiness.ts), not a copy:
 * block ended, and her check-in for the current window submitted. The coach's
 * manual send uses the same function, so the two cannot drift.
 *
 * Idempotent without a new table: a progress_checks row for that program_id IS
 * the record that one was sent. A new block means a new program_id, so the next
 * milestone fires fresh.
 *
 * Auth: Bearer ${CRON_SECRET}.
 * Schedule registered in vercel.json at "0 22 * * *" (8am Brisbane), which is
 * after the block-end notification run and, on a Monday, after the check-in
 * window has closed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateProgressCheckReadiness } from '@/lib/progress-check-readiness'
import { lastCheckinWindowOpenMs } from '@/lib/weekly-checkin-questions'
import { buildProgressCheckInviteEmail } from '@/lib/progress-check-invite-email'
import { logClientCommunication } from '@/lib/client-communications'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'
import { coach } from '@/config/tenant'

/**
 * A ceiling on one run. Nothing should ever produce more than a handful, so a
 * larger number means something is wrong - a duration column cleared, a bulk
 * program regeneration - and a runaway that emails every client at once is a
 * worse failure than a milestone landing a day late.
 */
const MAX_PER_RUN = 5

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  const { data: programs, error } = await admin
    .from('programs')
    .select('id, client_id, block_name, week_duration, generated_at, clients!inner(id, name, email, ended_at, frozen_at, coaching_started_at)')
    .eq('is_active', true)

  if (error) {
    console.error('progress-check-invites: program fetch failed', error)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }

  const windowOpenIso = new Date(lastCheckinWindowOpenMs()).toISOString()

  const sent: string[] = []
  const skipped: { client: string; why: string }[] = []

  for (const program of programs ?? []) {
    const c = program.clients as unknown as {
      id: string; name: string | null; email: string | null
      ended_at: string | null; frozen_at: string | null; coaching_started_at: string | null
    }
    const name = c?.name ?? 'Unknown'

    if (!c || c.ended_at || c.frozen_at) continue
    if (!program.generated_at || !program.week_duration) continue

    const blockWeek =
      Math.floor((Date.now() - new Date(program.generated_at).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1

    // Already raised for this block? The row is the idempotency record.
    const { count: existing } = await admin
      .from('progress_checks')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', program.id)
    if (existing && existing > 0) continue

    const { count: checkins } = await admin
      .from('weekly_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', c.id)
      .gte('submitted_at', windowOpenIso)

    const readiness = evaluateProgressCheckReadiness({
      coachingStartedAt: c.coaching_started_at,
      blockWeek,
      blockDuration: program.week_duration,
      checkedInThisWindow: (checkins ?? 0) > 0,
    })
    if (!readiness.ready) {
      // Only worth reporting once the block has actually ended - a client
      // mid-block is not "skipped", she is simply not due.
      if (readiness.blocker !== 'block_not_ended') skipped.push({ client: name, why: readiness.blocker ?? '' })
      continue
    }

    if (!c.email) {
      skipped.push({ client: name, why: 'no email on file' })
      continue
    }

    if (sent.length >= MAX_PER_RUN) {
      skipped.push({ client: name, why: 'run cap reached, will send tomorrow' })
      continue
    }

    const { data: row, error: insErr } = await admin
      .from('progress_checks')
      .insert({ client_id: c.id, program_id: program.id })
      .select('token')
      .single()
    if (insErr || !row) {
      console.error('progress-check-invites: insert failed', insErr)
      skipped.push({ client: name, why: 'could not create invitation' })
      continue
    }

    const checkUrl = `${appUrl()}/progress-check/${row.token}`
    const firstName = (c.name ?? '').split(' ')[0] || 'there'
    const { subject, html } = buildProgressCheckInviteEmail({ firstName, checkUrl })

    if (!resend) {
      skipped.push({ client: name, why: 'email not configured' })
      continue
    }
    const { error: sendErr } = await resend.emails.send({
      from: fromCoach(),
      to: c.email,
      bcc: COACH_BCC,
      subject,
      html,
    })
    if (sendErr) {
      // The invitation exists and the link works, so this is recoverable by
      // hand rather than lost - say so rather than swallowing it.
      console.error('progress-check-invites: send failed', sendErr)
      skipped.push({ client: name, why: `created but email failed: ${sendErr.message}` })
      continue
    }

    await logClientCommunication(admin, {
      clientId: c.id,
      kind: 'progress_check_invite',
      subject,
      toAddress: c.email,
      sentBy: null,
      meta: { url: checkUrl, trigger: 'cron_block_end', programId: program.id },
    })
    sent.push(name)
  }

  // Tell the coach what went out in his name. Silence would mean finding out
  // from a BCC, or not at all.
  if (resend && (sent.length > 0 || skipped.length > 0)) {
    const lines: string[] = []
    if (sent.length) lines.push(`<p><b>Progress Check sent:</b> ${sent.join(', ')}.</p>`)
    if (skipped.length) {
      lines.push('<p><b>Due but not sent:</b></p><ul>' +
        skipped.map(s => `<li>${s.client} - ${s.why === 'weekly_checkin_pending' ? 'waiting on this week’s check-in' : s.why}</li>`).join('') +
        '</ul>')
    }
    try {
      await resend.emails.send({
        from: fromCoach(),
        to: coach().adminEmail,
        subject: sent.length
          ? `Progress Check sent to ${sent.length} client${sent.length === 1 ? '' : 's'}`
          : 'Progress Checks due, none sent',
        html: lines.join('\n'),
      })
    } catch (e) {
      console.error('progress-check-invites: coach summary failed (non-fatal)', e)
    }
  }

  return NextResponse.json({ ok: true, sent, skipped })
}
