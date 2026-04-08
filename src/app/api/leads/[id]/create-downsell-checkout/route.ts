import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('id, name, email')
    .eq('id', id)
    .maybeSingle()

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Get body state from scorecard event
  const { data: scorecardEvent } = await admin
    .from('lead_events')
    .select('notes')
    .eq('lead_id', id)
    .eq('type', 'scorecard_completed')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const bodyState = scorecardEvent?.notes?.match(/Body state: (.+?)\./)?.[1]

  const stateMap: Record<string, string> = {
    'Depleted State': 'depleted',
    'Transitioning State': 'transitioning',
    'Ready State': 'ready',
  }
  const stateKey = bodyState ? stateMap[bodyState] : null

  if (!stateKey) {
    return NextResponse.json({ error: 'No body state found for this lead' }, { status: 400 })
  }

  const stateProgramNames: Record<string, string> = {
    depleted: 'Self-Guided Program - Depleted State',
    transitioning: 'Self-Guided Program - Transitioning State',
    ready: 'Self-Guided Program - Ready State',
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: lead.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: 9700,
          product_data: {
            name: stateProgramNames[stateKey],
            description: '12-week self-guided training and nutrition program tailored to your body state.',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'self_guided_program',
      lead_id: lead.id,
      body_state: stateKey,
      name: lead.name,
      email: lead.email ?? '',
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/program/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/program/cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
