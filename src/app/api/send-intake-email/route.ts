import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email sending not configured' }, { status: 503 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { clientId, clientName, clientEmail, intakeToken } = await request.json()

  if (!clientEmail) {
    return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })
  }

  const intakeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/intake/${intakeToken}`

  const { error } = await resend.emails.send({
    from: 'Body Recode™ <onboarding@resend.dev>',
    to: clientEmail,
    subject: 'Your Body Recode foundational intake',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f5f5f4;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a8a29e;">Body Recode™</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#1c1917;line-height:1.3;">
                Hi ${clientName},
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
                Your coach has prepared a foundational intake for you. It takes around 15–20 minutes and covers your training history, body patterns, sleep, stress, nutrition, and goals.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#57534e;line-height:1.6;">
                Your responses are used to build an accurate picture of your current body state — not to judge or prescribe. Answer honestly based on your typical experience, not your best or worst days.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:12px;background:#1c1917;">
                    <a href="${intakeUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
                      Start my intake →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#a8a29e;line-height:1.5;">
                Or copy this link into your browser:<br/>
                <span style="color:#78716c;">${intakeUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f5f5f4;">
              <p style="margin:0;font-size:12px;color:#a8a29e;">
                This link is unique to you. If you have any questions, reply to your coach directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  })

  if (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: (error as { message?: string }).message || 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
