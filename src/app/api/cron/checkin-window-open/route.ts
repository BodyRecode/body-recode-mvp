import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody, emailCta,
  emailStatusCard,
  fromCoach,
} from '@/lib/email-shell'
import { sendSms, formatPhone } from '@/lib/twilio'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Get all active clients with a portal token
  const { data: clients } = await admin
    .from('clients')
    .select('id, name, email, phone, onboarding_token, coaching_started_at')
    .not('onboarding_token', 'is', null)

  if (!clients || clients.length === 0) {
    return NextResponse.json({ emailsSent: 0, smsSent: 0 })
  }

  // Build the set of client_ids that have an ACTIVE training program.
  // Weekly check-ins evaluate training response — there is nothing to
  // evaluate (and nothing for the client to report on) until a program is
  // live, so we mirror the portal-side gate (see project_weekly_checkin_program_gate
  // in feature registry) and skip anyone without one.
  const { data: activePrograms } = await admin
    .from('programs')
    .select('client_id')
    .eq('is_active', true)
  const clientsWithActiveProgram = new Set(
    (activePrograms ?? []).map((p: { client_id: string }) => p.client_id)
  )

  let emailsSent = 0
  let smsSent = 0
  let skippedNoProgram = 0

  for (const client of clients) {
    if (!client.onboarding_token) continue

    // Only notify clients who have started coaching
    if (!client.coaching_started_at) continue
    const startDate = new Date(client.coaching_started_at)
    if (startDate > new Date()) continue

    // No active training program = nothing to check in against. Skip.
    if (!clientsWithActiveProgram.has(client.id)) {
      skippedNoProgram++
      continue
    }

    const firstName = client.name.split(' ')[0]
    const portalUrl = `${appUrl()}/portal/${client.onboarding_token}`

    const subject = 'Your weekly check-in is now open'

    // Email
    if (client.email) {
      await resend.emails.send({
        from: fromCoach(),
        to: client.email,
        subject,
        html: darkEmailShell(`
${emailLogo()}
${emailEyebrow('Weekly Check-In')}
${emailHeading('Your weekly check-in is open.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('Your weekly check-in window is now open in your portal. Complete it before Sunday 6pm Brisbane time so I can review your data and update your program for the week ahead.', { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'Window closes',
  headline: 'Sunday 6pm Brisbane',
  body: 'Submissions after this point roll forward to next week. Aim for Friday or Saturday if your schedule allows.',
})}
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`, { previewText: `${firstName}, your weekly check-in is open until Sunday 6pm.` }),
      })
      await logClientCommunication(admin, {
        clientId: client.id,
        kind: 'checkin_window_open',
        channel: 'email',
        subject,
        toAddress: client.email,
        meta: { url: portalUrl, trigger: 'cron' },
      })
      emailsSent++
    }

    // SMS
    if (client.phone) {
      await sendSms({
        to: formatPhone(client.phone),
        message: `Hi ${firstName}, your Body Recode weekly check-in is now open. Close Sunday 6pm. Open your portal: ${portalUrl}`,
      })
      await logClientCommunication(admin, {
        clientId: client.id,
        kind: 'checkin_window_open',
        channel: 'sms',
        subject: null,
        toAddress: client.phone,
        meta: { url: portalUrl, trigger: 'cron' },
      })
      smsSent++
    }
  }

  return NextResponse.json({ emailsSent, smsSent, skippedNoProgram })
}
