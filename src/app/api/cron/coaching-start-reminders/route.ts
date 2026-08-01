import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody, emailCta,
  fromCoach,
} from '@/lib/email-shell'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from "@/lib/app-url";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Find clients whose coaching starts tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStart = new Date(tomorrow)
  tomorrowStart.setHours(0, 0, 0, 0)
  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(23, 59, 59, 999)

  const { data: clients } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token, coaching_started_at')
    // Offboarded or frozen clients receive nothing. Gated on clients.ended_at (final) and clients.frozen_at (paused) rather than
    // on an active plan, so a coach can archive a former client's file without
    // it silently re-enabling contact. See offboard-client.ts.
    .is('ended_at', null)
    .is('frozen_at', null)
    .gte('coaching_started_at', tomorrowStart.toISOString())
    .lte('coaching_started_at', tomorrowEnd.toISOString())

  if (!clients || clients.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  const subject = 'Coaching begins tomorrow'
  for (const client of clients) {
    if (!client.email) continue
    const firstName = client.name.split(' ')[0]
    const portalUrl = client.onboarding_token
      ? `${appUrl()}/portal/${client.onboarding_token}`
      : `${appUrl()}/portal/login`

    await resend.emails.send({
      from: fromCoach(),
      to: client.email,
      subject,
      html: darkEmailShell(`
${emailLogo()}
${emailEyebrow('Coaching Starts Tomorrow')}
${emailHeading(`See you tomorrow, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('Just a reminder that your coaching begins tomorrow.')}
${emailBody("I'll be in touch with your session details shortly. If you have any questions before we begin, reply to this email.")}
${emailBody('Looking forward to it.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`, { previewText: `${firstName}, coaching begins tomorrow.` }),
    })
    await logClientCommunication(admin, {
      clientId: client.id,
      kind: 'coaching_start_reminder',
      subject,
      toAddress: client.email,
      meta: { coaching_started_at: client.coaching_started_at, trigger: 'cron' },
    })
    sent++
  }

  return NextResponse.json({ sent })
}
