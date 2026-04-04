import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { leadId } = await params
  const body = await request.json()
  const { subject, message } = body

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  }

  // Load lead
  const { data: lead } = await supabase
    .from('leads')
    .select('id, name, email')
    .eq('id', leadId)
    .or(`coach_id.eq.${user.id},coach_id.is.null`)
    .single()

  if (!lead?.email) {
    return NextResponse.json({ error: 'Lead not found or has no email' }, { status: 404 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  const firstName = lead.name?.split(' ')[0] ?? 'there'
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: sent, error } = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    replyTo: 'replies@bodyrecode.au',
    to: lead.email,
    subject,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:48px 32px;">
  <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;margin-bottom:40px;"/>
  <div style="font-size:15px;color:#aaa;line-height:1.9;">
    ${message.replace(/\n/g, '<br/>')}
  </div>
  <p style="font-size:15px;color:#aaa;margin-top:32px;">Kade</p>
</div>
</body></html>`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log to lead_events
  await supabase.from('lead_events').insert({
    lead_id: leadId,
    type: 'email_sent',
    subject,
    resend_email_id: sent?.id ?? null,
    notes: message,
    sent_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, emailId: sent?.id })
}
