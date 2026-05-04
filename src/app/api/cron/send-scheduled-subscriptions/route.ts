import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { getCoachingPackage } from '@/lib/coaching-packages'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Find clients with a scheduled send date that has passed and hasn't been sent yet
  const { data: clients } = await admin
    .from('clients')
    .select('id, name, email, package')
    .lte('subscription_link_send_at', new Date().toISOString())
    .is('subscription_link_sent_at', null)
    .not('subscription_link_send_at', 'is', null)

  if (!clients || clients.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  for (const client of clients) {
    if (!client.email || !client.package) continue

    const pkg = getCoachingPackage(client.package)
    if (!pkg) continue

    const firstName = client.name.split(' ')[0]
    const subscriptionUrl = `${pkg.stripe}?client_reference_id=${client.id}`

    try {
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: client.email,
        subject: `${firstName}, your Body Recode subscription link`,
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
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Here is your weekly subscription link for Body Recode Performance Coaching.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 28px;">Package: <strong style="color:#fff;">${pkg.label} at ${pkg.price}</strong></p>
    <a href="${subscriptionUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Set up subscription</a>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">If you have any questions, reply to this email.</p>
    ${darkEmailSignature()}
    <p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${subscriptionUrl}</p>
  </div>
</body>
</html>`,
      })

      // Mark as sent
      await admin
        .from('clients')
        .update({ subscription_link_sent_at: new Date().toISOString() })
        .eq('id', client.id)

      sent++
    } catch (err) {
      console.error('Failed to send scheduled subscription for client:', client.id, err)
    }
  }

  return NextResponse.json({ sent })
}
