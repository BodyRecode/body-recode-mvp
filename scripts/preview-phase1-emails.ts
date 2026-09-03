// Send [PREVIEW] copies of the 6 Phase 1 migrated emails to Kade so he can
// verify the new design language across the highest-touch templates.
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-phase1-emails.ts
//
// Each preview is composed using the SAME helpers and shape as the live
// route, with realistic mock data. If the live route's composition is
// later edited, this script needs the matching edit — there's no automatic
// drift detection.

import { Resend } from 'resend'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList, emailStatusCard,
  EMAIL_BLUE_BG, EMAIL_BLUE_BORDER, EMAIL_BLUE_DARK,
  EMAIL_GRAPHITE, EMAIL_MUTED, EMAIL_FF, EMAIL_MONO,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'

const APP = 'https://app.bodyrecode.au'
const FIRST_NAME = 'Sample'
const FULL_NAME = 'Sample Client'
const SAMPLE_EMAIL = 'sample.client@example.com'
const SAMPLE_TOKEN = 'preview-token-1234567890abcdef'
const SAMPLE_LEAD_ID = 'preview-lead-id'

const previews: Array<{ subject: string; html: string }> = []

// 1. Sign-in code (OTP)
{
  const code = '482917'
  const CODE_TTL_MINUTES = 10
  const codeBlock = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${EMAIL_BLUE_BG}" style="background-color:${EMAIL_BLUE_BG};margin:0 0 24px;">
        <tr>
          <td bgcolor="${EMAIL_BLUE_BG}" align="center" style="background-color:${EMAIL_BLUE_BG};padding:28px 24px;border:1px solid ${EMAIL_BLUE_BORDER};border-radius:12px;">
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${EMAIL_BLUE_DARK};letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FF};">Your sign-in code</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:${EMAIL_GRAPHITE};letter-spacing:0.4em;font-family:${EMAIL_MONO};">${code}</p>
          </td>
        </tr>
      </table>`
  const inner = `
${emailLogo()}
${emailEyebrow('Portal Sign-in')}
${emailHeading('Enter this code to sign in.')}
${emailDivider()}
${emailBody('Enter the code below on the sign-in page to access your Body Recode coaching portal.')}
${codeBlock}
${emailBody(`This code expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, you can safely ignore it.`, { color: EMAIL_MUTED, size: 13, bottom: 16 })}
${emailUrlFallback(`${APP}/portal/login`, 'Sign-in page')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Your Body Recode sign-in code',
    html: darkEmailShell(inner, { previewText: `Your Body Recode sign-in code: ${code}` }),
  })
}

// 2. Foundational Intake invite
{
  const intakeUrl = `${APP}/intake/${SAMPLE_TOKEN}`
  const inner = `
${emailLogo()}
${emailEyebrow('Foundational Intake')}
${emailHeading(`${FIRST_NAME}, your intake is ready.`)}
${emailDivider()}
${emailBody(`Hi ${FIRST_NAME},`)}
${emailBody('Before we begin, I need you to complete your foundational intake. This is how I build an accurate picture of where you are starting from: your training history, recovery patterns, stress load, sleep, and lifestyle.')}
${emailBody('It takes around 15 to 20 minutes and there are no right or wrong answers. Just answer based on your typical experience, not your best or worst days. This intake forms the foundation of everything we do together, so take your time with it.', { bottom: 28 })}
${emailCta({ href: intakeUrl, label: 'Complete my intake' })}
${emailUrlFallback(intakeUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  previews.push({
    subject: `[PREVIEW] ${FIRST_NAME}, your Body Recode intake is ready`,
    html: darkEmailShell(inner, { previewText: `${FIRST_NAME}, your foundational intake is ready.` }),
  })
}

// 3. Weekly check-in window opens
{
  const portalUrl = `${APP}/portal/${SAMPLE_TOKEN}`
  const inner = `
${emailLogo()}
${emailEyebrow('Weekly Check-In')}
${emailHeading('Your weekly check-in is open.')}
${emailDivider()}
${emailBody(`Hi ${FIRST_NAME},`)}
${emailBody('Your weekly check-in window is now open in your portal. Complete it before Sunday 6pm Brisbane time so I can review your data and update your program for the week ahead.', { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'Window closes',
  headline: 'Sunday 6pm Brisbane',
  body: 'Submissions after this point roll forward to next week. Aim for Friday or Saturday if your schedule allows.',
})}
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Your weekly check-in is now open',
    html: darkEmailShell(inner, { previewText: `${FIRST_NAME}, your weekly check-in is open until Sunday 6pm.` }),
  })
}

// 4. Welcome (post-payment)
{
  const portalUrl = `${APP}/portal/${SAMPLE_TOKEN}`
  const guideUrl = `${APP}/coaching-guide`
  const inner = `
${emailLogo()}
${emailEyebrow('Welcome to Body Recode')}
${emailHeading(`You're officially in, ${FIRST_NAME}.`)}
${emailDivider()}
${emailBody(`Hi ${FIRST_NAME},`)}
${emailBody('Your commencement fee has been received. Your client portal is ready.')}
${emailBody(`Open the link below and sign in with this email address (${SAMPLE_EMAIL}). You'll get a 6-digit code by email — no password to set or remember.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${emailFeaturedCard(
  emailNumberedList([
    'Coaching Agreement',
    'Health Declaration',
    'Foundational Intake (230 questions across 8 areas, 15-20 min)',
    'Baseline Documentation (photos and measurements)',
  ]),
  { eyebrow: 'Inside the portal, work through' },
)}
${emailBody('Take your time with the intake — it is the foundation of everything I do with you. Answer based on your typical experience, not your best or worst days.')}
${emailBody(`While you're getting set up, read through your <a href="${guideUrl}" style="color:#1B6DFC;font-weight:600;text-decoration:none;">Active Coaching Client Guide</a> (also linked inside your portal). It covers how the coaching process works, what to expect each week, and how we build progress together.`)}
${emailBody('Looking forward to getting started.')}
${darkEmailSignature()}
`
  previews.push({
    subject: `[PREVIEW] Welcome to Body Recode, ${FIRST_NAME}`,
    html: darkEmailShell(inner, { previewText: `Welcome ${FIRST_NAME} — your portal is ready.` }),
  })
}

// 5. Payment received (coach notification)
{
  const coachInner = `
${emailLogo()}
${emailEyebrow('Payment Received')}
${emailHeading(`${FULL_NAME} just paid.`)}
${emailDivider()}
${emailBody(`Commencement fee confirmed. The welcome email and intake link have been sent to ${SAMPLE_EMAIL}.`)}
${emailStatusCard({
  eyebrow: 'Next step',
  headline: 'Wait for intake completion',
  body: `${FULL_NAME} now has portal access and will start the onboarding flow: agreement → health declaration → 230-question intake → baseline. You will be notified as each step lands.`,
})}
${emailCta({ href: `${APP}/dashboard/leads/${SAMPLE_LEAD_ID}`, label: 'View lead' })}
${darkEmailSignature()}
`
  previews.push({
    subject: `[PREVIEW] Payment received - ${FULL_NAME}`,
    html: darkEmailShell(coachInner, { previewText: `${FULL_NAME} paid the commencement fee.` }),
  })
}

// 6. Scorecard report delivery
{
  const reportUrl = `${APP}/report/${SAMPLE_TOKEN}`
  const reportInner = `
${emailLogo()}
${emailEyebrow('Body Decode Report')}
${emailHeading('Your report is ready.')}
${emailDivider()}
${emailBody(`Hi ${FIRST_NAME},`)}
${emailBody('Your Body Decode Report is ready. It breaks down what your scorecard results mean, what your body state tells us, what is actively working against you right now, and what to focus on first.', { bottom: 28 })}
${emailCta({ href: reportUrl, label: 'View my report' })}
${emailUrlFallback(reportUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW] Your Body Decode Report is ready',
    html: darkEmailShell(reportInner, { previewText: `${FIRST_NAME}, your Body Decode Report is ready.` }),
  })
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY missing.')
    process.exit(1)
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  console.log(`Sending ${previews.length} previews to kade@bodyrecode.au...`)
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
    // Resend rate limit is 2 req/s on the default plan — add a brief gap.
    await new Promise(r => setTimeout(r, 600))
  }
  console.log('\nDone.')
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
