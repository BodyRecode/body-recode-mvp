import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Baseline progress photos.
 *
 * These live in a PRIVATE bucket and are only ever served over short-lived
 * signed URLs. They were public until 2026-07-28, protected by nothing but an
 * unguessable UUID in the path — which meant any URL that leaked once (a
 * forwarded email, a screenshot, browser history on a shared machine) was
 * public permanently with no way to revoke it. Client body photos are close to
 * the most sensitive thing the platform holds.
 *
 * Rows written before that change store a full public-format URL; rows written
 * after store the object path. Both are handled here so no data migration was
 * needed and neither shape can break.
 */

const BUCKET = 'baseline-photos'

/** Normalises either a stored public URL or a bare object path to the object path. */
export function baselinePhotoPath(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null
  const value = urlOrPath.trim()
  if (!value) return null
  // Legacy full URL: .../object/public/baseline-photos/<path>
  const marker = `/${BUCKET}/`
  const idx = value.indexOf(marker)
  if (idx !== -1) return value.slice(idx + marker.length)
  // Already a path.
  return value.replace(/^\/+/, '')
}

/**
 * Signs a single baseline photo for viewing. Returns null when there is no
 * photo or the object is missing, so callers can render an empty state rather
 * than a broken image.
 */
export async function signedBaselinePhotoUrl(
  admin: SupabaseClient,
  urlOrPath: string | null | undefined,
  expiresInSeconds = 60 * 60,
): Promise<string | null> {
  const path = baselinePhotoPath(urlOrPath)
  if (!path) return null
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error || !data?.signedUrl) {
    console.warn('[baseline-photos] could not sign:', path, error?.message)
    return null
  }
  return data.signedUrl
}

/** Signs the front/side/back set in one go. */
export async function signedBaselinePhotoSet(
  admin: SupabaseClient,
  baseline: {
    photo_front_url?: string | null
    photo_side_url?: string | null
    photo_back_url?: string | null
  } | null | undefined,
  expiresInSeconds = 60 * 60,
): Promise<{ front: string | null; side: string | null; back: string | null }> {
  if (!baseline) return { front: null, side: null, back: null }
  const [front, side, back] = await Promise.all([
    signedBaselinePhotoUrl(admin, baseline.photo_front_url, expiresInSeconds),
    signedBaselinePhotoUrl(admin, baseline.photo_side_url, expiresInSeconds),
    signedBaselinePhotoUrl(admin, baseline.photo_back_url, expiresInSeconds),
  ])
  return { front, side, back }
}
