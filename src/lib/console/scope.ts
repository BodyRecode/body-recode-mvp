/**
 * The Operator Console's tenant boundary.
 *
 * This is the file the whole console rests on. Every tool resolves its scope
 * here and filters every query by it. Nothing in the console reads a coach id
 * out of the request body, the conversation, or a model argument — the scope
 * comes from the signed-in session and nowhere else.
 *
 * WHY IT IS ENFORCED HERE RATHER THAN IN THE PROMPT
 *
 * The console's whole point is that a licensee can talk to their business the
 * way Kade talks to Claude. That means untrusted text — a coach's question, a
 * lead's own words quoted back out of the database — reaches a model that is
 * holding tools which can read data. A system prompt saying "only ever look at
 * your own practice" is a request, and a request can be talked around. A WHERE
 * clause the model never sees cannot be.
 *
 * So the rule is: the model chooses WHICH tool to call and WHAT to look for.
 * It never chooses WHOSE data. That is decided before the model is reached and
 * applied after it has spoken.
 *
 * See src/lib/api-auth.ts for the same reasoning at the route layer. That guard
 * answers "is this person a coach"; this one answers "which practice are they".
 * Today those collapse into one another because there is one coach. They stop
 * collapsing the day a second practice's rows land in this database, which is
 * exactly when the console is being licensed.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'

export type ConsoleScope = {
  /** The auth user id. Every coach-owned row carries this as coach_id. */
  coachId: string
  /** Lower-cased, for audit rows and preference lookups. */
  email: string
  /** Service-role client. Scoping is the caller's job, not RLS's, on this one. */
  admin: SupabaseClient
}

export type ScopeResult =
  | { ok: true; scope: ConsoleScope }
  | { ok: false; status: number; error: string }

/**
 * Resolve the console scope for the current request.
 *
 * Two gates, deliberately both:
 *   1. Signed in at all.
 *   2. A coach — either on the allowlist, or owning at least one client row.
 *      This mirrors the `public.is_coach()` SQL helper so a route guard and an
 *      RLS policy agree on who counts.
 *
 * A portal client holds a valid Supabase session, so gate 1 alone would let
 * them in. That was the exact hole Security Sweep Phase 1 found repeated
 * across ~110 routes; it is not repeated here.
 */
export async function resolveConsoleScope(): Promise<ScopeResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, status: 401, error: 'Unauthorised' }

  const email = (user.email ?? '').toLowerCase()
  const admin = createAdminClient()

  if (isCoachEmail(email)) {
    return { ok: true, scope: { coachId: user.id, email, admin } }
  }

  // Not on the allowlist — does this user own any clients? A coach provisioned
  // through /signup passes here without being added to an env var.
  const { count } = await admin
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', user.id)

  if ((count ?? 0) > 0) {
    return { ok: true, scope: { coachId: user.id, email, admin } }
  }

  return { ok: false, status: 403, error: 'Coach access only' }
}

/**
 * Apply the scope to a query builder.
 *
 * Every console read goes through this. It exists as a named function rather
 * than an inline `.eq()` so that a tool missing its scope is visible when
 * reading the code, and greppable when auditing it: a query in this directory
 * that does not call `scoped()` is a bug, not a style choice.
 *
 * `column` is a parameter because ownership is not spelled the same everywhere
 * — most tables use coach_id; a few reach it through a join.
 *
 * On the unusual signature: the constraint used to be
 * `T extends { eq(column: string, value: unknown): T }`, which reads better but
 * made `tsc` fail with TS2589 (instantiation excessively deep) at the first
 * call site. Structurally checking Supabase's generated PostgrestFilterBuilder
 * against that constraint blows the depth limit. Keeping T unconstrained and
 * narrowing internally gives the same call-site ergonomics, the same return
 * type, and compiles.
 */
type EqQuery = { eq(column: string, value: unknown): unknown }

export function scoped<T>(
  query: T,
  scope: ConsoleScope,
  column = 'coach_id',
): T {
  return (query as EqQuery).eq(column, scope.coachId) as T
}
