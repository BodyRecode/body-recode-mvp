import { darkEmailSignature } from './email-signature'

export interface PortalOrientationEmailParams {
  firstName: string
  portalUrl: string
}

/**
 * Portal Orientation email. Fires automatically when the client submits their
 * baseline (last onboarding step), so they have time to read through the portal
 * while the coach builds their program.
 *
 * Includes 3 PIL-rendered mockups (saved at /public/email-assets/) showing the
 * portal landing, Resources hub, and Foundational Reading layout.
 *
 * Visual tour:
 *   1. Portal landing (Welcome screen, weekly check-in / reading / resources cards)
 *   2. Resources hub (the 6-card menu)
 *   3. Foundational Reading (cream/black premium deliverable)
 */
export function buildPortalOrientationEmail({
  firstName,
  portalUrl,
}: PortalOrientationEmailParams): { subject: string; html: string } {
  const subject = `${firstName}, your coaching portal is set up`

  // Public asset URLs. The email client fetches these from production.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bodyrecode.au'
  const img = (slug: string) => `${baseUrl}/email-assets/${slug}.png`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:600px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="140" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#a8a29e;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#14b8a6;text-transform:uppercase;margin:0 0 14px;">Portal Orientation</p>
              <p style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;margin:0 0 18px;">
                ${escapeHtml(firstName)}, your coaching portal is set up.
              </p>

              <p style="margin:0 0 16px;">Your baseline has been received. While I build your program over the next few days, you have time to get to know your portal. This is going to be your home base for everything from here.</p>
              <p style="margin:0 0 24px;">Here is what is in it.</p>

              <!-- Section 1: Portal landing -->
              <p style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:#ffffff;text-transform:uppercase;margin:32px 0 12px;">01 · Your Portal Home</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
                <tr>
                  <td>
                    <img src="${img('portal-landing')}" alt="Portal home page mockup" width="520" style="display:block;width:100%;max-width:520px;border-radius:12px;border:1px solid #1c1917;" />
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;">When you sign in, you land here. The page is split into sections so you always know what is current.</p>
              <ul style="padding-left:18px;margin:0 0 16px;color:#a8a29e;">
                <li style="margin-bottom:6px;"><strong style="color:#ffffff;">This week</strong>: your weekly check-in (when the window is open) or a status note when it is not</li>
                <li style="margin-bottom:6px;"><strong style="color:#ffffff;">Your reading</strong>: your Foundational Reading appears here once it is ready</li>
                <li style="margin-bottom:6px;"><strong style="color:#ffffff;">Resources</strong>: the all-in-one menu shown next</li>
              </ul>

              <!-- Section 2: Resources hub -->
              <p style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:#ffffff;text-transform:uppercase;margin:32px 0 12px;">02 · Resources</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
                <tr>
                  <td>
                    <img src="${img('portal-resources')}" alt="Portal resources hub mockup" width="520" style="display:block;width:100%;max-width:520px;border-radius:12px;border:1px solid #1c1917;" />
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;">Six cards, one for each thing you might need beyond your weekly check-in and program:</p>
              <ul style="padding-left:18px;margin:0 0 16px;color:#a8a29e;">
                <li style="margin-bottom:6px;"><strong style="color:#ffffff;">Your progress</strong>: measurements over time, side by side with your starting baseline</li>
                <li style="margin-bottom:6px;"><strong style="color:#ffffff;">Your readings</strong>: every Foundational Reading we generate for you, current and archived</li>
                <li style="margin-bottom:6px;"><strong style="color:#ffffff;">Glossary</strong>: plain-language definitions of every term you hear from me. RPE, body state, regulation, recovery margin, all of it</li>
                <li style="margin-bottom:6px;"><strong style="color:#ffffff;">Practical guides</strong>: short, actionable. Sleep hygiene, stress regulation, pre-session prep, post-session recovery, weekly structure</li>
                <li style="margin-bottom:6px;"><strong style="color:#ffffff;">Message your coach</strong>: a non-urgent message form. I reply by email. For anything urgent, the WhatsApp link is at the bottom of the portal</li>
                <li style="margin-bottom:0;"><strong style="color:#ffffff;">Account and service</strong>: update your contact details, request a pause, refer a friend, download all your data</li>
              </ul>

              <!-- Section 3: Foundational Reading -->
              <p style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:#ffffff;text-transform:uppercase;margin:32px 0 12px;">03 · Your Foundational Reading</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
                <tr>
                  <td>
                    <img src="${img('portal-reading')}" alt="Foundational Reading layout mockup" width="520" style="display:block;width:100%;max-width:520px;border-radius:12px;border:1px solid #1c1917;" />
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;">Your Foundational Reading is a structured read of how your body is currently organising itself, derived from the intake you completed. Five sections: where you are right now, what your body is telling us, what we are focusing on first, what we are not doing yet, and a note from me. It is not a verdict. It is the starting position we build from. You will get a separate email when it is ready.</p>

              <!-- Section 4: How to sign in + bookmark reminder -->
              <p style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:#ffffff;text-transform:uppercase;margin:32px 0 12px;">04 · How to sign in</p>
              <p style="margin:0 0 14px;">Open the link below and enter your email. You will get a 6-digit code by email. No password to set or remember.</p>
              <p style="margin:0 0 14px;background:#0c0a09;border:1px solid #1c1917;border-radius:10px;padding:14px 16px;color:#d4cfc9;font-size:14px;">
                <strong style="color:#ffffff;">Bookmark the page once you are in.</strong> The portal is your home base for everything from here. No password to remember, but bookmarking it means one less email-and-code cycle every time.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
                <tr>
                  <td bgcolor="#14b8a6" style="background-color:#14b8a6;border-radius:10px;">
                    <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#0c0a09;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">Open my portal</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#57534e;margin:8px 0 0;">Or copy the link directly: ${portalUrl}</p>

              <!-- Section 5: Personal close -->
              <p style="margin:32px 0 16px;">Take a few days to read through it. There is no rush. The portal is built to be discovered slowly.</p>
              <p style="margin:0;">When your program is ready, I will let you know and the next phase begins.</p>

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
