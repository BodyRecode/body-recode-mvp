// PAR-Q + Health Declaration catch-up for the pre-deploy cohort.
//
// `challengeFormsReminderFunction` (Inngest) chases the second Challenge gate,
// but like every Inngest sequence it only ever starts on a NEW
// `challenge/enrolled` event. The people it was built for enrolled in July -
// their event was consumed weeks ago, so the function can never reach them.
// Exactly the trap the Check-In prompt hit, where 28 of 29 predated it.
//
// This is a ONE-OFF for that cohort. Unlike the Check-In catch-up it is not
// scheduled, because there is no rolling window to re-enter: someone either
// still has training locked or they do not.
//
// Safety properties, in order of how badly each would hurt if missing:
//   1. `forms_catchup_sent` lead_events guard - nobody is emailed twice across
//      runs. Written immediately after each successful send so a crash mid-run
//      cannot double-send on the next pass.
//   2. PRE_DEPLOY_CUTOFF - anyone enrolling after the Inngest function shipped
//      is already covered by it. Without this the two would both chase.
//   3. hasPortalAccess - a cancelled enrolment cannot open the portal at all,
//      so chasing them toward a form they cannot reach is worse than silence.
//   4. Gate one first - never chase the PAR-Q from someone who has not cleared
//      the Day 0 intake. They have a different, earlier problem.

import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { buildFormsReminderEmail } from '@/lib/challenge-checkin-emails'
import { fromCoach } from '@/lib/email-shell'
import { brand } from '@/config/tenant'
import { hasPortalAccess } from '@/lib/challenge-access'

// challengeFormsReminderFunction shipped 2026-08-14. Latest enrolment was
// 2026-08-07, so this is a clean boundary with nothing either side of it.
export const PRE_DEPLOY_CUTOFF = new Date('2026-08-14T00:00:00+10:00')

export type FormsCatchupResult = {
  sent: { name: string; email: string; id: string | null }[]
  failed: { email: string; error: string }[]
  eligible: number
  alreadySent: number
  noPortalAccess: number
}

export async function runFormsCatchup({ live }: { live: boolean }): Promise<FormsCatchupResult> {
  const admin = createAdminClient()
  const result: FormsCatchupResult = { sent: [], failed: [], eligible: 0, alreadySent: 0, noPortalAccess: 0 }

  const { data, error } = await admin
    .from('challenge_enrollments')
    .select('token, lead_id, enrolled_at, status, parq_completed_at, health_dec_completed_at, body_decode_intake_completed_at, leads(name, email, scorecard_profile)')
    .lt('enrolled_at', PRE_DEPLOY_CUTOFF.toISOString())
  if (error) throw new Error(error.message)

  const { data: alreadySent } = await admin
    .from('lead_events').select('lead_id').eq('type', 'forms_catchup_sent')
  const done = new Set((alreadySent ?? []).map(r => r.lead_id as string))

  const resend = new Resend(process.env.RESEND_API_KEY)

  for (const row of data ?? []) {
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
    if (!lead?.email) continue

    // Both forms done: nothing to chase.
    if (row.parq_completed_at && row.health_dec_completed_at) continue
    // Gate one not cleared: a different problem, and the intake reminder owns it.
    const clearedGateOne = !!row.body_decode_intake_completed_at || !!lead.scorecard_profile
    if (!clearedGateOne) continue

    if (!hasPortalAccess(row.status as string)) { result.noPortalAccess++; continue }
    if (done.has(row.lead_id as string)) { result.alreadySent++; continue }

    result.eligible++
    if (!live) continue

    const firstName = (lead.name ?? '').split(' ')[0] || 'there'
    const portalUrl = `${brand().marketingDomain}/challenge/${row.token}`
    // `finished` - this cohort's 14 days are over. The in-flight copy talks
    // about training that "does the work over the fourteen days", which is
    // nonsense to someone who finished weeks ago and hides what actually
    // happened: they completed a Challenge without ever seeing the training.
    const built = buildFormsReminderEmail({ firstName, portalUrl, finished: true })

    // BCC Kade on every one-off send to a client or prospect, so he can
    // confirm what actually landed without asking for a separate copy.
    const { data: sent, error: sendErr } = await resend.emails.send({
      from: fromCoach(), to: lead.email, bcc: ['kade@bodyrecode.au'],
      subject: built.subject, html: built.html,
    })
    if (sendErr) { result.failed.push({ email: lead.email, error: sendErr.message ?? 'unknown' }); continue }

    // Log before continuing so a crash cannot double-send on the next run.
    await admin.from('lead_events').insert({
      lead_id: row.lead_id,
      type: 'forms_catchup_sent',
      subject: built.subject,
      resend_email_id: sent?.id ?? null,
      sent_at: new Date().toISOString(),
    })
    result.sent.push({ name: lead.name ?? '?', email: lead.email, id: sent?.id ?? null })
  }

  return result
}
