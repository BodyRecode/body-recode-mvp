import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { clientId, fullName } = await req.json()
  if (!clientId || !fullName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({
      agreement_accepted_at: new Date().toISOString(),
      agreement_accepted_name: fullName,
    })
    .eq('id', clientId)

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `${fullName} signed their coaching agreement`,
      html: `<div style="font-family:sans-serif;background:#0a0a0a;color:#aaa;padding:32px;max-width:480px;"><img src="https://bodyrecode.au/logo-teal.png" width="110" style="display:block;margin-bottom:24px;" alt="Body Recode" /><p style="color:#fff;font-size:16px;font-weight:700;margin:0 0 12px;">Coaching agreement signed</p><p style="margin:0;font-size:14px;line-height:1.7;"><strong style="color:#fff;">${fullName}</strong> has signed and accepted the Body Recode coaching agreement.</p></div>`,
    })
  } catch (e) {
    console.error('Notification email failed:', e)
  }

  return NextResponse.json({ success: true })
}
