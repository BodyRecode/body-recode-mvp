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
  // A coach-initiated message has nothing to quote, and calling it a reply
  // would have the client hunting for a message they never sent.
  const isReply = !!inReplyTo?.trim()
  const subject = isReply
    ? `${coachFirstName} replied to your message`
    : `A message from ${coachFirstName}`

  const quoted = inReplyTo
    ? `<div style="border-left:2px solid ${EMAIL_HAIRLINE};padding:2px 0 2px 14px;margin:0 0 18px 0;">
         <p style="margin:0 0 4px 0;font-family:${EMAIL_FF};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_MUTED};">You wrote</p>
         <p style="margin:0;font-family:${EMAIL_FF};font-size:13px;line-height:1.7;color:${EMAIL_MUTED};">${escapeHtml(preview(inReplyTo, 140))}</p>
       </div>`
    : ''

  // Preview only, never the full message. Three reasons, in order of weight:
  // replying to this email routes to the coach's inbox rather than the portal
  // thread, so a full message invites the client to answer in the one place
  // that fragments the conversation; coaching messages carry health content and
  // an inbox is a weaker container than the portal; and a long message makes an
  // unreadable email. Enough here to know it is worth opening, not enough to
  // answer without opening it.
  const truncated = preview(replyBody, 220)
  const reply = `<div style="background:#FFFFFF;border:1px solid ${EMAIL_HAIRLINE};border-radius:12px;padding:18px 20px;margin:0 0 22px 0;">
       <p style="margin:0;font-family:${EMAIL_FF};font-size:15px;line-height:1.75;color:${EMAIL_BODY_SOFT};font-style:italic;">${escapeHtml(truncated)}</p>
     </div>`

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Message')}
${emailHeading(
  isReply
    ? `${escapeHtml(coachFirstName)} replied, ${escapeHtml(firstName)}.`
    : `${escapeHtml(coachFirstName)} sent you a message, ${escapeHtml(firstName)}.`
)}
${quoted}
${reply}
${emailCta({ href: threadUrl, label: isReply ? 'Read the full reply' : 'Read the full message' })}
${emailBody('Read it and reply in your portal. Your whole conversation lives there, so nothing gets lost in an email chain.', { size: 13, color: EMAIL_MUTED })}
${emailUrlFallback(threadUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`, { previewText: subject })

  return { subject, html }
}

/** First N characters on a word boundary, with an ellipsis when cut. */
function preview(input: string, max: number): string {
  const flat = input.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, '')}...`
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
