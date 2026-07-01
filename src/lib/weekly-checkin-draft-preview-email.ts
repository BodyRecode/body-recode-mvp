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
import { logoUrl } from '@/config/tenant'

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

function paragraphsToHtml(text: string): string {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .join('</p><p style="margin:0 0 12px;">')
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
    ? `<p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:24px 0 8px;">Reframe</p>
       <p style="margin:0 0 6px;">${paragraphsToHtml(reframe)}</p>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/><meta name="supported-color-schemes" content="light"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:640px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="${logoUrl()}" width="140" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.7;color:#3A3A3A;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:0 0 12px;">Awaiting your approval</p>
              <p style="color:#1A1A1A;font-size:20px;font-weight:800;letter-spacing:-0.02em;line-height:1.3;margin:0 0 6px;">
                ${escapeHtml(clientFirstName)} — Week ${weekNumber} (Form ${formType})
              </p>
              <p style="font-size:13px;color:#6B6B6B;margin:0 0 24px;">Nothing has been sent to ${escapeHtml(clientFirstName)}. Click Approve below to send the response. No auto-send.</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:0 40px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.7;color:#3A3A3A;">
              <table cellpadding="0" cellspacing="0" style="margin:8px 0 12px;">
                <tr>
                  <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:10px;">
                    <a href="${approveUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                      Approve &amp; send to ${escapeHtml(clientFirstName)}
                    </a>
                  </td>
                  <td style="width:12px;"></td>
                  <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid #E5E5E5;border-radius:10px;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 22px;color:#1A1A1A;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                      Edit or skip
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:#9B9B9B;margin:0 0 24px;">Approve link: <span style="word-break:break-all;">${approveUrl}</span></p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#F8F9FB" style="background-color:#F8F9FB;padding:24px 40px;border-top:1px solid #E5E5E5;border-bottom:1px solid #E5E5E5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#3A3A3A;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1A1A1A;text-transform:uppercase;margin:0 0 4px;">${escapeHtml(clientFirstName)}'s check-in</p>
              <p style="font-size:13px;color:#6B6B6B;margin:0;">What she submitted, by section.</p>
              ${renderCheckinSections(checkinSections)}
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.7;color:#3A3A3A;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1A1A1A;text-transform:uppercase;margin:0 0 12px;">Your drafted response</p>
              <p style="font-size:13px;color:#6B6B6B;margin:0 0 18px;">Exactly what ${escapeHtml(clientFirstName)} will see when you approve.</p>
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:24px 0 8px;">Interpretation</p>
              <p style="margin:0 0 6px;">${paragraphsToHtml(interpretation)}</p>
              ${reframeBlock}
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:24px 0 8px;">This week, hold this</p>
              <p style="margin:0 0 6px;">${paragraphsToHtml(nextFocus)}</p>
              <table cellpadding="0" cellspacing="0" style="margin:32px 0 8px;">
                <tr>
                  <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:10px;">
                    <a href="${approveUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                      Approve &amp; send
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#6B6B6B;margin:0 0 6px;">Approve sends the response above to ${escapeHtml(clientFirstName)} and BCCs you. Edit or skip opens the dashboard.</p>
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
