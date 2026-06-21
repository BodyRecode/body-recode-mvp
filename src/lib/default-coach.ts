/**
 * Resolve the default coach user id used by PUBLIC lead-creation surfaces
 * (scorecard, challenge enrol, book, book-request, submit-check-in) where
 * no authenticated coach session exists. Returns the same user id every
 * call within a process (module-level cache).
 *
 * Resolution order:
 *   1. process.env.DEFAULT_COACH_USER_ID — explicit override, used when
 *      the system goes multi-tenant and routes need to pick a tenant.
 *   2. The most-common coach_id on the clients table — works automatically
 *      while the system is single-coach.
 *
 * Returns null only if neither is available (fresh DB, no clients, no env).
 * Callers should treat null as "leave coach_id null and surface the gap"
 * rather than guess.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

let cached: string | null | undefined

export async function getDefaultCoachId(admin: SupabaseClient): Promise<string | null> {
  if (cached !== undefined) return cached

  const fromEnv = process.env.DEFAULT_COACH_USER_ID?.trim()
  if (fromEnv) {
    cached = fromEnv
    return cached
  }

  const { data } = await admin
    .from('clients')
    .select('coach_id')
    .not('coach_id', 'is', null)
    .limit(50)

  if (!data?.length) {
    cached = null
    return cached
  }

  // Pick the most frequent coach_id in case multi-coach data exists.
  const counts = new Map<string, number>()
  for (const row of data) {
    if (!row.coach_id) continue
    counts.set(row.coach_id, (counts.get(row.coach_id) ?? 0) + 1)
  }
  let bestId: string | null = null
  let bestCount = 0
  for (const [id, n] of counts) {
    if (n > bestCount) { bestId = id; bestCount = n }
  }
  cached = bestId
  return cached
}
