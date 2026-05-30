// Preview the Day 7 Body Decode Check-In result email.
// Replicates the live email composition from src/app/api/challenge/quiz/route.ts
// with sample data (Stress-Stored pattern, 6/8 progress score, firstName "Kade").
//
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/preview-day7-checkin-email.ts

import { Resend } from 'resend'
import { darkEmailSignature } from '../src/lib/email-signature'

const FIRST = 'Kade'
const PATTERN_SLUG = 'stress-stored'
const PROGRESS_SCORE = 6 // out of 8

const PATTERNS: Record<string, { label: string; desc: string; color: string; actions: string[] }> = {
  'stress-stored': {
    label: 'Stress-Stored Pattern',
    color: '#DC2626',
    desc: 'Your body is storing and retaining in response to a chronic stress load. Cortisol and adrenaline are keeping your system in a state of low-grade alert, which signals your body to hold fat around the midsection as an energy reserve. The reset you have done this week is directly targeting this. The full picture requires understanding exactly how your stress hormones are behaving across the day.',
    actions: [
      'Sleep is your highest leverage point. Cortisol resets overnight. Prioritise sleep quality above everything else this week.',
      'Keep training intensity moderate. Hard sessions spike cortisol further and can slow progress in this pattern.',
      'Eat breakfast within 60 minutes of waking. This supports your morning cortisol curve and begins the process of hormonal regulation for the day.',
    ],
  },
}

function emailShell(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#999999;">
              ${body}
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`
}

async function main() {
  const p = PATTERNS[PATTERN_SLUG]
  const html = emailShell(`
    <p style="color:#1A1A1A;font-size:20px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;">
      Your Body Decode Check-In
    </p>
    <p>Hi ${FIRST},</p>
    <p>You completed the Day 7 Body Decode Check-In. Here is your result.</p>

    <div style="background:#FFFFFF;border:1px solid #2a2826;border-radius:12px;padding:18px 22px;margin:20px 0;">
      <p style="font-size:11px;font-weight:700;color:#999999;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">Your 7-Day Progress</p>
      <p style="font-size:28px;font-weight:900;color:#1B6DFC;margin:0 0 4px;letter-spacing:-0.02em;">${PROGRESS_SCORE}<span style="font-size:15px;font-weight:500;color:#999999;letter-spacing:0;"> of 8 markers improving</span></p>
      <p style="font-size:13px;color:#999999;margin:0;line-height:1.6;">
        ${PROGRESS_SCORE >= 6
          ? 'Strong week. Your system is responding well to the structure.'
          : PROGRESS_SCORE >= 4
          ? 'Solid progress. The markers that have not shifted yet will often follow in week two.'
          : 'Your body is still adjusting. Week two is typically where the clearer shifts happen.'}
      </p>
    </div>

    <div style="background:#FFFFFF;border:1px solid ${p.color}25;border-left:3px solid ${p.color};border-radius:12px;padding:20px 24px;margin:20px 0;">
      <p style="font-size:11px;font-weight:700;color:${p.color};letter-spacing:0.1em;text-transform:uppercase;margin:0 0 6px;">Your Biological Pattern</p>
      <p style="font-size:19px;font-weight:800;color:#1A1A1A;margin:0 0 14px;letter-spacing:-0.01em;line-height:1.2;">${p.label}</p>
      <p style="font-size:14px;color:#6B6B6B;line-height:1.75;margin:0;">${p.desc}</p>
    </div>

    <p style="color:#1A1A1A;font-size:15px;font-weight:700;margin:24px 0 12px;">What to focus on this week</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${p.actions.map((action, i) => `
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:28px;">
            <span style="font-size:11px;font-weight:800;color:${p.color};font-family:monospace;">${String(i + 1).padStart(2, '0')}</span>
          </td>
          <td style="padding:8px 0;font-size:14px;color:#6B6B6B;line-height:1.65;">${action}</td>
        </tr>
      `).join('')}
    </table>

    <div style="background:#B5CFFC;border:1px solid rgba(27,109,252,0.2);border-radius:12px;padding:20px 24px;margin:24px 0;">
      <p style="font-size:14px;color:#1A1A1A;line-height:1.7;margin:0 0 16px;">
        You have read your pattern. The next dose is correction. The 6-Week Body Rewire Blueprint takes the pattern you have just identified and runs six weeks of focused, pattern-specific corrective work. Training calibrated. Nutrition timed. Weekly coaching written for your pattern.
      </p>
      <a href="https://bodyrecode.au/blueprint?source=challenge_day7_result" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#1B6DFC;color:#FFFFFF;font-size:13px;font-weight:700;text-decoration:none;">
        Start the 6-Week Blueprint · $97
      </a>
    </div>

    <p>Keep going. Week two is where the clearer changes happen.</p>
  `)

  const resend = new Resend(process.env.RESEND_API_KEY)

  const sent = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: `[PREVIEW] Your Day 7 Body Decode Check-In result`,
    html,
  })

  if (sent.error) {
    console.error('Send error:', sent.error)
    process.exit(1)
  }

  console.log('[PREVIEW] Day 7 Check-In result email sent to kade@bodyrecode.au')
  console.log('  Sample data: firstName =', FIRST, '| pattern =', PATTERN_SLUG, '| progressScore =', PROGRESS_SCORE, '/ 8')
  console.log('  Resend id:', sent.data?.id)
}

main().catch(err => {
  console.error('Preview send failed:', err)
  process.exit(1)
})
