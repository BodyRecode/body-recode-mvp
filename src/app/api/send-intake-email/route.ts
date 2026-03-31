import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { darkEmailSignature } from '@/lib/email-signature'

export async function POST(request: NextRequest) {
  const { clientId, clientName, clientEmail, intakeToken } = await request.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!clientEmail) return NextResponse.json({ error: 'No email address' }, { status: 400 })
  if (!intakeToken) return NextResponse.json({ error: 'No intake token' }, { status: 400 })

  const firstName = clientName.split(' ')[0]
  const intakeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/intake/${intakeToken}`

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: clientEmail,
    subject: `${firstName}, your Body Recode intake is ready`,
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
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Before we begin, I need you to complete your foundational intake. This is how I build an accurate picture of where you are starting from, your training history, recovery patterns, stress load, sleep, and lifestyle.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 28px;">It takes around 15 to 20 minutes and there are no right or wrong answers. Just answer based on your typical experience, not your best or worst days. This intake forms the foundation of everything we do together, so take your time with it.</p>
    <a href="${intakeUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Complete my intake</a>
    ${darkEmailSignature()}
    <p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${intakeUrl}</p>
  </div>
</body>
</html>`,
  })

  if (error) {
    console.error('Intake email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
