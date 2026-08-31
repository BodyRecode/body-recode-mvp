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
${emailEyebrow('Reframe')}
${paragraphsToHtml((reframe))}`
    : ''

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow(`Week ${weekNumber} · Form ${formType} response`)}
${emailHeading(`${escapeHtml(firstName)}, here is the Body Recode read on your check-in.`)}
${emailBody(`Thanks for completing your check-in. Here is what the system is seeing in your signal this week, and the one thing to hold.`)}
${emailEyebrow('Interpretation')}
${paragraphsToHtml((interpretation))}
${reframeBlock}
${emailEyebrow('This week, hold this')}
${paragraphsToHtml((nextFocus))}
${emailBody('Kade will personally review your check-in and this response, and decide what, if anything, changes in your plan.')}
${emailCta({ href: checkinUrl, label: 'View in your portal' })}
${emailBody('Your check-in and this response both live in your portal so you can return to them any time.', { size: 13, color: '#6B6B6B' })}
${emailUrlFallback(checkinUrl, 'Or paste this link into your browser')}
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

/**
 * Every paragraph gets the FULL body styling, not just the first.
 *
 * 2026-08-31: this used to join paragraphs with a bare
 * `</p><p style="margin:14px 0 0;">`, which carries no font-family, size,
 * colour or line-height. Wrapped in a single emailBody(), only the FIRST
 * paragraph was styled and every one after it fell back to the mail client's
 * default - a serif at a different size. Razia's week 15 response went out
 * looking like three different documents. Each paragraph is now its own
 * emailBody() so they cannot drift apart again.
 */
function paragraphsToHtml(input: string, opts?: { size?: number; color?: string }): string {
  return escapeHtml(input.trim())
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => emailBody(p.replace(/\n/g, '<br />'), { ...opts, bottom: 14 }))
    .join('')
}
