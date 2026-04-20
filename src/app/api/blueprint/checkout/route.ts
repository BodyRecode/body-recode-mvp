import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email.toLowerCase().trim(),
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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/blueprint/pending?email=${encodeURIComponent(email.toLowerCase().trim())}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/blueprint`,
  })

  return NextResponse.json({ url: session.url })
}
