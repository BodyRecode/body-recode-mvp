import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * The single gate for every portal page that shows a client anything personal.
 *
 * Written 2026-08-01 while building offboarding, because offboarding could not
 * be made airtight without it.
 *
 * An audit of the portal found 17 pages with no session check at all. They were
 * gated only by knowing the token in the URL, and around twelve of them carry
 * personal or health information: progress photos, the health declaration, the
 * medical clearance, the signed agreement, the training program, the nutrition
 * plan, check-in history. Anyone holding a client's portal link could read all
 * of it without ever logging in.
 *
 * That is a standing privacy problem on its own. It also made offboarding a
 * fiction: banning a client's login does nothing to a page that never asks who
 * is looking, so a bookmarked URL keeps working after the engagement ends. The
 * only lever that worked was rotating the token, which is a workaround for a
 * missing gate rather than a gate.
 *
 * Three checks, in order:
 *   1. Is anyone signed in at all?
 *   2. Is the signed-in person THIS client (or a coach)?
 *   3. Has the engagement ended?
 *
 * Check 3 is what makes offboarding real. Revoking access becomes a property of
 * the client record rather than a race to invalidate every URL they ever held.
 */

export interface PortalClient {
  id: string
  /**
   * Nullable in the database, but every portal page treats it as a string and
   * supplies its own fallback. Coalesced once here rather than asserted at a
   * dozen call sites.
   */
  name: string
  email: string | null
  onboarding_token: string
  active: boolean
  ended_at: string | null
  /** True when a coach is viewing a client's portal rather than the client. */
  viewedByCoach: boolean
}

/**
 * Resolve and authorise the client behind a portal token.
 *
 * Redirects or 404s rather than returning null, so a page can use the result
 * directly and cannot forget to handle the unauthorised case.
 *
 * @param extraColumns additional client columns the page needs, comma separated
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function requirePortalClient(
  token: string,
  extraColumns = '',
): Promise<PortalClient & Record<string, any>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const base = 'id, name, email, onboarding_token, active, ended_at'
  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select(extraColumns ? `${base}, ${extraColumns}` : base)
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()

  const c = client as unknown as PortalClient
  const userEmail = (user.email ?? '').toLowerCase()
  const viewedByCoach = isCoachEmail(userEmail)

  // Signed in as someone else entirely.
  if (userEmail !== (c.email ?? '').toLowerCase() && !viewedByCoach) {
    redirect(`/portal/${token}`)
  }

  // Engagement ended. The coach keeps access because the records are retained
  // and they may need to read them; the client does not.
  if (c.ended_at && !viewedByCoach) {
    redirect('/portal/ended')
  }

  return {
    ...(client as unknown as PortalClient & Record<string, any>),
    name: c.name ?? '',
    viewedByCoach,
  }
}
