import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  // Optional flag — when true, the coach has confirmed the commencement fee
  // is already in (e.g. cash, transfer). When false (the default), the client
  // is created but the lead's status is left alone so the commencement-fee
  // link can still be sent later. Once Stripe webhook records the payment it
  // moves the status to 'commencement_fee_paid'.
  let markPaid = false
  try {
    const body = await request.json()
    markPaid = body?.markPaid === true
  } catch {
    // empty body is fine - default false
  }

  // Get lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.converted_to_client_id) return NextResponse.json({ error: 'Already converted' }, { status: 400 })

  // Create client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({ coach_id: user.id, name: lead.name, email: lead.email || null })
    .select()
    .single()

  if (clientError || !client) return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })

  // Create intake invitation
  const { data: invitation, error: invError } = await supabase
    .from('intake_invitations')
    .insert({ client_id: client.id })
    .select()
    .single()

  if (invError || !invitation) return NextResponse.json({ error: 'Failed to generate intake link' }, { status: 500 })

  // Update lead. Only flip the status to 'commencement_fee_paid' when the
  // coach has confirmed the fee is in. Otherwise leave the existing status
  // so the commencement-fee link can still be sent later.
  const update: Record<string, unknown> = {
    converted_to_client_id: client.id,
    converted_at: new Date().toISOString(),
  }
  if (markPaid) update.status = 'commencement_fee_paid'

  await supabase
    .from('leads')
    .update(update)
    .eq('id', id)

  return NextResponse.json({
    client_id: client.id,
    intake_token: invitation.token,
  })
}
