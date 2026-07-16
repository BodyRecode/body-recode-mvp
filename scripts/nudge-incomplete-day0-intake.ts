// One-off: nudge the Challenge enrollers who signed up BEFORE the automated
// Day 0 scorecard reminder went live (2026-07-16) and never completed their
// in-portal Body Decode Intake. The automation only fires on new enrollments,
// so these earlier sign-ups need a manual catch-up send.
//
// Sends the firmer "second" reminder (they enrolled days ago): email via the
// shared builder + a matching SMS via sendLeadSms (consent-gated: opted-in
// numbers only, STOP-respecting, frequency-capped, logged to sms_logs).
//
// Re-checks each lead at send time and SKIPS anyone who has since completed
// the intake or whose enrollment is no longer active - so it can be re-run
// safely and never chases a completer.
//
// Default mode is PREVIEW: sends ONE [PREVIEW] copy of the email to
// kade@bodyrecode.au and prints exactly who would receive email + SMS. Pass
// --live to actually send to the real recipients.
//
// Usage:
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/nudge-incomplete-day0-intake.ts
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/nudge-incomplete-day0-intake.ts --live

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildDayZeroIntakeReminderEmail } from '@/lib/challenge-checkin-emails'
import { sendLeadSms } from '@/lib/speed-to-lead-sms'
import { fromCoach } from '@/lib/email-shell'
import { brand } from '@/config/tenant'

const LIVE = process.argv.includes('--live')

// The cohort that pre-dates the automation. Matched by name; the send-time
// guard is what actually protects against chasing a completer.
const TARGET_NAMES = ['Andrea L', 'Gemma Sier', 'Kiki Dlynn']

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const marketingDomain = brand().marketingDomain

  const { data: rows, error } = await supabase
    .from('challenge_enrollments')
    .select('token, status, body_decode_intake_completed_at, lead_id, leads(id, name, email, sms_opt_in_at, sms_opted_out_at)')
    .eq('status', 'active')
    .is('body_decode_intake_completed_at', null)

  if (error) {
    console.error('Query failed:', error.message)
    process.exit(1)
  }

  // Filter to the target cohort, still-incomplete, still-active.
  const targets = (rows ?? []).filter((r: any) => TARGET_NAMES.includes(r.leads?.name))

  console.log(`\nMode: ${LIVE ? 'LIVE' : 'PREVIEW'}`)
  console.log(`Incomplete + active in target cohort: ${targets.length}\n`)

  if (targets.length === 0) {
    console.log('Nobody left to nudge (all completed or inactive). Done.')
    return
  }

  for (const r of targets) {
    const lead = r.leads as any
    const firstName = (lead.name?.split(' ')[0] ?? 'there') as string
    const portalUrl = `${marketingDomain}/challenge/${r.token}`
    const optedIn = Boolean(lead.sms_opt_in_at) && !lead.sms_opted_out_at
    const smsBody = `${firstName}, your Challenge is still on hold. Your 2-minute starting read is all that is between you and Day 1: ${portalUrl}. Reply if something got in the way.`

    console.log(`- ${lead.name} <${lead.email}>  | email: yes | sms: ${optedIn ? 'yes' : 'no (not opted in)'}`)

    if (!LIVE) continue

    // Email (firmer "on hold" copy).
    const built = buildDayZeroIntakeReminderEmail({ firstName, portalUrl, second: true })
    const emailRes = await resend.emails.send({
      from: fromCoach(),
      to: lead.email,
      subject: built.subject,
      html: built.html,
    })
    console.log(`    email -> ${emailRes.error ? 'ERROR ' + emailRes.error.message : 'sent ' + emailRes.data?.id}`)

    // SMS (consent-gated inside sendLeadSms; no-op if not opted in).
    const smsRes = await sendLeadSms({ leadId: lead.id, trigger: 'challenge_enrolled', body: smsBody })
    console.log(`    sms   -> ${smsRes.ok ? 'sent' : 'skipped (' + smsRes.reason + ')'}`)
  }

  if (!LIVE) {
    // Send one preview of the email to Kade so he sees the exact look.
    const sample = targets[0].leads as any
    const previewName = sample.name?.split(' ')[0] ?? 'there'
    const previewPortal = `${marketingDomain}/challenge/${targets[0].token}`
    const built = buildDayZeroIntakeReminderEmail({ firstName: previewName, portalUrl: previewPortal, second: true })
    await resend.emails.send({
      from: fromCoach(),
      to: 'kade@bodyrecode.au',
      subject: `[PREVIEW] ${built.subject}`,
      html: built.html,
    })
    console.log(`\nPREVIEW email sent to kade@bodyrecode.au. Re-run with --live to send for real.`)
  } else {
    console.log('\nLive send complete.')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
