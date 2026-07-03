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
