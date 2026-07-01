import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { fromCoach, darkEmailShell } from '@/lib/email-shell'

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

  // Note: lead.name is intentionally not templated into the body — the coach
  // writes the message free-text and personalises it themselves.
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: sent, error } = await resend.emails.send({
    from: fromCoach(),
    replyTo: 'kade@replies.bodyrecode.au',
    to: lead.email,
    subject,
    html: darkEmailShell(`
      <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;margin-bottom:40px;border:0;"/>
      <div style="font-size:15px;color:#4A4A4A;line-height:1.9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        ${message.replace(/\n/g, '<br/>')}
      </div>
      <p style="font-size:15px;color:#4A4A4A;margin-top:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Kade</p>
`, { previewText: subject }),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log to lead_events (admin client bypasses RLS for legacy null coach_id leads)
  const admin = createAdminClient()
  await admin.from('lead_events').insert({
    lead_id: leadId,
    type: 'email_sent',
    subject,
    resend_email_id: sent?.id ?? null,
    notes: message,
    sent_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, emailId: sent?.id })
}
