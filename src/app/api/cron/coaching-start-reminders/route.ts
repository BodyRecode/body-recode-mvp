import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { logClientCommunication } from '@/lib/client-communications'

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
    .select('id, name, email, coaching_started_at')
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

    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: client.email,
      subject,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:40px;">
      <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
    </div>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Hi ${firstName},</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Just a reminder that your coaching begins tomorrow.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">I'll be in touch with your session details shortly. If you have any questions before we begin, reply to this email.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0;">Looking forward to it.</p>
    ${darkEmailSignature()}
  </div>
</body>
</html>`,
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
