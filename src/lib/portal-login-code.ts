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

  // Invalidate any existing unused codes for this email so only the latest works.
  await admin
    .from('portal_login_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('email', cleanEmail)
    .is('used_at', null)

  const { error } = await admin
    .from('portal_login_codes')
    .insert({ email: cleanEmail, code, expires_at: expiresAt })

  if (error) {
    console.error('Failed to store portal login code:', error)
    return null
  }

  return { code, expiresAt }
}
