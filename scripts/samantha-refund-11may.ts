// Refund the two remaining charges in Samantha's clean-up:
//   1. Sub B first invoice, 11 May 2026, $149.50 (duplicate)
//   2. Sub A 3rd cycle,     20 May 2026, $149.50 (legitimate, goodwill reversal)
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/samantha-refund-11may.ts

import Stripe from 'stripe'

const TO_REFUND = [
  { invoice: 'in_1TVnveQovwo9QLBUCyblT7EP', note: 'Sub B first invoice 11 May (duplicate)' },
  { invoice: 'in_1TZ03UQovwo9QLBUEtvcYEjm', note: 'Sub A 3rd cycle 20 May (goodwill)' },
]

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let total = 0
  for (const { invoice: INVOICE_ID, note } of TO_REFUND) {
    console.log(`\n--- ${INVOICE_ID} — ${note} ---`)
    const inv = await stripe.invoices.retrieve(INVOICE_ID, {
      expand: ['charge', 'payments', 'payment_intent'],
    } as Stripe.InvoiceRetrieveParams)

    console.log(`  status      ${inv.status}`)
    console.log(`  amount_paid ${inv.amount_paid / 100} ${inv.currency}`)

    const invAny = inv as Stripe.Invoice & {
      payment_intent?: string | Stripe.PaymentIntent | null
      payments?: { data: Array<{ payment?: { payment_intent?: string | Stripe.PaymentIntent | null; charge?: string | Stripe.Charge | null } }> }
      charge?: string | Stripe.Charge | null
    }

    let paymentIntentId: string | null = null
    let chargeId: string | null = null
    if (typeof invAny.payment_intent === 'string') paymentIntentId = invAny.payment_intent
    else if (invAny.payment_intent && 'id' in invAny.payment_intent) paymentIntentId = invAny.payment_intent.id
    if (typeof invAny.charge === 'string') chargeId = invAny.charge
    else if (invAny.charge && 'id' in invAny.charge) chargeId = invAny.charge.id
    if (!paymentIntentId && invAny.payments?.data?.length) {
      for (const p of invAny.payments.data) {
        const pi = p.payment?.payment_intent
        if (typeof pi === 'string') { paymentIntentId = pi; break }
        if (pi && 'id' in pi) { paymentIntentId = pi.id; break }
        const ch = p.payment?.charge
        if (!chargeId && typeof ch === 'string') chargeId = ch
        else if (!chargeId && ch && 'id' in ch) chargeId = ch.id
      }
    }

    console.log(`  PI          ${paymentIntentId ?? '(none)'}`)
    console.log(`  charge      ${chargeId ?? '(none)'}`)

    if (!paymentIntentId && !chargeId) {
      console.error(`  ABORT: no refundable target for ${INVOICE_ID}`)
      continue
    }

    const refund = await stripe.refunds.create(
      paymentIntentId
        ? { payment_intent: paymentIntentId, reason: 'duplicate', metadata: { invoice: INVOICE_ID, note } }
        : { charge: chargeId!, reason: 'duplicate', metadata: { invoice: INVOICE_ID, note } },
    )

    console.log(`  REFUND CREATED ${refund.id} status=${refund.status} amount=${refund.amount / 100} ${refund.currency}`)
    total += refund.amount / 100
  }

  console.log(`\n=== Refunded this run: ${total.toFixed(2)} AUD ===`)
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
