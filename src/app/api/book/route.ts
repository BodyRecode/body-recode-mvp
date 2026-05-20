import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createZoomMeeting } from '@/lib/zoom'
import { Resend } from 'resend'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fireTrigger } from '@/lib/automation-engine'
import { darkEmailSignature } from '@/lib/email-signature'
import { emailUrlFallback } from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'

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
    const { data: newLead, error: leadError } = await admin
      .from('leads')
      .insert({
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

    // Email to lead
    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: lead.email,
      subject: `Your Zoom call is confirmed — ${dateStr}`,
      attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
            <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Hi ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#999999;line-height:1.75;">Your Zoom call with Kade is confirmed.</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
                  <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1A1A1A;">${dateStr}</p>
                  <p style="margin:0 0 16px;font-size:14px;color:#999999;">${timeStr} Brisbane · 30 min</p>
                  ${meetingLink ? `<a href="${meetingLink}" style="display:inline-block;padding:12px 24px;background:#1B6DFC;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Join Zoom ↗</a>` : ''}
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#6B6B6B;">Open the attached file to add this to your calendar.</p>
            ${meetingLink ? emailUrlFallback(meetingLink, 'Or paste the Zoom link into your browser') : ''}
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })

    // Reminder emails to lead (scheduled)
    const reminder2hTime = new Date(slotStart.getTime() - 2 * 60 * 60 * 1000)
    const reminder30mTime = new Date(slotStart.getTime() - 30 * 60 * 1000)
    const now = Date.now()

    const reminderHtml = (minutesBefore: number) => `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
            <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Hi ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#999999;line-height:1.75;">Your Zoom call with Kade is in ${minutesBefore === 120 ? '2 hours' : '30 minutes'}.</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
                  <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1A1A1A;">${dateStr}</p>
                  <p style="margin:0 0 16px;font-size:14px;color:#999999;">${timeStr} Brisbane · 30 min</p>
                  ${meetingLink ? `<a href="${meetingLink}" style="display:inline-block;padding:12px 24px;background:#1B6DFC;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Join Zoom ↗</a>` : ''}
                </td>
              </tr>
            </table>
            ${meetingLink ? emailUrlFallback(meetingLink, 'Or paste the Zoom link into your browser') : ''}
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`

    if (reminder2hTime.getTime() > now + 60_000) {
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: lead.email,
        subject: `Your Zoom call is in 2 hours — ${timeStr} Brisbane`,
        scheduledAt: reminder2hTime.toISOString(),
        html: reminderHtml(120),
      })
    }

    if (reminder30mTime.getTime() > now + 60_000) {
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: lead.email,
        subject: `Your Zoom call is in 30 minutes — ${timeStr} Brisbane`,
        scheduledAt: reminder30mTime.toISOString(),
        html: reminderHtml(30),
      })
    }

    // Email to coach
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `Zoom booked — ${lead.name}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:480px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
            <img src="https://bodyrecode.au/logo-black.png" width="110" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1A1A1A;">Zoom booked — ${lead.name}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#6B6B6B;">${lead.email}</p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;width:100%;">
              <tr>
                <td style="padding:14px 20px;background:#1a1a1a;border-radius:10px;border:1px solid #222;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">Date &amp; Time</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1A1A1A;">${dateStr} · ${timeStr} Brisbane</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0"><tr>
              ${meetingLink ? `<td style="padding-right:12px;"><a href="${meetingLink}" style="display:inline-block;padding:12px 24px;background:#1B6DFC;color:#000;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">Join Zoom ↗</a></td>` : ''}
              <td><a href="${appUrl()}/dashboard/leads/${lead.id}" style="display:inline-block;padding:12px 20px;border:1px solid #333;color:#6B6B6B;font-size:13px;text-decoration:none;border-radius:8px;">View Lead →</a></td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
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
