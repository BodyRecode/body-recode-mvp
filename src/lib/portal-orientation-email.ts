import { darkEmailSignature } from './email-signature'
import { emailUrlFallback } from './email-shell'
import fs from 'node:fs'
import path from 'node:path'
import { appUrl } from '@/lib/app-url'

export interface PortalOrientationEmailParams {
  firstName: string
  portalUrl: string
}

/**
 * Inlines a public/email-assets/*.png as a base64 data URI so the email
 * doesn't rely on remote image fetching. Bulletproof across every email
 * client: no "show images" prompts, no domain reputation issues, no CSP
 * blocks. Cost is ~170KB across the three mockups, well within email
 * body limits.
 */
function inlinePng(slug: string): string {
  try {
    const file = path.join(process.cwd(), 'public', 'email-assets', `${slug}.png`)
    const buf = fs.readFileSync(file)
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch (e) {
    console.error(`[portal-orientation-email] could not inline ${slug}:`, e)
    const baseUrl = appUrl()
    return `${baseUrl}/email-assets/${slug}.png`
  }
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

  // Inline images as base64 data URIs so they render in every email
  // client without remote-fetch dependencies.
  const img = (slug: string) => inlinePng(slug)

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:600px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="140" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#6B6B6B;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:0 0 14px;">Portal Orientation</p>
              <p style="color:#1A1A1A;font-size:24px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;margin:0 0 18px;">
                ${escapeHtml(firstName)}, your coaching portal is set up.
              </p>

              <p style="margin:0 0 16px;">While I build your program over the next few days, take some time to get to know your portal. This is going to be your home base for everything from here.</p>
              <p style="margin:0 0 24px;">Here is what is in it.</p>

              <!-- Section 1: Portal landing -->
              <p style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:#1A1A1A;text-transform:uppercase;margin:32px 0 12px;">01 · Your Portal Home</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
                <tr>
                  <td>
                    <img src="${img('portal-landing')}" alt="Portal home page mockup" width="520" style="display:block;width:100%;max-width:520px;border-radius:12px;border:1px solid #E5E5E5;" />
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;">When you sign in, you land here. The page is split into sections so you always know what is current.</p>
              <ul style="padding-left:18px;margin:0 0 16px;color:#6B6B6B;">
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">This week</strong>: your weekly check-in (when the window is open) or a status note when it is not</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Your reading</strong>: your Foundational Reading appears here once it is ready</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Resources</strong>: the all-in-one menu shown next</li>
              </ul>

              <!-- Section 2: Resources hub -->
              <p style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:#1A1A1A;text-transform:uppercase;margin:32px 0 12px;">02 · Resources</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
                <tr>
                  <td>
                    <img src="${img('portal-resources')}" alt="Portal resources hub mockup" width="520" style="display:block;width:100%;max-width:520px;border-radius:12px;border:1px solid #E5E5E5;" />
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;">Six cards, one for each thing you might need beyond your weekly check-in and program:</p>
              <ul style="padding-left:18px;margin:0 0 16px;color:#6B6B6B;">
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Your progress</strong>: measurements over time, side by side with your starting baseline</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Your readings</strong>: every Foundational Reading we generate for you, current and archived</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Glossary</strong>: plain-language definitions of every term you hear from me. RPE, body state, regulation, recovery margin, all of it</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Practical guides</strong>: short, actionable. Sleep hygiene, stress regulation, pre-session prep, post-session recovery, weekly structure</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Message your coach</strong>: a non-urgent message form. I reply by email. For anything urgent, the WhatsApp link is at the bottom of the portal</li>
                <li style="margin-bottom:0;"><strong style="color:#1A1A1A;">Account and service</strong>: update your contact details, request a pause, refer a friend, download all your data</li>
              </ul>

              <!-- Section 3: Foundational Reading -->
              <p style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:#1A1A1A;text-transform:uppercase;margin:32px 0 12px;">03 · Your Foundational Reading</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
                <tr>
                  <td>
                    <img src="${img('portal-reading')}" alt="Foundational Reading layout mockup" width="520" style="display:block;width:100%;max-width:520px;border-radius:12px;border:1px solid #E5E5E5;" />
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;">Your Foundational Reading is a structured read of how your body is currently organising itself, derived from the intake you completed. Five sections: where you are right now, what your body is telling us, what we are focusing on first, what we are not doing yet, and a note from me. It is not a verdict. It is the starting position we build from. You will get a separate email when it is ready.</p>

              <!-- Section 4: How to sign in + bookmark reminder -->
              <p style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:#1A1A1A;text-transform:uppercase;margin:32px 0 12px;">04 · How to sign in</p>
              <p style="margin:0 0 14px;">Open the link below and enter your email. You will get a 6-digit code by email. No password to set or remember.</p>
              <p style="margin:0 0 14px;background:#FFFFFF;border:1px solid #E5E5E5;border-radius:10px;padding:14px 16px;color:#3A3A3A;font-size:14px;">
                <strong style="color:#1A1A1A;">Bookmark the page once you are in.</strong> The portal is your home base for everything from here. No password to remember, but bookmarking it means one less email-and-code cycle every time.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
                <tr>
                  <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:10px;">
                    <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">Open my portal</a>
                  </td>
                </tr>
              </table>
              ${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}

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
