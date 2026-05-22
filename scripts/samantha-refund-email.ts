// One-off recovery email for Samantha re: 3 × $149.50 duplicate subscription refunds.
// Default sends a [PREVIEW] copy to kade@bodyrecode.au only.
// Pass --live to send to Samantha (and BCC Kade via COACH_BCC).
//
// Usage:
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/samantha-refund-email.ts
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/samantha-refund-email.ts --live

import { Resend } from 'resend'
import {
  darkEmailShell, COACH_BCC,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailFeaturedCard, emailNumberedList, emailCallout, emailStatusCard,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'

const LIVE = process.argv.includes('--live')

const SUBJECT = LIVE
  ? 'About the duplicate charges on your account'
  : '[PREVIEW] About the duplicate charges on your account'

const TO = LIVE ? 'samantha.arandelovic@mater.org.au' : 'kade@bodyrecode.au'
const BCC = LIVE ? COACH_BCC : undefined

const inner = `
${emailLogo()}
${emailEyebrow('Account update')}
${emailHeading('Three duplicate charges, reversed.')}
${emailDivider()}
${emailBody('Hi Samantha,')}
${emailBody('Our system accidentally created three separate weekly subscriptions for you instead of one when you signed up earlier this month. That meant your card was billed six times in 14 days when it should have been billed three.')}
${emailBody('That is on us and I am sorry for the confusion.', { bottom: 28 })}
${emailFeaturedCard(
  emailNumberedList([
    'Cancelled the two extra subscriptions so no more duplicate charges can hit your card.',
    'Refunded the three duplicate charges in full: 11 May $149.50, 18 May $149.50, 18 May $149.50.',
  ]),
  { eyebrow: 'What I have done today' },
)}
${emailCallout({ eyebrow: 'Total being returned', value: '$448.50', unit: 'AUD' })}
${emailBody('Card refunds normally take 5 to 10 business days to appear on your statement, depending on your bank.', { size: 15 })}
${emailStatusCard({
  eyebrow: 'Your subscription',
  headline: 'Active and uninterrupted.',
  body: 'Your next weekly charge of $149.50 will be on Wednesday 27 May as scheduled. Nothing changes on the coaching side.',
})}
${emailBody('If anything looks off when the refunds land, just hit reply and I will sort it.', { size: 15, bottom: 4 })}
${darkEmailSignature()}
`

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY missing.')
    process.exit(1)
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  console.log(`Mode      : ${LIVE ? 'LIVE (sending to Samantha)' : 'PREVIEW (sending to Kade only)'}`)
  console.log(`Subject   : ${SUBJECT}`)
  console.log(`To        : ${TO}`)
  if (BCC && BCC.length) console.log(`Bcc       : ${BCC.join(', ')}`)

  const html = darkEmailShell(inner, { previewText: 'Three duplicate charges have been reversed. Total returned: $448.50.' })

  const result = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: TO,
    bcc: BCC,
    subject: SUBJECT,
    html,
  })

  console.log('\nResend result:')
  console.log(JSON.stringify(result, null, 2))
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
