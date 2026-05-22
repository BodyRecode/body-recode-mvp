// Cancel Samantha's two duplicate subscriptions immediately.
// Keeps sub_1TTvNXQovwo9QLBUPPCbsfB7 (the May 6 original) active.
// Usage: set -a && source .env.local && set +a && npx tsx scripts/samantha-cancel-extras.ts

import Stripe from 'stripe'

const TO_CANCEL = [
  'sub_1TVnvkQovwo9QLBUosZKCdDO', // created 11 May
  'sub_1TYLb1Qovwo9QLBU4CKBU28k', // created 18 May
]
const KEEP = 'sub_1TTvNXQovwo9QLBUPPCbsfB7'

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  // Sanity: confirm the keeper is still active
  const keeper = await stripe.subscriptions.retrieve(KEEP)
  if (keeper.status !== 'active') {
    console.error(`ABORT: keeper ${KEEP} is not active (status=${keeper.status})`)
    process.exit(1)
  }
  console.log(`Keeper ${KEEP} is active. Proceeding with cancellations.\n`)

  for (const subId of TO_CANCEL) {
    console.log(`---`)
    const before = await stripe.subscriptions.retrieve(subId)
    console.log(`Before: ${subId} status=${before.status}`)
    if (before.status === 'canceled') {
      console.log(`  Already cancelled. Skipping.`)
      continue
    }

    const cancelled = await stripe.subscriptions.cancel(subId, {
      prorate: false,
      invoice_now: false,
    })
    console.log(`After:  ${subId} status=${cancelled.status} canceled_at=${cancelled.canceled_at ? new Date(cancelled.canceled_at * 1000).toISOString() : 'null'}`)
  }
}

main().then(() => { console.log('\nDone.'); process.exit(0) }).catch(err => { console.error(err); process.exit(1) })
