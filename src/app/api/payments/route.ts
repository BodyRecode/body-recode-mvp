import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fireTrigger } from '@/lib/automation-engine'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()

  if (!body.amount || (!body.lead_id && !body.client_id)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('be_payments')
    .insert({
      coach_id: user.id,
      lead_id: body.lead_id ?? null,
      client_id: body.client_id ?? null,
      product_id: body.product_id ?? null,
      amount: body.amount,
      status: body.status ?? 'paid',
      paid_at: body.status === 'paid' ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.status === 'paid') {
    fireTrigger('payment_completed', {
      leadId: body.lead_id || undefined,
      clientId: body.client_id || undefined,
      paymentId: data.id,
    }).catch(err => console.error('Automation trigger failed:', err))
  }

  return NextResponse.json(data)
}
