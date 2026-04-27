import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

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

  // Update lead
  await supabase
    .from('leads')
    .update({
      converted_to_client_id: client.id,
      converted_at: new Date().toISOString(),
      status: 'commencement_fee_paid',
    })
    .eq('id', id)

  return NextResponse.json({
    client_id: client.id,
    intake_token: invitation.token,
  })
}
