// One-off catch-up for the Body Decode Check-In.
//
// The Check-In prompt emails (challenge-checkin-prompt Inngest function, added
// 2026-08-03) only fire for NEW `challenge/enrolled` events. Anyone already
// mid-challenge when that shipped never gets them, so this covers that gap
// once. Not intended to be run on a schedule.
//
// Sends the reminder only to enrollments that are:
//   - status 'active' (so nobody who already finished is re-poked)
//   - have NOT completed the Check-In
//   - are on Day 7 or later (the Check-In is locked before Day 7)
//   - are on Day 13 or earlier (past that, the Day 14 email has effectively
//     landed and the ask is stale)
//
// IMPORTANT: everyone who enrolled before the function shipped is invisible to
// it forever - their `challenge/enrolled` event was consumed long ago. That
// includes people not yet at Day 7, who will reach the window over the coming
// days. So this needs running once a day until the pre-deploy cohort clears
// (roughly 10 days from 2026-08-03). It is safe to re-run: every send is
// logged to lead_events as `checkin_catchup_sent` and anyone already logged is
// skipped, so nobody is emailed twice.
//
// Dry run by default. Pass --send to actually deliver.
//
//   npx tsx --env-file=.env.local scripts/send-checkin-catchup.ts
//   npx tsx --env-file=.env.local scripts/send-checkin-catchup.ts --send

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildCheckInReminderEmail } from '../src/lib/challenge-checkin-emails'
import { fromCoach } from '../src/lib/email-shell'

const LIVE = process.argv.includes('--send')

// Hard cutoff: challengeCheckinPromptFunction shipped on the morning of
// 2026-08-03 and covers every enrolment from that point on. Without this,
// a NEW enrollee sitting on Day 8 without a Check-In matches every other
// filter here and would be emailed by this script on top of the Day 7 email
// Inngest already sent them. The cutoff makes the script self-limiting: once
// the pre-deploy cohort clears the Day 7-13 window it can never send again,
// so leaving it scheduled is harmless. Nobody enrolled on 2026-08-03 itself
// (latest was 2026-07-30), so midnight Brisbane is a clean boundary.
const PRE_DEPLOY_CUTOFF = new Date('2026-08-03T00:00:00+10:00')

function challengeDay(enrolledAt: string): number {
  const days = Math.floor((Date.now() - new Date(enrolledAt).getTime()) / 86_400_000)
  return Math.min(Math.max(days + 1, 1), 14)
}

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await admin
    .from('challenge_enrollments')
    .select('token, lead_id, enrolled_at, status, quiz_completed_at, leads(name, email)')
    .eq('status', 'active')
    .is('quiz_completed_at', null)
    .lt('enrolled_at', PRE_DEPLOY_CUTOFF.toISOString())

  if (error) throw new Error(error.message)

  // Anyone already caught up on a previous run is skipped, so this is safe to
  // re-run daily while the pre-deploy cohort works through the Day 7-13 window.
  const { data: alreadySent } = await admin
    .from('lead_events')
    .select('lead_id')
    .eq('type', 'checkin_catchup_sent')
  const done = new Set((alreadySent ?? []).map((r) => r.lead_id as string))

  const candidates = (data ?? [])
    .map((row) => {
      const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
      return {
        token: row.token as string,
        leadId: row.lead_id as string,
        email: (lead as { email?: string } | null)?.email ?? '',
        firstName: ((lead as { name?: string } | null)?.name ?? 'there').split(' ')[0],
        day: challengeDay(row.enrolled_at as string),
      }
    })
    .filter((c) => c.email && c.day >= 7 && c.day <= 13 && !done.has(c.leadId))

  const tooEarly = (data ?? []).filter((r) => challengeDay(r.enrolled_at as string) < 7).length
  console.log(`${LIVE ? 'SENDING' : 'DRY RUN'} - ${candidates.length} eligible of ${data?.length ?? 0} active non-completers`)
  console.log(`  (${done.size} already caught up, ${tooEarly} not yet at Day 7 - re-run daily to catch them)\n`)

  if (!candidates.length) {
    console.log('Nothing to send.')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY!)

  for (const c of candidates) {
    const daysLeft = Math.max(14 - c.day, 1)
    const built = buildCheckInReminderEmail({
      firstName: c.firstName,
      token: c.token,
      daysLeft,
    })

    if (!LIVE) {
      console.log(`  [dry] day ${c.day}, ${daysLeft}d left  ${c.email}  "${built.subject}"`)
      continue
    }

    const { data: sent, error: sendErr } = await resend.emails.send({
      from: fromCoach(),
      to: c.email,
      subject: built.subject,
      html: built.html,
    })

    if (sendErr) {
      console.log(`  FAILED  ${c.email}  ${sendErr.message}`)
      continue
    }

    // Log before moving on so a crash mid-run cannot cause a double-send.
    await admin.from('lead_events').insert({
      lead_id: c.leadId,
      type: 'checkin_catchup_sent',
      subject: built.subject,
      resend_email_id: sent?.id ?? null,
      sent_at: new Date().toISOString(),
    })
    console.log(`  sent    day ${c.day}  ${c.email}  ${sent?.id}`)
  }
}

main().catch((e) => {
  console.error('FAILED:', e instanceof Error ? e.message : e)
  process.exit(1)
})
