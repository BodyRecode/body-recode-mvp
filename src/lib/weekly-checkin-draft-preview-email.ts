// Coach-only preview email sent the moment the auto-response Inngest worker
// drafts a weekly check-in response. Shows:
//   1. The client's full check-in answers (organised by section)
//   2. The AI-drafted response (interpretation + reframe + next focus)
//   3. An Approve & Send button that fires the actual client send
//   4. A secondary "Edit or skip" deep-link to the dashboard
//
// As of 2026-06-15 this is THE gate on whether the client ever hears back.
// The previous "auto-send after 4h" path was removed. If Kade never clicks
// Approve (or sends from the dashboard) the response sits in the feedback
// row indefinitely.
//
// Triggered ONLY from the auto-response Inngest path. Manual coach-driven
// drafts (Generate Response button) don't email a preview — the coach is
// already on the page reviewing.

import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailBody,
  emailCta,
  emailDivider,
} from './email-shell'

export interface CheckinAnswerSection {
  title: string
  items: Array<{ label: string; value: string }>
}

export interface WeeklyCheckinDraftPreviewEmailParams {
  clientFirstName: string
  weekNumber: number
  formType: 'A' | 'B'
  interpretation: string
  reframe: string | null
  nextFocus: string
  approveUrl: string
  dashboardUrl: string
  checkinSections: CheckinAnswerSection[]
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Same fix as weekly-checkin-feedback-email.ts: style every paragraph, not just the first. */
function paragraphsToHtml(text: string): string {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => emailBody(p, { bottom: 12 }))
    .join('')
}

function renderCheckinSections(sections: CheckinAnswerSection[]): string {
  if (!sections.length) return ''
  return sections.map(section => {
    const items = section.items
      .filter(i => (i.value ?? '').toString().trim().length > 0)
      .map(i => `
        <p style="font-size:12px;color:#6B6B6B;margin:14px 0 4px;line-height:1.45;">${escapeHtml(i.label)}</p>
        <p style="margin:0 0 4px;color:#1A1A1A;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(i.value)}</p>
      `).join('')
    if (!items.trim()) return ''
    return `
      <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:28px 0 6px;">${escapeHtml(section.title)}</p>
      ${items}
    `
  }).join('')
}

export function buildWeeklyCheckinDraftPreviewEmail({
  clientFirstName,
  weekNumber,
  formType,
  interpretation,
  reframe,
  nextFocus,
  approveUrl,
  dashboardUrl,
  checkinSections,
}: WeeklyCheckinDraftPreviewEmailParams): { subject: string; html: string } {
  const subject = `[Approve] ${clientFirstName} W${weekNumber} response — your click sends it`

  const reframeBlock = reframe
    ? `
${emailEyebrow('Reframe')}
${paragraphsToHtml((reframe))}`
    : ''

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Awaiting your approval')}
${emailHeading(`${escapeHtml(clientFirstName)} — Week ${weekNumber} (Form ${formType})`, { size: 20 })}
${emailBody(`Nothing has been sent to ${escapeHtml(clientFirstName)}. Click Approve below to send the response. No auto-send.`, { size: 13, color: '#6B6B6B' })}
${emailCta({ href: approveUrl, label: `Approve &amp; send to ${escapeHtml(clientFirstName)}` })}
${emailCta({ href: dashboardUrl, label: 'Edit or skip' })}
${emailBody(`Approve link: <span style="word-break:break-all;">${approveUrl}</span>`, { size: 12, color: '#9B9B9B' })}
${emailDivider()}
${emailEyebrow(`${escapeHtml(clientFirstName)}'s check-in`, '#1A1A1A')}
${emailBody('What she submitted, by section.', { size: 13, color: '#6B6B6B' })}
${renderCheckinSections(checkinSections)}
${emailDivider()}
${emailEyebrow('Your drafted response', '#1A1A1A')}
${emailBody(`Exactly what ${escapeHtml(clientFirstName)} will see when you approve.`, { size: 13, color: '#6B6B6B' })}
${emailEyebrow('Interpretation')}
${paragraphsToHtml((interpretation))}
${reframeBlock}
${emailEyebrow('This week, hold this')}
${paragraphsToHtml((nextFocus))}
${emailBody(`Kade will personally review your check-in and this response, and decide what, if anything, changes in your plan.`)}
${emailCta({ href: approveUrl, label: 'Approve &amp; send' })}
${emailBody(`Approve sends the response above to ${escapeHtml(clientFirstName)} and BCCs you. Edit or skip opens the dashboard.`, { size: 13, color: '#6B6B6B' })}
${darkEmailSignature()}
`, { previewText: subject })

  return { subject, html }
}
