import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { darkEmailShell } from '@/lib/email-shell'
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
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: client.email,
        subject,
        html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your weekly check-in window closes at 6:30pm today. You haven't submitted yet — takes less than 5 minutes.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#10E1C2" style="background-color:#10E1C2;border-radius:8px;">
            <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#000000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Complete check-in →</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${portalUrl}</p>
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
