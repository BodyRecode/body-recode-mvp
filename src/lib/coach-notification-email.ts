/**
 * Shared dark-template builder for coach-facing notification emails sent
 * when a client completes a portal task (baseline, intake, agreement,
 * health declaration, medical clearance, weekly check-in, session
 * confirmations and reschedules).
 *
 * Uses the same DNA as the client-facing welcome / commencement / foundational
 * reading templates so the entire email surface reads as one product.
 */

export interface CoachNotificationParams {
  /** Small uppercase label above the heading (e.g. "BASELINE", "INTAKE") */
  eyebrow: string
  /** Main headline (e.g. "Samantha submitted their baseline") */
  heading: string
  /** One or more paragraphs of body copy */
  body: string | string[]
  /** Optional bulleted list rendered between body and CTA */
  details?: string[]
  /** Primary CTA */
  ctaLabel: string
  ctaUrl: string
  /** Optional secondary muted note shown below the CTA */
  footnote?: string
  /** Accent colour for the eyebrow + CTA. Defaults to locked teal. */
  accent?: 'teal' | 'amber' | 'red'
}

const ACCENTS = {
  teal:  { bar: '#1B6DFC', hover: '#5390FF' },
  amber: { bar: '#B7791F', hover: '#8A5A14' },
  red:   { bar: '#DC2626', hover: '#DC2626' },
}

export function buildCoachNotificationEmail({
  eyebrow,
  heading,
  body,
  details,
  ctaLabel,
  ctaUrl,
  footnote,
  accent = 'teal',
}: CoachNotificationParams): string {
  const a = ACCENTS[accent]
  const paragraphs = Array.isArray(body) ? body : [body]

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="140" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#6B6B6B;">
              <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:${a.bar};text-transform:uppercase;margin:0 0 14px;">${escapeHtml(eyebrow)}</p>
              <p style="color:#1A1A1A;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;margin:0 0 18px;">${escapeHtml(heading)}</p>
              ${paragraphs.map(p => `<p style="margin:0 0 14px;">${p}</p>`).join('')}
              ${details && details.length > 0 ? `
              <ul style="padding-left:18px;color:#6B6B6B;margin:8px 0 18px;">
                ${details.map(d => `<li style="margin-bottom:6px;">${d}</li>`).join('')}
              </ul>
              ` : ''}
              <table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
                <tr>
                  <td bgcolor="${a.bar}" style="background-color:${a.bar};border-radius:10px;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">${escapeHtml(ctaLabel)}</a>
                  </td>
                </tr>
              </table>
              ${footnote ? `<p style="font-size:12px;color:#999999;margin:12px 0 0;">${footnote}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
