import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', id)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })
  if (!client.onboarding_token) return NextResponse.json({ error: 'No onboarding token' }, { status: 400 })

  const firstName = client.name.split(' ')[0]
  const portalUrl = `https://app.bodyrecode.au/portal/${client.onboarding_token}`

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: client.email,
    subject: `${firstName}, your portal is ready`,
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
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your portal is open. Four steps to complete before we start coaching:</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 8px;"><strong style="color:#fff;">1.</strong> Coaching Agreement</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 8px;"><strong style="color:#fff;">2.</strong> Health Declaration</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 8px;"><strong style="color:#fff;">3.</strong> Foundational Intake (208 questions across 8 areas. Take your time. The more accurate it is, the better your read.)</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 24px;"><strong style="color:#fff;">4.</strong> Baseline Documentation</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 24px;">Once your intake is in, your CFFS generates automatically. That is the read I work from to write your program. No template. Built around what your body is actually doing.</p>
    <a href="${portalUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Open my portal</a>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Sign in with your email. No password. The link does the work.</p>
    ${darkEmailSignature()}
    <p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${portalUrl}</p>
  </div>
</body>
</html>`,
  })

  return NextResponse.json({ sent: true })
}
