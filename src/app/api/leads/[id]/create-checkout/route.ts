import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { appUrl } from '@/lib/app-url'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: lead } = await supabase
    .from('leads')
    .select('id, name, email, converted_to_client_id, status')
    .eq('id', id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  // Allow when converted-but-unpaid; block once the fee is on the lead.
  const PAID_STATUSES = ['commencement_fee_paid', 'active_deliberate_start', 'active_coaching']
  if (PAID_STATUSES.includes(lead.status)) {
    return NextResponse.json({ error: 'Foundational Read is already paid for this lead.' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: lead.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: 29700, // $297.00
          product_data: {
            name: 'Body Recode - Foundational Read',
            description: 'One-time Foundational Read for Body Recode Performance Coaching.',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      lead_id: id,
      type: 'commencement_fee',
    },
    success_url: `${appUrl()}/payment-success`,
    cancel_url: `${appUrl()}/dashboard/leads/${id}`,
  })

  return NextResponse.json({ url: session.url })
}
