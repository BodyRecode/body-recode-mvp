import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import { emailUrlFallback } from '@/lib/email-shell'
import { logLeadEvent } from '@/lib/log-lead-event'

function generateIcs({ title, startTime, durationMinutes, location, description, uid }: {
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

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data: lead } = await admin.from('leads').select('*').eq('id', id).single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.email) return NextResponse.json({ error: 'Lead has no email' }, { status: 400 })
  if (!lead.zoom_1_date) return NextResponse.json({ error: 'No Zoom date set on this lead. Set it in Actions first.' }, { status: 400 })

  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

  const slotStart = new Date(lead.zoom_1_date)
  const meetingLink: string | null = lead.zoom_meeting_url ?? null
  const firstName = lead.name.split(' ')[0]
  const sessionTitle = `Body Recode Strategy Call - ${lead.name}`

  const dateStr = slotStart.toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Australia/Brisbane',
  })
  const timeStr = slotStart.toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Australia/Brisbane',
  })

  const ics = generateIcs({
    title: sessionTitle,
    startTime: lead.zoom_1_date,
    durationMinutes: 30,
    location: meetingLink ?? 'Zoom',
    description: meetingLink ? `Join Zoom: ${meetingLink}` : '',
    uid: `manual-${lead.id}`,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: lead.email,
    subject: `Your strategy call is locked in: ${dateStr}`,
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
            <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">You are locked in. Here is what we will cover.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#888888;line-height:1.75;">We go through your scorecard together, identify the specific reason your body has stopped responding, and map out what to do first. Free. No pitch.</p>
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
            ${meetingLink ? emailUrlFallback(meetingLink, 'Or paste the Zoom link into your browser') : ''}
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })

  // Schedule 2-hour and 30-minute reminder emails if Zoom call is in the future
  const twoHoursBefore = new Date(slotStart.getTime() - 2 * 60 * 60 * 1000)
  const thirtyMinBefore = new Date(slotStart.getTime() - 30 * 60 * 1000)
  const now = new Date()

  const reminders: { at: Date; label: string }[] = []
  if (twoHoursBefore > now) reminders.push({ at: twoHoursBefore, label: '2 hours' })
  if (thirtyMinBefore > now) reminders.push({ at: thirtyMinBefore, label: '30 minutes' })

  for (const reminder of reminders) {
    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: lead.email!,
      subject: `Your strategy call starts in ${reminder.label}`,
      scheduledAt: reminder.at.toISOString(),
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
            <p style="margin:0 0 24px;font-size:15px;color:#888888;line-height:1.75;">Your strategy call with Kade starts in ${reminder.label}.</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
                  <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#ffffff;">${dateStr}</p>
                  <p style="margin:0 0 16px;font-size:14px;color:#888888;">${timeStr} Brisbane · 30 min</p>
                  ${meetingLink ? `<a href="${meetingLink}" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Join Zoom ↗</a>` : ''}
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
</body></html>`,
    })
  }

  // Update lead status to zoom_1_booked
  await admin.from('leads').update({ status: 'zoom_1_booked', updated_at: new Date().toISOString() }).eq('id', lead.id)

  await logLeadEvent({
    leadId: lead.id,
    type: 'zoom_booked',
    notes: `Zoom booking confirmation sent for ${slotStart.toLocaleString('en-AU', {
      timeZone: 'Australia/Brisbane',
      weekday: 'short', day: 'numeric', month: 'short',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })} Brisbane${reminders.length > 0 ? ` + ${reminders.length} reminder${reminders.length > 1 ? 's' : ''} scheduled` : ''}`,
    sentAt: new Date(),
  })

  return NextResponse.json({ success: true })
}
