import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://performance.bodyrecode.au',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  const { name, email, phone, reason } = await request.json()

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400, headers: CORS_HEADERS })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503, headers: CORS_HEADERS })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createAdminClient()

  const notes = reason ? `Founder Client Application\n\nWhat's happening: ${reason}` : 'Founder Client Application'

  const { error: leadError } = await supabase.from('leads').insert({
    name,
    email,
    phone: phone || null,
    source: 'founder_program',
    status: 'new_check_in',
    notes,
    active: true,
  })

  if (leadError) console.error('Lead insert error:', leadError)

  // Notify Kade
  await resend.emails.send({
    from: 'Body Recode™ <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: `Founder Client Application: ${name}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="color-scheme" content="dark" /></head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#0c0a09">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:560px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px 24px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="120" alt="Body Recode" style="display:block;margin-bottom:20px;" />
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#555;">Founder Client Application</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${name}</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#555;">Contact</p>
                    <p style="margin:0;font-size:14px;color:#ccc;">${email}</p>
                    ${phone ? `<p style="margin:4px 0 0;font-size:14px;color:#888;">${phone}</p>` : ''}
                  </td>
                </tr>
                ${reason ? `
                <tr>
                  <td style="padding:0;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#555;">What's happening</p>
                    <p style="margin:0;font-size:14px;color:#ccc;line-height:1.6;">${reason}</p>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:20px 40px 28px;border-top:1px solid #1c1917;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads" style="display:inline-block;padding:11px 22px;background:#10E1C2;color:#000;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">View in dashboard</a>
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

  // Confirmation to applicant
  const firstName = name.trim().split(' ')[0]
  await resend.emails.send({
    from: 'Body Recode™ <kade@bodyrecode.au>',
    to: email,
    subject: 'Founder Client Program — application received',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark" />
</head>
<body style="margin:0;padding:0;background-color:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#0c0a09">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:32px 40px 28px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;">
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Application received,<br/>${firstName}.</p>
              <p style="margin:0 0 16px;font-size:15px;color:#888888;line-height:1.7;">
                Your application for the Body Recode™ Founder Client Program has been received and will be reviewed shortly.
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#888888;line-height:1.7;">
                There are 20 positions available. If your application is a strong fit, you'll hear from me directly within one to two business days.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#888888;line-height:1.7;">
                No further action is required from you at this stage.
              </p>
              ${darkEmailSignature()}
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

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
}
