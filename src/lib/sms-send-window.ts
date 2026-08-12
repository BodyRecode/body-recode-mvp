/**
 * SMS send-window rules for speed-to-lead pipeline.
 *
 * Governed by two forces:
 *   1. ACMA guidance + industry norms + basic decency — avoid overnight, respect Sunday.
 *   2. Business goals — speed-to-lead conversion lift caps at ~5 min after the event,
 *      so if we're inside the send window we fire ASAP; if we're outside, we queue.
 *
 * Timezone: AEST (UTC+10, Queensland, no DST). BR audience is ~95% AU.
 *
 * Rules per trigger:
 *   - scorecard_completed:  Mon-Fri 08:30-20:00 AEST + Sat 08:30-18:00. No Sunday.
 *   - challenge_enrolled:   Mon-Sat 08:30-20:00 AEST. Explicit signup, tighter latitude.
 *   - purchase_report:      Always fire in 30s except overnight 22:00-06:00 AEST → queue to 08:30.
 *   - noshow_reminder:      Always fire 30 min after scheduled start, unless outside 08:30-20:00 → queue to 08:30.
 *
 * All frequency caps ("max 1 per 24h across triggers", "max 3 per week") live in the
 * caller — this file only answers "when should this SMS actually go out."
 */

export type SmsTrigger =
  | 'scorecard_completed'
  | 'challenge_enrolled'
  | 'waitlist_joined'
  | 'purchase_report'
  | 'noshow_reminder'
  | 'dormant_reactivation'
  | 'manual'

/**
 * Returns the Date the SMS should actually be sent. If `now` is inside the
 * appropriate window for this trigger, returns `now` (or `now + short delay`).
 * Otherwise returns the next in-window Date.
 */
export function computeSendAt(now: Date, trigger: SmsTrigger): Date {
  // Convert `now` to AEST wall time. AEST = UTC+10 always (Queensland no DST).
  const aestMs = now.getTime() + 10 * 60 * 60 * 1000
  const aest = new Date(aestMs)
  const day = aest.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const hour = aest.getUTCHours()
  const minute = aest.getUTCMinutes()
  const timeMinutes = hour * 60 + minute

  const OPEN = 8 * 60 + 30 // 08:30
  const CLOSE_WEEKDAY = 20 * 60 // 20:00
  const CLOSE_SATURDAY = 18 * 60 // 18:00

  const isSunday = day === 0
  const isSaturday = day === 6
  const isWeekday = day >= 1 && day <= 5

  const shortDelayMs =
    trigger === 'purchase_report' ? 30 * 1000 : 60 * 1000

  // Trigger-specific windows
  if (trigger === 'scorecard_completed') {
    if (isSunday) return nextWindowStart(aest, /* skipSunday */ true)
    if (isSaturday && timeMinutes >= CLOSE_SATURDAY) return nextWindowStart(aest, true)
    if (isWeekday && timeMinutes >= CLOSE_WEEKDAY) return nextWindowStart(aest, true)
    if (timeMinutes < OPEN) return nextWindowStart(aest, true)
    return new Date(now.getTime() + shortDelayMs)
  }

  if (trigger === 'challenge_enrolled') {
    if (isSunday) return nextWindowStart(aest, true)
    if (timeMinutes >= CLOSE_WEEKDAY) return nextWindowStart(aest, true)
    if (timeMinutes < OPEN) return nextWindowStart(aest, true)
    return new Date(now.getTime() + shortDelayMs)
  }

  // Waitlist joiner - lower urgency than enrolment, same window as scorecard.
  if (trigger === 'waitlist_joined') {
    if (isSunday) return nextWindowStart(aest, true)
    if (isSaturday && timeMinutes >= CLOSE_SATURDAY) return nextWindowStart(aest, true)
    if (isWeekday && timeMinutes >= CLOSE_WEEKDAY) return nextWindowStart(aest, true)
    if (timeMinutes < OPEN) return nextWindowStart(aest, true)
    return new Date(now.getTime() + shortDelayMs)
  }

  if (trigger === 'purchase_report') {
    // Overnight quiet hours 22:00-06:00 AEST
    const inQuietHours = timeMinutes >= 22 * 60 || timeMinutes < 6 * 60
    if (inQuietHours) return nextWindowStart(aest, false /* Sunday OK for purchases */)
    return new Date(now.getTime() + shortDelayMs)
  }

  if (trigger === 'noshow_reminder') {
    if (isSunday) return nextWindowStart(aest, true)
    if (timeMinutes >= CLOSE_WEEKDAY || timeMinutes < OPEN) return nextWindowStart(aest, true)
    return new Date(now.getTime() + shortDelayMs)
  }

  // Manual + fallthrough: respect broad window
  if (isSunday) return nextWindowStart(aest, true)
  if (timeMinutes >= CLOSE_WEEKDAY || timeMinutes < OPEN) return nextWindowStart(aest, true)
  return new Date(now.getTime() + shortDelayMs)
}

/**
 * Given an AEST-wall-clock Date, return the UTC Date corresponding to the next
 * valid 08:30 AEST start. If `skipSunday` is true, roll past Sunday to Monday.
 */
function nextWindowStart(aestNow: Date, skipSunday: boolean): Date {
  // Start with tomorrow 08:30 AEST
  const target = new Date(aestNow)
  target.setUTCHours(8, 30, 0, 0)
  // If we're already before 08:30 today, use today
  const currentAestMinutes = aestNow.getUTCHours() * 60 + aestNow.getUTCMinutes()
  if (currentAestMinutes >= 8 * 60 + 30) {
    target.setUTCDate(target.getUTCDate() + 1)
  }

  // Roll past Sunday if required
  if (skipSunday) {
    while (target.getUTCDay() === 0) {
      target.setUTCDate(target.getUTCDate() + 1)
    }
  }

  // AEST wall time → convert back to UTC by subtracting 10 hours
  return new Date(target.getTime() - 10 * 60 * 60 * 1000)
}

/**
 * Human-readable window description for the trigger.
 * Used in dashboards + coach-notify emails to explain why an SMS is queued vs sent.
 */
export function describeWindow(trigger: SmsTrigger): string {
  switch (trigger) {
    case 'scorecard_completed':
      return 'Mon-Fri 08:30-20:00 AEST + Sat 08:30-18:00. No Sunday.'
    case 'challenge_enrolled':
      return 'Mon-Sat 08:30-20:00 AEST. No Sunday.'
    case 'waitlist_joined':
      return 'Mon-Fri 08:30-20:00 AEST + Sat 08:30-18:00. No Sunday.'
    case 'purchase_report':
      return 'Anytime except 22:00-06:00 AEST (queued to 08:30 next day).'
    case 'noshow_reminder':
      return 'Mon-Sat 08:30-20:00 AEST. Queued outside window.'
    case 'dormant_reactivation':
      return 'Mon-Sat 08:30-20:00 AEST. Cold re-engagement, so it uses the default window rather than firing on an event.'
    case 'manual':
      return 'Mon-Sat 08:30-20:00 AEST default.'
  }
}
