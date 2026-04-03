import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createZoomMeeting } from '@/lib/zoom'
import { Resend } from 'resend'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fireTrigger } from '@/lib/automation-engine'

function generateIcs({
  title, startTime, durationMinutes, location, description, uid,
}: {
  title: string; startTime: string; durationMinutes: number
  location: string; description: string; uid: string
}): string {
  const start = new Date(startTime)
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Body Recode//Booking//EN',
    'CALSCALE:GREGORIAN', 'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}@bodyrecode.au`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, phone, slot } = body

  if (!name || !email || !slot) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify slot is still available
  const slotStart = new Date(slot)
  const { data: existingBookings } = await admin
    .from('be_bookings')
    .select('id')
    .eq('status', 'scheduled')
    .eq('scheduled_at', slotStart.toISOString())

  if (existingBookings && existingBookings.length > 0) {
    return NextResponse.json({ error: 'This slot has just been taken. Please choose another time.' }, { status: 409 })
  }

  // Find or create lead
  let lead
  const { data: existingLead } = await admin
    .from('leads')
    .select('*')
    .ilike('email', email.trim())
    .maybeSingle()

  if (existingLead) {
    lead = existingLead
    // Cancel any pending follow-up sequences
    const followupIds = (existingLead.followup_email_ids as string[] | null) ?? []
    if (followupIds.length > 0 && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      for (const emailId of followupIds) {
        try { await resend.emails.cancel(emailId) } catch {}
      }
    }
  } else {
    // Create new lead
    const { data: coach } = await admin
      .from('clients')
      .select('coach_id')
      .limit(1)
      .single()

    // Get coach_id from availability table
    const { data: avail } = await admin
      .from('be_availability')
      .select('coach_id')
      .limit(1)
      .single()

    const coachId = avail?.coach_id
    if (!coachId) return NextResponse.json({ error: 'No coach configured' }, { status: 500 })

    const { data: newLead, error: leadError } = await admin
      .from('leads')
      .insert({
        coach_id: coachId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        source: 'direct',
        status: 'zoom_1_booked',
      })
      .select()
      .single()

    if (leadError || !newLead) {
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }
    lead = newLead
  }

  // Determine zoom type based on lead status
  const isZoom2 = lead.status === 'zoom_1_completed'
  const bookingType = isZoom2 ? 'zoom2' : 'zoom1'
  const newStatus = isZoom2 ? 'zoom_2_booked' : 'zoom_1_booked'
  const sessionTitle = `Body Recode — Zoom ${isZoom2 ? '2' : '1'} — ${lead.name}`

  // Create Zoom meeting
  let meetingLink: string | null = null
  let zoomMeetingId: number | null = null
  try {
    const zoom = await createZoomMeeting({
      topic: sessionTitle,
      startTime: slot,
      durationMinutes: 30,
    })
    meetingLink = zoom.joinUrl
    zoomMeetingId = zoom.id
  } catch (err) {
    console.error('Zoom creation failed:', err)
  }

  // Create booking record
  const { data: booking, error: bookingError } = await admin
    .from('be_bookings')
    .insert({
      coach_id: lead.coach_id,
      lead_id: lead.id,
      type: bookingType,
      scheduled_at: slotStart.toISOString(),
      duration_minutes: 30,
      meeting_link: meetingLink,
      status: 'scheduled',
    })
    .select()
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }

  // Update lead status and zoom details
  await admin
    .from('leads')
    .update({
      status: newStatus,
      zoom_meeting_url: meetingLink,
      zoom_1_date: !isZoom2 ? slotStart.toISOString() : undefined,
      zoom_2_date: isZoom2 ? slotStart.toISOString() : undefined,
      followup_email_ids: null,
    })
    .eq('id', lead.id)

  // Log event
  await logLeadEvent({
    leadId: lead.id,
    type: 'zoom_booked',
    notes: `Zoom ${isZoom2 ? '2' : '1'} booked for ${slotStart.toLocaleString('en-AU', {
      timeZone: 'Australia/Brisbane',
      weekday: 'short', day: 'numeric', month: 'short',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })} Brisbane`,
    sentAt: new Date(),
  })

  const dateStr = slotStart.toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Australia/Brisbane',
  })
  const timeStr = slotStart.toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Australia/Brisbane',
  })
  const firstName = lead.name.split(' ')[0]

  const ics = generateIcs({
    title: sessionTitle,
    startTime: slot,
    durationMinutes: 30,
    location: meetingLink ?? 'Zoom',
    description: meetingLink ? `Join Zoom: ${meetingLink}` : '',
    uid: booking.id,
  })

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Email to lead
    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: lead.email,
      subject: `Your Zoom call is confirmed — ${dateStr}`,
      attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
      html: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:48px 32px;">
  <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;margin-bottom:40px;"/>
  <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Hi ${firstName},</p>
  <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your Zoom call with Kade is confirmed.</p>
  <div style="background:#111;border:1px solid #222;border-radius:12px;padding:24px;margin:0 0 28px;">
    <p style="font-size:16px;font-weight:700;color:#fff;margin:0 0 6px;">${dateStr}</p>
    <p style="font-size:15px;color:#aaa;margin:0 0 16px;">${timeStr} Brisbane · 30 min</p>
    ${meetingLink ? `<a href="${meetingLink}" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Join Zoom ↗</a>` : ''}
  </div>
  <p style="font-size:14px;color:#555;margin:0 0 8px;">Open the attached file to add this to your calendar.</p>
  <p style="font-size:15px;color:#aaa;line-height:1.9;margin:24px 0 0;">Looking forward to speaking with you.</p>
  <p style="font-size:15px;color:#aaa;margin:8px 0 0;">Kade</p>
</div>
</body></html>`,
    })

    // Email to coach
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `Zoom ${isZoom2 ? '2' : '1'} booked — ${lead.name}`,
      attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
      html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#aaa;">
  <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;"/>
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">Zoom ${isZoom2 ? '2' : '1'} booked — ${lead.name}</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 6px;">${dateStr}</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">${timeStr} Brisbane</p>
  ${meetingLink ? `<a href="${meetingLink}" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;margin-bottom:16px;">Join Zoom ↗</a>` : ''}
  <br/>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${lead.id}" style="display:inline-block;margin-top:12px;padding:10px 20px;border:1px solid #333;color:#aaa;font-size:13px;text-decoration:none;border-radius:8px;">View Lead →</a>
</div>`,
    })
  }

  // Fire automation triggers
  fireTrigger('booking_created', {
    leadId: lead.id,
    bookingId: booking.id,
    bookingType: bookingType,
  }, { booking_type: bookingType }).catch(err => console.error('Automation trigger failed:', err))

  if (!existingLead) {
    fireTrigger('lead_created', { leadId: lead.id })
      .catch(err => console.error('Automation trigger failed:', err))
  }

  return NextResponse.json({ success: true, bookingId: booking.id })
}
