// Phase 3c previews: representative Blueprint week-advance steps +
// representative Re-engagement steps. Each replicates the live composition
// with mock data so Kade can verify rendering before the real drip fires.
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-phase3c-emails.ts

import { Resend } from 'resend'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList, emailStatusCard,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'

const FIRST = 'Sample'
const portalUrl = 'https://bodyrecode.au/blueprint/preview-token-1234'
const extensionUrl = 'https://app.bodyrecode.au/extension'
const membershipUrl = 'https://app.bodyrecode.au/membership'

const previews: Array<{ subject: string; html: string }> = []

// Blueprint week-advance — wrap with the same pattern callout the live shell uses
function wrapBlueprint(body: string, patternLabel: string, patternColour: string, patternCallout: string): string {
  const patternBlock = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid ${patternColour};margin:24px 0 0;">
        <tr>
          <td style="padding-left:16px;">
            <p style="font-size:11px;font-weight:700;color:${patternColour};letter-spacing:0.12em;text-transform:uppercase;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${patternLabel}</p>
            <p style="font-size:13px;color:#4A4A4A;line-height:1.7;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${patternCallout}</p>
          </td>
        </tr>
      </table>`
  return darkEmailShell(`${emailLogo()}${body}${patternBlock}${darkEmailSignature()}`)
}

// Blueprint Week 1
previews.push({
  subject: `[PREVIEW · Blueprint · Week 1] Week 1 starts today, ${FIRST}`,
  html: wrapBlueprint(`
${emailEyebrow('Week 1 · Regulate')}
${emailHeading('Re-establish biological rhythm.')}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('Your six-week programme starts today. The first two weeks are called the Regulate phase — and the goal is simple: re-establish biological rhythm.')}
${emailBody('This week is not about pushing hard. It is about removing the inputs that have been keeping your system in a stressed state and replacing them with a structure your body can actually respond to. Consistent meals, controlled training intensity, prioritised sleep.')}
${emailBody('Your first education lesson — Cortisol and the Stress Response — is now unlocked in your portal. It explains the biology behind why this phase is designed the way it is. Worth reading before your first session.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open your portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
`,
    'Stress-Stored', '#DC2626',
    'Your cortisol curve is the target this week. Eat breakfast within an hour of waking, never train fasted, and keep caffeine before noon. Every one of these rules is directly lowering the cortisol load your body is carrying.',
  ),
})

// Blueprint Week 3 (midpoint)
previews.push({
  subject: `[PREVIEW · Blueprint · Week 3] ${FIRST} - you are at the midpoint`,
  html: wrapBlueprint(`
${emailEyebrow('Week 3 · Adapt Phase Begins')}
${emailHeading('Progressive load starts now.')}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('Three weeks in. You have moved through the full Regulate phase and the Adapt phase starts this week. Progressive load begins — your training intensity target increases and the sessions will ask more of you.')}
${emailBody('Your Week 3 education lesson — Testosterone and Muscle Signal — is now unlocked. It covers why training harder and eating less are two of the most reliable ways to suppress the hormone responsible for body composition change, and what actually drives it instead.')}
${emailBody('This is also a good week to submit your check-in if you have not already. Eight markers, two minutes. It gives you a clear picture of what has shifted since Week 1.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Submit your check-in' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
`,
    'Insulin-Drift', '#B7791F',
    'Improving insulin sensitivity reduces aromatase activity, which increases testosterone availability. The Session B finisher is now your most important metabolic tool. Do not skip it.',
  ),
})

// Blueprint Week 6 (final)
previews.push({
  subject: `[PREVIEW · Blueprint · Week 6] Final week, ${FIRST}. What comes next.`,
  html: wrapBlueprint(`
${emailEyebrow('Week 6 · Embed and Deload')}
${emailHeading('Final week — adaptations land here.')}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('Final week. This is a deload week — training volume drops by 30 percent, intensity stays controlled, and nutrition stays exactly the same. The body makes its biggest adaptations when load drops and recovery takes over.')}
${emailBody('Take some time this week to compare where you are now with where you started. Energy through the day. Sleep quality. Afternoon crashes. Hunger between meals. Training recovery. These are the markers that the programme targets first, and after six weeks of consistent work they should look different to Week 1.')}
${emailBody('The 6-Week Blueprint was Stage 2. What you have built here is the hormonal foundation that makes Stage 3 possible. Your portal will show you what comes next.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'See what comes next' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
`,
    'Estrogen-Shift', '#8b5cf6',
    'Restriction and overtraining were driving your pattern. Six weeks of adequacy and consistency has been correcting the hormonal imbalance at the root. The physical changes may still be arriving — they often lag the hormonal changes by two to three weeks.',
  ),
})

// Re-engagement Day 3
{
  const patternNote = ' Your Stress-Stored pattern doesn\'t reset when you stop - it\'s still there when you come back.'
  const inner = `
${emailLogo()}
${emailEyebrow('Checking In')}
${emailHeading(`How is it going, ${FIRST}?`)}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody(`You completed the 6-Week Blueprint a few days ago. I wanted to check in and see how things are going.`)}
${emailBody(`The work you put in doesn't disappear the moment a programme ends.${patternNote}`)}
${emailBody(`If the timing wasn't right, or life got in the way, that's fine. There's no pressure here. But if you've been thinking about what's next, I want to make sure you know the door is still open.`)}
${emailBody("Reply to this email if you want to talk through where you're at. I read every reply.", { size: 14 })}
${darkEmailSignature()}
`
  previews.push({
    subject: `[PREVIEW · Re-engagement · Day 3] Checking in, ${FIRST}`,
    html: darkEmailShell(inner),
  })
}

// Re-engagement Day 30 (re-entry offer with status card)
{
  const inner = `
${emailLogo()}
${emailEyebrow('90-Day Extension')}
${emailHeading('A lower-commitment way back in.')}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody("If the weekly membership commitment felt like too much right now, there's another option.", { bottom: 24 })}
${emailStatusCard({
  eyebrow: '90-Day Body Rewire Extension',
  headline: '$197 one-time',
  body: "12 weeks of progressive pattern-specific programming. No subscription, no ongoing commitment. Same portal, same pattern-driven training and nutrition you've already experienced.",
})}
${emailCta({ href: extensionUrl, label: 'See the Extension' })}
${emailUrlFallback(extensionUrl, 'Or paste this link into your browser')}
${emailBody("Not ready yet? That's fine. I'll check back in.", { size: 14 })}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW · Re-engagement · Day 30] A lower-commitment way back in',
    html: darkEmailShell(inner),
  })
}

// Re-engagement Day 60 (membership with featured card list)
{
  const inner = `
${emailLogo()}
${emailEyebrow('Body Recode Membership')}
${emailHeading('The membership is still open.')}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody("If you've been thinking about the full membership, here's the short version of what it is:")}
${emailFeaturedCard(
  emailNumberedList([
    'Progressive 6-week training blocks built around your pattern — Block A, B, and C',
    'Nutrition precision layer updated each block',
    'Monthly coach Loom — I review your check-in data and send a personal response',
    'Monthly group Q&amp;A call',
    'Cancel anytime. No lock-in.',
  ]),
  { eyebrow: '$49 per week' },
)}
${emailCta({ href: membershipUrl, label: 'See the Membership' })}
${emailUrlFallback(membershipUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  previews.push({
    subject: '[PREVIEW · Re-engagement · Day 60] The membership is still open',
    html: darkEmailShell(inner),
  })
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY missing.')
    process.exit(1)
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  console.log(`Sending ${previews.length} Phase 3c previews to kade@bodyrecode.au...`)
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
