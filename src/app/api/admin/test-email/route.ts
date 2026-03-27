import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailSignature } from '@/lib/email-signature'

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
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f5f5f4;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a8a29e;">Body Recode</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#1c1917;line-height:1.3;">Hi Kade,</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
                This is a preview of how the email signature looks at the bottom of outgoing client emails.
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

    console.log('Resend result:', JSON.stringify(result))
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ sent: true, id: result.data?.id })
  }

  return NextResponse.json({ sent: false, error: 'Unknown type' }, { status: 400 })
}
