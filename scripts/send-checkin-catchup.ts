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
// Dry run by default. Pass --send to actually deliver.
//
//   npx tsx --env-file=.env.local scripts/send-checkin-catchup.ts
//   npx tsx --env-file=.env.local scripts/send-checkin-catchup.ts --send

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildCheckInReminderEmail } from '../src/lib/challenge-checkin-emails'
import { fromCoach } from '../src/lib/email-shell'

const LIVE = process.argv.includes('--send')

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
    .select('token, enrolled_at, status, quiz_completed_at, leads(name, email)')
    .eq('status', 'active')
    .is('quiz_completed_at', null)

  if (error) throw new Error(error.message)

  const candidates = (data ?? [])
    .map((row) => {
      const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
      return {
        token: row.token as string,
        email: (lead as { email?: string } | null)?.email ?? '',
        firstName: ((lead as { name?: string } | null)?.name ?? 'there').split(' ')[0],
        day: challengeDay(row.enrolled_at as string),
      }
    })
    .filter((c) => c.email && c.day >= 7 && c.day <= 13)

  console.log(`${LIVE ? 'SENDING' : 'DRY RUN'} - ${candidates.length} eligible of ${data?.length ?? 0} active non-completers\n`)

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
    console.log(
      sendErr
        ? `  FAILED  ${c.email}  ${sendErr.message}`
        : `  sent    day ${c.day}  ${c.email}  ${sent?.id}`
    )
  }
}

main().catch((e) => {
  console.error('FAILED:', e instanceof Error ? e.message : e)
  process.exit(1)
})
