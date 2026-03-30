import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailSignature } from '@/lib/email-signature'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const firstName = 'Kade'
  const intakeUrl = 'https://app.bodyrecode.au/intake/preview-token-123'

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: `[PREVIEW] Welcome to Body Recode, ${firstName}`,
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
                Your commencement fee has been received - you're officially in.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
                Before we begin, I need you to complete your foundational intake. This is how I build an accurate picture of where you're starting from - your training history, recovery patterns, stress load, sleep, and lifestyle. It takes around 15-20 minutes and there are no right or wrong answers. Just answer based on your typical experience, not your best or worst days.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
                This intake forms the foundation of everything we do together, so take your time with it.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:12px;background:#1c1917;">
                    <a href="${intakeUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
                      Complete my intake
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:15px;color:#57534e;line-height:1.6;">
                While you're getting set up, take a read through your <a href="https://app.bodyrecode.au/coaching-guide" style="color:#1c1917;font-weight:600;text-decoration:underline;">Active Coaching Client Guide</a>. It covers how the coaching process works, what to expect each week, and how we build progress together.
              </p>
              <p style="margin:16px 0 0;font-size:15px;color:#57534e;line-height:1.6;">
                Looking forward to getting started.
              </p>
              ${emailSignature()}
              <p style="margin:16px 0 0;font-size:13px;color:#a8a29e;line-height:1.5;">
                Or copy this link: <span style="color:#78716c;">${intakeUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f5f5f4;">
              <p style="margin:0;font-size:12px;color:#a8a29e;">This link is unique to you. Reply to this email if you have any questions.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })

  return NextResponse.json({ sent: true })
}
