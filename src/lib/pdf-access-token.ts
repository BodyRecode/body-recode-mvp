import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Short-lived signed token that lets the PDF renderer's headless browser load a
 * protected page.
 *
 * Why this exists. renderDashboardPdf forwards the CALLER'S SESSION COOKIES to
 * puppeteer so the browser can load a dashboard route as that user. That works
 * for a signed-in coach and fails silently for a server-side caller: with no
 * cookies the browser loads the page as a stranger, gets redirected to /login,
 * and photographs the sign-in screen. The result is a valid PDF with entirely
 * the wrong contents, which is exactly what shipped on 2026-08-01.
 *
 * Opening the API route to a bearer token was only half the fix. The browser
 * needs a way in too.
 *
 * The token is HMAC-signed with CRON_SECRET, scoped to ONE path, and expires in
 * sixty seconds, which is longer than a render and far too short to be useful
 * if it leaks. It appears only in the URL the server hands to its own headless
 * browser, never in anything a person sees or clicks.
 */

const TTL_SECONDS = 60

function secret(): string {
  const s = process.env.CRON_SECRET
  if (!s) throw new Error('CRON_SECRET is required to sign PDF access tokens')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

/**
 * @param path the exact pathname the browser will load, e.g.
 *             /dashboard/clients/abc/foundational-reading-preview
 */
export function createPdfAccessToken(path: string, now: Date = new Date()): string {
  const exp = Math.floor(now.getTime() / 1000) + TTL_SECONDS
  const payload = `${path}|${exp}`
  return `${exp}.${sign(payload)}`
}

/** True only for an unexpired signature over this exact path. */
export function verifyPdfAccessToken(token: string | null | undefined, path: string, now: Date = new Date()): boolean {
  if (!token) return false
  const [expRaw, sig] = token.split('.')
  if (!expRaw || !sig) return false

  const exp = Number(expRaw)
  if (!Number.isFinite(exp)) return false
  if (exp < Math.floor(now.getTime() / 1000)) return false

  let expected: string
  try { expected = sign(`${path}|${exp}`) } catch { return false }

  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export const PDF_TOKEN_PARAM = 'pdfToken'
