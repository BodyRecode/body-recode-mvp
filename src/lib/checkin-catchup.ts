// Body Decode Check-In catch-up for the pre-deploy cohort.
//
// `challengeCheckinPromptFunction` (Inngest) sends the Day 7 + Day 11 Check-In
// prompts, but it only ever starts on a NEW `challenge/enrolled` event. Anyone
// already mid-challenge when it shipped on 2026-08-03 is invisible to it
// permanently - their event was consumed long ago. This covers that cohort as
// they cross into the Day 7-13 window.
//
// Shared by the cron route (/api/cron/checkin-catchup) and the manual script
// (scripts/send-checkin-catchup.ts) so the two can never drift apart.
//
// Safety properties, in order of how badly each would hurt if missing:
//   1. PRE_DEPLOY_CUTOFF - without it, a NEW enrollee on Day 8 without a
//      Check-In matches every other filter and gets this email on top of the
//      Day 7 email Inngest already sent them. This is what makes the job safe
//      to leave scheduled: once the cohort clears, it can never send again.
//   2. `checkin_catchup_sent` lead_events guard - nobody is emailed twice
//      across runs. Written immediately after each successful send so a crash
//      mid-run cannot double-send on the next pass.
//   3. status 'active' + quiz_completed_at null - never chase someone who has
//      finished or already done the Check-In.
//   4. Day 7-13 window - the Check-In is locked before Day 7, and past Day 13
//      the Day 14 email has effectively landed so the ask is stale.

import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { buildCheckInReminderEmail } from '@/lib/challenge-checkin-emails'
import { fromCoach } from '@/lib/email-shell'

// The morning challengeCheckinPromptFunction shipped. Nobody enrolled on
// 2026-08-03 itself (latest was 2026-07-30), so midnight Brisbane is a clean
// boundary with no edge case either side.
export const PRE_DEPLOY_CUTOFF = new Date('2026-08-03T00:00:00+10:00')

export type CatchupResult = {
  sent: { email: string; day: number; id: string | null }[]
  failed: { email: string; error: string }[]
  eligible: number
  alreadyCaughtUp: number
  notYetDay7: number
  cohortRemaining: number
}

export function challengeDayFromEnrolledAt(enrolledAt: string): number {
  const days = Math.floor((Date.now() - new Date(enrolledAt).getTime()) / 86_400_000)
  return Math.min(Math.max(days + 1, 1), 14)
}

export async function runCheckinCatchup({ live }: { live: boolean }): Promise<CatchupResult> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('challenge_enrollments')
    .select('token, lead_id, enrolled_at, status, quiz_completed_at, leads(name, email)')
    .eq('status', 'active')
    .is('quiz_completed_at', null)
    .lt('enrolled_at', PRE_DEPLOY_CUTOFF.toISOString())

  if (error) throw new Error(error.message)

  const { data: alreadySent } = await admin
    .from('lead_events')
    .select('lead_id')
    .eq('type', 'checkin_catchup_sent')
  const done = new Set((alreadySent ?? []).map((r) => r.lead_id as string))

  const rows = (data ?? []).map((row) => {
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
    return {
      token: row.token as string,
      leadId: row.lead_id as string,
      email: (lead as { email?: string } | null)?.email ?? '',
      firstName: ((lead as { name?: string } | null)?.name ?? 'there').split(' ')[0],
      day: challengeDayFromEnrolledAt(row.enrolled_at as string),
    }
  })

  const candidates = rows.filter(
    (c) => c.email && c.day >= 7 && c.day <= 13 && !done.has(c.leadId)
  )

  const result: CatchupResult = {
    sent: [],
    failed: [],
    eligible: candidates.length,
    alreadyCaughtUp: rows.filter((r) => done.has(r.leadId)).length,
    notYetDay7: rows.filter((r) => r.day < 7).length,
    cohortRemaining: rows.length,
  }

  if (!live || !candidates.length) return result

  const resend = new Resend(process.env.RESEND_API_KEY!)

  for (const c of candidates) {
    const built = buildCheckInReminderEmail({
      firstName: c.firstName,
      token: c.token,
      daysLeft: Math.max(14 - c.day, 1),
    })

    const { data: sent, error: sendErr } = await resend.emails.send({
      from: fromCoach(),
      to: c.email,
      subject: built.subject,
      html: built.html,
    })

    if (sendErr) {
      result.failed.push({ email: c.email, error: sendErr.message ?? 'unknown' })
      continue
    }

    // Log before continuing so a crash cannot cause a double-send next run.
    await admin.from('lead_events').insert({
      lead_id: c.leadId,
      type: 'checkin_catchup_sent',
      subject: built.subject,
      resend_email_id: sent?.id ?? null,
      sent_at: new Date().toISOString(),
    })

    result.sent.push({ email: c.email, day: c.day, id: sent?.id ?? null })
  }

  return result
}
