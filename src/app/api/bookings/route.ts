import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createZoomMeeting } from '@/lib/zoom'
import { Resend } from 'resend'
import { fireTrigger } from '@/lib/automation-engine'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailStatusCard,
  fromCoach, fromBrand,
} from '@/lib/email-shell'
import { coach, brand } from '@/config/tenant'
import { buildBookingConfirmationEmail, scheduleBookingReminders } from '@/lib/booking-reminders'

const typeLabel: Record<string, string> = {
  zoom: 'Zoom',
  zoom1: 'Zoom',
  zoom2: 'Zoom',
  other: 'Session',
}

const pipelineStageOnBooking: Record<string, string> = {
  zoom: 'zoom_1_booked',
  zoom1: 'zoom_1_booked',
  zoom2: 'zoom_1_booked',
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
  let prepUrl: string | null = null
  if (body.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('name, email')
      .eq('id', body.lead_id)
      .single()
    if (lead) { contactName = lead.name; contactEmail = lead.email }

    // Pre-call form link, but ONLY if this lead has not already completed it.
    //
    // Added 2026-08-06. Until now the form link was surfaced in exactly one
    // place: the confirmation sent by /api/book-request when a lead requested a
    // time through the booking page. Anyone booked straight from the dashboard —
    // every lead whose time was agreed by email, text or DM — never saw it at
    // all, so Kade walked into those calls with no brief. Renders nothing for
    // leads who have already filled it in.
    const { data: prepDone } = await supabase
      .from('lead_events')
      .select('id')
      .eq('lead_id', body.lead_id)
      .eq('type', 'prep_form_completed')
      .limit(1)
    if (!prepDone || prepDone.length === 0) {
      prepUrl = `${brand().marketingDomain}/book/prep/${body.lead_id}`
    }
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
      // Stored so the booking can be MOVED rather than deleted and recreated.
      // Without it there is nothing to update on Zoom's side. See
      // sql/2026-08-10_booking_reschedule.sql.
      zoom_meeting_id: zoomMeetingId,
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
        from: fromBrand(),
        to: coach().email,
        subject: `Booking confirmed — ${contactName} — ${typeLabel[body.type] ?? 'Session'}`,
        html: darkEmailShell(`
${emailLogo()}
${emailEyebrow(`${typeLabel[body.type] ?? 'Session'} Booked`)}
${emailHeading(`${contactName} just booked.`)}
${emailDivider()}
${emailStatusCard({
  eyebrow: 'Date & Time',
  headline: `${dateStr} · ${timeStr} Brisbane`,
  body: `${body.duration_minutes ?? 60} minutes. Calendar (.ics) file attached.`,
})}
${meetingLink ? emailCta({ href: meetingLink, label: 'Join Zoom' }) : ''}
${meetingLink ? emailUrlFallback(meetingLink, 'Or paste the Zoom link into your browser') : ''}
${darkEmailSignature()}
`, { previewText: `${contactName} booked ${typeLabel[body.type] ?? 'a session'} for ${dateStr}.` }),
        attachments: [
          {
            filename: 'booking.ics',
            content: Buffer.from(icsContent).toString('base64'),
          },
        ],
      })

      // Send confirmation + reminders to the lead/client
      if (contactEmail) {
        const emailCtx = {
          firstName: contactName.split(' ')[0],
          dateStr,
          timeStr,
          durationMinutes: body.duration_minutes ?? 60,
          meetingLink,
          prepUrl,
        }

        const confirmation = buildBookingConfirmationEmail(emailCtx)
        await resend.emails.send({
          from: fromCoach(),
          to: contactEmail,
          subject: confirmation.subject,
          attachments: [
            {
              filename: 'booking.ics',
              content: Buffer.from(icsContent).toString('base64'),
            },
          ],
          html: confirmation.html,
        })

        // Reminder IDs are persisted so a later reschedule or cancel can pull
        // them back out of Resend's queue. Before 2026-08-10 they were
        // discarded, so a booking made at the wrong time left two stale
        // reminders that fired at the old time no matter what the dashboard
        // said.
        const reminderIds = await scheduleBookingReminders({
          to: contactEmail,
          scheduledAt,
          ctx: emailCtx,
        })
        if (reminderIds.length) {
          await supabase
            .from('be_bookings')
            .update({ reminder_email_ids: reminderIds })
            .eq('id', booking.id)
        }
      }
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
