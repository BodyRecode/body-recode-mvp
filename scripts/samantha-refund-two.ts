// Refund Samantha's two Mon 18 May 2026 duplicate debits ($149.50 each, $299 total).
// Leaves Sub B's 11 May charge and all of Sub A's charges alone.
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/samantha-refund-two.ts

import Stripe from 'stripe'

const TO_REFUND = [
  { invoice: 'in_1TYLHCQovwo9QLBURSPB55I3', note: 'Sub B 2nd weekly cycle (18 May)' },
  { invoice: 'in_1TYLawQovwo9QLBUkJALaaH1', note: 'Sub C first invoice (18 May)' },
]

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let total = 0
  for (const { invoice: invoiceId, note } of TO_REFUND) {
    console.log(`\n--- ${invoiceId} — ${note} ---`)
    const inv = await stripe.invoices.retrieve(invoiceId, {
      expand: ['charge', 'payments', 'payment_intent'],
    } as Stripe.InvoiceRetrieveParams)

    console.log(`  status            ${inv.status}`)
    console.log(`  amount_paid       ${inv.amount_paid / 100} ${inv.currency}`)

    // Try every known way to resolve a refundable target.
    const invAny = inv as Stripe.Invoice & {
      payment_intent?: string | Stripe.PaymentIntent | null
      payments?: { data: Array<{ payment?: { type: string; payment_intent?: string | Stripe.PaymentIntent | null; charge?: string | Stripe.Charge | null } }> }
      charge?: string | Stripe.Charge | null
    }

    let paymentIntentId: string | null = null
    let chargeId: string | null = null

    if (typeof invAny.payment_intent === 'string') paymentIntentId = invAny.payment_intent
    else if (invAny.payment_intent && typeof invAny.payment_intent !== 'string') paymentIntentId = invAny.payment_intent.id

    if (typeof invAny.charge === 'string') chargeId = invAny.charge
    else if (invAny.charge && typeof invAny.charge !== 'string') chargeId = invAny.charge.id

    if (!paymentIntentId && invAny.payments?.data?.length) {
      for (const p of invAny.payments.data) {
        const pi = p.payment?.payment_intent
        if (typeof pi === 'string') { paymentIntentId = pi; break }
        if (pi && typeof pi !== 'string') { paymentIntentId = pi.id; break }
        const ch = p.payment?.charge
        if (!chargeId && typeof ch === 'string') chargeId = ch
        else if (!chargeId && ch && typeof ch !== 'string') chargeId = ch.id
      }
    }

    console.log(`  resolved PI       ${paymentIntentId ?? '(none)'}`)
    console.log(`  resolved charge   ${chargeId ?? '(none)'}`)

    if (!paymentIntentId && !chargeId) {
      console.error(`  ABORT: no PI or charge found for ${invoiceId}. Skipping.`)
      continue
    }

    const refundParams: Stripe.RefundCreateParams = paymentIntentId
      ? { payment_intent: paymentIntentId, reason: 'duplicate', metadata: { invoice: invoiceId, note } }
      : { charge: chargeId!, reason: 'duplicate', metadata: { invoice: invoiceId, note } }

    const refund = await stripe.refunds.create(refundParams)
    console.log(`  REFUND CREATED    ${refund.id} status=${refund.status} amount=${refund.amount / 100} ${refund.currency}`)
    total += refund.amount / 100
  }

  console.log(`\n=== Total refunded: ${total.toFixed(2)} AUD ===`)
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
