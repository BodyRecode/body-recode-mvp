import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * The single gate for every API route that performs a coach action.
 *
 * Written 2026-08-06 during Security Sweep Phase 1, because an audit of all 275
 * routes under src/app/api found the same hole repeated ~110 times.
 *
 * The hole: a route checks `getUser()` and stops there. That reads as an auth
 * check, and it is — but it is not an authorisation check. Portal clients sign
 * in through Supabase Auth, so they hold the `authenticated` role and a valid
 * session. `getUser()` returns a user for them too. Every route that then went
 * on to use `createAdminClient()` (service role, which bypasses RLS entirely)
 * was therefore executable by any signed-in client against any client's data —
 * reading another client's blood panel, offboarding them, sending email as the
 * coach.
 *
 * `requirePortalClient` in portal-guard.ts is the mirror of this for pages the
 * client is meant to see. This is the coach side, for routes they are not.
 *
 * Who counts as a coach:
 *   1. An email on the COACH_EMAILS allowlist (Kade), or
 *   2. Anyone who owns at least one `clients` row via `clients.coach_id`
 *
 * Rule 2 matches the semantics of the `public.is_coach()` SQL helper that the
 * Phase 0 RLS policies use, so a route guard and a policy agree on who a coach
 * is. It also means a coach provisioned through /api/coach/signup passes
 * without being added to an env var.
 *
 * ⚠️ Neither rule scopes a coach to THEIR OWN clients. Under one coach that is
 * the same thing. It stops being the same thing the day a second coach's
 * clients land in this database — see Security Sweep Phase 3.3, multi-tenant
 * boundary, which must be closed before the Collective ships.
 *
 * Usage — the failure case cannot be forgotten, because `gate.ok` narrows:
 *
 *   const gate = await requireCoach()
 *   if (!gate.ok) return gate.response
 *   // gate.email and gate.userId are available here
 */

export type CoachGate =
  | { ok: true; userId: string; email: string }
  | { ok: false; response: NextResponse }

/** Minimal shape of a Supabase user — avoids importing the full type. */
interface AuthedUser {
  id: string
  email?: string | null
}

/**
 * Is this already-resolved user a coach?
 *
 * Separate from `requireCoach()` so a route that has already called
 * `getUser()` can authorise without paying for a second auth round trip. Most
 * of the routes hardened in Phase 1 are in exactly that position.
 */
export async function isCoachUser(user: AuthedUser | null | undefined): Promise<boolean> {
  if (!user) return false
  if (isCoachEmail(user.email)) return true

  // Not on the allowlist. Fall back to "owns at least one client", which is how
  // the database decides the same question. Uses the admin client on purpose:
  // the `clients` RLS policy would filter this lookup and return zero rows for
  // the very people it is meant to identify.
  const admin = createAdminClient()
  const { count } = await admin
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', user.id)

  return (count ?? 0) > 0
}

/** The 403 every coach-only route returns. Kept identical across routes. */
export function forbidden(): NextResponse {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function requireCoach(): Promise<CoachGate> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }),
    }
  }

  if (await isCoachUser(user)) {
    return { ok: true, userId: user.id, email: (user.email ?? '').toLowerCase() }
  }

  return { ok: false, response: forbidden() }
}

/**
 * Gate for maintenance and backfill routes that are run by hand rather than
 * from the dashboard — one-off scripts, resends, retriggers.
 *
 * Accepts either a signed-in coach or a shared `ADMIN_SECRET`, because some of
 * these are invoked with curl from a terminal where there is no session. The
 * secret is compared in constant time so the endpoint cannot be used as an
 * oracle to recover it a byte at a time.
 */
export async function requireCoachOrAdminSecret(req: Request): Promise<CoachGate> {
  const expected = process.env.ADMIN_SECRET
  if (expected) {
    const supplied =
      req.headers.get('x-admin-secret') ??
      new URL(req.url).searchParams.get('secret') ??
      ''
    if (supplied && timingSafeEqual(supplied, expected)) {
      return { ok: true, userId: 'admin-secret', email: 'admin-secret' }
    }
  }
  return requireCoach()
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
