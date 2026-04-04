import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Handles inbound email webhooks from Postmark
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Postmark format: From, Subject, TextBody, HtmlBody, FromFull.Email
  // Resend format: from, subject, text, html
  const from: string = body.From ?? body.from ?? ''
  const subject: string = body.Subject ?? body.subject ?? '(no subject)'
  const text: string = body.TextBody ?? body.text ?? body.HtmlBody ?? body.html ?? ''

  // Postmark provides parsed email in FromFull
  const senderEmail: string =
    body.FromFull?.Email ??
    (() => {
      const m = from.match(/<(.+?)>/)
      return m ? m[1] : from.trim()
    })()

  if (!senderEmail) {
    return NextResponse.json({ error: 'No sender email' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Find the lead by email
  const { data: lead } = await admin
    .from('leads')
    .select('id, coach_id')
    .ilike('email', senderEmail)
    .maybeSingle()

  if (!lead) {
    // Try clients table too
    const { data: client } = await admin
      .from('clients')
      .select('lead_id, coach_id')
      .ilike('email', senderEmail)
      .maybeSingle()

    if (!client?.lead_id) {
      // Unknown sender — log and move on
      console.log(`Inbound email from unknown sender: ${senderEmail}`)
      return NextResponse.json({ ok: true })
    }

    await admin.from('lead_events').insert({
      lead_id: client.lead_id,
      type: 'email_received',
      subject,
      notes: text,
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  }

  await admin.from('lead_events').insert({
    lead_id: lead.id,
    type: 'email_received',
    subject,
    notes: text,
    sent_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
