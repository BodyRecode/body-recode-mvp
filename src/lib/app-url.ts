/**
 * Canonical app URL helper.
 *
 * Why this exists: on 2026-05-13 we discovered Ruby-Cate's check-in
 * emails contained `https://body-recode.vercel.app/portal/...` instead of
 * the production domain. Cause: `NEXT_PUBLIC_APP_URL` on Vercel had been
 * left as the raw Vercel deployment URL since project setup, and several
 * email senders (the cron routes especially) interpolated that env var
 * directly. When she clicked, Outlook.com's link tracker + the wrong
 * cookie domain produced a "can't connect to server" error.
 *
 * The fix has two halves:
 *   1. Set NEXT_PUBLIC_APP_URL=https://app.bodyrecode.au in Vercel prod
 *      (done out-of-band via `vercel env`).
 *   2. Route every URL builder through this helper so a future env-var
 *      drift can't poison the email body again — the helper falls back
 *      to the canonical apex if the env var is missing or non-https, and
 *      strips a trailing slash so callers don't have to think about it.
 *
 * NEVER interpolate `process.env.NEXT_PUBLIC_APP_URL` directly inside
 * an email body. Use `appUrl()` or `portalUrl(token)` / `intakeUrl(token)`
 * etc.
 */
const CANONICAL = 'https://app.bodyrecode.au'

function safe(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) return CANONICAL
  // Reject anything that doesn't look like a real https URL pointing at a
  // real domain. Catches the historical Vercel deployment URL leak and any
  // future "http://localhost" leak from a broken env file.
  if (!raw.startsWith('https://')) return CANONICAL
  if (raw.includes('vercel.app')) return CANONICAL
  if (raw.includes('localhost')) return CANONICAL
  return raw.replace(/\/+$/, '')
}

/** Base URL for the client portal app. Always production-safe. */
export function appUrl(): string {
  return safe()
}

/** Build a full URL from a path. `path` may start with or without a slash. */
export function appUrlFor(path: string): string {
  const base = safe()
  const tail = path.startsWith('/') ? path : `/${path}`
  return `${base}${tail}`
}

/** Convenience helpers — most email builders want these specific shapes. */
export function portalUrl(onboardingToken: string): string {
  return `${safe()}/portal/${onboardingToken}`
}
export function portalLoginUrl(): string {
  return `${safe()}/portal/login`
}
export function intakeUrl(token: string): string {
  return `${safe()}/intake/${token}`
}
export function supplementaryIntakeUrl(token: string): string {
  return `${safe()}/intake-supplement/${token}`
}
