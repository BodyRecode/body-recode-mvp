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
${emailBody(paragraphsToHtml(reframe))}`
    : ''

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow(`Week ${weekNumber} · Form ${formType} response`)}
${emailHeading(`${escapeHtml(firstName)}, here is my read on your check-in.`)}
${emailBody(`Thanks for completing your check-in. Here is what I am seeing in your signal and what to hold this week.`)}
${emailEyebrow('Interpretation')}
${emailBody(paragraphsToHtml(interpretation))}
${reframeBlock}
${emailEyebrow('This week, hold this')}
${emailBody(paragraphsToHtml(nextFocus))}
${emailCta({ href: checkinUrl, label: 'View in your portal' })}
${emailBody('Your check-in and my response both live in your portal so you can return to them any time.', { size: 13, color: '#6B6B6B' })}
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

function paragraphsToHtml(input: string): string {
  return escapeHtml(input.trim())
    .split(/\n\s*\n/)
    .map(p => p.replace(/\n/g, '<br />'))
    .join('</p><p style="margin:14px 0 0;">')
}
