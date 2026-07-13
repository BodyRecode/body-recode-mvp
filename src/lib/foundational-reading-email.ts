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
    ? emailBody(`The reading covers where your body is right now (currently in ${escapeHtml(bodyState)}), what it is signalling, what we are focusing on first, and what we are deliberately not doing yet.`)
    : emailBody(`The reading covers where your body is right now, what it is signalling, what we are focusing on first, and what we are deliberately not doing yet.`)

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Foundational Reading')}
${emailHeading(`Your Foundational Reading is ready, ${escapeHtml(firstName)}.`)}
${emailBody(`This is a structured read of how your body is currently organising itself, written from the same intake you completed.`)}
${stateLine}
${emailBody(`It is not a verdict and it is not a plan. It is the foundation we will build everything else on, written so you can see exactly where we are starting from.`)}
${emailCta({ href: portalUrl, label: 'Open your reading' })}
${emailBody('It lives in your portal alongside everything else, so you can return to it any time. You can also download it as a PDF from the top of the page.', { size: 13, color: '#6B6B6B' })}
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
