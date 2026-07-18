/**
 * Approve & send one drafted outreach touch.
 *
 * Coach-gated. Re-checks the lead is still eligible at send time (they may have
 * booked or been paused since the draft was written), sends the branded email
 * through Resend in Kade's voice with a BCC copy to his inbox, then marks the
 * touch sent and logs it on the lead timeline.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { coach } from '@/config/tenant'
import { logLeadEvent } from '@/lib/log-lead-event'
import { STOP_STATUSES } from '@/lib/booking-agent/sequence'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()

  const { data: touch } = await admin
    .from('outreach_touches')
    .select('id, lead_id, status, subject, body_html')
    .eq('id', id)
    .maybeSingle()

  if (!touch) return NextResponse.json({ error: 'Touch not found' }, { status: 404 })
  if (touch.status === 'sent') return NextResponse.json({ error: 'Already sent' }, { status: 409 })
  if (touch.status === 'skipped') return NextResponse.json({ error: 'Touch was skipped' }, { status: 409 })
  if (!touch.body_html || !touch.subject) return NextResponse.json({ error: 'Draft is incomplete' }, { status: 400 })

  const { data: lead } = await admin
    .from('leads')
    .select('id, email, status, active, booking_agent_state')
    .eq('id', touch.lead_id)
    .maybeSingle()

  if (!lead?.email) return NextResponse.json({ error: 'Lead has no email' }, { status: 400 })

  // Eligibility gate — if they've booked / gone inactive / been paused, don't
  // send; skip the draft so it leaves the queue cleanly.
  if (lead.active === false || lead.booking_agent_state !== 'active' || STOP_STATUSES.has(lead.status)) {
    await admin.from('outreach_touches').update({ status: 'skipped', updated_at: new Date().toISOString() }).eq('id', id)
    return NextResponse.json({ error: 'Lead is no longer eligible — draft skipped', skipped: true }, { status: 409 })
  }

  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const sent = await resend.emails.send({
    from: fromCoach(),
    to: lead.email,
    bcc: COACH_BCC,
    replyTo: coach().email,
    subject: touch.subject,
    html: touch.body_html,
  })

  if (sent.error) {
    console.error('[outreach/send] Resend error:', sent.error)
    await admin.from('outreach_touches').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', id)
    return NextResponse.json({ error: 'Send failed' }, { status: 502 })
  }

  await admin
    .from('outreach_touches')
    .update({ status: 'sent', sent_at: new Date().toISOString(), resend_email_id: sent.data?.id ?? null, updated_at: new Date().toISOString() })
    .eq('id', id)

  await logLeadEvent({
    leadId: touch.lead_id,
    type: 'email_sent',
    subject: touch.subject,
    resendEmailId: sent.data?.id,
    notes: 'Booking agent touch approved and sent.',
    sentAt: new Date(),
  })

  return NextResponse.json({ success: true, resendId: sent.data?.id })
}
