import { brand } from '@/config/tenant'

/**
 * Addressed reply-to for coach message emails.
 *
 * Until now a client replying to a coach message landed in Kade's personal
 * inbox via the inbound forwarder, never in the portal thread. So the
 * conversation split in two: her question in his email, his answer in the
 * portal, neither side holding the whole thing. That is exactly what moving
 * contact into the portal was meant to end.
 *
 * The fix is a plus-addressed reply-to carrying the client's portal token:
 *
 *   reply+<onboarding_token>@replies.bodyrecode.au
 *
 * Postmark routes every address at that domain to the inbound webhook, so the
 * local part is free for us to use. The handler pulls the token back out and
 * files the reply as a client message on the right thread.
 *
 * The token is already the client's portal credential and already travels in
 * every email we send them, so this exposes nothing new.
 */

const PREFIX = 'reply+'

/** `reply+<token>@<reply domain>` for a client's message thread. */
export function messageReplyAddress(onboardingToken: string): string {
  const domain = brand().replyToEmail.split('@')[1]
  return `${PREFIX}${onboardingToken}@${domain}`
}

/**
 * Pulls the portal token back out of whatever recipient fields an inbound
 * webhook gives us. Returns null when this is not an addressed reply, in which
 * case the caller should fall back to the existing forward-to-inbox behaviour.
 */
export function parseMessageReplyToken(...recipients: Array<string | null | undefined>): string | null {
  for (const raw of recipients) {
    if (!raw) continue
    // A recipient header can hold several addresses and display names.
    const match = raw.match(/reply\+([0-9a-fA-F-]{36})@/)
    if (match) return match[1].toLowerCase()
  }
  return null
}
