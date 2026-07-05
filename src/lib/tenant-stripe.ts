/**
 * Tenant-aware Stripe helpers.
 *
 * Two payment flows:
 *
 * 1. **Tenant's clients pay the TENANT (Direct Charges via Connect Standard).**
 *    When `tenant.licence.stripeAccountId` is set, checkout callsites can pass
 *    `stripeAccount: acct_...` on Stripe API calls to charge the tenant's
 *    connected account directly. Platform fees applied via
 *    `application_fee_amount`. Requires Kade's connected account to be
 *    activated on Stripe Connect ("Standard" account type — one-off setup on
 *    dashboard.stripe.com/connect).
 *
 * 2. **Tenant pays KADE for platform.** Separate integration (Kade's Stripe
 *    against Kade's own products for setup + subscription + per-active-client
 *    metering). Not in this file.
 *
 * BR is always `stripeAccountId: null` and every existing callsite continues
 * using `process.env.STRIPE_SECRET_KEY` directly — nothing about BR flows
 * changes. Only when a new tenant onboards + a specific checkout callsite is
 * updated to pass the tenant context will the split take effect.
 *
 * Refactoring the 15 existing callsites to accept a tenant context is
 * deliberately deferred — needs per-callsite decisions on which flows should
 * remain platform-billed vs tenant-billed (e.g. bolt-on store is BR content,
 * not a tenant's product).
 */

import Stripe from 'stripe'
import { getTenant } from '@/config/tenant'

/**
 * Returns a Stripe SDK instance. If a tenant has a Connect account, the
 * caller MUST pass `{stripeAccount}` on individual API calls (not baked into
 * the instance) to route charges to that account via Direct Charges. This
 * helper centralises the API version + secret key resolution.
 */
export function stripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // Pin API version once per project. Sync to installed @types/stripe.
    // Leave undefined to use the SDK default.
  })
}

/**
 * Returns the Stripe Connect account id for the current tenant, or null if
 * BR (or any tenant that hasn't onboarded). Use to attach `{stripeAccount}`
 * on payment/customer API calls that should route to the tenant.
 */
export function tenantStripeAccountId(): string | null {
  const t = getTenant()
  return t.licence.stripeAccountId ?? null
}

/**
 * Returns { platform: true } for BR / unconnected tenants (no stripeAccount
 * options needed) or { platform: false, stripeAccount: acct_... } for a
 * tenant with a live Connect account. Call sites can spread this into their
 * options: `stripe().checkout.sessions.create({...}, ctx.stripeAccount ? {stripeAccount: ctx.stripeAccount} : undefined)`.
 */
export function tenantStripeContext(): { platform: true } | { platform: false; stripeAccount: string } {
  const acct = tenantStripeAccountId()
  if (!acct) return { platform: true }
  return { platform: false, stripeAccount: acct }
}

/**
 * Whether the current tenant has an active Stripe Connect account.
 * "active" means Stripe accepted charges_enabled after onboarding completed.
 * Any other state (pending, restricted, null) → returns false and callers
 * should not attempt payments.
 */
export function isStripeConnectActive(): boolean {
  const t = getTenant()
  return t.licence.stripeAccountStatus === 'active' && !!t.licence.stripeAccountId
}

/**
 * Convenience wrapper for `stripe.checkout.sessions.create` that routes the
 * charge to the current tenant's Connect account if one is active.
 *
 * For BR (no Connect account) this is equivalent to
 * `stripe.checkout.sessions.create(params)` — no behaviour change.
 *
 * For a tenant with active Connect, the session is created ON THE CONNECTED
 * ACCOUNT via the `stripeAccount` option. This means the Prices / Products
 * referenced in the params MUST live on the connected account, not on the
 * platform account. Callers refactoring an existing endpoint must:
 *   1. Confirm the flow should be tenant-billed (some flows are BR IP and
 *      should stay platform-billed — see bolt-on store).
 *   2. Ensure tenant has Products + Prices seeded on their Connect account
 *      (this is done during onboarding, not per-call).
 *   3. Attribute correctly: metadata.tenant_id + metadata.lead_id + any
 *      other identifiers needed on the webhook side.
 *
 * Returns the Stripe.Checkout.Session and the account context so callers
 * can log which path fired.
 */
export async function createTenantAwareCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams,
): Promise<{
  session: Stripe.Checkout.Session
  routedTo: 'platform' | 'connect'
  stripeAccount?: string
}> {
  const ctx = tenantStripeContext()
  const s = stripe()
  if (ctx.platform) {
    const session = await s.checkout.sessions.create(params)
    return { session, routedTo: 'platform' }
  }
  const session = await s.checkout.sessions.create(params, { stripeAccount: ctx.stripeAccount })
  return { session, routedTo: 'connect', stripeAccount: ctx.stripeAccount }
}

/**
 * Guidance for refactoring existing checkout callsites:
 *
 * BEFORE:
 *   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
 *   const session = await stripe.checkout.sessions.create({...})
 *
 * AFTER:
 *   import { createTenantAwareCheckoutSession } from '@/lib/tenant-stripe'
 *   const { session, routedTo } = await createTenantAwareCheckoutSession({...})
 *   console.log('[endpoint] checkout routed to:', routedTo)
 *
 * Per-callsite decision matrix:
 * - **Bolt-on store** (BR IP content): STAY platform-billed. Do NOT refactor.
 * - **Digital assets checkout**: STAY platform-billed. Do NOT refactor.
 * - **Report / Blueprint / Membership / Extension**: tenant-billed. Refactor.
 * - **Coaching commencement fee**: tenant-billed. Refactor.
 * - **Downsell offer**: tenant-billed. Refactor.
 * - **Admin backfill / test scripts**: platform-only. Do NOT refactor.
 * - **Webhook handler**: hybrid — needs to accept both platform and connect
 *   events; add a separate /api/webhooks/stripe/connect endpoint for
 *   Connect account events.
 *
 * Full refactor is deferred until after Funnel B launch (Mon 13 Jul).
 */

