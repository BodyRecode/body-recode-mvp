import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailSignature } from '@/lib/email-signature'

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
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.onboarding_token}`

    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: client.email,
      subject: 'Your weekly check-in is now open',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f5f5f4;">
              <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#1c1917;line-height:1.3;">Hi ${firstName},</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
                Your weekly check-in window is now open. It closes Sunday at 6pm Brisbane time.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#57534e;line-height:1.6;">
                Open your portal to complete this week's check-in.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:12px;background:#1c1917;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
                      Open my portal
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#a8a29e;line-height:1.5;">
                Or copy this link: <span style="color:#78716c;">${dashboardUrl}</span>
              </p>
              ${emailSignature()}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f5f5f4;">
              <p style="margin:0;font-size:12px;color:#a8a29e;">Body Recode Performance Coaching</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })
    sent++
  }

  return NextResponse.json({ sent })
}
