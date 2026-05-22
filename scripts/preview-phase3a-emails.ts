// Send [PREVIEW] copies of the Phase 3a migrated emails to Kade.
// Covers: 5 cron emails + medical-clearance-required + a representative
// shell-wrapped drip step. (Per-step body composition refactor of all
// 15+ drip emails queued as Phase 3b.)
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-phase3a-emails.ts

import { Resend } from 'resend'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList, emailStatusCard, emailCallout,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'
import { sendMedicalClearanceRequiredEmail as _unused } from '../src/lib/medical-clearance-required-email'
void _unused

const APP = 'https://app.bodyrecode.au'
const SAMPLE_TOKEN = 'preview-token-1234567890abcdef'
const FIRST = 'Sample'

const previews: Array<{ subject: string; html: string }> = []

// 1. Session reminder (tomorrow)
{
  const portalUrl = `${APP}/portal/${SAMPLE_TOKEN}`
  const confirmUrl = `${APP}/api/portal/confirm-session?id=preview-session`
  const inner = `
${emailLogo()}
${emailEyebrow('Session Reminder')}
${emailHeading(`See you tomorrow, ${FIRST}.`)}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('Just a reminder that you have a session tomorrow.', { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'Face-to-face session',
  headline: 'Friday 23 May · 5:30pm',
  body: '45 minutes · AF Newstead. Tap below to confirm so I know to expect you.',
})}
${emailCta({ href: confirmUrl, label: 'Confirm attendance' })}
${emailUrlFallback(confirmUrl, 'Or paste this confirm link into your browser')}
${emailBody("If you can't make it, log in to your portal and reschedule — or reply to this email.", { size: 13, bottom: 0 })}
${darkEmailSignature()}
`
  void portalUrl
  previews.push({
    subject: '[PREVIEW] Session reminder - tomorrow at 5:30pm',
    html: darkEmailShell(inner, { previewText: `Session tomorrow at 5:30pm, ${FIRST}.` }),
  })
}

// 2. Coaching start reminder
{
  const portalUrl = `${APP}/portal/${SAMPLE_TOKEN}`
  const inner = `
${emailLogo()}
${emailEyebrow('Coaching Starts Tomorrow')}
${emailHeading(`See you tomorrow, ${FIRST}.`)}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('Just a reminder that your coaching begins tomorrow.')}
${emailBody("I'll be in touch with your session details shortly. If you have any questions before we begin, reply to this email.")}
${emailBody('Looking forward to it.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Coaching begins tomorrow',
    html: darkEmailShell(inner, { previewText: `${FIRST}, coaching begins tomorrow.` }),
  })
}

// 3. Onboarding reminder (Day 7 example)
{
  const portalUrl = `${APP}/portal/${SAMPLE_TOKEN}`
  const inner = `
${emailLogo()}
${emailEyebrow('Onboarding Reminder')}
${emailHeading(`${FIRST}, your Foundational Intake is waiting.`)}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('Your Foundational Intake is still outstanding. We need this to keep your coaching on track.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${emailBody("If anything's blocking you or unclear, reply to this email.", { size: 13, bottom: 0 })}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Your Foundational Intake is still pending',
    html: darkEmailShell(inner, { previewText: `${FIRST}, your Foundational Intake is waiting.` }),
  })
}

// 4. Weekly check-in window closing (1 hour warning)
{
  const portalUrl = `${APP}/portal/${SAMPLE_TOKEN}`
  const inner = `
${emailLogo()}
${emailEyebrow('Check-In Closing Soon')}
${emailHeading('One hour to lock in this week.')}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody("Your weekly check-in window closes at 6:30pm today. You haven't submitted yet — takes less than 5 minutes.", { bottom: 20 })}
${emailCallout({ eyebrow: 'Closes', value: '6:30pm', unit: 'Brisbane' })}
${emailCta({ href: portalUrl, label: 'Complete check-in' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Check-in closes in 1 hour',
    html: darkEmailShell(inner, { previewText: `${FIRST}, last hour to lock in this week's check-in.` }),
  })
}

// 5. Medical clearance required (amber accent)
{
  const portalUrl = `${APP}/portal/${SAMPLE_TOKEN}/medical-clearance`
  const inner = `
${emailLogo()}
${emailEyebrow('Medical Clearance', '#B7791F')}
${emailHeading('One step before we start coaching.')}
${emailDivider('#B7791F')}
${emailBody(`Hi ${FIRST},`)}
${emailBody('Your health declaration is in. Thanks for the detail.')}
${emailBody('One of your answers means we need a GP sign-off before coaching starts. This is a routine duty-of-care step, not a flag against you.', { bottom: 20 })}
${emailFeaturedCard(
  emailNumberedList([
    'Download the form (one page, pre-filled with your name)',
    'See your GP and have them sign it',
    'Upload the signed form back to your portal',
  ]),
  { eyebrow: 'Three steps on your Medical Clearance card' },
)}
${emailBody("The moment it lands I'll review and approve. Once approved, your Foundational Intake unlocks and we keep moving.", { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my portal', bg: '#B7791F' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${emailBody('Any questions, reply to this email.', { size: 14, bottom: 0 })}
${darkEmailSignature()}
`
  previews.push({
    subject: `[PREVIEW] ${FIRST}, one step before we start coaching`,
    html: darkEmailShell(inner, { previewText: `${FIRST}, one duty-of-care step before we start coaching.` }),
  })
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY missing.')
    process.exit(1)
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  console.log(`Sending ${previews.length} Phase 3a previews to kade@bodyrecode.au...`)
  for (const p of previews) {
    const result = await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: p.subject,
      html: p.html,
    })
    console.log(`  ${p.subject}`)
    console.log(`    → ${result.data?.id ?? 'NO ID'}`)
    if (result.error) console.error('    error:', result.error)
    await new Promise(r => setTimeout(r, 600))
  }
  console.log('\nDone.')
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
