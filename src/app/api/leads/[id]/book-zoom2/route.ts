import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createZoomMeeting } from '@/lib/zoom'
import { Resend } from 'resend'
import { logLeadEvent } from '@/lib/log-lead-event'
import { darkEmailSignature } from '@/lib/email-signature'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { scheduledAt } = await request.json()

  if (!scheduledAt) return NextResponse.json({ error: 'Missing scheduledAt' }, { status: 400 })

  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const slotStart = new Date(scheduledAt)
  const sessionTitle = `Body Recode — Zoom 2 — ${lead.name}`

  // Create Zoom meeting
  let meetingLink: string | null = null
  let zoomMeetingId: number | null = null
  try {
    const zoom = await createZoomMeeting({
      topic: sessionTitle,
      startTime: scheduledAt,
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
      type: 'zoom2',
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

  // Update lead
  await admin
    .from('leads')
    .update({
      status: 'zoom_2_booked',
      zoom_meeting_url: meetingLink,
      zoom_2_date: slotStart.toISOString(),
    })
    .eq('id', id)

  await logLeadEvent({
    leadId: id,
    type: 'zoom_booked',
    notes: `Zoom 2 booked for ${slotStart.toLocaleString('en-AU', {
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
    startTime: scheduledAt,
    durationMinutes: 30,
    location: meetingLink ?? 'Zoom',
    description: meetingLink ? `Join Zoom: ${meetingLink}` : '',
    uid: booking.id,
  })

  if (process.env.RESEND_API_KEY && lead.email) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Email to lead
    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: lead.email,
      subject: `Zoom 2 confirmed — ${dateStr}`,
      attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
            <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Hi ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#888888;line-height:1.75;">Your Zoom 2 with Kade is confirmed.</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
                  <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#ffffff;">${dateStr}</p>
                  <p style="margin:0 0 16px;font-size:14px;color:#888888;">${timeStr} Brisbane · 30 min</p>
                  ${meetingLink ? `<a href="${meetingLink}" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Join Zoom ↗</a>` : ''}
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#555555;">Open the attached file to add this to your calendar.</p>
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })

    // Email to coach
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `Zoom 2 booked — ${lead.name}`,
      attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:480px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
            <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#ffffff;">Zoom 2 booked — ${lead.name}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#a8a29e;">${lead.email}</p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;width:100%;">
              <tr>
                <td style="padding:14px 20px;background:#1a1a1a;border-radius:10px;border:1px solid #222;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#57534e;letter-spacing:0.08em;text-transform:uppercase;">Date &amp; Time</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#ffffff;">${dateStr} · ${timeStr} Brisbane</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0"><tr>
              ${meetingLink ? `<td style="padding-right:12px;"><a href="${meetingLink}" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">Join Zoom ↗</a></td>` : ''}
              <td><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${lead.id}" style="display:inline-block;padding:12px 20px;border:1px solid #333;color:#a8a29e;font-size:13px;text-decoration:none;border-radius:8px;">View Lead →</a></td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })
  }

  return NextResponse.json({ success: true, meetingLink, bookingId: booking.id })
}
