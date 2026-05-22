// Phase 4 previews: Membership/Extension week-advance + resend-program-offer +
// the Performance Check-In Report header (the broken-color fix).
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-phase4-emails.ts

import { Resend } from 'resend'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody, emailCta,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'

const FIRST = 'Sample'
const previews: Array<{ subject: string; html: string }> = []

// 1. Membership Block A Week 4 check-in due
{
  const portalUrl = 'https://app.bodyrecode.au/membership/preview-token'
  const block = 'A'
  const completedWeek = 4
  const week = 5
  const inner = `
${emailLogo()}
${emailEyebrow(`Membership · Block ${block} Week ${completedWeek}`)}
${emailHeading(`Block ${block} Week ${completedWeek} check-in is due.`)}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody(`Block ${block} Week ${completedWeek} is complete. Week ${week} is now live in your portal.`)}
${emailBody(`Submit your Week ${completedWeek} check-in before moving on. This is the data that feeds your monthly Loom review — the more consistent the data, the more useful the feedback.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: `Submit Week ${completedWeek} check-in` })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  previews.push({
    subject: `[PREVIEW · Membership · Block A Week 4] Block A Week 4 check-in is due`,
    html: darkEmailShell(inner, { previewText: `${FIRST}, submit your Block A Week 4 check-in.` }),
  })
}

// 2. Membership Block B Week 2 check-in reminder
{
  const portalUrl = 'https://app.bodyrecode.au/membership/preview-token'
  const block = 'B'
  const completedWeek = 2
  const inner = `
${emailLogo()}
${emailEyebrow(`Membership · Block ${block} Week ${completedWeek}`)}
${emailHeading('Your check-in is still outstanding.')}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody(`Your Block ${block} Week ${completedWeek} check-in is still outstanding. This data is what your monthly Loom review is built from — without it, I am working blind.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Submit check-in now' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW · Membership · Block B Week 2 reminder] Reminder: Block B Week 2 check-in not yet submitted',
    html: darkEmailShell(inner, { previewText: `${FIRST}, your Block B Week 2 check-in is overdue.` }),
  })
}

// 3. Extension Week 6 check-in due
{
  const portalUrl = 'https://app.bodyrecode.au/extension/preview-token'
  const completedWeek = 6
  const week = 7
  const inner = `
${emailLogo()}
${emailEyebrow(`90-Day Extension · Week ${completedWeek}`)}
${emailHeading(`Week ${completedWeek} check-in is due.`)}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody(`Extension Week ${completedWeek} is complete. Week ${week} is now live. Submit your check-in before moving on.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: `Submit Week ${completedWeek} check-in` })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW · Extension · Week 6] Extension Week 6 check-in is due',
    html: darkEmailShell(inner, { previewText: `${FIRST}, submit your Extension Week 6 check-in.` }),
  })
}

// 4. resend-program-offer.ts (manual one-off when a Stripe session expires)
{
  const checkoutUrl = 'https://checkout.stripe.com/c/pay/cs_live_preview_session'
  const stateLabel = 'Transitioning'
  const inner = `
${emailLogo()}
${emailEyebrow(`Self-Guided ${stateLabel} Program`)}
${emailHeading('Here is a fresh link.')}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('No hassle at all. Here is a fresh link, valid for the next 24 hours.')}
${emailBody(`Same program, same price. 12 weeks built for ${stateLabel} State. Yours to keep, self-paced.`, { bottom: 28 })}
${emailCta({ href: checkoutUrl, label: `Get the program — $97` })}
${emailUrlFallback(checkoutUrl, 'Or paste this link into your browser')}
${emailBody('If it expires again before you get to it, just reply and I will send another.', { size: 14 })}
${darkEmailSignature()}
`
  previews.push({
    subject: `[PREVIEW · Resend program offer] Re: ${FIRST}, the self-guided ${stateLabel} program - $97`,
    html: darkEmailShell(inner, { previewText: `${FIRST}, fresh ${stateLabel} program link inside.` }),
  })
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY missing.')
    process.exit(1)
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  console.log(`Sending ${previews.length} Phase 4 previews to kade@bodyrecode.au...`)
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
  console.log('\nNote: Performance Check-In Report header + body color bugs fixed in-place (color:#ffffff → #1A1A1A on white) but no [PREVIEW] sent — the email is generated dynamically per-lead via Anthropic API, requires real intake data to render.')
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
