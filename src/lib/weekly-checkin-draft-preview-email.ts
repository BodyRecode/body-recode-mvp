// Coach-only preview email sent the moment the auto-response Inngest worker
// drafts a weekly check-in response. Shows the three fields exactly as the
// client will see them, plus the scheduled send time and a deep-link to the
// check-in dashboard for Edit / Send now / Skip actions.
//
// Triggered ONLY from the auto-response Inngest path. Manual coach-driven
// drafts (Generate Response button) don't email a preview — the coach is
// already on the page reviewing.

import { darkEmailSignature } from './email-signature'

export interface WeeklyCheckinDraftPreviewEmailParams {
  clientFirstName: string
  weekNumber: number
  formType: 'A' | 'B'
  interpretation: string
  reframe: string | null
  nextFocus: string
  scheduledSendAt: string
  dashboardUrl: string
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

function formatScheduledTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' Brisbane'
}

export function buildWeeklyCheckinDraftPreviewEmail({
  clientFirstName,
  weekNumber,
  formType,
  interpretation,
  reframe,
  nextFocus,
  scheduledSendAt,
  dashboardUrl,
}: WeeklyCheckinDraftPreviewEmailParams): { subject: string; html: string } {
  const subject = `[Draft] ${clientFirstName} W${weekNumber} response — sends ${formatScheduledTime(scheduledSendAt)}`

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
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:600px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="140" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.7;color:#3A3A3A;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:0 0 12px;">Draft for review</p>
              <p style="color:#1A1A1A;font-size:20px;font-weight:800;letter-spacing:-0.02em;line-height:1.3;margin:0 0 6px;">
                ${escapeHtml(clientFirstName)} — Week ${weekNumber} (Form ${formType})
              </p>
              <p style="font-size:13px;color:#6B6B6B;margin:0 0 24px;">Auto-generated draft. Sends to ${escapeHtml(clientFirstName)} on ${formatScheduledTime(scheduledSendAt)} unless you edit, send now, or skip.</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:0 40px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.7;color:#3A3A3A;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:24px 0 8px;">Interpretation</p>
              <p style="margin:0 0 6px;">${paragraphsToHtml(interpretation)}</p>
              ${reframeBlock}
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;margin:24px 0 8px;">This week, hold this</p>
              <p style="margin:0 0 6px;">${paragraphsToHtml(nextFocus)}</p>
              <table cellpadding="0" cellspacing="0" style="margin:32px 0 8px;">
                <tr>
                  <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:10px;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
                      Review in dashboard
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#6B6B6B;margin:0 0 6px;">From the dashboard you can edit the text, send immediately, or skip this week.</p>
              <p style="font-size:12px;color:#9B9B9B;margin:18px 0 0;word-break:break-all;">${dashboardUrl}</p>
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
