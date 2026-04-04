import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .update({ medical_clearance_received_at: new Date().toISOString() })
    .eq('id', id)
    .select('name, email, onboarding_token')
    .single()

  // Notify client by email
  if (client?.email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const firstName = client.name?.split(' ')[0] ?? 'there'
    const portalUrl = `https://app.bodyrecode.au/portal/${client.onboarding_token}`

    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: client.email,
      subject: 'Medical clearance approved — you\'re good to go',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:40px;">
      <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
    </div>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 8px;">Hi ${firstName},</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your medical clearance has been reviewed and approved. Your onboarding is now fully unlocked — you can complete your Foundational Intake and Baseline Documentation through your portal.</p>
    <a href="${portalUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Go to my portal →</a>
    <p style="margin:0 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${portalUrl}</p>
    ${darkEmailSignature()}
  </div>
</body>
</html>`,
    }).catch(err => console.error('Clearance approval email error:', err))
  }

  return NextResponse.json({ success: true })
}
