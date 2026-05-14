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

  const admin = createAdminClient()

  // Check if this person already has a blueprint enrollment - pattern carries over
  const { data: blueprintEnrollment } = await admin
    .from('blueprint_enrollments')
    .select('token, pattern, first_name')
    .ilike('email', email.trim())
    .not('pattern', 'eq', 'pending')
    .maybeSingle()

  const patternFromBlueprint = blueprintEnrollment?.pattern ?? null
  const firstName = name.trim().split(' ')[0]

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email.toLowerCase().trim(),
      line_items: [
        {
          price_data: {
            currency: 'aud',
            unit_amount: 4900, // $49.00
            recurring: { interval: 'week' },
            product_data: {
              name: 'Body Recode Membership',
              description: 'Ongoing pattern-specific programming. Progressive 6-week blocks. Monthly coach Loom. Monthly group Q&A. Pattern resource library.',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'membership_purchase',
        name: name.trim(),
        first_name: firstName,
        email: email.toLowerCase().trim(),
        pattern_from_blueprint: patternFromBlueprint ?? '',
        blueprint_token: blueprintEnrollment?.token ?? '',
      },
      success_url: `${appUrl()}/membership/welcome?email=${encodeURIComponent(email.toLowerCase().trim())}`,
      cancel_url: `${appUrl()}/membership`,
    })
  } catch (err) {
    console.error('Stripe membership checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
