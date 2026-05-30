// Preview the Day 14 Result Reveal email (the completed-Check-In branch
// of the new Day 14 step in inngest-functions.ts). Replicates the live
// email composition with sample data (firstName Kade, Stress-Stored
// pattern, 6/8 progress score).
//
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-day14-result-reveal-email.ts

import { Resend } from 'resend'
import {
  darkEmailShell,
  emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailStatusCard, emailUrlFallback,
} from '../src/lib/email-shell'
import { CHECKIN_PATTERNS } from '../src/lib/checkin-patterns'

const FIRST = 'Kade'
const PATTERN_SLUG = 'stress-stored'
const PROGRESS_SCORE = 6 // out of 8

function challengeEmailShell(body: string): string {
  return darkEmailShell(body)
}

function buildResultRevealBlock(patternSlug: string, progressScore: number): string {
  const p = CHECKIN_PATTERNS[patternSlug]
  if (!p) return ''
  const progressPercent = Math.round((progressScore / 8) * 100)
  return `
<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-left:3px solid #1B6DFC;border-radius:14px;padding:24px 26px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:#1056D6;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    Your 7-Day Progress
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
    <tr>
      <td style="vertical-align:baseline;padding:0;">
        <span style="font-size:52px;font-weight:900;color:#1B6DFC;letter-spacing:-0.04em;line-height:1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${progressScore}</span>
      </td>
      <td style="vertical-align:baseline;padding:0 0 0 14px;">
        <span style="font-size:15px;font-weight:600;color:#4A4A4A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">of 8 markers<br/>improving</span>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px;">
    <tr>
      <td bgcolor="#E5E5E5" style="background:#E5E5E5;height:8px;line-height:0;border-radius:99px;">
        <table cellpadding="0" cellspacing="0" border="0" width="${progressPercent}%">
          <tr><td bgcolor="#1B6DFC" style="background:#1B6DFC;height:8px;line-height:0;border-radius:99px;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
  </table>
  <p style="font-size:14px;color:#4A4A4A;margin:0;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    ${progressScore >= 6
      ? 'Strong first week. This is what your body has done across the first seven days of the reset, and it set the baseline that the second week has been consolidating.'
      : progressScore >= 4
      ? 'Solid first-week progress. The markers that had not shifted yet at the Check-In often follow as the rhythm carries forward.'
      : 'Your body was still finding its baseline at the Check-In. The shifts continue as you carry the rhythm forward.'}
  </p>
</div>

<div style="background:#FFFFFF;border:1px solid ${p.color}25;border-left:3px solid ${p.color};border-radius:14px;padding:24px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:${p.color};letter-spacing:0.14em;text-transform:uppercase;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    Your Biological Pattern
  </p>
  <p style="font-size:21px;font-weight:800;color:#1A1A1A;margin:0 0 14px;letter-spacing:-0.01em;line-height:1.2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    ${p.label}
  </p>
  <p style="font-size:14px;color:#4A4A4A;line-height:1.75;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    ${p.desc}
  </p>
</div>

<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:14px;padding:24px;margin:0 0 24px;">
  <p style="font-size:11px;font-weight:700;color:#1B6DFC;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    What to focus on going forward
  </p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${p.actions.map((action, i) => `
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:28px;">
          <span style="font-size:11px;font-weight:800;color:${p.color};font-family:monospace;">${String(i + 1).padStart(2, '0')}</span>
        </td>
        <td style="padding:8px 0;font-size:14px;color:#4A4A4A;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${action}</td>
      </tr>
    `).join('')}
  </table>
</div>
`
}

async function main() {
  const resultRevealBlock = buildResultRevealBlock(PATTERN_SLUG, PROGRESS_SCORE)

  const html = challengeEmailShell(`
${emailEyebrow('Day 14 · Challenge complete + Result reveal')}
${emailHeading(`Your Body Decode result, ${FIRST}.`)}
${emailDivider()}
${emailBody(`Hi ${FIRST},`)}
${emailBody('You finished the 14 days. Here is what your body has been doing, the pattern your biology has settled into, and what comes next.')}
${resultRevealBlock}
${emailBody('This is your baseline now. The question is: what do you build on top of it?')}
${emailBody('Your pattern (above) is the answer. The next dose is correction. The 6-Week Body Rewire Blueprint takes the pattern you have just had read and runs six weeks of focused, pattern-specific corrective work. Training calibrated. Nutrition timed. Weekly coaching written for your pattern.', { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'Next step',
  headline: '6-Week Body Rewire Blueprint',
  body: 'Six weeks of pattern-specific corrective work. $97 one-time. Your pattern carries through from the Challenge into Week 1.',
})}
${emailCta({ href: 'https://bodyrecode.au/blueprint?source=challenge_day14_ascension', label: 'Start the 6-Week Blueprint · $97' })}
${emailUrlFallback('https://bodyrecode.au/blueprint?source=challenge_day14_ascension', 'Or paste this link into your browser')}
${emailBody('Or just reply to this email and I will personally help you figure out the right next step.', { size: 14, bottom: 0 })}
`)

  const resend = new Resend(process.env.RESEND_API_KEY)

  const sent = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: `[PREVIEW] ${FIRST}, your Day 14 result + what's next`,
    html,
  })

  if (sent.error) {
    console.error('Send error:', sent.error)
    process.exit(1)
  }

  console.log('[PREVIEW] Day 14 Result Reveal email sent to kade@bodyrecode.au')
  console.log('  Sample data: firstName =', FIRST, '| pattern =', PATTERN_SLUG, '| progressScore =', PROGRESS_SCORE, '/ 8')
  console.log('  Resend id:', sent.data?.id)
}

main().catch(err => {
  console.error('Preview send failed:', err)
  process.exit(1)
})
