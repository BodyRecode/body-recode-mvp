// One-off: tell Challenge finishers their Body Decode read is still available.
//
// Targets people who completed the 14 days but never did the Check-In, so they
// finished with no pattern read. Their portal is reachable again (see
// lib/challenge-access) and /api/challenge/quiz sends the full Body Decode
// Report immediately for anyone past Day 14, so the read is one form away.
//
// Three modes, in the order you should use them:
//
//   --preview   Sends ONE copy to Kade for approval. Uses a real recipient's
//               first name and token so the link in the preview is live and
//               clickable. Nobody else is emailed.
//                 npx tsx --env-file=.env.local scripts/send-finisher-checkin-reopen.ts --preview
//
//   (no flag)   Dry run. Lists who would receive it. Sends nothing.
//                 npx tsx --env-file=.env.local scripts/send-finisher-checkin-reopen.ts
//
//   --send      The real send.
//                 npx tsx --env-file=.env.local scripts/send-finisher-checkin-reopen.ts --send
//
// Routes through sendMarketingEmail so unsubscribes are honoured and the
// compliant footer is attached. Every send is logged to lead_events as
// `finisher_checkin_reopen_sent` and anyone already logged is skipped, so a
// re-run cannot double-send.

import { createAdminClient } from '@/lib/supabase/admin'
import { sendMarketingEmail } from '@/lib/marketing-email'
import { buildFinisherCheckInReopenEmail } from '@/lib/challenge-checkin-emails'
import { fromCoach } from '@/lib/email-shell'
import { coach } from '@/config/tenant'

const PREVIEW = process.argv.includes('--preview')
const LIVE = process.argv.includes('--send')
const EVENT_TYPE = 'finisher_checkin_reopen_sent'

async function main() {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('challenge_enrollments')
    .select('token, lead_id, enrolled_at, leads(name, email)')
    .eq('status', 'completed')
    // CHALLENGE ONLY. This sends Challenge finisher copy about a check-in that
    // The Body Decode does not have. It had no date cutoff and no product
    // filter, so the moment Decode enrolments start reaching 'completed' a
    // re-run would quietly have included them. Added 25 Aug 2026.
    .eq('product', 'challenge')
    .is('quiz_completed_at', null)

  if (error) throw new Error(error.message)

  const { data: alreadySent } = await admin
    .from('lead_events')
    .select('lead_id')
    .eq('type', EVENT_TYPE)
  const done = new Set((alreadySent ?? []).map((r) => r.lead_id as string))

  const recipients = (data ?? [])
    .map((row) => {
      const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads
      return {
        token: row.token as string,
        leadId: row.lead_id as string,
        email: (lead as { email?: string } | null)?.email ?? '',
        firstName: ((lead as { name?: string } | null)?.name ?? 'there').split(' ')[0],
      }
    })
    .filter((r) => r.email && !done.has(r.leadId))

  console.log(`Finishers with no Check-In, not yet contacted: ${recipients.length}`)
  console.log(`(${done.size} already sent)\n`)

  if (!recipients.length) {
    console.log('Nobody to send to.')
    return
  }

  // ── Preview: one copy to Kade, using a real name + token so the CTA works ──
  if (PREVIEW) {
    const sample = recipients[0]
    const built = buildFinisherCheckInReopenEmail({
      firstName: sample.firstName,
      token: sample.token,
    })
    const to = coach().adminEmail ?? coach().email
    const res = await sendMarketingEmail({
      to,
      subject: `[PREVIEW - not sent to anyone else] ${built.subject}`,
      html: built.html,
      from: fromCoach(),
      source: 'finisher-checkin-reopen-preview',
    })
    console.log(res.ok ? `PREVIEW sent to ${to}` : `PREVIEW FAILED: ${res.reason}`)
    console.log(`  rendered for: ${sample.firstName} (real token, CTA is live)`)
    console.log(`  would go to ${recipients.length} people on --send`)
    return
  }

  if (!LIVE) {
    console.log('DRY RUN - would send to:')
    for (const r of recipients) console.log(`  ${r.firstName.padEnd(12)} ${r.email}`)
    console.log('\nRun with --preview to see it, or --send to deliver.')
    return
  }

  for (const r of recipients) {
    const built = buildFinisherCheckInReopenEmail({
      firstName: r.firstName,
      token: r.token,
    })
    const res = await sendMarketingEmail({
      to: r.email,
      subject: built.subject,
      html: built.html,
      from: fromCoach(),
      source: 'finisher-checkin-reopen',
    })

    if (!res.ok) {
      console.log(`  ${res.skipped ? 'SKIPPED (unsubscribed)' : 'FAILED'}  ${r.email}  ${res.reason ?? ''}`)
      continue
    }

    await admin.from('lead_events').insert({
      lead_id: r.leadId,
      type: EVENT_TYPE,
      subject: built.subject,
      sent_at: new Date().toISOString(),
    })
    console.log(`  sent    ${r.email}`)
  }
}

main().catch((e) => {
  console.error('FAILED:', e instanceof Error ? e.message : e)
  process.exit(1)
})
