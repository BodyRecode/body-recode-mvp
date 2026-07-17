// One-off: offer Vicki S the available Zoom slots (Tue 21 / Thu 23 July, after 6pm).
//
// Composed with the shared email shell so it carries the branded signature and
// matches the "Got your time request" email she already received from
// kade@send.bodyrecode.au. Reply-to is set so her answer lands in Kade's inbox.
//
// Preview to Kade (default):
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/send-vicki-time-offer.ts
// Send for real to Vicki:
//   ... npx tsx scripts/send-vicki-time-offer.ts --send

import { Resend } from 'resend'
import {
  darkEmailShell,
  emailLogo,
  emailBody,
  emailFeaturedCard,
  fromCoach,
  COACH_BCC,
  EMAIL_GRAPHITE,
  EMAIL_FF,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'

const VICKI = 'dragonkindred@optusnet.com.au'
const KADE = 'kade@bodyrecode.au'
const SEND_FOR_REAL = process.argv.includes('--send')

const SUBJECT = 'Tuesday or Thursday evening, Vicki?'

function slotLine(day: string, times: string): string {
  return `<p style="margin:0 0 6px;font-size:16px;color:${EMAIL_GRAPHITE};line-height:1.6;font-family:${EMAIL_FF};"><strong style="font-weight:800;">${day}</strong> — ${times}</p>`
}

const html = darkEmailShell(
  `${emailLogo(130)}
${emailBody('Hi Vicki,')}
${emailBody('Thanks for sending your times through, and for filling in the pre-call form so thoroughly.')}
${emailBody('Fridays are tough on my end, but your "weekdays after 6pm" works well. Here\'s what I have open, Brisbane time:')}
${emailFeaturedCard(
    `${slotLine('Tuesday 21 July', '6:00pm or 6:45pm')}
${slotLine('Thursday 23 July', '6:00pm or 6:45pm')}`,
    { eyebrow: 'Available slots' },
  )}
${emailBody("Reply with whichever suits and I'll lock it in. It's a 30-minute Zoom call. You'll get the link and a calendar invite straight after I book it.")}
${emailBody("One thing worth saying now: I read what you wrote about the last six months. Given everything your body has been through since January, the fact that effort isn't giving you anything back is not a discipline problem. It's a physiological one, and it's readable. That's what we'll go through on the call.")}
${emailBody('Talk soon,')}
${darkEmailSignature()}`,
  { previewText: 'Tue 21 or Thu 23 July, 6:00pm or 6:45pm — reply and I\'ll lock it in.' },
)

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const to = SEND_FOR_REAL ? VICKI : KADE
  const subject = SEND_FOR_REAL ? SUBJECT : `[PREVIEW] ${SUBJECT}`

  // Coach keeps a copy of manual client sends (house convention: BCC, not CC,
  // so Vicki never sees Kade copying himself).
  const bcc = SEND_FOR_REAL ? COACH_BCC : undefined

  const sent = await resend.emails.send({
    from: fromCoach(),
    to,
    bcc,
    replyTo: KADE,
    subject,
    html,
  })

  if (sent.error) {
    console.error('Send error:', sent.error)
    process.exit(1)
  }

  console.log(SEND_FOR_REAL ? `SENT to Vicki (${to})` : `Preview sent to ${to}`)
  console.log('  Subject:', subject)
  console.log('  From:', fromCoach())
  console.log('  BCC:', bcc ?? '(none - preview)')
  console.log('  Resend id:', sent.data?.id)
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
