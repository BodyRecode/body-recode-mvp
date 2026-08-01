import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailStatusCard,
  fromCoach,
} from '@/lib/email-shell'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Find sessions in the next 20–28 hours that haven't had a reminder sent
  const windowStart = new Date(Date.now() + 20 * 60 * 60 * 1000)
  const windowEnd = new Date(Date.now() + 28 * 60 * 60 * 1000)

  const { data: sessions } = await admin
    .from('client_sessions')
    .select('id, client_id, scheduled_at, duration_minutes, clients!inner(id, name, email, ended_at, frozen_at)')
    // Offboarded or frozen clients receive nothing.
    .is('clients.ended_at', null)
    .is('clients.frozen_at', null)
    .eq('status', 'scheduled')
    .is('reminder_sent_at', null)
    .gte('scheduled_at', windowStart.toISOString())
    .lte('scheduled_at', windowEnd.toISOString())

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const session of sessions) {
    const client = Array.isArray(session.clients) ? session.clients[0] : session.clients
    if (!client?.email) continue

    const firstName = (client.name as string).split(' ')[0]
    const sessionDate = new Date(session.scheduled_at)

    const displayDate = sessionDate.toLocaleDateString('en-AU', {
      timeZone: 'Australia/Brisbane',
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const displayTime = sessionDate.toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Brisbane',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })

    const confirmUrl = `${appUrl()}/api/portal/confirm-session?id=${session.id}`
    const subject = `Session reminder - tomorrow at ${displayTime}`

    try {
      await resend.emails.send({
        from: fromCoach(),
        to: client.email as string,
        subject,
        html: darkEmailShell(`
${emailLogo()}
${emailEyebrow('Session Reminder')}
${emailHeading(`See you ${displayDate.split(',')[0]}, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('Just a reminder that you have a session tomorrow.', { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'Face-to-face session',
  headline: `${displayDate} · ${displayTime}`,
  body: `${session.duration_minutes} minutes · AF Newstead. Tap below to confirm so I know to expect you.`,
})}
${emailCta({ href: confirmUrl, label: 'Confirm attendance' })}
${emailUrlFallback(confirmUrl, 'Or paste this confirm link into your browser')}
${emailBody("If you can't make it, log in to your portal and reschedule — or reply to this email.", { size: 13, bottom: 0 })}
${darkEmailSignature()}
`, { previewText: `Session tomorrow at ${displayTime}, ${firstName}.` }),
      })

      const sentAt = new Date().toISOString()
      await admin
        .from('client_sessions')
        .update({ reminder_sent_at: sentAt })
        .eq('id', session.id)

      await logClientCommunication(admin, {
        clientId: client.id as string,
        kind: 'session_reminder',
        subject,
        toAddress: client.email as string,
        sentAt,
        meta: {
          session_id: session.id,
          scheduled_at: session.scheduled_at,
          duration_minutes: session.duration_minutes,
          confirm_url: confirmUrl,
          trigger: 'cron',
        },
      })

      sent++
    } catch (e) {
      console.error(`Reminder failed for session ${session.id}:`, e)
    }
  }

  return NextResponse.json({ sent })
}
