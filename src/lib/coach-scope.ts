import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Which clients this coach may see.
 *
 * WHY THIS EXISTS (17 September 2026): access to a client record was decided by
 * "is this person a coach", never "is this client theirs". Forty-eight dashboard
 * files read the clients table and not one filtered on coach_id, and the pages
 * use the service-role connection, which bypasses row level security. With one
 * coach that was harmless. The moment a second coach signs in it is a health
 * information breach, and a notifiable one.
 *
 * Nothing about the coach SaaS pilot can ship until every client-scoped read
 * goes through this.
 *
 * THE MODEL:
 *   - The owner (an address on the coach allowlist) sees everything. That is
 *     Kade, and the platform is his.
 *   - Every other coach sees only clients whose coach_id is their user id.
 *
 * WHERE IT IS ENFORCED:
 *   1. The dashboard layout, which now requires a coach rather than any signed
 *      in person.
 *   2. The client record layout, which refuses a client that is not theirs.
 *      One check covers every page under it, the same way the product tier gate
 *      covers every dashboard page.
 *   3. List pages, which filter with `scopeClientQuery`.
 *   4. API routes under a client id, via `assertApiOwnsClient`.
 *
 * Defence in depth, not one clever gate: a page added later that forgets this
 * is still behind the layout check.
 */

export interface CoachScope {
  /** The signed-in coach's user id. Clients are owned by this. */
  coachId: string
  email: string
  /** Owner sees every client. Everyone else sees their own. */
  isOwner: boolean
}

/**
 * For server components. Sends anyone who is not a coach to the login page.
 * Returns the scope so the caller can filter with it.
 */
export async function requireCoachScope(): Promise<CoachScope> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = (user.email ?? '').toLowerCase()
  if (isCoachEmail(email)) {
    return { coachId: user.id, email, isOwner: true }
  }

  // Not the owner. A coach is someone who owns at least one client, which is
  // how the database answers the same question.
  const admin = createAdminClient()
  const { count } = await admin
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', user.id)

  if (!count) redirect('/login')

  return { coachId: user.id, email, isOwner: false }
}

/**
 * The coach_id a query should filter on, or null when this coach sees
 * everything.
 *
 * Deliberately a value rather than a query wrapper: wrapping the Supabase
 * builder in a generic made TypeScript give up on the larger dashboard queries
 * ("type instantiation is excessively deep"). A value keeps every call site
 * readable and the types simple:
 *
 *   let q = admin.from('clients').select('...')
 *   const only = coachFilter(scope)
 *   if (only) q = q.eq('coach_id', only)
 */
export function coachFilter(scope: CoachScope): string | null {
  return scope.isOwner ? null : scope.coachId
}

/**
 * For a page that renders one client. Returns the client's coach_id, or shows
 * the not-found page if this coach may not see them.
 *
 * Not-found rather than forbidden on purpose: a coach poking at identifiers
 * should not be able to learn which ones exist.
 */
export async function assertOwnsClient(clientId: string, scope: CoachScope): Promise<void> {
  if (scope.isOwner) return

  const admin = createAdminClient()
  const { data } = await admin
    .from('clients')
    .select('coach_id')
    .eq('id', clientId)
    .maybeSingle()

  if (!data || data.coach_id !== scope.coachId) notFound()
}

/**
 * The same question for an API route, where redirecting is wrong. Returns true
 * when the caller may act on this client.
 */
export async function coachOwnsClient(clientId: string, userId: string, email: string | null): Promise<boolean> {
  if (isCoachEmail(email)) return true

  const admin = createAdminClient()
  const { data } = await admin
    .from('clients')
    .select('coach_id')
    .eq('id', clientId)
    .maybeSingle()

  return !!data && data.coach_id === userId
}
