import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { clientId, requiresClearance, data } = await req.json()
  if (!clientId) return NextResponse.json({ error: 'Missing client' }, { status: 400 })

  const admin = createAdminClient()

  const { data: client } = await admin.from('clients').select('name').eq('id', clientId).maybeSingle()

  const { error } = await admin
    .from('clients')
    .update({
      health_declaration_submitted_at: new Date().toISOString(),
      medical_clearance_required: requiresClearance,
      health_declaration_data: data,
    })
    .eq('id', clientId)

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const name = client?.name ?? 'A client'
    const clearanceNote = requiresClearance
      ? '<p style="margin:12px 0 0;font-size:14px;color:#f59e0b;"><strong>⚠ Medical clearance required</strong> — review before commencing.</p>'
      : ''
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `${name} submitted their health declaration`,
      html: `<div style="font-family:sans-serif;background:#0a0a0a;color:#aaa;padding:32px;max-width:480px;"><img src="https://bodyrecode.au/logo-teal.png" width="110" style="display:block;margin-bottom:24px;" alt="Body Recode" /><p style="color:#fff;font-size:16px;font-weight:700;margin:0 0 12px;">Health declaration submitted</p><p style="margin:0;font-size:14px;line-height:1.7;"><strong style="color:#fff;">${name}</strong> has completed their health declaration.${clearanceNote}</p></div>`,
    })
  } catch (e) {
    console.error('Notification email failed:', e)
  }

  return NextResponse.json({ success: true })
}
