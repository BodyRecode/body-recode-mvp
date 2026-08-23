import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { tenantStripe } from '@/lib/tenant-stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrl } from '@/lib/app-url'
import { REPORT_RETIRED } from '@/lib/scorecard-report-retired'


export async function POST(request: NextRequest) {
  // Retired 24 Aug 2026 - see src/lib/scorecard-report-retired.ts
  return NextResponse.json(REPORT_RETIRED, { status: 410 })

  // eslint-disable-next-line no-unreachable
  const { stripe, opts } = tenantStripe()
  const { email } = await request.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find lead by email
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email')
    .eq('email', email.toLowerCase().trim())
    .limit(1)

  const lead = leads?.[0]
  if (!lead) {
    return NextResponse.json({ error: 'No scorecard found for this email. Please complete the scorecard first.' }, { status: 404 })
  }

  // Get their latest scorecard result
  const { data: event } = await supabase
    .from('lead_events')
    .select('notes')
    .eq('lead_id', lead.id)
    .eq('type', 'scorecard_completed')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!event?.notes) {
    return NextResponse.json({ error: 'No scorecard found for this email. Please complete the scorecard first.' }, { status: 404 })
  }

  const scoreMatch = event.notes.match(/Score: (\d+)\/15/)
  const stateMatch = event.notes.match(/Body state: (.+?)\./)

  if (!scoreMatch || !stateMatch) {
    return NextResponse.json({ error: 'Could not read scorecard result. Please contact us.' }, { status: 500 })
  }

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
    success_url: `${appUrl()}/report/pending?email=${encodeURIComponent(lead.email)}`,
    cancel_url: `${appUrl()}/get-report`,
  }, opts)

  return NextResponse.json({ url: session.url })
}
