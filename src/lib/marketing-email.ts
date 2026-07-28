/**
 * The one way to send MARKETING email.
 *
 * Every commercial/sequence send should go through here rather than calling
 * Resend directly. It does three things no individual sender should have to
 * remember:
 *
 *   1. Checks the suppression list and skips the send if the person opted out.
 *   2. Appends the unsubscribe footer to the rendered HTML.
 *   3. Sets List-Unsubscribe + List-Unsubscribe-Post so Gmail and Apple Mail
 *      render their native one-click unsubscribe button (a real deliverability
 *      signal, not just a legal box-tick).
 *
 * TRANSACTIONAL sends deliberately do NOT come through here — Zoom
 * confirmations and reminders, portal sign-in codes, payment receipts, report
 * delivery, intake invites. Those are things the person asked for, and
 * withholding a booking confirmation because someone left a drip sequence
 * would be worse than the problem this solves. Keep using Resend directly for
 * those.
 *
 * Built 2026-07-28 — before this, the app had no email unsubscribe facility at
 * all and opt-outs had to be applied by hand across several tables.
 */

import { Resend } from 'resend'
import { emailUnsubscribeFooter } from '@/lib/email-shell'
import { isSuppressed, unsubscribeUrl, unsubscribePostUrl } from '@/lib/unsubscribe'
import { coach } from '@/config/tenant'

export interface MarketingEmailInput {
  to: string
  subject: string
  /** Fully rendered HTML. The unsubscribe footer is appended before sending. */
  html: string
  from: string
  replyTo?: string
  bcc?: string[]
  /** Where this send came from, e.g. 'scorecard-drip-step-3'. For the log. */
  source?: string
}

export type MarketingEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; skipped: true; reason: 'suppressed' }
  | { ok: false; skipped: false; reason: string }

export async function sendMarketingEmail(
  input: MarketingEmailInput,
): Promise<MarketingEmailResult> {
  const to = input.to?.trim()
  if (!to) return { ok: false, skipped: false, reason: 'no recipient' }

  if (await isSuppressed(to)) {
    console.log(`[marketing-email] skipped — ${to} is unsubscribed (${input.source ?? 'unknown'})`)
    return { ok: false, skipped: true, reason: 'suppressed' }
  }

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, skipped: false, reason: 'RESEND_API_KEY not set' }
  }

  const unsubUrl = unsubscribeUrl(to)
  // The footer is injected before </body> when the HTML came through the
  // shell, and appended otherwise, so senders that hand-roll their HTML still
  // end up compliant.
  const footer = emailUnsubscribeFooter(unsubUrl)
  const html = input.html.includes('</body>')
    ? input.html.replace('</body>', `${footer}</body>`)
    : `${input.html}${footer}`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const sent = await resend.emails.send({
    from: input.from,
    to,
    bcc: input.bcc,
    replyTo: input.replyTo ?? coach().email,
    subject: input.subject,
    html,
    headers: {
      // RFC 8058 one-click. Points at the API route, not the page: the
      // provider sends an unauthenticated POST that must act immediately, and
      // a Next page route can't handle POST. GET there redirects a human to
      // the same friendly page the footer link opens.
      'List-Unsubscribe': `<${unsubscribePostUrl(to)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })

  if (sent.error) {
    console.error('[marketing-email] send failed:', sent.error)
    return { ok: false, skipped: false, reason: sent.error.message ?? 'send failed' }
  }

  return { ok: true, id: sent.data?.id ?? null }
}
