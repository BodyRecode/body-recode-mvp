// Phase 3b previews: 15 lead-drip templates (via generate-report.ts) +
// 4 Challenge drip steps fully refactored. Sends one representative
// per builder/step to Kade.
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-phase3b-emails.ts

import { Resend } from 'resend'
import {
  buildFollowUpEmails,
  buildNoShowEmails,
  buildReportFollowUpEmails,
  buildZoom1DeclinedEmails,
  buildProgramBuyerEmails,
} from '../src/lib/generate-report'

const previews: Array<{ subject: string; html: string }> = []

const FIRST = 'Sample'
const BOOKING = 'https://bodyrecode.au/book'
const BODY_STATE = 'Transitioning'

// generate-report.ts: 5 builders × 3 emails each = 15 templates.
// One representative per builder (the strongest first step).

const fu = buildFollowUpEmails(FIRST, BOOKING)
previews.push({ subject: `[PREVIEW · scorecard 5-step · email 1] ${fu.email1.subject}`, html: fu.email1.html })
previews.push({ subject: `[PREVIEW · scorecard 5-step · email 2] ${fu.email2.subject}`, html: fu.email2.html })
previews.push({ subject: `[PREVIEW · scorecard 5-step · email 3] ${fu.email3.subject}`, html: fu.email3.html })

const rfu = buildReportFollowUpEmails(FIRST, BODY_STATE, BOOKING)
previews.push({ subject: `[PREVIEW · report 3-step · email 1] ${rfu.email1.subject}`, html: rfu.email1.html })

const ns = buildNoShowEmails(FIRST, BOOKING)
previews.push({ subject: `[PREVIEW · no-show 3-step · email 1] ${ns.email1.subject}`, html: ns.email1.html })

const dec = buildZoom1DeclinedEmails(FIRST, BOOKING)
previews.push({ subject: `[PREVIEW · declined 3-step · email 1] ${dec.email1.subject}`, html: dec.email1.html })

const pb = buildProgramBuyerEmails(FIRST, BOOKING)
previews.push({ subject: `[PREVIEW · program-buyer · week 4] ${pb.email1.subject}`, html: pb.email1.html })

// Challenge drip — replicate compositions inline with realistic mock data.
// (challengeEmailShell + the helpers compose the same shape in the live code.)
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList, emailStatusCard,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'

const portalUrl = `https://bodyrecode.au/challenge/preview-token`

// Welcome
{
  const inner = `
${emailLogo()}
${emailEyebrow('14-Day Body Decode Challenge')}
${emailHeading(`Welcome in, ${FIRST}.`)}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('You are in. Day 1 starts today.')}
${emailBody('Over the next 14 days you will follow a simple structure designed to calm your system, rebuild your baseline, and help you understand what is actually driving the way your body looks and feels.')}
${emailFeaturedCard(
  emailNumberedList([
    'Your daily coaching note — opens each morning',
    'Your 14-day training plan',
    'Your HABNS nutrition guide',
    'Your morning and evening reset sequences',
    'The Body Decode Check-In — unlocks on Day 7',
  ]),
  { eyebrow: 'Inside your challenge portal' },
)}
${emailBody('Start simple. Follow the structure. Do not try to be perfect on Day 1.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my challenge portal' })}
${emailUrlFallback(portalUrl, 'Bookmark this link — your portal for the full 14 days')}
${darkEmailSignature()}
`
  previews.push({
    subject: `[PREVIEW · challenge · Day 1 welcome] You're in, ${FIRST}. Day 1 starts now.`,
    html: darkEmailShell(inner, { previewText: `Welcome ${FIRST}, Day 1 starts now.` }),
  })
}

// Day 5 zoom invite
{
  const sessionVideoUrl = portalUrl
  const inner = `
${emailLogo()}
${emailEyebrow('Day 5 · Week One Progress')}
${emailHeading('Your Week One session is ready.')}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('You have made it to Day 5. That puts you ahead of most people who started.')}
${emailBody('Your Week One Progress Session is now available to watch. It is a 30-minute session I recorded specifically for this point in the challenge.')}
${emailFeaturedCard(
  emailNumberedList([
    'What your body has actually been doing this week',
    'How to decode the signals you have been feeling — energy, digestion, puffiness, mood',
    'Why rhythm matters more than restriction',
    'What Week 2 is building toward',
    'The next step after the challenge for those who want to go deeper',
  ]),
  { eyebrow: 'In this session' },
)}
${emailBody('I also share the personal story behind how I built this system. Watch it today while you are in the middle of the reset — it will make Week 2 feel much clearer.', { bottom: 28 })}
${emailCta({ href: sessionVideoUrl, label: 'Watch the session (30 min)' })}
${emailUrlFallback(sessionVideoUrl, 'Or find this in your portal under the Live Session section')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW · challenge · Day 5] Day 5 - Your Week One Progress Session is ready',
    html: darkEmailShell(inner, { previewText: `${FIRST}, your Week One session is ready.` }),
  })
}

// Day 14 ascension
{
  const inner = `
${emailLogo()}
${emailEyebrow('Day 14 · Challenge Complete')}
${emailHeading(`14 days done, ${FIRST}.`)}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('You finished the challenge. That is not nothing.')}
${emailBody('Most people who start something like this quit before Day 5. You made it to Day 14. That means your body has had 14 consecutive days of structured rhythm — consistent training, real food, better sleep, predictable timing.')}
${emailFeaturedCard(
  emailNumberedList([
    'Reduced the daily puffiness and inflammation',
    'Stabilised your energy across the day',
    'Calmed the afternoon cravings',
    'Improved your sleep quality',
    'Given your digestion a cleaner baseline',
  ]),
  { eyebrow: 'What that should have done' },
)}
${emailBody('This is your baseline now. The question is: what do you build on top of it?')}
${emailBody('The 6-Week Body Recode Blueprint takes everything you have started and adds structure, progressive training, signal-guided nutrition, and real accountability. It is where the results become visible.', { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'Next step',
  headline: '6-Week Body Recode Blueprint',
  body: 'Where rhythm becomes results. Start with the full Body State Scorecard so I can match the Blueprint to your specific pattern.',
})}
${emailCta({ href: 'https://bodyrecode.au/scorecard', label: 'Take the full Body State Scorecard' })}
${emailUrlFallback('https://bodyrecode.au/scorecard', 'Or paste this link into your browser')}
${emailBody('Or just reply to this email and I will personally help you figure out the right next step.', { size: 14, bottom: 0 })}
${darkEmailSignature()}
`
  previews.push({
    subject: `[PREVIEW · challenge · Day 14] ${FIRST}, you finished the 14 days.`,
    html: darkEmailShell(inner, { previewText: `${FIRST}, 14 days done.` }),
  })
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY missing.')
    process.exit(1)
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  console.log(`Sending ${previews.length} Phase 3b previews to kade@bodyrecode.au...`)
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
