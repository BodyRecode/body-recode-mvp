import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Get all clients with a portal token and email
  const { data: clients } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token, coaching_started_at')
    .not('onboarding_token', 'is', null)
    .not('email', 'is', null)

  if (!clients || clients.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  for (const client of clients) {
    if (!client.email || !client.onboarding_token) continue

    // Only notify clients who have started coaching
    if (!client.coaching_started_at) continue
    const startDate = new Date(client.coaching_started_at)
    if (startDate > new Date()) continue

    const firstName = client.name.split(' ')[0]
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.onboarding_token}`

    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: client.email,
      subject: 'Your weekly check-in is now open',
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
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your weekly check-in window is now open. Complete it before Sunday 6pm Brisbane time.</p>
    <a href="${portalUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Open my portal →</a>
    <p style="margin:0 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${portalUrl}</p>
    ${darkEmailSignature()}
  </div>
</body>
</html>`,
    })
    sent++
  }

  return NextResponse.json({ sent })
}
