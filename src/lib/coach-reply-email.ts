import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailBody,
  emailCta,
  emailUrlFallback,
  EMAIL_HAIRLINE,
  EMAIL_BODY_SOFT,
  EMAIL_MUTED,
  EMAIL_FF,
} from './email-shell'

export interface CoachReplyEmailParams {
  firstName: string
  coachFirstName: string
  /** The coach's reply, plain text. Rendered as a quoted block. */
  replyBody: string
  /** The client's original message, if this reply answers one. */
  inReplyTo?: string | null
  /** Canonical portal messages URL, built with portalUrl(). */
  threadUrl: string
}

/**
 * Sent to the client when the coach replies to them in the portal.
 *
 * The reply is included in full so the client can read it without clicking
 * anything, which is the whole point: the previous system dropped the answer
 * into a separate email thread and the portal never showed it. The CTA exists
 * so the conversation has one canonical home to continue in.
 */
export function buildCoachReplyEmail({
  firstName,
  coachFirstName,
  replyBody,
  inReplyTo,
  threadUrl,
}: CoachReplyEmailParams): { subject: string; html: string } {
  const subject = `${coachFirstName} replied to your message`

  const quoted = inReplyTo
    ? `<div style="border-left:2px solid ${EMAIL_HAIRLINE};padding:2px 0 2px 14px;margin:0 0 18px 0;">
         <p style="margin:0 0 4px 0;font-family:${EMAIL_FF};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_MUTED};">You wrote</p>
         <p style="margin:0;font-family:${EMAIL_FF};font-size:13px;line-height:1.7;color:${EMAIL_MUTED};">${escapeHtml(inReplyTo)}</p>
       </div>`
    : ''

  const reply = `<div style="background:#FFFFFF;border:1px solid ${EMAIL_HAIRLINE};border-radius:12px;padding:18px 20px;margin:0 0 22px 0;">
       <p style="margin:0;font-family:${EMAIL_FF};font-size:15px;line-height:1.75;color:${EMAIL_BODY_SOFT};">${escapeHtml(replyBody)}</p>
     </div>`

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Message')}
${emailHeading(`${escapeHtml(coachFirstName)} replied, ${escapeHtml(firstName)}.`)}
${quoted}
${reply}
${emailCta({ href: threadUrl, label: 'Open the conversation' })}
${emailBody('Your full conversation lives in your portal, so nothing gets lost in an email thread. Reply there any time.', { size: 13, color: EMAIL_MUTED })}
${emailUrlFallback(threadUrl, 'Or paste this link into your browser')}
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
    .replace(/\n/g, '<br/>')
}
