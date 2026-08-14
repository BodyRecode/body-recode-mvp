/**
 * Phone validation and normalisation, shared by every form that captures a
 * mobile we will later text.
 *
 * Why this exists (2026-08-14). The enrol form validated `phone.trim()` and
 * nothing else, and `formatPhone()` in twilio.ts had a catch-all branch that
 * prefixed a `+` to whatever digits it was handed. So a participant who typed
 * her mobile without the leading zero - "438 672 578" - was stored as
 * `+438672578`, which is not an Australian number at all. Every SMS to her
 * failed with Twilio error 21211, silently, for a month.
 *
 * The rule: reject at the door rather than discover it in a delivery log.
 */

export type PhoneResult =
  | { ok: true; e164: string; corrected: boolean }
  | { ok: false; error: string }

/**
 * Digits only, preserving whether the user wrote a leading '+'.
 *
 * The `(0)` in a number like +44(0)7905 691768 is a national trunk prefix. It
 * is written for people dialling domestically and must be DROPPED in
 * international format - keeping it produced +4407905691768, which is not a
 * reachable number. Real example from the lead list.
 */
function clean(raw: string): { digits: string; hadPlus: boolean } {
  const trimmed = (raw ?? '').trim()
  const hadPlus = trimmed.startsWith('+')
  const withoutTrunk = hadPlus ? trimmed.replace(/\((0)\)/, '') : trimmed
  return { digits: withoutTrunk.replace(/\D/g, ''), hadPlus }
}

/**
 * Normalise to E.164, or explain why it cannot be.
 *
 * Australian mobiles are 04XX XXX XXX locally, +61 4XX XXX XXX internationally.
 * The three shapes below are the ones real people actually type. Anything that
 * does not resolve to a plausible number is rejected rather than guessed at.
 */
export function normalisePhone(raw: string): PhoneResult {
  const { digits, hadPlus } = clean(raw)

  if (!digits) return { ok: false, error: 'Enter your mobile number.' }

  // Obvious junk: too short to be any phone number anywhere.
  if (digits.length < 8) {
    return { ok: false, error: 'That number looks too short. Check for missing digits.' }
  }

  // 04XX XXX XXX — the standard local form.
  if (digits.length === 10 && digits.startsWith('04')) {
    return { ok: true, e164: `+61${digits.slice(1)}`, corrected: false }
  }

  // 614XX XXX XXX — already international, with or without the +.
  if (digits.length === 11 && digits.startsWith('614')) {
    return { ok: true, e164: `+${digits}`, corrected: false }
  }

  // 4XX XXX XXX — the leading zero dropped. This is the exact mistake that
  // produced +438672578. Unambiguous for AU mobiles, so correct it rather than
  // bouncing someone for a missing zero, but flag that we changed it.
  if (digits.length === 9 && digits.startsWith('4') && !hadPlus) {
    return { ok: true, e164: `+61${digits}`, corrected: true }
  }

  // An Australian landline is not a mobile and will never receive our SMS.
  if (digits.length === 10 && /^0[2378]/.test(digits)) {
    return { ok: false, error: 'That looks like a landline. Enter a mobile number so we can text your daily portal link.' }
  }
  if (digits.length === 11 && /^61[2378]/.test(digits)) {
    return { ok: false, error: 'That looks like a landline. Enter a mobile number so we can text your daily portal link.' }
  }

  // Genuine overseas numbers exist in the list (UK, for one). Accept them only
  // when written properly with a country code, since we cannot infer one.
  if (hadPlus && digits.length >= 10 && digits.length <= 15) {
    return { ok: true, e164: `+${digits}`, corrected: false }
  }

  if (digits.length === 9) {
    return { ok: false, error: 'That number is one digit short. Australian mobiles are 10 digits, starting 04.' }
  }
  return {
    ok: false,
    error: 'That does not look like a valid mobile. Use 04XX XXX XXX, or include your country code for an overseas number.',
  }
}

/** Convenience for form-level checks that only need a yes/no. */
export function isValidPhone(raw: string): boolean {
  return normalisePhone(raw).ok
}
