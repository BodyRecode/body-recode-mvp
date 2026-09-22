import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoachScope } from '@/lib/coach-scope'
import { productTierForScope } from '@/lib/coach-tier'
import OperatorGuide from './operator-guide'
import CoachGuide from './coach-guide'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Guide' }

/**
 * Two guides behind one menu item, chosen by what the person bought.
 *
 * 22 September 2026, and this is the largest leak the page-by-page pass found.
 * It was not client data. It was the business.
 *
 * A PILOT COACH COULD READ KADE'S ENTIRE OPERATOR MANUAL. Ninety-four sections
 * across Flows, Coaching, Business, Content, Challenge, Blueprint and
 * Membership: the lead pipeline, the Zoom call script stage by stage, the
 * decision paths, and THE WHOLE PRICE LIST, from the $297 commencement fee
 * down. It opened by telling them this is "how the Body Recode Performance
 * Coaching system works", which is a different product from the one they have.
 *
 * Tier-gating the route was not the answer, because the menu item is right:
 * a coach SHOULD have a guide. They just need the guide to the thing they
 * bought. So the route branches, the way Today does.
 */
export default async function GuidePage() {
  const scope = await requireCoachScope()
  const tier = await productTierForScope(createAdminClient(), scope)
  return tier === 'owner' ? <OperatorGuide /> : <CoachGuide />
}
