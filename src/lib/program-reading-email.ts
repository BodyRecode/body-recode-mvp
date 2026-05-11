import { darkEmailSignature } from './email-signature'

export interface ProgramReadingEmailParams {
  firstName: string
  blockName: string
  portalUrl: string
}

export function buildProgramReadingEmail({
  firstName,
  blockName,
  portalUrl,
}: ProgramReadingEmailParams): { subject: string; html: string } {
  const subject = `${firstName}, your new training block is ready`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:560px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="140" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#a8a29e;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#14b8a6;text-transform:uppercase;margin:0 0 14px;">Program Reading</p>
              <p style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;margin:0 0 18px;">
                Your new block is ready, ${escapeHtml(firstName)}.
              </p>
              <p>${escapeHtml(blockName)} is live in your portal. Before the sessions, you will find your Program Reading: the read of what this block is for, what it is asking of your body, and how we will know it is working.</p>
              <p>The reading sits at the top of your program page so the why frames every session you open.</p>
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td bgcolor="#14b8a6" style="background-color:#14b8a6;border-radius:10px;">
                    <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#0c0a09;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                      Open your program
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#57534e;">Take a minute to read the framing before your first session. It is short and it sets the lens for the next few weeks.</p>
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
