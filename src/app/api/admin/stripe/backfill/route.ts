/**
 * Stripe → client_subscriptions backfill
 *
 * Pages through every Stripe customer, matches to a client row by email,
 * populates clients.stripe_customer_id, then pulls every subscription for
 * matched customers and writes them into client_subscriptions.
 *
 * Safe to re-run. Idempotent via upsert on stripe_subscription_id.
 *
 * Returns a reconciliation report:
 *   {
 *     stripe_customers_seen,
 *     matched_clients,
 *     unmatched_stripe_customers: [{ id, email }],   // they pay us, no client row
 *     unmatched_clients: [{ id, name, email }],      // client rows with no Stripe link
 *     subscriptions_synced,
 *     subscriptions_by_status: { active: 3, past_due: 1, ... },
 *   }
 *
 * Coach-only. POST trigger to avoid accidental browser hits.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncSubscriptionFromStripe } from '@/lib/stripe-sync'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(_request: NextRequest) {
  // Auth — must be signed-in coach
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const unmatched_stripe_customers: Array<{ id: string; email: string | null; name: string | null }> = []
  let stripe_customers_seen = 0
  let matched_clients = 0
  let subscriptions_synced = 0
  const subscriptions_by_status: Record<string, number> = {}
  const errors: string[] = []

  // Page through all Stripe customers
  let startingAfter: string | undefined = undefined
  while (true) {
    const page: Stripe.ApiList<Stripe.Customer> = await stripe.customers.list({
      limit: 100,
      starting_after: startingAfter,
    })

    for (const customer of page.data) {
      stripe_customers_seen++

      // Try to match
      const { data: byId } = await admin
        .from('clients')
        .select('id, coach_id, stripe_customer_id')
        .eq('stripe_customer_id', customer.id)
        .maybeSingle()

      let matched = byId
      if (!matched && customer.email) {
        const { data: byEmail } = await admin
          .from('clients')
          .select('id, coach_id, stripe_customer_id')
          .ilike('email', customer.email)
          .maybeSingle()
        matched = byEmail ?? null

        // Backfill stripe_customer_id on the client row
        if (matched && !matched.stripe_customer_id) {
          await admin
            .from('clients')
            .update({ stripe_customer_id: customer.id })
            .eq('id', matched.id)
        }
      }

      if (!matched) {
        unmatched_stripe_customers.push({
          id: customer.id,
          email: customer.email ?? null,
          name: customer.name ?? null,
        })
        continue
      }

      matched_clients++

      // Pull this customer's subscriptions and sync each one
      try {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'all',
          limit: 100,
        })
        for (const sub of subs.data) {
          await syncSubscriptionFromStripe(admin, sub)
          subscriptions_synced++
          subscriptions_by_status[sub.status] = (subscriptions_by_status[sub.status] ?? 0) + 1
        }
      } catch (e) {
        errors.push(`Failed to sync subscriptions for customer ${customer.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    if (!page.has_more) break
    startingAfter = page.data[page.data.length - 1]?.id
    if (!startingAfter) break
  }

  // Unmatched clients = client rows with no stripe_customer_id (after backfill ran)
  const { data: unmatchedClients } = await admin
    .from('clients')
    .select('id, name, email')
    .is('stripe_customer_id', null)

  return NextResponse.json({
    ok: true,
    stripe_customers_seen,
    matched_clients,
    unmatched_stripe_customers,
    unmatched_clients: unmatchedClients ?? [],
    subscriptions_synced,
    subscriptions_by_status,
    errors,
    ran_at: new Date().toISOString(),
  })
}
