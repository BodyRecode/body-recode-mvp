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
  for (const client of clients) {
    if (!client.email) continue
    const firstName = client.name.split(' ')[0]

    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: client.email,
      subject: 'Coaching begins tomorrow',
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
                Just a reminder that your coaching begins tomorrow.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
                I'll be in touch with your session details shortly. If you have any questions before we begin, reply to this email.
              </p>
              <p style="margin:0 0 0;font-size:15px;color:#57534e;line-height:1.6;">
                Looking forward to it.
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
