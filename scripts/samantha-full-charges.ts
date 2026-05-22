// READ-ONLY: list every invoice and charge for each of Samantha's three subscriptions.
// Usage: set -a && source .env.local && set +a && npx tsx scripts/samantha-full-charges.ts

import Stripe from 'stripe'

const SUB_IDS = [
  'sub_1TTvNXQovwo9QLBUPPCbsfB7', // first charge May 6
  'sub_1TVnvkQovwo9QLBUosZKCdDO', // first charge May 11
  'sub_1TYLb1Qovwo9QLBU4CKBU28k', // first charge May 18
]

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let grandTotal = 0

  for (const subId of SUB_IDS) {
    console.log(`\n========================================`)
    console.log(`SUBSCRIPTION ${subId}`)
    console.log(`========================================`)

    let sub: Stripe.Subscription
    try {
      sub = await stripe.subscriptions.retrieve(subId)
    } catch (e) {
      console.error(`  Could not retrieve: ${(e as Error).message}`)
      continue
    }

    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    console.log(`  customer        : ${customerId}`)
    console.log(`  status          : ${sub.status}`)
    console.log(`  created         : ${new Date(sub.created * 1000).toISOString()}`)
    console.log(`  cancel_at       : ${sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : 'null'}`)
    console.log(`  canceled_at     : ${sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : 'null'}`)
    const item = sub.items.data[0]
    console.log(`  price           : ${item?.price.unit_amount ? item.price.unit_amount / 100 : '?'} ${item?.price.currency} every ${item?.price.recurring?.interval}`)

    // All invoices for this subscription
    const invoices = await stripe.invoices.list({ subscription: subId, limit: 100 })
    console.log(`\n  Invoices (${invoices.data.length}):`)
    let subTotal = 0
    for (const inv of invoices.data) {
      const invWithCharge = inv as Stripe.Invoice & { charge?: string | Stripe.Charge | null }
      const chargeId = typeof invWithCharge.charge === 'string' ? invWithCharge.charge : invWithCharge.charge?.id ?? null
      const paidAmount = inv.amount_paid / 100
      subTotal += paidAmount
      console.log(`    - ${inv.id}`)
      console.log(`        created       ${new Date(inv.created * 1000).toISOString()}`)
      console.log(`        status        ${inv.status}`)
      console.log(`        amount_paid   ${paidAmount} ${inv.currency}`)
      console.log(`        billing_reason ${inv.billing_reason}`)
      console.log(`        charge        ${chargeId}`)

      // Detail the charge so we know what to refund
      if (chargeId) {
        const charge = await stripe.charges.retrieve(chargeId)
        console.log(`          charge.status   ${charge.status}`)
        console.log(`          charge.amount   ${charge.amount / 100}`)
        console.log(`          refunded?       ${charge.refunded} (refunded_amount=${charge.amount_refunded / 100})`)
        console.log(`          payment_intent  ${charge.payment_intent}`)
      }
    }
    console.log(`  --- Subscription total billed: ${subTotal.toFixed(2)} ${item?.price.currency ?? ''} ---`)
    grandTotal += subTotal
  }

  console.log(`\n========================================`)
  console.log(`GRAND TOTAL billed across all 3 subs: ${grandTotal.toFixed(2)}`)
  console.log(`========================================`)
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
