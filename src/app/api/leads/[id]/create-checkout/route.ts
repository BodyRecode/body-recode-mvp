import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

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
    .select('id, name, email')
    .eq('id', id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.converted_to_client_id) return NextResponse.json({ error: 'Already converted' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: lead.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: 24000, // $240.00
          product_data: {
            name: 'Body Recode - Commencement Fee',
            description: 'One-time commencement fee for Body Recode Performance Coaching.',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      lead_id: id,
      type: 'commencement_fee',
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${id}`,
  })

  return NextResponse.json({ url: session.url })
}
