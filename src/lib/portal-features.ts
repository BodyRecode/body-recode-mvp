/**
 * What a client sees in her portal depends on what HER COACH licenses.
 *
 * 21 September 2026. Kade: *"this should have already been addressed"*, and he
 * is right. The product tier work covered the dashboard only. The portal was
 * never wired to it, so a pilot coach's client would have opened her portal and
 * found Nutrition plan, Daily sequences, Recovery protocols, Supplement stack
 * and Your sessions, none of which her coach can produce. Tabs leading nowhere,
 * in front of the client rather than the coach, which is the worse audience.
 *
 * And a second decision the same day, Kade: *"the client only uses the software
 * to complete the intake and the weekly checkins"*. Messaging her coach through
 * the portal is out. She already has her coach's phone number.
 *
 * THE RULE: the portal offers a client only what her own coach is licensed to
 * give her. Read from her coach's record, and fails CLOSED, so a client whose
 * coach cannot be resolved sees the interpretation half and nothing else.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { tierAllows, type ProductTier } from '@/lib/product-tier'
import { productTierForCoach } from '@/lib/coach-tier'

export type PortalFeatures = {
  tier: ProductTier
  /** Training blocks, eating plans, supplements, recovery, daily sequences. */
  prescription: boolean
  /** Free-text conversation with the coach. Out of the product entirely. */
  messaging: boolean
  /** Body Recode's own written material, which is ours rather than the coach's. */
  resources: boolean
  /** Asking her what she thinks of the product. Ours, not the coach's. */
  feedback: boolean
  /**
   * A separate written interpretation of what she takes.
   *
   * OUT, Kade 21 Sep 2026: "this crosses over from our area". Reading somebody's
   * medicines back to them is closer to a pharmacist's job than a coach's.
   *
   * Her medicines are still COLLECTED at intake and still drive the safety
   * gates, which is what stops a read telling a woman on spironolactone to add
   * potassium. Only the document she reads is gone.
   */
  medicationsReading: boolean
}

/**
 * Resolve what this client's portal may offer.
 *
 * Never throws. A failure returns the smallest product rather than the largest,
 * because the cost of showing too little is a missing link and the cost of
 * showing too much is a client asking her coach for something he cannot give.
 */
export async function portalFeaturesForClient(
  admin: SupabaseClient,
  clientId: string,
): Promise<PortalFeatures> {
  const closed: PortalFeatures = {
    tier: 'interpret',
    prescription: false,
    messaging: false,
    resources: false,
    feedback: false,
    medicationsReading: false,
  }

  try {
    const { data: client } = await admin
      .from('clients')
      .select('coach_id')
      .eq('id', clientId)
      .maybeSingle()

    const coachId = client?.coach_id as string | undefined
    if (!coachId) return closed

    const tier = await productTierForCoach(admin, coachId)
    const isOwner = tier === 'owner'

    return {
      tier,
      // Everything prescriptive needs the coaching layer at least.
      prescription: tierAllows(tier, 'coach'),
      // Messaging is not a tier question. It is out of the product, and stays
      // only for Kade's own clients, who have been using it.
      messaging: isOwner,
      resources: isOwner,
      feedback: isOwner,
      medicationsReading: isOwner,
    }
  } catch {
    return closed
  }
}
