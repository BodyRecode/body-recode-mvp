import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrl } from '@/lib/app-url'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const { name, email } = await request.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }

  // Check if this buyer already has a pattern from the challenge
  const admin = createAdminClient()
  const { data: challengeEnrollment } = await admin
    .from('challenge_enrollments')
    .select('quiz_result')
    .ilike('email', email.trim())
    .not('quiz_result', 'is', null)
    .maybeSingle()

  const patternFromChallenge = challengeEnrollment?.quiz_result ?? null

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
      pattern_from_challenge: patternFromChallenge ?? '',
    },
      success_url: `${appUrl()}/blueprint/pending?email=${encodeURIComponent(email.toLowerCase().trim())}`,
      cancel_url: `${appUrl()}/blueprint`,
    })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
