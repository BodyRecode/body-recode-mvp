import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
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

  if (page) {
    const admin = createAdminClient()
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('onboarding_token', token)
      .maybeSingle()

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
