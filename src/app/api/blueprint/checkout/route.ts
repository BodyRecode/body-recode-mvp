import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { tenantStripe } from '@/lib/tenant-stripe'
import { appUrl } from '@/lib/app-url'


export async function POST(request: NextRequest) {
  const { stripe, opts } = tenantStripe()
  const { name, email } = await request.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }

  // Pattern is resolved authoritatively in the Stripe webhook (see
  // resolveBuyerPattern): it anchors on the lead by email OR the Stripe-collected
  // phone, then Challenge quiz → high-confidence scorecard → in-portal
  // assessment. Nothing to look up here (the old email query hit a non-existent
  // challenge_enrollments.email column and silently no-op'd anyway).
  let session
  try {
    session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email.toLowerCase().trim(),
    // Collect phone so a buyer who purchases under a different email than they
    // enrolled with can still be matched back to their challenge lead (the
    // re-engagement guards match on email OR phone).
    phone_number_collection: { enabled: true },
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: 9700, // $97.00
          product_data: {
            name: '6-Week Body Rewire Blueprint',
            description: 'A structured 6-week programme built around your biological pattern. Phase 1: Regulate. Phase 2: Adapt. Phase 3: Embed.',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'blueprint_purchase',
      name: name.trim(),
      email: email.toLowerCase().trim(),
    },
      success_url: `${appUrl()}/blueprint/pending?email=${encodeURIComponent(email.toLowerCase().trim())}`,
      cancel_url: `${appUrl()}/blueprint`,
    }, opts)
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
