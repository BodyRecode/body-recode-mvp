import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function errorRedirect(reason: string) {
  const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/get-report`)
  url.searchParams.set('error', reason)
  return NextResponse.redirect(url, { status: 302 })
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')?.toLowerCase().trim()

  if (!email) return errorRedirect('missing-email')

  const supabase = createAdminClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email')
    .eq('email', email)
    .limit(1)

  const lead = leads?.[0]
  if (!lead) return errorRedirect('no-scorecard')

  const { data: event } = await supabase
    .from('lead_events')
    .select('notes')
    .eq('lead_id', lead.id)
    .eq('type', 'scorecard_completed')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!event?.notes) return errorRedirect('no-scorecard')

  const scoreMatch = event.notes.match(/Score: (\d+)\/15/)
  const stateMatch = event.notes.match(/Body state: (.+?)\./)

  if (!scoreMatch || !stateMatch) return errorRedirect('bad-scorecard')

  const score = parseInt(scoreMatch[1])
  const body_state = stateMatch[1]

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: lead.email,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: 3700,
          product_data: {
            name: 'Body Decode Report',
            description: 'Your personalised body state interpretation. What your scores mean for your training and fat loss.',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'scorecard_report',
      name: lead.name,
      email: lead.email,
      score: String(score),
      body_state,
      section_scores: '{}',
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/report/pending?email=${encodeURIComponent(lead.email)}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/get-report`,
  })

  if (!session.url) return errorRedirect('stripe-failed')

  return NextResponse.redirect(session.url, { status: 302 })
}
