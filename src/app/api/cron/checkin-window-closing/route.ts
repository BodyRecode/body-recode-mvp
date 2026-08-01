import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailCallout,
  fromCoach,
} from '@/lib/email-shell'
import { sendSms, formatPhone } from '@/lib/twilio'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Get all active coaching clients with portal access
  const { data: clients } = await admin
    .from('clients')
    .select('id, name, email, phone, onboarding_token, coaching_started_at')
    // Offboarded or frozen clients receive nothing. Gated on clients.ended_at (final) and clients.frozen_at (paused) rather than
    // on an active plan, so a coach can archive a former client's file without
    // it silently re-enabling contact. See offboard-client.ts.
    .is('ended_at', null)
    .is('frozen_at', null)
    .not('onboarding_token', 'is', null)
    .not('coaching_started_at', 'is', null)

  if (!clients || clients.length === 0) {
    return NextResponse.json({ emailsSent: 0, smsSent: 0 })
  }

  // Get all check-ins submitted this window (past 7 days) to check who's done
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentCheckins } = await admin
    .from('weekly_checkins')
    .select('client_id, week_number, form_type')
    .gte('submitted_at', since)

  const checkinsByClient = new Map<string, Set<string>>()
  for (const ci of recentCheckins ?? []) {
    if (!checkinsByClient.has(ci.client_id)) checkinsByClient.set(ci.client_id, new Set())
    checkinsByClient.get(ci.client_id)!.add(`${ci.week_number}-${ci.form_type}`)
  }

  // Build the set of client_ids that have an ACTIVE training program.
  // Mirror the portal-side gate: weekly check-ins evaluate training response,
  // so a client with no active program has nothing to evaluate and gets no
  // closing reminder.
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
    if (!client.onboarding_token || !client.coaching_started_at) continue

    // Skip clients whose coaching hasn't started yet
    if (new Date(client.coaching_started_at) > new Date()) continue

    // No active training program = no check-in expected = no closing nudge.
    if (!clientsWithActiveProgram.has(client.id)) {
      skippedNoProgram++
      continue
    }

    // Determine their current week number
    const weekNumber = getWeekNumber(client.coaching_started_at)
    if (!weekNumber) continue

    // Check if they've submitted both forms this week
    const submitted = checkinsByClient.get(client.id) ?? new Set()
    const doneA = submitted.has(`${weekNumber}-A`)
    const doneB = submitted.has(`${weekNumber}-B`)

    // If both done, skip
    if (doneA && doneB) continue

    const firstName = client.name.split(' ')[0]
    const portalUrl = `${appUrl()}/portal/${client.onboarding_token}`

    const subject = 'Check-in closes in 1 hour'

    // Email
    if (client.email) {
      await resend.emails.send({
        from: fromCoach(),
        to: client.email,
        subject,
        html: darkEmailShell(`
${emailLogo()}
${emailEyebrow('Check-In Closing Soon')}
${emailHeading('One hour to lock in this week.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody("Your weekly check-in window closes at 6:30pm today. You haven't submitted yet — takes less than 5 minutes.", { bottom: 20 })}
${emailCallout({ eyebrow: 'Closes', value: '6:30pm', unit: 'Brisbane' })}
${emailCta({ href: portalUrl, label: 'Complete check-in' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`, { previewText: `${firstName}, last hour to lock in this week's check-in.` }),
      })
      await logClientCommunication(admin, {
        clientId: client.id,
        kind: 'checkin_window_closing',
        channel: 'email',
        subject,
        toAddress: client.email,
        meta: { url: portalUrl, week_number: weekNumber, trigger: 'cron' },
      })
      emailsSent++
    }

    // SMS
    if (client.phone) {
      await sendSms({
        to: formatPhone(client.phone),
        message: `Hi ${firstName}, your Body Recode check-in closes at 6:30pm today. Takes 5 min: ${portalUrl}`,
      })
      await logClientCommunication(admin, {
        clientId: client.id,
        kind: 'checkin_window_closing',
        channel: 'sms',
        subject: null,
        toAddress: client.phone,
        meta: { url: portalUrl, week_number: weekNumber, trigger: 'cron' },
      })
      smsSent++
    }
  }

  return NextResponse.json({ emailsSent, smsSent, skippedNoProgram })
}
