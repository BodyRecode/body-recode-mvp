import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'

export async function POST(request: NextRequest) {
  const { type } = await request.json()
  const resend = new Resend(process.env.RESEND_API_KEY!)

  if (type === 'signature') {
    const result = await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: 'Test — Email signature preview',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#0a0a0a">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111111" style="max-width:520px;background-color:#111111;border-radius:16px;border:1px solid #222222;overflow:hidden;">
          <tr>
            <td bgcolor="#111111" style="background-color:#111111;padding:32px 40px 28px;border-bottom:1px solid #1e1e1e;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#10E1C2;">Body Recode™</p>
              <p style="margin:0;font-size:13px;color:#555555;letter-spacing:0.05em;">Performance Coaching · Brisbane</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#111111" style="background-color:#111111;padding:36px 40px 40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Hi Kade,</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#888888;line-height:1.75;">
                This is a preview of how the email signature looks at the bottom of outgoing client emails.
              </p>
              <p style="margin:0;font-size:15px;color:#888888;line-height:1.75;">
                Looking forward to it.
              </p>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })

    console.log('Resend result:', JSON.stringify(result))
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ sent: true, id: result.data?.id })
  }

  return NextResponse.json({ sent: false, error: 'Unknown type' }, { status: 400 })
}
