import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { portalFeaturesForClient } from '@/lib/portal-features'

/**
 * One gate over every page in a client's portal.
 *
 * 21 September 2026. Hiding a link on the portal home is presentation. Somebody
 * can still type the address, and more to the point a link from an older email
 * still points at it. This is the enforcement, and it is written once here so a
 * page added next month is covered before anybody remembers to think about it.
 *
 * What it enforces: a client is offered only what HER OWN COACH is licensed to
 * give her. A read-only coach's client has no eating plan, no daily sequences,
 * no supplement stack, no recovery protocols and no sessions, because nobody
 * can produce them for her. Sending her to a page that cannot exist is worse in
 * front of a client than in front of a coach.
 *
 * It deliberately does NOT authenticate. Each page already calls the portal
 * guard, which decides whether this person may see this client at all. This
 * decides something different: whether this PAGE is part of her coach's
 * product. Doing auth here as well would put the same check in two places and
 * invite them to disagree.
 */

const PRESCRIPTION_PAGES = [
  'my-plan',
  'nutrition',
  'program',
  'training',
  'routine',
  'recovery',
  'supplements',
  'sessions',
]

const OUT_OF_PRODUCT: Record<string, keyof Awaited<ReturnType<typeof portalFeaturesForClient>>> = {
  message: 'messaging',
  'medications-reading': 'medicationsReading',
  resources: 'resources',
  guides: 'resources',
  feedback: 'feedback',
}

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const pathname = (await headers()).get('x-pathname') ?? ''

  // The first segment after the token is the page. The portal home has none.
  const after = pathname.split(`/portal/${token}`)[1] ?? ''
  const page = after.split('/').filter(Boolean)[0]

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, email, ended_at, frozen_at')
    .eq('onboarding_token', token)
    .maybeSingle()

  /**
   * THE ENDED AND FROZEN GATE, IN ONE PLACE.
   *
   * 23 September 2026. There was a guard that did this and it was applied to
   * TWELVE of the forty-one portal pages. The twenty-nine without it included
   * the foundational read, the progress read, bloods and nutrition, and none
   * of them checked whether the engagement had ended: they checked that
   * somebody was signed in and that the email matched.
   *
   * So the only thing stopping an offboarded client from opening their read
   * was the BAN ON THEIR LOGIN, applied at offboarding. A ban is not a gate.
   * It is the blunt instrument you reach for when there is no gate, and it
   * cost this: a client who cancelled from her own portal was met with
   * "your account is disabled" rather than the page written to explain it.
   *
   * Signing in does not even need the old link. The auth callback looks a
   * client up by email and redirects to their CURRENT token, so rotating the
   * token on offboarding protects nothing either.
   *
   * Done in the layout because the layout runs for every page under the token,
   * including the portal home, which the old guard's own callers missed.
   * A coach keeps access: the records are retained and they may need to read
   * them.
   */
  if (client?.ended_at || client?.frozen_at) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const viewedByCoach = isCoachEmail(user?.email)
    if (!viewedByCoach) {
      redirect(client.ended_at ? '/portal/ended' : '/portal/frozen')
    }
  }

  if (page) {
    if (client) {
      const features = await portalFeaturesForClient(admin, client.id as string)

      if (PRESCRIPTION_PAGES.includes(page) && !features.prescription) {
        redirect(`/portal/${token}`)
      }
      const flag = OUT_OF_PRODUCT[page]
      if (flag && !features[flag]) {
        redirect(`/portal/${token}`)
      }
    }
  }

  return <>{children}</>
}
