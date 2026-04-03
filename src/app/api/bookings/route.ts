import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()

  if (!body.type || !body.scheduled_at || (!body.lead_id && !body.client_id)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('be_bookings')
    .insert({
      coach_id: user.id,
      lead_id: body.lead_id || null,
      client_id: body.client_id || null,
      type: body.type,
      scheduled_at: body.scheduled_at,
      duration_minutes: body.duration_minutes ?? 60,
      meeting_link: body.meeting_link || null,
      notes: body.notes || null,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
