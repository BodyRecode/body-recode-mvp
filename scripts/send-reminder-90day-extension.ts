// One-time reminder: nudge Kade that the 90-Day Extension product still needs
// building. Fired by a self-destructing launchd job at 5pm on 2026-07-16.
// Branded email via the shared email-shell helpers.

import { Resend } from 'resend'
import {
  fromBrand, darkEmailShell,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody, emailStatusCard,
} from '@/lib/email-shell'

async function main() {
  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Reminder · Funnel')}
${emailHeading('Finish the 90-Day Extension')}
${emailDivider()}
${emailBody('This is the reminder you asked for earlier today.')}
${emailStatusCard({
  eyebrow: 'Still to build',
  headline: '90-Day Extension ($197)',
  body: "It's pitched in the re-engagement emails and has a /extension URL, but the product isn't actually built - no extension_enrollments table, no checkout. Once built, add it to the re-engagement purchase-stop guard.",
})}
${emailBody('When you are ready to pick it up, just tell Claude to start on the 90-day extension.', { size: 14 })}
`, { previewText: 'Reminder: finish the 90-Day Extension' })

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const res = await resend.emails.send({
    from: fromBrand(),
    to: 'kade@bodyrecode.au',
    subject: 'Reminder: finish the 90-Day Extension',
    html,
  })
  console.log(res.error ? `Email ERROR: ${res.error.message}` : `Reminder emailed (${res.data?.id})`)
}

main().catch(e => { console.error(e); process.exit(1) })
