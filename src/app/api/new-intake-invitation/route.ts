import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { clientId } = await request.json()

  // Verify client belongs to this coach
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { data: invitation, error } = await supabase
    .from('intake_invitations')
    .insert({ client_id: clientId })
    .select()
    .single()

  if (error || !invitation) return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })

  return NextResponse.json({ token: invitation.token })
}
