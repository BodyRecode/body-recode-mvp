import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailBody,
  emailCta,
  emailUrlFallback,
} from './email-shell'
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

  const mockup = (slug: string, alt: string) => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
                <tr>
                  <td>
                    <img src="${img(slug)}" alt="${alt}" width="520" style="display:block;width:100%;max-width:520px;border-radius:12px;border:1px solid #E5E5E5;" />
                  </td>
                </tr>
              </table>`

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Portal Orientation')}
${emailHeading(`${escapeHtml(firstName)}, your coaching portal is set up.`, { size: 24 })}
${emailBody(`While I build your program over the next few days, take some time to get to know your portal. This is going to be your home base for everything from here.`)}
${emailBody(`Here is what is in it.`)}

${emailEyebrow('01 · Your Portal Home', '#1A1A1A')}
${mockup('portal-landing', 'Portal home page mockup')}
${emailBody(`When you sign in, you land here. The page is split into sections so you always know what is current.`)}
              <ul style="padding-left:18px;margin:0 0 16px;color:#6B6B6B;">
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">This week</strong>: your weekly check-in (when the window is open) or a status note when it is not</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Your reading</strong>: your Foundational Reading appears here once it is ready</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Resources</strong>: the all-in-one menu shown next</li>
              </ul>

${emailEyebrow('02 · Resources', '#1A1A1A')}
${mockup('portal-resources', 'Portal resources hub mockup')}
${emailBody(`Six cards, one for each thing you might need beyond your weekly check-in and program:`)}
              <ul style="padding-left:18px;margin:0 0 16px;color:#6B6B6B;">
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Your progress</strong>: measurements over time, side by side with your starting baseline</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Your readings</strong>: every Foundational Reading we generate for you, current and archived</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Glossary</strong>: plain-language definitions of every term you hear from me. RPE, body state, regulation, recovery margin, all of it</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Practical guides</strong>: short, actionable. Sleep hygiene, stress regulation, pre-session prep, post-session recovery, weekly structure</li>
                <li style="margin-bottom:6px;"><strong style="color:#1A1A1A;">Message your coach</strong>: a non-urgent message form. I reply by email. For anything urgent, the WhatsApp link is at the bottom of the portal</li>
                <li style="margin-bottom:0;"><strong style="color:#1A1A1A;">Account and service</strong>: update your contact details, request a pause, refer a friend, download all your data</li>
              </ul>

${emailEyebrow('03 · Your Foundational Reading', '#1A1A1A')}
${mockup('portal-reading', 'Foundational Reading layout mockup')}
${emailBody(`Your Foundational Reading is a structured read of how your body is currently organising itself, derived from the intake you completed. Five sections: where you are right now, what your body is telling us, what we are focusing on first, what we are not doing yet, and a note from me. It is not a verdict. It is the starting position we build from. You will get a separate email when it is ready.`)}

${emailEyebrow('04 · How to sign in', '#1A1A1A')}
${emailBody(`Open the link below and enter your email. You will get a 6-digit code by email. No password to set or remember.`)}
              <p style="margin:0 0 14px;background:#FFFFFF;border:1px solid #E5E5E5;border-radius:10px;padding:14px 16px;color:#3A3A3A;font-size:14px;">
                <strong style="color:#1A1A1A;">Bookmark the page once you are in.</strong> The portal is your home base for everything from here. No password to remember, but bookmarking it means one less email-and-code cycle every time.
              </p>

${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}

${emailBody(`Take a few days to read through it. There is no rush. The portal is built to be discovered slowly.`)}
${emailBody(`When your program is ready, I will let you know and the next phase begins.`)}
${darkEmailSignature()}
`, { previewText: subject })

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
