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

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Program Reading')}
${emailHeading(`Your new block is ready, ${escapeHtml(firstName)}.`)}
${emailBody(`${escapeHtml(blockName)} is live in your portal. Before the sessions, you will find your Program Reading: the read of what this block is for, what it is asking of your body, and how we will know it is working.`)}
${emailBody(`The reading sits at the top of your program page so the why frames every session you open.`)}
${emailCta({ href: portalUrl, label: 'Open your program' })}
${emailBody('Take a minute to read the framing before your first session. It is short and it sets the lens for the next few weeks.', { size: 13, color: '#6B6B6B' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
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
