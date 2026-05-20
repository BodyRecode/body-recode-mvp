import { darkEmailSignature } from './email-signature'
import { emailUrlFallback } from './email-shell'

export interface WeeklyCheckinFeedbackEmailParams {
  firstName: string
  weekNumber: number
  formType: 'A' | 'B'
  interpretation: string
  reframe: string | null
  nextFocus: string
  checkinUrl: string
}

export function buildWeeklyCheckinFeedbackEmail({
  firstName,
  weekNumber,
  formType,
  interpretation,
  reframe,
  nextFocus,
  checkinUrl,
}: WeeklyCheckinFeedbackEmailParams): { subject: string; html: string } {
  const subject = `${firstName}, your Week ${weekNumber} check-in response`

  const reframeBlock = reframe
    ? `
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:28px 0 10px;">Reframe</p>
              <p style="margin:0 0 6px;">${paragraphsToHtml(reframe)}</p>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="140" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#6B6B6B;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:0 0 14px;">Week ${weekNumber} · Form ${formType} response</p>
              <p style="color:#1A1A1A;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;margin:0 0 18px;">
                ${escapeHtml(firstName)}, here is my read on your check-in.
              </p>
              <p>Thanks for completing your check-in. Here is what I am seeing in your signal and what to hold this week.</p>

              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:28px 0 10px;">Interpretation</p>
              <p style="margin:0;">${paragraphsToHtml(interpretation)}</p>
              ${reframeBlock}

              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:28px 0 10px;">This week, hold this</p>
              <p style="margin:0;">${paragraphsToHtml(nextFocus)}</p>

              <table cellpadding="0" cellspacing="0" style="margin:32px 0 8px;">
                <tr>
                  <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:10px;">
                    <a href="${checkinUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                      View in your portal
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#6B6B6B;margin-top:18px;">Your check-in and my response both live in your portal so you can return to them any time.</p>
              ${emailUrlFallback(checkinUrl, 'Or paste this link into your browser')}
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function paragraphsToHtml(input: string): string {
  return escapeHtml(input.trim())
    .split(/\n\s*\n/)
    .map(p => p.replace(/\n/g, '<br />'))
    .join('</p><p style="margin:14px 0 0;">')
}
