/**
 * Stripe sync helpers — keep `client_subscriptions` and `client_payment_plan`
 * in lock-step with the source of truth (Stripe).
 *
 * Used by:
 *   - /api/admin/stripe/backfill          (one-time initial population)
 *   - /api/admin/stripe/refresh-client    (on-demand per-client refresh)
 *   - /api/webhooks/stripe                (ongoing event-driven updates)
 *
 * Authoritative source is always Stripe; these helpers update our cache.
 */

import Stripe from 'stripe'
import { tenantStripe } from '@/lib/tenant-stripe'
import type { SupabaseClient } from '@supabase/supabase-js'


/**
 * Stripe interval → our billing_interval enum.
 * Stripe supports: day | week | month | year. We add 'fortnight' for our own
 * use cases but Stripe represents that as week * 2 (interval='week',
 * interval_count=2).
 */
function mapInterval(interval: Stripe.Price.Recurring.Interval, count: number | null | undefined): string | null {
  if (interval === 'week') return count === 2 ? 'fortnight' : 'week'
  if (interval === 'month') return 'month'
  if (interval === 'year') return 'year'
  if (interval === 'day') return 'day'
  return null
}

/**
 * Resolve our internal client_id from a Stripe customer.
 * Match order:
 *   1. clients.stripe_customer_id direct match (fastest)
 *   2. case-insensitive email match against clients.email
 * Returns { clientId, coachId } or null if no match.
 */
export async function findClientForStripeCustomer(
  supabase: SupabaseClient,
  customer: Stripe.Customer | Stripe.DeletedCustomer
): Promise<{ clientId: string; coachId: string } | null> {
  // Direct stripe_customer_id match first
  const { data: byId } = await supabase
    .from('clients')
    .select('id, coach_id')
    .eq('stripe_customer_id', customer.id)
    .maybeSingle()
  if (byId) return { clientId: byId.id, coachId: byId.coach_id }

  // Deleted customers don't have email
  if (customer.deleted) return null

  const c = customer as Stripe.Customer
  if (!c.email) return null

  const { data: byEmail } = await supabase
    .from('clients')
    .select('id, coach_id, stripe_customer_id')
    .ilike('email', c.email)
    .maybeSingle()
  if (!byEmail) return null

  // Backfill the stripe_customer_id while we're here
  if (!byEmail.stripe_customer_id) {
    await supabase
      .from('clients')
      .update({ stripe_customer_id: customer.id })
      .eq('id', byEmail.id)
  }

  return { clientId: byEmail.id, coachId: byEmail.coach_id }
}

/**
 * Upsert a Stripe Subscription into client_subscriptions.
 * If the subscription's customer doesn't match any client we have, returns
 * { matched: false } and writes nothing. Caller decides what to do.
 */
export async function syncSubscriptionFromStripe(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
): Promise<{ matched: boolean; clientId?: string; subscriptionRow?: string }> {
  // Resolved per call, not at module scope: getTenant() reads a per-request
  // cache, and a subscription created on a connected account can only be read
  // back with that account's options.
  const { stripe, opts } = tenantStripe()

  // Stripe customer is always a string id at this point (sub.customer)
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  // Fetch the customer to get email for matching
  const customer = await stripe.customers.retrieve(customerId, opts)
  if (customer.deleted) return { matched: false }

  const match = await findClientForStripeCustomer(supabase, customer)
  if (!match) return { matched: false }

  // Extract pricing + interval from first subscription item. In Stripe SDK
  // v18+ the current_period_* fields moved from Subscription onto the items.
  const firstItem = subscription.items.data[0] as Stripe.SubscriptionItem & {
    current_period_start?: number | null
    current_period_end?: number | null
  }
  const price = firstItem?.price
  const amount = price?.unit_amount ? price.unit_amount / 100 : null
  const currency = price?.currency ?? 'aud'
  const intervalMapped = price?.recurring
    ? mapInterval(price.recurring.interval, price.recurring.interval_count)
    : null

  // Try to find our product_id from be_products via stripe_price_id
  let productId: string | null = null
  if (price?.id) {
    const { data: prod } = await supabase
      .from('be_products')
      .select('id')
      .eq('stripe_price_id', price.id)
      .maybeSingle()
    productId = prod?.id ?? null
  }

  // Derive a human label from the product name. The product comes back as
  // either a string id (default) or an expanded object. We can't expand
  // through to it from list calls because data.items.data.price.product is
  // 5 levels deep and Stripe caps expansion at 4. Fetch it separately when
  // it's just an id.
  let productName: string | null = null
  if (typeof price?.product === 'object' && price.product && !('deleted' in price.product)) {
    productName = (price.product as Stripe.Product).name
  } else if (typeof price?.product === 'string') {
    try {
      const prod = await stripe.products.retrieve(price.product, opts)
      if (!prod.deleted) productName = prod.name
    } catch {
      productName = null
    }
  }

  const row = {
    client_id: match.clientId,
    coach_id: match.coachId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    product_id: productId,
    status: subscription.status,
    plan_label: productName,
    amount,
    currency,
    billing_interval: intervalMapped,
    current_period_start: firstItem?.current_period_start
      ? new Date(firstItem.current_period_start * 1000).toISOString()
      : null,
    current_period_end: firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    raw: subscription as unknown as Record<string, unknown>,
    last_synced_at: new Date().toISOString(),
  }

  const { data: upserted, error } = await supabase
    .from('client_subscriptions')
    .upsert(row, { onConflict: 'stripe_subscription_id' })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to upsert subscription ${subscription.id}: ${error.message}`)

  return { matched: true, clientId: match.clientId, subscriptionRow: upserted?.id }
}

/**
 * Mark the commencement fee paid on client_payment_plan, if not already set.
 * Triggered by checkout.session.completed for the one-off $297 charge.
 * Idempotent: won't overwrite an existing paid_at.
 */
export async function markCommencementPaid(
  supabase: SupabaseClient,
  clientId: string,
  stripePaymentId: string,
  paidAt: Date
): Promise<void> {
  const { stripe, opts } = tenantStripe()
  // Ensure a client_payment_plan row exists. Assign default plan if none.
  const { data: existing } = await supabase
    .from('client_payment_plan')
    .select('client_id, commencement_fee_paid_at')
    .eq('client_id', clientId)
    .maybeSingle()

  if (existing?.commencement_fee_paid_at) return // already paid, leave alone

  if (!existing) {
    // Find the default plan for the coach who owns this client
    const { data: client } = await supabase
      .from('clients')
      .select('coach_id')
      .eq('id', clientId)
      .single()
    if (!client) return

    const { data: defaultPlan } = await supabase
      .from('payment_plans')
      .select('id')
      .eq('coach_id', client.coach_id)
      .eq('is_default', true)
      .maybeSingle()

    await supabase.from('client_payment_plan').insert({
      client_id: clientId,
      payment_plan_id: defaultPlan?.id ?? null,
      commencement_fee_paid_at: paidAt.toISOString(),
      commencement_fee_stripe_payment_id: stripePaymentId,
    })
    return
  }

  await supabase
    .from('client_payment_plan')
    .update({
      commencement_fee_paid_at: paidAt.toISOString(),
      commencement_fee_stripe_payment_id: stripePaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq('client_id', clientId)
}

/**
 * Refresh a single client's subscriptions from Stripe.
 * Used by the "Refresh from Stripe" button on the client Payments section.
 */
export async function refreshClientFromStripe(
  supabase: SupabaseClient,
  clientId: string
): Promise<{ synced: number; subscriptions: Array<{ id: string; status: string }> }> {
  const { stripe, opts } = tenantStripe()

  const { data: client, error } = await supabase
    .from('clients')
    .select('id, email, stripe_customer_id')
    .eq('id', clientId)
    .single()
  if (error || !client) throw new Error('Client not found')

  let customerId = client.stripe_customer_id

  // No customer yet? Try email lookup
  if (!customerId && client.email) {
    const customers = await stripe.customers.list({ email: client.email, limit: 10 }, opts)
    if (customers.data.length === 0) return { synced: 0, subscriptions: [] }
    customerId = customers.data[0].id
    await supabase.from('clients').update({ stripe_customer_id: customerId }).eq('id', clientId)
  }

  if (!customerId) return { synced: 0, subscriptions: [] }

  // Fetch all subscriptions (any status) for this customer. Product names
  // are resolved per-sub inside syncSubscriptionFromStripe — we can't expand
  // data.items.data.price.product here (5 levels, Stripe caps at 4).
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  }, opts)

  const out: Array<{ id: string; status: string }> = []
  for (const sub of subs.data) {
    await syncSubscriptionFromStripe(supabase, sub)
    out.push({ id: sub.id, status: sub.status })
  }

  return { synced: subs.data.length, subscriptions: out }
}
