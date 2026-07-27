import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Per-client "Blood Test Request - For My GP" PDF.
 *
 * This is the second half of the two-doc bloodwork split. The general
 * education pack ("Understanding your baseline bloodwork") is gender-gated
 * and shared across all clients; THIS document is written per client, names
 * them, and reflects their own history — so it lives under a client-scoped
 * path in the private library-assets bucket and is only ever served over a
 * short-lived signed URL.
 *
 * Presence is probed from storage rather than tracked in a column: the coach
 * builds these by hand from the BR ops PDF pipeline and uploads them, so the
 * file existing IS the source of truth. No migration, nothing to keep in sync.
 */

const BUCKET = 'library-assets'
const FOLDER = 'gp-requests'

export function gpRequestPath(clientId: string): string {
  return `${FOLDER}/${clientId}.pdf`
}

/**
 * Returns a signed URL for the client's GP request PDF, or null if they don't
 * have one. Served inline (not as an attachment) so the browser's PDF viewer
 * renders it and the client can print straight from there.
 */
export async function getGpRequestUrl(
  admin: SupabaseClient,
  clientId: string,
  expiresInSeconds = 60 * 60 * 24,
): Promise<string | null> {
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(gpRequestPath(clientId), expiresInSeconds)

  // A missing object surfaces as an error here, which is the "no GP request
  // for this client" case — not something worth logging as a failure.
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
