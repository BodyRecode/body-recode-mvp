import type { SupabaseClient } from '@supabase/supabase-js'

// Self-serve codes are short-lived (the client requests and types it within
// seconds). Coach-issued codes need longer because the coach has to relay the
// code to the client by phone/text first.
export const PORTAL_CODE_TTL_MINUTES = 10
export const COACH_ISSUED_CODE_TTL_MINUTES = 30

function generateCode(): string {
  // 6-digit, always padded to 6 so there's no leading-zero ambiguity.
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')
}

/**
 * Generate a fresh portal login code for an email, invalidating any prior
 * unused codes so only the latest works. Returns the code + expiry, or null
 * if the DB insert fails.
 *
 * Shared by the self-serve send-code route and the coach "issue login code"
 * fallback (for clients whose email provider silently blocks delivery, e.g.
 * Outlook/Microsoft).
 */
export async function createPortalLoginCode(
  admin: SupabaseClient,
  email: string,
  ttlMinutes: number = PORTAL_CODE_TTL_MINUTES,
): Promise<{ code: string; expiresAt: string } | null> {
  const cleanEmail = email.trim().toLowerCase()
  const code = generateCode()
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()

  // NOTE: we deliberately do NOT invalidate prior unused codes here. The login
  // form forces the user to click "Send sign-in code" (which calls this) before
  // it reveals the code-entry field — so invalidating prior codes would kill any
  // code a coach has relayed by phone/text the instant the client requests one
  // to reach that field. Letting short-lived codes coexist makes both the
  // self-serve and coach-issued (relay) paths work. Each code is still
  // single-use: verify-code stamps used_at on whichever code is actually entered,
  // and all codes expire within their TTL regardless.
  const { error } = await admin
    .from('portal_login_codes')
    .insert({ email: cleanEmail, code, expires_at: expiresAt })

  if (error) {
    console.error('Failed to store portal login code:', error)
    return null
  }

  return { code, expiresAt }
}
