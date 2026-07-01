/**
 * Coach allowlist used to bypass the portal "wrong account signed in" gate.
 *
 * Why this exists: every /portal/[token]/* page checks that the signed-in
 * email matches the client's email. When Kade clicks "Client view" from a
 * dashboard reading panel, he's signed in as the coach (kade.dunstone@gmail.com
 * or kade@bodyrecode.au), not as the client — so without a bypass he gets
 * blocked from previewing what the client sees.
 *
 * Override via COACH_EMAILS env var (comma-separated). Default covers the
 * personal email + the tenant coach email.
 */
import { coach } from '@/config/tenant'
const DEFAULT_COACH_EMAILS = ['kade.dunstone@gmail.com', coach().email]

const COACH_EMAILS: string[] = (process.env.COACH_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

const ALLOWED = COACH_EMAILS.length > 0 ? COACH_EMAILS : DEFAULT_COACH_EMAILS

export function isCoachEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ALLOWED.includes(email.toLowerCase())
}
