import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailStatusCard,
  fromCoach,
} from '@/lib/email-shell'
import { logLeadEvent } from '@/lib/log-lead-event'
import { inngest } from '@/lib/inngest'
import { isCoachUser, forbidden } from '@/lib/api-auth'

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
  if (!(await isCoachUser(user))) return forbidden()

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
    from: fromCoach(),
    to: lead.email,
    subject: `Your strategy call is locked in: ${dateStr}`,
    attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
    html: darkEmailShell(`
${emailLogo()}
${emailEyebrow('Strategy Call · Locked In')}
${emailHeading(`See you ${dateStr.split(',')[0]}, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You are locked in. Here is what we will cover.')}
${emailBody('We go through your scorecard together, identify the specific reason your body has stopped responding, and map out what to do first. Free. No pitch.', { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'When',
  headline: `${dateStr} · ${timeStr} Brisbane`,
  body: '30 minutes on Zoom. Tap the button below at the time to join.',
})}
${meetingLink ? emailCta({ href: meetingLink, label: 'Join Zoom' }) : ''}
${meetingLink ? emailUrlFallback(meetingLink, 'Or paste the Zoom link into your browser') : ''}
${emailBody('Open the attached calendar file (.ics) to add this to your calendar.', { size: 13, bottom: 0 })}
${darkEmailSignature()}
`, { previewText: `${firstName}, your strategy call is locked in for ${dateStr}.` }),
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
      from: fromCoach(),
      to: lead.email!,
      subject: `Your strategy call starts in ${reminder.label}`,
      scheduledAt: reminder.at.toISOString(),
      html: darkEmailShell(`
${emailLogo()}
${emailEyebrow('Strategy Call Reminder')}
${emailHeading(`Starting in ${reminder.label}, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Your strategy call with Kade starts in ${reminder.label}.`, { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'When',
  headline: `${dateStr} · ${timeStr} Brisbane`,
  body: '30 minutes on Zoom. Tap below at the time to join.',
})}
${meetingLink ? emailCta({ href: meetingLink, label: 'Join Zoom' }) : ''}
${meetingLink ? emailUrlFallback(meetingLink, 'Or paste the Zoom link into your browser') : ''}
${darkEmailSignature()}
`, { previewText: `${firstName}, your strategy call starts in ${reminder.label}.` }),
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

  // Fire speed-to-lead no-show trigger. Inngest sleeps until scheduled + 30 min
  // and, if the lead status is still zoom_1_booked (coach hasn't marked
  // completed or no-show), sends the no-show SMS. Non-fatal on failure.
  try {
    await inngest.send({
      name: 'booking/scheduled',
      data: {
        leadId: lead.id,
        scheduledAt: slotStart.toISOString(),
      },
    })
  } catch (e) {
    console.error('[booking-confirmation] booking/scheduled inngest.send failed:', e)
  }

  return NextResponse.json({ success: true })
}
