/**
 * Reusable feedback footer block for every broadcast email going out from
 * Body Recode. Renders a dark-card section with a single teal CTA pointing
 * the client at /portal/[token]/feedback.
 *
 * Use this in any broadcast template (platform update emails, feature
 * announcements, milestone messages) so clients always have an explicit
 * place to tell us what is working, what is not, and what they wish
 * existed. Habit-forming on both sides: clients learn to share, Kade
 * learns to read.
 */

export interface BroadcastFeedbackFooterParams {
  /** Per-recipient portal base URL, e.g. https://app.bodyrecode.au/portal/{token}. */
  portalUrl: string
  /** Optional headline override. Defaults to "Tell us what would help". */
  heading?: string
  /** Optional intro paragraph override. */
  intro?: string
  /** Optional CTA label override. Defaults to "Share feedback". */
  ctaLabel?: string
}

export function buildBroadcastFeedbackFooter({
  portalUrl,
  heading = 'Tell us what would help',
  intro = 'What is working, what is not, what you wish existed. Send a short note and Kade reads every one. We use them to shape what we build next.',
  ctaLabel = 'Share feedback',
}: BroadcastFeedbackFooterParams): string {
  // Trim a trailing slash so we always join cleanly to /feedback.
  const feedbackUrl = `${portalUrl.replace(/\/$/, '')}/feedback`
  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:32px 0 0;border-top:1px solid #1c1917;padding-top:32px;">
      <tr>
        <td>
          <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#14b8a6;text-transform:uppercase;margin:0 0 10px;">Feedback</p>
          <p style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.01em;line-height:1.3;margin:0 0 12px;">${escapeHtml(heading)}</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#a8a29e;">${escapeHtml(intro)}</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td bgcolor="#14b8a6" style="background-color:#14b8a6;border-radius:10px;">
                <a href="${feedbackUrl}" style="display:inline-block;padding:12px 22px;color:#0c0a09;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">${escapeHtml(ctaLabel)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
