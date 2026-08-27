/**
 * GET /api/cron/progress-check-invites
 *
 * BACKSTOP ONLY. The real trigger is the client's weekly check-in: the gate is
 * "her block has finished AND her check-in is in", so the instant that second
 * condition becomes true the invite goes, from the check-in submit handler
 * (src/lib/progress-check-dispatch.ts).
 *
 * This exists for what the event cannot catch: an email that failed to send, a
 * block that finished after her last check-in and before her next one, a
 * deploy that ate the handler, anything raised by hand out of sequence. It runs
 * daily so nothing sits for a week, and it is a no-op on any day where the
 * event already did its job - the progress_checks row is the record.
 *
 * Auth: Bearer ${CRON_SECRET}.
 * Schedule registered in vercel.json at "0 22 * * *" (8am Brisbane).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchProgressCheckIfDue } from '@/lib/progress-check-dispatch'
import { fromCoach } from '@/lib/email-shell'
import { coach } from '@/config/tenant'

/**
 * A ceiling on one run. Nothing should ever produce more than a handful, so a
 * larger number means something is wrong - a duration column cleared, a bulk
 * regeneration - and a runaway that emails every client at once is a worse
 * failure than a milestone landing a day late.
 */
const MAX_PER_RUN = 5

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: clients, error } = await admin
    .from('clients')
    .select('id')
    .is('ended_at', null)
    .is('frozen_at', null)

  if (error) {
    console.error('progress-check-invites: client fetch failed', error)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }

  const sent: string[] = []
  const held: { client: string; why: string }[] = []

  for (const c of clients ?? []) {
    if (sent.length >= MAX_PER_RUN) break
    const result = await dispatchProgressCheckIfDue(admin, c.id, 'cron_backstop')
    if (result.sent) sent.push(result.client)
    // Only worth reporting the ones that were genuinely due and held. A client
    // mid-block is not "held", she is simply not due.
    else if (result.why === 'weekly_checkin_pending' || result.why.startsWith('created but'))
      held.push({ client: result.client, why: result.why })
  }

  // The backstop firing at all means the event missed one, which is worth
  // knowing about rather than quietly patching over.
  if (process.env.RESEND_API_KEY && sent.length > 0) {
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: fromCoach(),
        to: coach().adminEmail,
        subject: `Progress Check sent by backstop: ${sent.join(', ')}`,
        html: `<p>The daily backstop sent a Progress Check to ${sent.join(', ')}.</p>
<p>These should normally go the moment the client submits her weekly check-in. The backstop catching one means that did not happen - worth a look at the logs for that submission.</p>`,
      })
    } catch (e) {
      console.error('progress-check-invites: coach summary failed (non-fatal)', e)
    }
  }

  return NextResponse.json({ ok: true, sent, held })
}
