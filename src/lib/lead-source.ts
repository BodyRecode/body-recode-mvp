/**
 * Lead source normalisation.
 *
 * `leads.source` is guarded by a CHECK constraint. Writing anything outside
 * the allowed set doesn't produce a warning or a null — the INSERT is rejected
 * outright, so the visitor sees "Failed to create lead." and the signup is
 * lost. There is no retry and nothing lands in the dashboard.
 *
 * That happened twice (found 2026-07-28, reported by someone who hit it from a
 * paid ad and messaged Kade on Instagram):
 *
 *   - /api/challenge/enroll wrote `source: 'meta'` for any visitor arriving
 *     with utm_source=meta. 'meta' was never in the allowed set, so paid Meta
 *     traffic could not enrol at all while organic traffic (which falls
 *     through to 'other') worked fine.
 *   - /api/funnels/[id]/submit wrote `source: 'funnel'`, also not allowed, so
 *     every funnel submission failed.
 *
 * Both are the same mistake: a literal typed at the call site that nothing
 * checks against the database. Route every source through here instead — an
 * unrecognised value degrades to 'other' and the signup still succeeds, which
 * is always better than losing a lead to keep a label tidy. The raw value is
 * preserved in `source_detail` / `utm_source` for reporting.
 */

/** Mirrors the leads_source_check constraint. Keep the two in step. */
export const ALLOWED_LEAD_SOURCES = new Set([
  'quiz',
  'instagram',
  'facebook',
  'linkedin',
  'google',
  'gym_floor',
  'referral',
  'direct',
  'other',
  'meta',
  'funnel',
])

/** Common aliases seen in ad URLs and utm parameters. */
const SOURCE_ALIASES: Record<string, string> = {
  fb: 'facebook',
  'facebook.com': 'facebook',
  ig: 'instagram',
  'instagram.com': 'instagram',
  meta_ads: 'meta',
  paid_social: 'meta',
  li: 'linkedin',
  adwords: 'google',
  gads: 'google',
  gym: 'gym_floor',
  qr: 'gym_floor',
}

/**
 * Coerce any incoming source string to one the database will accept.
 * Never throws, never returns an invalid value.
 */
export function normaliseLeadSource(raw: string | null | undefined): string {
  if (!raw) return 'other'
  const key = raw.trim().toLowerCase()
  if (ALLOWED_LEAD_SOURCES.has(key)) return key
  const aliased = SOURCE_ALIASES[key]
  if (aliased && ALLOWED_LEAD_SOURCES.has(aliased)) return aliased
  return 'other'
}
