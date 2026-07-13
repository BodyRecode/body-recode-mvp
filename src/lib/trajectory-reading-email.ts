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

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Block-End Reading')}
${emailHeading(`You have closed a block, ${escapeHtml(firstName)}.`)}
${emailBody(`You have finished ${escapeHtml(blockName)}. Your block-end reading is now in your portal: the step back from the week-to-week, reading how your signal moved across the whole block, what held steady, and what this sets up next.`)}
${emailBody(`It reads your weekly check-ins as one arc, not one week at a time. A minute with it is worth it before the next block begins.`)}
${emailCta({ href: portalUrl, label: 'Read your block-end reading' })}
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
