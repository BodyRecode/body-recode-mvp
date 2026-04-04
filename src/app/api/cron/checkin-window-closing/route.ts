import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { sendSms, formatPhone } from '@/lib/twilio'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'

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

  let emailsSent = 0
  let smsSent = 0

  for (const client of clients) {
    if (!client.onboarding_token || !client.coaching_started_at) continue

    // Skip clients whose coaching hasn't started yet
    if (new Date(client.coaching_started_at) > new Date()) continue

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
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.onboarding_token}`

    // Email
    if (client.email) {
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: client.email,
        subject: 'Check-in closes in 1 hour',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:40px;">
      <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
    </div>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 8px;">Hi ${firstName},</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your weekly check-in window closes at 6:30pm today. You haven't submitted yet — takes less than 5 minutes.</p>
    <a href="${portalUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Complete check-in →</a>
    <p style="margin:0 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${portalUrl}</p>
    ${darkEmailSignature()}
  </div>
</body>
</html>`,
      })
      emailsSent++
    }

    // SMS
    if (client.phone) {
      await sendSms({
        to: formatPhone(client.phone),
        message: `Hi ${firstName}, your Body Recode check-in closes at 6:30pm today. Takes 5 min: ${portalUrl}`,
      })
      smsSent++
    }
  }

  return NextResponse.json({ emailsSent, smsSent })
}
