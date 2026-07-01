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
import { coach } from '@/config/tenant'

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
        const firstName = contactName.split(' ')[0]
        const durationMinutes = body.duration_minutes ?? 60

        await resend.emails.send({
          from: fromCoach(),
          to: contactEmail,
          subject: `Your Zoom call is confirmed. ${dateStr}`,
          attachments: [
            {
              filename: 'booking.ics',
              content: Buffer.from(icsContent).toString('base64'),
            },
          ],
          html: darkEmailShell(`
${emailLogo()}
${emailEyebrow('Zoom Call · Confirmed')}
${emailHeading(`See you ${dateStr.split(',')[0]}, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('Your Zoom call with Kade is confirmed.', { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'When',
  headline: `${dateStr} · ${timeStr} Brisbane`,
  body: `${durationMinutes} minutes on Zoom. Tap the button below at the time to join.`,
})}
${meetingLink ? emailCta({ href: meetingLink, label: 'Join Zoom' }) : ''}
${meetingLink ? emailUrlFallback(meetingLink, 'Or paste the Zoom link into your browser') : ''}
${emailBody('Open the attached calendar file (.ics) to add this to your calendar.', { size: 13, bottom: 0 })}
${darkEmailSignature()}
`, { previewText: `${firstName}, your Zoom call is confirmed for ${dateStr}.` }),
        })

        // Scheduled reminders: 2 hours and 30 minutes before
        const reminder2hTime = new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000)
        const reminder30mTime = new Date(scheduledAt.getTime() - 30 * 60 * 1000)
        const now = Date.now()

        const reminderHtml = (minutesBefore: number) => {
          const label = minutesBefore === 120 ? '2 hours' : '30 minutes'
          return darkEmailShell(`
${emailLogo()}
${emailEyebrow('Zoom Call Reminder')}
${emailHeading(`Starting in ${label}, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Your Zoom call with Kade is in ${label}.`, { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'When',
  headline: `${dateStr} · ${timeStr} Brisbane`,
  body: `${durationMinutes} minutes on Zoom. Tap below at the time to join.`,
})}
${meetingLink ? emailCta({ href: meetingLink, label: 'Join Zoom' }) : ''}
${meetingLink ? emailUrlFallback(meetingLink, 'Or paste the Zoom link into your browser') : ''}
${darkEmailSignature()}
`, { previewText: `${firstName}, your Zoom call starts in ${label}.` })
        }

        if (reminder2hTime.getTime() > now + 60_000) {
          await resend.emails.send({
            from: fromCoach(),
            to: contactEmail,
            subject: `Your Zoom call is in 2 hours. ${timeStr} Brisbane`,
            scheduledAt: reminder2hTime.toISOString(),
            html: reminderHtml(120),
          })
        }

        if (reminder30mTime.getTime() > now + 60_000) {
          await resend.emails.send({
            from: fromCoach(),
            to: contactEmail,
            subject: `Your Zoom call is in 30 minutes. ${timeStr} Brisbane`,
            scheduledAt: reminder30mTime.toISOString(),
            html: reminderHtml(30),
          })
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
