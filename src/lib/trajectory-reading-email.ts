import { darkEmailSignature } from './email-signature'
import { emailUrlFallback } from './email-shell'
import { logoUrl } from '@/config/tenant'

export interface TrajectoryReadingEmailParams {
  firstName: string
  blockName: string
  portalUrl: string
}

export function buildTrajectoryReadingEmail({
  firstName,
  blockName,
  portalUrl,
}: TrajectoryReadingEmailParams): { subject: string; html: string } {
  const subject = `${firstName}, your block-end reading is ready`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="${logoUrl()}" width="140" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#6B6B6B;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:0 0 14px;">Block-End Reading</p>
              <p style="color:#1A1A1A;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;margin:0 0 18px;">
                You have closed a block, ${escapeHtml(firstName)}.
              </p>
              <p>You have finished ${escapeHtml(blockName)}. Your block-end reading is now in your portal: the step back from the week-to-week, reading how your signal moved across the whole block, what held steady, and what this sets up next.</p>
              <p>It reads your weekly check-ins as one arc, not one week at a time. A minute with it is worth it before the next block begins.</p>
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:10px;">
                    <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                      Read your block-end reading
                    </a>
                  </td>
                </tr>
              </table>
              ${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
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
