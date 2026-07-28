/**
 * Unsubscribe tokens + the email suppression list.
 *
 * Built 2026-07-28. Until then the app had no unsubscribe facility of any kind
 * on email — no footer link, no page, no List-Unsubscribe header. The only way
 * out was to email Kade and have him switch the person off by hand across
 * every table they appeared in. That is a Spam Act problem (a commercial email
 * must carry a functional unsubscribe facility) and a deliverability one:
 * Gmail and Outlook both weight one-click unsubscribe, and its absence pushes
 * mail toward junk.
 *
 * Token design: the address is carried IN the token, signed, so the
 * unsubscribe page needs no database lookup to know who is unsubscribing and
 * there is no token table to keep. The signature stops someone editing the
 * address in the URL and unsubscribing a competitor — or every address they
 * can guess.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Signing secret. Falls back through secrets that are always present in prod
 * rather than throwing, because a missing env var must never be able to stop
 * an unsubscribe link from working — a broken unsubscribe is worse than a
 * predictable one. Set UNSUBSCRIBE_SECRET to pin it.
 */
function secret(): string {
  const s =
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('[unsubscribe] no signing secret available')
  return s
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

/** Mint an unsubscribe token for an email address. Stable for a given address. */
export function mintUnsubscribeToken(email: string): string {
  const normalised = email.trim().toLowerCase()
  const payload = b64url(normalised)
  return `${payload}.${sign(payload)}`
}

/**
 * Verify a token and recover the address. Returns null on any tampering.
 * Constant-time compare so the signature can't be brute-forced a byte at a time.
 */
export function readUnsubscribeToken(token: string): string | null {
  const [payload, signature] = (token ?? '').split('.')
  if (!payload || !signature) return null

  let expected: string
  try {
    expected = sign(payload)
  } catch {
    return null
  }

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const email = Buffer.from(payload, 'base64url').toString('utf8')
    return email.includes('@') ? email : null
  } catch {
    return null
  }
}

/** Absolute URL of the human-facing unsubscribe page for an address. */
export function unsubscribeUrl(email: string): string {
  // Imported lazily to keep this module usable from scripts that don't boot
  // the whole app config.
  const { appUrlFor } = require('@/lib/app-url') as typeof import('@/lib/app-url')
  return appUrlFor(`/unsubscribe/${mintUnsubscribeToken(email)}`)
}

/**
 * URL for the List-Unsubscribe header. Separate from the page above because
 * RFC 8058 one-click sends an unauthenticated POST that must act immediately,
 * and a Next page route can't also be a POST handler. GET on this endpoint
 * redirects a human to the friendly page.
 */
export function unsubscribePostUrl(email: string): string {
  const { appUrlFor } = require('@/lib/app-url') as typeof import('@/lib/app-url')
  return appUrlFor(`/api/unsubscribe?token=${mintUnsubscribeToken(email)}`)
}

export type SuppressionReason =
  | 'unsubscribe_link'
  | 'manual'
  | 'reply_stop'
  | 'bounce'
  | 'complaint'

/**
 * Is this address on the suppression list?
 *
 * Fails OPEN (returns false) if the lookup itself errors. A database blip must
 * not silently stop every email in the system; a bad send is recoverable,
 * a silent outage across every sequence is not.
 */
export async function isSuppressed(email: string): Promise<boolean> {
  if (!email) return false
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('email_suppressions')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()
    if (error) {
      console.error('[unsubscribe] suppression lookup failed, allowing send:', error)
      return false
    }
    return !!data
  } catch (e) {
    console.error('[unsubscribe] suppression lookup threw, allowing send:', e)
    return false
  }
}

/** Add an address to the suppression list. Idempotent. */
export async function suppressEmail(
  email: string,
  reason: SuppressionReason = 'unsubscribe_link',
  source?: string,
): Promise<void> {
  const admin = createAdminClient()
  const normalised = email.trim().toLowerCase()

  await admin
    .from('email_suppressions')
    .upsert({ email: normalised, reason, source: source ?? null }, { onConflict: 'email' })

  // Mirror onto the lead record where one exists, so the dashboard shows the
  // person as inactive and the per-sequence eligibility gates (which read
  // leads.active) wind themselves down too. Best-effort: the suppression list
  // is authoritative on its own.
  try {
    await admin
      .from('leads')
      .update({ active: false, booking_agent_state: 'done', updated_at: new Date().toISOString() })
      .eq('email', normalised)
  } catch (e) {
    console.error('[unsubscribe] lead mirror failed (suppression still applied):', e)
  }
}

/** Remove an address from the suppression list (resubscribe). */
export async function unsuppressEmail(email: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('email_suppressions').delete().eq('email', email.trim().toLowerCase())
}
