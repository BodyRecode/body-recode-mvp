// One-off: correct the stale launch date in the Blueprint waitlist email Janean
// received (it said "Blueprint opens Monday 20 July", which had passed / moved).
// Warm, owns the mix-up, no new hardcoded date. BCC Kade.
//
// Preview to Kade:  npx tsx scripts/send-janean-correction.ts
// Send to Janean:   npx tsx scripts/send-janean-correction.ts --send

import { Resend } from 'resend'
import { darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody, emailCta, fromCoach } from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'

const JANEAN = 'blackholden_v8@live.com'
const KADE = 'kade@bodyrecode.au'
const SEND = process.argv.includes('--send')
const CHALLENGE_URL = 'https://bodyrecode.au/challenge?source=correction'

const SUBJECT = 'Quick correction, Janean'

const html = darkEmailShell(
  `${emailLogo()}
${emailEyebrow('6-Week Body Rewire Blueprint · waitlist')}
${emailHeading('A quick correction.')}
${emailDivider()}
${emailBody('Hi Janean,')}
${emailBody('The confirmation you just received had an out-of-date line on it: it listed a Blueprint opening date that has since moved. Apologies for the mix-up, that was on my end, not yours.')}
${emailBody('Where things actually stand: you are on the Blueprint waitlist, and I will email you the moment doors open with the link to enrol. There is nothing you need to do between now and then.')}
${emailBody('If you would rather not wait, the free 14-Day Body Decode Challenge is open now, and it is the natural place to start, you can see what your Day 14 read says before the Blueprint even opens.')}
${emailCta({ href: CHALLENGE_URL, label: 'Start the free 14-Day Challenge' })}
${emailBody('Either way, your spot on the Blueprint list is held.')}
${darkEmailSignature()}`,
  { previewText: 'A quick correction on that Blueprint email, and where things actually stand.' },
)

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const to = SEND ? JANEAN : KADE
  const subject = SEND ? SUBJECT : `[PREVIEW] ${SUBJECT}`
  const sent = await resend.emails.send({
    from: fromCoach(),
    to,
    bcc: SEND ? [KADE] : undefined,
    replyTo: KADE,
    subject,
    html,
  })
  if (sent.error) { console.error('Send error:', sent.error); process.exit(1) }
  console.log(SEND ? `SENT to Janean (${to})` : `Preview sent to ${to}`)
  console.log('  From:', fromCoach(), '| BCC:', SEND ? KADE : '(none)')
  console.log('  Resend id:', sent.data?.id)
}

main().catch(e => { console.error(e); process.exit(1) })
