import { darkEmailSignature } from './email-signature'
import { emailUrlFallback } from './email-shell'

export interface ReadingEmailParams {
  firstName: string
  bodyState: string | null
  portalUrl: string
}

export function buildFoundationalReadingEmail({
  firstName,
  bodyState,
  portalUrl,
}: ReadingEmailParams): { subject: string; html: string } {
  const subject = `${firstName}, your Foundational Reading is ready`

  const stateLine = bodyState
    ? `<p>The reading covers where your body is right now (currently in ${escapeHtml(bodyState)}), what it is signalling, what we are focusing on first, and what we are deliberately not doing yet.</p>`
    : `<p>The reading covers where your body is right now, what it is signalling, what we are focusing on first, and what we are deliberately not doing yet.</p>`

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
              <img src="https://bodyrecode.au/logo-black.png" width="140" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#6B6B6B;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:0 0 14px;">Foundational Reading</p>
              <p style="color:#1A1A1A;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;margin:0 0 18px;">
                Your Foundational Reading is ready, ${escapeHtml(firstName)}.
              </p>
              <p>This is a structured read of how your body is currently organising itself, written from the same intake you completed.</p>
              ${stateLine}
              <p>It is not a verdict and it is not a plan. It is the foundation we will build everything else on, written so you can see exactly where we are starting from.</p>
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:10px;">
                    <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                      Open your reading
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#6B6B6B;">It lives in your portal alongside everything else, so you can return to it any time. You can also download it as a PDF from the top of the page.</p>
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
