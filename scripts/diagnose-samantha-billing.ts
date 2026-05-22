// READ-ONLY diagnostic for Samantha's triple-subscription bug.
// Usage: set -a && source .env.local && set +a && npx tsx scripts/diagnose-samantha-billing.ts

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  // 1. Find Samantha — match by first name (Samantha is unusual enough)
  const { data: candidates, error } = await supabase
    .from('clients')
    .select('id, name, email, subscription_active, subscription_link_send_at, subscription_link_sent_at, package, created_at')
    .ilike('name', 'samantha%')

  if (error) {
    console.error('Supabase error:', error)
    process.exit(1)
  }

  if (!candidates || candidates.length === 0) {
    console.error('No client matching "Samantha%" found.')
    process.exit(1)
  }

  console.log(`\n=== Clients matching "Samantha%" ===`)
  for (const c of candidates) {
    console.log(JSON.stringify(c, null, 2))
  }

  if (candidates.length > 1) {
    console.error(`\nMultiple matches — pass the exact client id as arg to disambiguate.`)
    process.exit(1)
  }

  const client = candidates[0]
  console.log(`\nUsing client_id = ${client.id} (${client.name}, ${client.email})\n`)

  // 2. Pull all be_payments for this client
  const { data: payments } = await supabase
    .from('be_payments')
    .select('id, amount, status, stripe_payment_id, stripe_subscription_id, paid_at, created_at, lead_id')
    .eq('client_id', client.id)
    .order('paid_at', { ascending: true, nullsFirst: false })

  console.log(`=== be_payments rows (${payments?.length ?? 0}) ===`)
  for (const p of payments ?? []) {
    console.log(JSON.stringify(p, null, 2))
  }

  // 3. Pull client_subscriptions cache rows
  const { data: subsCache } = await supabase
    .from('client_subscriptions')
    .select('*')
    .eq('client_id', client.id)
  console.log(`\n=== client_subscriptions cache rows (${subsCache?.length ?? 0}) ===`)
  for (const s of subsCache ?? []) {
    console.log(JSON.stringify(s, null, 2))
  }

  // 4. Pull client_communications for subscription_link history
  const { data: comms } = await supabase
    .from('client_communications')
    .select('id, kind, subject, sent_at, meta')
    .eq('client_id', client.id)
    .in('kind', ['subscription_link', 'commencement_fee_link'])
    .order('sent_at', { ascending: true })
  console.log(`\n=== Subscription-link emails sent to her (${comms?.length ?? 0}) ===`)
  for (const c of comms ?? []) {
    console.log(JSON.stringify(c, null, 2))
  }

  // 5. Stripe — look up the customer by email, list all subscriptions
  if (!client.email) {
    console.log('\nNo email on client — cannot query Stripe customers.')
    return
  }

  const customers = await stripe.customers.list({ email: client.email, limit: 10 })
  console.log(`\n=== Stripe customers matching ${client.email} (${customers.data.length}) ===`)
  for (const cust of customers.data) {
    console.log(`Customer ${cust.id} — created ${new Date(cust.created * 1000).toISOString()}`)
  }

  for (const cust of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: cust.id, status: 'all', limit: 20 })
    console.log(`\n=== Subscriptions for ${cust.id} (${subs.data.length}) ===`)
    const tsIso = (ts: number | null | undefined) => (ts && ts > 0) ? new Date(ts * 1000).toISOString() : null
    for (const sub of subs.data) {
      const item = sub.items.data[0]
      const cpe = (sub as unknown as { current_period_end?: number }).current_period_end
      console.log(JSON.stringify({
        id: sub.id,
        status: sub.status,
        created: tsIso(sub.created),
        current_period_end: tsIso(cpe),
        cancel_at: tsIso(sub.cancel_at),
        canceled_at: tsIso(sub.canceled_at),
        price_id: item?.price.id,
        amount: item?.price.unit_amount ? item.price.unit_amount / 100 : null,
        currency: item?.price.currency,
        interval: item?.price.recurring?.interval,
        metadata: sub.metadata,
        client_reference_at_checkout: 'see checkout sessions below',
      }, null, 2))
    }

    // List the underlying invoices/charges to see the actual money movement
    const invoices = await stripe.invoices.list({ customer: cust.id, limit: 50 })
    console.log(`\n=== Invoices for ${cust.id} (${invoices.data.length}) ===`)
    for (const inv of invoices.data) {
      const invWithSub = inv as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null
        payment_intent?: string | Stripe.PaymentIntent | null
        charge?: string | Stripe.Charge | null
      }
      console.log(JSON.stringify({
        id: inv.id,
        status: inv.status,
        amount_paid: inv.amount_paid / 100,
        currency: inv.currency,
        created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
        billing_reason: inv.billing_reason,
        subscription: typeof invWithSub.subscription === 'string' ? invWithSub.subscription : invWithSub.subscription?.id ?? null,
        payment_intent: typeof invWithSub.payment_intent === 'string' ? invWithSub.payment_intent : invWithSub.payment_intent?.id ?? null,
        charge_id: typeof invWithSub.charge === 'string' ? invWithSub.charge : invWithSub.charge?.id ?? null,
      }, null, 2))
    }

    // List checkout sessions to see what client_reference_id was on each
    const sessions = await stripe.checkout.sessions.list({ customer: cust.id, limit: 20 })
    console.log(`\n=== Checkout sessions for ${cust.id} (${sessions.data.length}) ===`)
    for (const s of sessions.data) {
      console.log(JSON.stringify({
        id: s.id,
        created: s.created ? new Date(s.created * 1000).toISOString() : null,
        mode: s.mode,
        status: s.status,
        amount_total: s.amount_total ? s.amount_total / 100 : null,
        subscription: s.subscription as string | null,
        client_reference_id: s.client_reference_id,
        payment_link: s.payment_link,
      }, null, 2))
    }
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
