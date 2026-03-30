import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'

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
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:40px;">
      <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
    </div>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Hi ${firstName},</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your commencement fee has been received. You're officially in.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Before we begin, I need you to complete your foundational intake. This is how I build an accurate picture of where you're starting from - your training history, recovery patterns, stress load, sleep, and lifestyle. It takes around 15-20 minutes and there are no right or wrong answers. Just answer based on your typical experience, not your best or worst days.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 28px;">This intake forms the foundation of everything we do together, so take your time with it.</p>
    <a href="${intakeUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Complete my intake</a>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">While you're getting set up, take a read through your <a href="https://app.bodyrecode.au/coaching-guide" style="color:#10E1C2;font-weight:600;text-decoration:none;">Active Coaching Client Guide</a>. It covers how the coaching process works, what to expect each week, and how we build progress together.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Looking forward to getting started.</p>
    ${darkEmailSignature()}
    <p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${intakeUrl}</p>
  </div>
</body>
</html>`,
  })

  return NextResponse.json({ sent: true })
}
