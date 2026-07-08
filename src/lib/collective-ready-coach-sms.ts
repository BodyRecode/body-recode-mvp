/**
 * Speed-to-lead SMS to Kade when a `ready`-tier applicant lands via the
 * Collective Fit Scorecard. Per COLLECTIVE_FIT_SCORECARD.md: "Speed-to-
 * lead: `ready` tier fires an instant notify to Kade (reuse the
 * speed-to-lead SMS pattern, AEST-windowed)."
 *
 * Distinct from the client-facing speed-to-lead pipeline
 * (src/lib/speed-to-lead-sms.ts) - that one texts LEADS, this one
 * texts KADE. Fires only on `ready`, never on `building` / `not_yet`
 * (those are lower-priority signals; the email is sufficient).
 *
 * AEST-windowed: Mon-Sat 08:30-20:00. Outside window = skip (Kade
 * sees the email either way). Silent-fail so the API response never
 * blocks on SMS pipeline health.
 */

import { sendSms, formatPhone } from '@/lib/twilio'
import { coach } from '@/config/tenant'

/** Returns true if the given UTC Date sits inside the coach-friendly SMS window (Mon-Sat 08:30-20:00 AEST). */
export function isWithinCoachSmsWindow(now: Date = new Date()): boolean {
  // Convert to AEST wall time. AEST = UTC+10 always (Queensland, no DST).
  const aest = new Date(now.getTime() + 10 * 60 * 60 * 1000)
  const day = aest.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const hour = aest.getUTCHours()
  const minute = aest.getUTCMinutes()
  const timeMinutes = hour * 60 + minute

  if (day === 0) return false // No Sunday

  const OPEN = 8 * 60 + 30 // 08:30
  const CLOSE = 20 * 60    // 20:00

  return timeMinutes >= OPEN && timeMinutes < CLOSE
}

export interface CollectiveReadySmsResult {
  ok: boolean
  reason?: 'outside_window' | 'no_phone' | 'send_error'
  error?: string
}

/**
 * Send the ready-tier notification SMS to Kade. Returns quickly with
 * a status; never throws (callers should await but not depend on the
 * result to decide response codes).
 */
export async function sendCollectiveReadyCoachSms(
  applicantFirstName: string,
): Promise<CollectiveReadySmsResult> {
  const first = applicantFirstName?.trim() || 'a new applicant'
  const rawPhone = coach().whatsAppNumber?.trim() || ''
  if (!rawPhone) {
    return { ok: false, reason: 'no_phone' }
  }
  if (!isWithinCoachSmsWindow()) {
    return { ok: false, reason: 'outside_window' }
  }

  const to = formatPhone(rawPhone)
  const message = `BR Collective · Ready-tier application from ${first}. Full details + reply CTA in your inbox.`

  try {
    await sendSms({ to, message })
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[collective-ready-coach-sms] send failed:', msg)
    return { ok: false, reason: 'send_error', error: msg }
  }
}
