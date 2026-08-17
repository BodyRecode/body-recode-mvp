import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { tenantStripe } from '@/lib/tenant-stripe'
import { appUrl } from '@/lib/app-url'
import { brand } from "@/config/tenant";


const CORS = {
  'Access-Control-Allow-Origin': brand().performanceDomain,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(request: NextRequest) {
  const { stripe, opts } = tenantStripe()
  const { name, email, score, body_state, section_scores } = await request.json()

  if (!name?.trim() || !email?.trim() || !score || !body_state) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400, headers: CORS })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: 3700, // $37.00
          product_data: {
            name: 'Body Decode Report',
            description: 'Your personalised body state interpretation — what your scores mean for your training and fat loss.',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'scorecard_report',
      name: name.trim(),
      email: email.toLowerCase().trim(),
      score: String(score),
      body_state,
      section_scores: JSON.stringify(section_scores ?? {}),
    },
    success_url: `${appUrl()}/report/pending?email=${encodeURIComponent(email)}`,
    cancel_url: `${brand().performanceDomain}/scorecard`,
  }, opts)

  return NextResponse.json({ url: session.url }, { headers: CORS })
}
