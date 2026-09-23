import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Finding a login by email, without lying about it.
 *
 * 23 September 2026. Every caller did the same thing: ask for a page of users,
 * take `data`, and search it. None checked `error`. When the listing failed
 * they got `undefined`, searched nothing, found nothing, and concluded THE
 * PERSON DOES NOT EXIST.
 *
 * That is not hypothetical. One account carried the Postgres value `infinity`
 * in `banned_until`, which the auth service cannot deserialise, so every page
 * containing that row failed. For two months:
 *
 *   - the test-coach tool reported "No test coach exists" while the account
 *     was sitting there, and only the next step failing with "already
 *     registered" gave it away
 *   - OFFBOARDING SILENTLY DID NOT BAN THE LOGIN, and reported the step as
 *     "no auth account found", which reads like a fact rather than a failure
 *
 * SO: this throws on a failure and pages properly. A caller that cannot find
 * somebody now learns whether that is because they are not there or because
 * the question could not be answered. Those are different answers and they
 * were being given the same one.
 *
 * Page size is deliberately small. The listing fails for the WHOLE page when
 * one row in it is unreadable, so a smaller page loses less, and a row that
 * cannot be read no longer takes the rest of the system down with it.
 */
export async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<{ id: string; email: string } | null> {
  const wanted = email.trim().toLowerCase()
  if (!wanted) return null

  const PER_PAGE = 50
  let unreadablePages = 0

  for (let page = 1; page <= 400; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE })

    if (error) {
      // One bad row breaks its whole page. Note it and keep going, so a single
      // unreadable account cannot hide everybody who comes after it.
      unreadablePages++
      continue
    }

    const users = data?.users ?? []
    const hit = users.find(u => (u.email ?? '').toLowerCase() === wanted)
    if (hit) return { id: hit.id, email: hit.email ?? wanted }

    if (users.length < PER_PAGE) {
      if (unreadablePages > 0) {
        // Absence is only a fact if everything was readable.
        throw new Error(
          `Could not read ${unreadablePages} page(s) of the login list, so "${email}" cannot be reported as missing. ` +
          `This usually means one account has an unreadable value, such as banned_until set to infinity.`,
        )
      }
      return null
    }
  }

  throw new Error(`Gave up looking for "${email}" after 400 pages.`)
}

/**
 * Every login we can read, and an honest count of what we could not.
 *
 * For callers that need the whole list rather than one person. The count
 * matters: a page that builds "last signed in" from this and gets an empty
 * list will show EVERY tenant as never having signed in, which is a wrong
 * answer wearing the clothes of a fact. Worse on a health page than anywhere
 * else, because the whole point of it is to be believed.
 */
export async function listAuthUsers(
  admin: SupabaseClient,
): Promise<{ users: Array<{ id: string; email: string | null; lastSignInAt: string | null }>; unreadablePages: number }> {
  const PER_PAGE = 50
  const users: Array<{ id: string; email: string | null; lastSignInAt: string | null }> = []
  let unreadablePages = 0

  for (let page = 1; page <= 400; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (error) { unreadablePages++; continue }
    const batch = data?.users ?? []
    for (const u of batch) {
      users.push({ id: u.id, email: u.email ?? null, lastSignInAt: u.last_sign_in_at ?? null })
    }
    if (batch.length < PER_PAGE) break
  }

  return { users, unreadablePages }
}
