import Stripe from 'stripe'
import { tenantStripe } from '@/lib/tenant-stripe'
import type { CoachingPackage } from '@/lib/coaching-packages'
import { appUrl } from '@/lib/app-url'

/**
 * Per-client subscription Checkout Session helper.
 *
 * Why this exists: until 2026-05-22 the platform emailed every client the
 * SAME static Stripe Payment Link with `?client_reference_id={id}` appended.
 * That URL is reusable — Stripe accepts any number of completions, so a
 * client who clicks twice (or refreshes the Stripe-hosted checkout mid-submit)
 * ends up with multiple live subscriptions. Samantha was billed for three
 * separate subscriptions across 14 days because of this.
 *
 * The webhook guard in `webhooks/stripe/route.ts` catches the duplicate on
 * the way IN. This helper closes the door at the source: every send now
 * creates a fresh `stripe.checkout.sessions.create` session, which is
 * single-use by Stripe's contract and expires within 24 hours. Defense in
 * depth — the guard alone is sufficient, but a single-use session means
 * the duplicate can't be generated in the first place.
 */


// In-memory cache mapping Payment Link URL → recurring Price ID. Populated
// lazily on first miss by listing all active Payment Links once. Vercel
// Functions are short-lived so this is effectively one Stripe API call per
// cold start, then free reads.
const PRICE_ID_CACHE = new Map<string, string>()

async function loadPaymentLinkCache(): Promise<void> {
  // Same account as the checkout that will use these Price IDs. A Price
  // resolved on the platform account cannot be charged on a connected one.
  const { stripe, opts: acct } = tenantStripe()
  // Stripe Payment Links don't paginate beyond 100 in a single call; we
  // page through with starting_after until exhausted.
  let startingAfter: string | undefined
  for (let i = 0; i < 10; i++) {
    const page = await stripe.paymentLinks.list({ active: true, limit: 100, starting_after: startingAfter }, acct)
    for (const link of page.data) {
      const url = link.url
      const items = await stripe.paymentLinks.listLineItems(link.id, { limit: 1 }, acct)
      const priceId = items.data[0]?.price?.id
      if (url && priceId) PRICE_ID_CACHE.set(url, priceId)
    }
    if (!page.has_more) break
    startingAfter = page.data[page.data.length - 1]?.id
  }
}

export async function resolvePriceIdForPaymentLink(paymentLinkUrl: string): Promise<string | null> {
  if (!paymentLinkUrl) return null
  const cached = PRICE_ID_CACHE.get(paymentLinkUrl)
  if (cached) return cached
  await loadPaymentLinkCache()
  return PRICE_ID_CACHE.get(paymentLinkUrl) ?? null
}

export interface SubscriptionCheckoutClient {
  id: string
  email: string
  onboarding_token: string | null
}

/**
 * Create a single-use subscription Checkout Session for one client/package
 * combination. The returned URL replaces what used to be the static Payment
 * Link in the email. Caller is responsible for sending the email.
 *
 * Throws if the package has no Stripe Payment Link (non-billing comps) or
 * if the Price ID cannot be resolved (Payment Link archived).
 */
export async function createSubscriptionCheckoutForClient(opts: {
  client: SubscriptionCheckoutClient
  pkg: CoachingPackage
}): Promise<{ url: string; sessionId: string; expiresAt: Date }> {
  const { client, pkg } = opts
  if (!pkg.stripe) {
    throw new Error(`Package ${pkg.value} is non-billing — no Stripe Payment Link configured.`)
  }
  if (!client.email) {
    throw new Error(`Client ${client.id} has no email on file — cannot send subscription link.`)
  }

  const priceId = await resolvePriceIdForPaymentLink(pkg.stripe)
  if (!priceId) {
    throw new Error(`Could not resolve Stripe Price ID for package ${pkg.value} (URL ${pkg.stripe}). The Payment Link may have been archived.`)
  }

  // Land them on their portal after successful payment. Onboarded clients
  // already have a portal token; if for some reason they don't, the appUrl
  // fallback sends them to the dashboard so the redirect doesn't 404.
  const successUrl = client.onboarding_token
    ? `${appUrl()}/portal/${client.onboarding_token}`
    : `${appUrl()}/payment-success`
  const cancelUrl = `${appUrl()}`

  // `acct`, not `opts`: this function's own parameter is already named opts.
  const { stripe, opts: acct } = tenantStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: client.email,
    client_reference_id: client.id,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      client_id: client.id,
      package: pkg.value,
      source: 'per-client-subscription-session',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  }, acct)

  if (!session.url) {
    throw new Error(`Stripe returned no URL for the subscription checkout session (${session.id}).`)
  }

  return {
    url: session.url,
    sessionId: session.id,
    expiresAt: new Date(session.expires_at * 1000),
  }
}
