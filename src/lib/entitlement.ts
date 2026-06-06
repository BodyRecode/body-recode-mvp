// Phase A Entitlement model — Field Guides + Bolt Ons.
//
// Decisions A1 + B1 + C3 locked 2026-06-06 in:
//   ~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-06-06_Phase_A_Reconcile.md
//
// Two questions this file answers:
//
//   1. hasEntitlement(identifier, productId) — "can this person access
//      this digital asset?" Yes if they have an active membership
//      (members get the whole library free) OR they have a paid purchase
//      row keyed off their email or client_id.
//
//   2. entitlementToken(identifier, productId) — what URL token grants
//      access? Returns the active Membership token if they are a member,
//      OR the digital_asset_purchases.id if they bought it directly,
//      OR null if no entitlement. Used by the delivery email to build
//      the reader link.

import { createAdminClient } from './supabase/admin'

export type EntitlementIdentifier = {
  clientId?: string | null
  email?: string | null
}

/**
 * Does this person have access to this digital-asset product?
 *
 * Active-membership bypass: if the identifier resolves to an active or
 * trialing membership_enrollments row, returns true for ANY field_guide
 * or protocol product (the whole library ships free with Membership).
 * Bolt-on kinds are NOT included in the bypass — those are paid
 * individually even by members.
 */
export async function hasEntitlement(
  identifier: EntitlementIdentifier,
  productId: string,
): Promise<boolean> {
  const admin = createAdminClient()

  // Need at least one identifier
  if (!identifier.clientId && !identifier.email) return false

  // 1. Look up the product's kind. Members bypass only for field_guide + protocol.
  const { data: product } = await admin
    .from('be_products')
    .select('id, kind')
    .eq('id', productId)
    .maybeSingle()
  if (!product) return false

  const isLibraryAsset = product.kind === 'field_guide' || product.kind === 'protocol'

  // 2. Active-membership bypass for library assets.
  if (isLibraryAsset) {
    const member = await lookupActiveMembership(identifier)
    if (member) return true
  }

  // 3. Direct-purchase check (any kind).
  const purchaseQuery = admin
    .from('digital_asset_purchases')
    .select('id')
    .eq('product_id', productId)
    .in('status', ['paid', 'fulfilled'])
    .limit(1)

  if (identifier.clientId) {
    const { data } = await purchaseQuery.eq('client_id', identifier.clientId)
    if (data && data.length > 0) return true
  }
  if (identifier.email) {
    const { data } = await purchaseQuery.ilike('email_at_purchase', identifier.email.toLowerCase().trim())
    if (data && data.length > 0) return true
  }

  return false
}

/**
 * What URL token grants this person access to the asset?
 *
 * Preference order:
 *   1. Active Membership token (if they are a member AND the asset is a
 *      library kind — field_guide / protocol).
 *   2. digital_asset_purchases.id (if they bought it directly).
 *
 * Returns null if no entitlement exists.
 */
export async function entitlementToken(
  identifier: EntitlementIdentifier,
  productId: string,
): Promise<string | null> {
  const admin = createAdminClient()

  if (!identifier.clientId && !identifier.email) return null

  const { data: product } = await admin
    .from('be_products')
    .select('id, kind')
    .eq('id', productId)
    .maybeSingle()
  if (!product) return null

  const isLibraryAsset = product.kind === 'field_guide' || product.kind === 'protocol'

  if (isLibraryAsset) {
    const member = await lookupActiveMembership(identifier)
    if (member?.token) return member.token
  }

  const purchaseQuery = admin
    .from('digital_asset_purchases')
    .select('id')
    .eq('product_id', productId)
    .in('status', ['paid', 'fulfilled'])
    .limit(1)

  if (identifier.clientId) {
    const { data } = await purchaseQuery.eq('client_id', identifier.clientId)
    if (data && data.length > 0) return data[0].id
  }
  if (identifier.email) {
    const { data } = await purchaseQuery.ilike('email_at_purchase', identifier.email.toLowerCase().trim())
    if (data && data.length > 0) return data[0].id
  }

  return null
}

/**
 * Backfill digital_asset_purchases.client_id rows that were created with a
 * null client_id (cold buyers) when the same email later signs up for an
 * account. Called from the Membership Stripe webhook handler (and any
 * other path that creates a clients row from a previously-cold email).
 *
 * Returns the number of rows backfilled.
 */
export async function backfillColdBuyerPurchases(
  clientId: string,
  email: string,
): Promise<number> {
  const admin = createAdminClient()
  const normalised = email.toLowerCase().trim()
  const { data, error } = await admin
    .from('digital_asset_purchases')
    .update({ client_id: clientId })
    .is('client_id', null)
    .ilike('email_at_purchase', normalised)
    .select('id')
  if (error) {
    console.error('[entitlement] backfillColdBuyerPurchases error:', error)
    return 0
  }
  return data?.length ?? 0
}

// ─── internal helpers ────────────────────────────────────────────────────

async function lookupActiveMembership(
  identifier: EntitlementIdentifier,
): Promise<{ token: string } | null> {
  const admin = createAdminClient()
  const select = 'token, cancelled_at'

  if (identifier.clientId) {
    const { data: client } = await admin
      .from('clients')
      .select('email')
      .eq('id', identifier.clientId)
      .maybeSingle()
    if (client?.email) {
      const { data } = await admin
        .from('membership_enrollments')
        .select(select)
        .ilike('email', client.email)
        .is('cancelled_at', null)
        .maybeSingle()
      if (data?.token) return { token: data.token }
    }
  }

  if (identifier.email) {
    const { data } = await admin
      .from('membership_enrollments')
      .select(select)
      .ilike('email', identifier.email.toLowerCase().trim())
      .is('cancelled_at', null)
      .maybeSingle()
    if (data?.token) return { token: data.token }
  }

  return null
}
