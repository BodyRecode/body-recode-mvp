import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createZoomMeeting } from '@/lib/zoom'

const typeLabel: Record<string, string> = {
  zoom1: 'Zoom 1',
  zoom2: 'Zoom 2',
  other: 'Session',
}

const pipelineStageOnBooking: Record<string, string> = {
  zoom1: 'zoom_1_booked',
  zoom2: 'zoom_2_booked',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()

  if (!body.type || !body.scheduled_at || (!body.lead_id && !body.client_id)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get contact name for the Zoom meeting topic
  let contactName = 'Client'
  if (body.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('name')
      .eq('id', body.lead_id)
      .single()
    if (lead) contactName = lead.name
  } else if (body.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', body.client_id)
      .single()
    if (client) contactName = client.name
  }

  // Create Zoom meeting automatically
  let meetingLink = body.meeting_link || null
  let zoomMeetingId: number | null = null

  try {
    const zoom = await createZoomMeeting({
      topic: `Body Recode — ${typeLabel[body.type] ?? 'Session'} — ${contactName}`,
      startTime: body.scheduled_at,
      durationMinutes: body.duration_minutes ?? 60,
    })
    meetingLink = zoom.joinUrl
    zoomMeetingId = zoom.id
  } catch (err) {
    console.error('Zoom meeting creation failed:', err)
    // Don't block booking creation if Zoom fails — just log it
  }

  // Create the booking
  const { data: booking, error } = await supabase
    .from('be_bookings')
    .insert({
      coach_id: user.id,
      lead_id: body.lead_id || null,
      client_id: body.client_id || null,
      type: body.type,
      scheduled_at: body.scheduled_at,
      duration_minutes: body.duration_minutes ?? 60,
      meeting_link: meetingLink,
      notes: body.notes || null,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-move lead pipeline stage
  const newStage = pipelineStageOnBooking[body.type]
  if (newStage && body.lead_id) {
    await supabase
      .from('leads')
      .update({ status: newStage })
      .eq('id', body.lead_id)
  }

  return NextResponse.json({ ...booking, zoom_meeting_id: zoomMeetingId })
}
