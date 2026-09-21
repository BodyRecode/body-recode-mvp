/**
 * Which product tier THIS SIGNED-IN COACH gets.
 *
 * 21 September 2026, found while making a test coach to walk the pilot
 * through. The tier system was complete, correct, carefully fail-closed, and
 * doing nothing at all.
 *
 * TWO FAULTS, EITHER OF WHICH WAS ENOUGH ON ITS OWN.
 *
 * First, the tier came from `getTenant()`, which reads the tenant resolved from
 * the HOST. A coach signing in on Kade's domain resolves to Kade's tenant, so
 * they were handed Kade's tier. The host says which brand the page wears. It
 * cannot say who is reading it.
 *
 * Second, `getTenant()` only consults the database when a feature flag is set,
 * and that flag has never been set in any environment. So it returned the
 * hard-coded Body Recode config, whose tier is `owner`. Every signed-in coach
 * was an owner: leads, ads, payments, revenue, the CRM, the strategy pages, all
 * of it.
 *
 * The client scoping closed on 19 September is not affected and still holds.
 * That stops a coach reaching another coach's CLIENTS. This is the other half:
 * stopping them reaching Kade's BUSINESS.
 *
 * THE RULE NOW: the tier is a property of the person signed in, read from their
 * own row, and it fails CLOSED. No row, an unreadable row, an unrecognised
 * value: all resolve to `interpret`, the least a coach can have. The previous
 * default failed open to `owner`, which is the worst possible direction for a
 * mistake to fall.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductTier } from '@/lib/product-tier'

const VALID: ProductTier[] = ['interpret', 'coach', 'owner']

/**
 * Read this coach's own tier.
 *
 * Never throws. A failure here must not lock a coach out of their own clients,
 * but it must not promote them either, so the failure case is the lowest tier
 * rather than no answer.
 */
export async function productTierForCoach(
  admin: SupabaseClient,
  coachId: string,
): Promise<ProductTier> {
  if (!coachId) return 'interpret'
  try {
    const { data, error } = await admin
      .from('tenant_config')
      .select('product_tier')
      .eq('coach_id', coachId)
      .maybeSingle()

    if (error || !data) return 'interpret'
    const tier = String(data.product_tier ?? '')
    return (VALID as string[]).includes(tier) ? (tier as ProductTier) : 'interpret'
  } catch {
    return 'interpret'
  }
}

/**
 * The tier for a resolved scope. Use this wherever a scope is already in hand.
 *
 * THE OWNER IS THE OWNER, 21 September 2026. Reading the tier from a coach's
 * own record was right, and it had one hole: Kade has two logins and only one
 * of them has a record. Signed in on the other, he was silently demoted to a
 * read-only coach and lost his own business pages and his co-pilot.
 *
 * The allowlist IS the definition of owner, so it does not need looking up. A
 * record can be missing, wrong or not created yet; being on the allowlist
 * cannot.
 */
export async function productTierForScope(
  admin: SupabaseClient,
  scope: { coachId: string; isOwner: boolean },
): Promise<ProductTier> {
  if (scope.isOwner) return 'owner'
  return productTierForCoach(admin, scope.coachId)
}
