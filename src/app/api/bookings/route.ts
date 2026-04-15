import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createZoomMeeting } from '@/lib/zoom'
import { Resend } from 'resend'
import { fireTrigger } from '@/lib/automation-engine'

const typeLabel: Record<string, string> = {
  zoom: 'Zoom',
  zoom1: 'Zoom',
  zoom2: 'Zoom',
  other: 'Session',
}

const pipelineStageOnBooking: Record<string, string> = {
  zoom: 'zoom_booked',
  zoom1: 'zoom_booked',
  zoom2: 'zoom_booked',
}

function generateIcs({
  title,
  startTime,
  durationMinutes,
  location,
  description,
  uid,
}: {
  title: string
  startTime: string
  durationMinutes: number
  location: string
  description: string
  uid: string
}): string {
  const start = new Date(startTime)
  const end = new Date(start.getTime() + durationMinutes * 60_000)

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Body Recode//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}@bodyrecode.au`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()

  if (!body.type || !body.scheduled_at || (!body.lead_id && !body.client_id)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get contact name + email
  let contactName = 'Client'
  let contactEmail: string | null = null
  if (body.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('name, email')
      .eq('id', body.lead_id)
      .single()
    if (lead) { contactName = lead.name; contactEmail = lead.email }
  } else if (body.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', body.client_id)
      .single()
    if (client) { contactName = client.name; contactEmail = client.email }
  }

  const sessionTitle = `Body Recode — ${typeLabel[body.type] ?? 'Session'} — ${contactName}`

  // Create Zoom meeting
  let meetingLink = body.meeting_link || null
  let zoomMeetingId: number | null = null

  try {
    const zoom = await createZoomMeeting({
      topic: sessionTitle,
      startTime: body.scheduled_at,
      durationMinutes: body.duration_minutes ?? 60,
    })
    meetingLink = zoom.joinUrl
    zoomMeetingId = zoom.id
  } catch (err) {
    console.error('Zoom meeting creation failed:', err)
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

  // Send .ics calendar invite to coach
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)

      const scheduledAt = new Date(body.scheduled_at)
      const dateStr = scheduledAt.toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Australia/Brisbane',
      })
      const timeStr = scheduledAt.toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Australia/Brisbane',
      })

      const icsContent = generateIcs({
        title: sessionTitle,
        startTime: body.scheduled_at,
        durationMinutes: body.duration_minutes ?? 60,
        location: meetingLink ?? 'Zoom',
        description: meetingLink ? `Join Zoom: ${meetingLink}` : 'Zoom link not available',
        uid: booking.id,
      })

      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Booking confirmed — ${contactName} — ${typeLabel[body.type] ?? 'Session'}`,
        html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#aaa;">
  <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${typeLabel[body.type] ?? 'Session'} booked — ${contactName}</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 6px;">${dateStr}</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">${timeStr} Brisbane · ${body.duration_minutes ?? 60} min</p>
  ${meetingLink ? `<a href="${meetingLink}" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;margin-bottom:24px;">Join Zoom ↗</a>` : ''}
  <p style="font-size:13px;color:#555;margin:24px 0 0;">Open the attached .ics file to add this to Apple Calendar.</p>
</div>`,
        attachments: [
          {
            filename: 'booking.ics',
            content: Buffer.from(icsContent).toString('base64'),
          },
        ],
      })
    } catch (err) {
      console.error('Failed to send booking email:', err)
    }
  }

  // Fire automation trigger
  fireTrigger('booking_created', {
    leadId: body.lead_id || undefined,
    clientId: body.client_id || undefined,
    bookingId: booking.id,
    bookingType: body.type,
  }, { booking_type: body.type }).catch(err => console.error('Automation trigger failed:', err))

  return NextResponse.json({ ...booking, zoom_meeting_id: zoomMeetingId })
}
