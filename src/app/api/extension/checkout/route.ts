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
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email.toLowerCase().trim(),
      // Collect phone so a buyer who pays under a different email than they used
      // for the Blueprint/challenge can still be matched back (re-engagement
      // guards match on email OR phone).
      phone_number_collection: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: 'aud',
            unit_amount: 19700,
            product_data: {
              name: '90-Day Body Rewire Extension',
              description: '12 weeks of progressive pattern-specific programming. Picks up exactly where the Blueprint ended.',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'extension_purchase',
        name: name.trim(),
        first_name: firstName,
        email: email.toLowerCase().trim(),
        pattern_from_blueprint: patternFromBlueprint ?? '',
        blueprint_token: blueprintEnrollment?.token ?? '',
      },
      success_url: `${appUrl()}/extension/welcome?email=${encodeURIComponent(email.toLowerCase().trim())}`,
      cancel_url: `${appUrl()}/extension`,
    })
  } catch (err) {
    console.error('Extension checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
