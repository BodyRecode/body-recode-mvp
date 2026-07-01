import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultCoachId } from '@/lib/default-coach'
import { createZoomMeeting } from '@/lib/zoom'
import { Resend } from 'resend'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fireTrigger } from '@/lib/automation-engine'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailStatusCard,
  fromCoach, fromBrand,
} from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'
import { coach } from '@/config/tenant'

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
    const coachId = await getDefaultCoachId(admin)
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

  const sessionTitle = `Body Recode — Scorecard Review — ${lead.name}`

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
      type: 'zoom1',
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
  const { error: leadUpdateError } = await admin
    .from('leads')
    .update({
      status: 'zoom_1_booked',
      zoom_meeting_url: meetingLink,
      zoom_1_date: slotStart.toISOString(),
      followup_email_ids: null,
    })
    .eq('id', lead.id)

  if (leadUpdateError) {
    console.error('Lead update failed after booking:', leadUpdateError.message, leadUpdateError)
  }

  // Log event
  await logLeadEvent({
    leadId: lead.id,
    type: 'zoom_booked',
    notes: `Zoom booked for ${slotStart.toLocaleString('en-AU', {
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

    // Email to lead — Zoom confirmation
    await resend.emails.send({
      from: fromCoach(),
      to: lead.email,
      subject: `Your Zoom call is confirmed — ${dateStr}`,
      attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
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
  body: '30 minutes on Zoom. Tap the button below at the time to join.',
})}
${meetingLink ? emailCta({ href: meetingLink, label: 'Join Zoom' }) : ''}
${meetingLink ? emailUrlFallback(meetingLink, 'Or paste the Zoom link into your browser') : ''}
${emailBody('Open the attached calendar file (.ics) to add this to your calendar.', { size: 13, bottom: 0 })}
${darkEmailSignature()}
`, { previewText: `${firstName}, your Zoom call is confirmed for ${dateStr}.` }),
    })

    // Reminder emails to lead (scheduled)
    const reminder2hTime = new Date(slotStart.getTime() - 2 * 60 * 60 * 1000)
    const reminder30mTime = new Date(slotStart.getTime() - 30 * 60 * 1000)
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
  body: '30 minutes on Zoom. Tap below at the time to join.',
})}
${meetingLink ? emailCta({ href: meetingLink, label: 'Join Zoom' }) : ''}
${meetingLink ? emailUrlFallback(meetingLink, 'Or paste the Zoom link into your browser') : ''}
${darkEmailSignature()}
`, { previewText: `${firstName}, your Zoom call starts in ${label}.` })
    }

    if (reminder2hTime.getTime() > now + 60_000) {
      await resend.emails.send({
        from: fromCoach(),
        to: lead.email,
        subject: `Your Zoom call is in 2 hours — ${timeStr} Brisbane`,
        scheduledAt: reminder2hTime.toISOString(),
        html: reminderHtml(120),
      })
    }

    if (reminder30mTime.getTime() > now + 60_000) {
      await resend.emails.send({
        from: fromCoach(),
        to: lead.email,
        subject: `Your Zoom call is in 30 minutes — ${timeStr} Brisbane`,
        scheduledAt: reminder30mTime.toISOString(),
        html: reminderHtml(30),
      })
    }

    // Email to coach — booking notification
    await resend.emails.send({
      from: fromBrand(),
      to: coach().email,
      subject: `Zoom booked — ${lead.name}`,
      html: darkEmailShell(`
${emailLogo()}
${emailEyebrow('Zoom Booked')}
${emailHeading(`${lead.name} just booked a strategy call.`)}
${emailDivider()}
${emailBody(`${lead.email}`, { color: '#6B6B6B', size: 14, bottom: 20 })}
${emailStatusCard({
  eyebrow: 'Date & Time',
  headline: `${dateStr} · ${timeStr} Brisbane`,
  body: '30 minute Zoom call. Confirmation email + reminders have been auto-scheduled.',
})}
${emailCta({ href: `${appUrl()}/dashboard/leads/${lead.id}`, label: 'View lead' })}
${meetingLink ? emailUrlFallback(meetingLink, 'Or join the Zoom call directly') : ''}
${darkEmailSignature()}
`, { previewText: `${lead.name} booked a Zoom call for ${dateStr}.` }),
    })
  }

  // Fire automation triggers
  fireTrigger('booking_created', {
    leadId: lead.id,
    bookingId: booking.id,
    bookingType: 'zoom',
  }, { booking_type: 'zoom' }).catch(err => console.error('Automation trigger failed:', err))

  if (!existingLead) {
    fireTrigger('lead_created', { leadId: lead.id })
      .catch(err => console.error('Automation trigger failed:', err))
  }

  return NextResponse.json({ success: true, bookingId: booking.id })
}
