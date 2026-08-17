/**
 * Post-call email for a lead who needs time to decide.
 *
 * The mirror of send-zoom1-declined, which has existed for months. Until
 * 2026-08-17 the "needs time" path on the Zoom companion recorded the outcome,
 * set a follow-up date three weeks out, and sent nothing — so the person who
 * said no got a courteous email and the person who said maybe got silence.
 *
 * Sends immediately rather than scheduling to the next morning. Someone who has
 * just spent thirty minutes deciding should leave the call holding something,
 * not wonder overnight whether anything is coming.
 *
 * Optionally sends the $97 self-guided program alongside, as the lower
 * commitment door. That is a judgement call the coach makes on the call, not
 * something to fire at everyone: offering a cheaper option to someone who was
 * about to say yes to coaching talks them down a tier.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildZoom1NeedsTimeEmail } from '@/lib/generate-report'
import { logLeadEvent } from '@/lib/log-lead-event'
import { sendDownsellOffer } from '@/lib/send-downsell-offer'
import { fromCoach } from '@/lib/email-shell'
import { requireCoach } from '@/lib/api-auth'
import { coach, brand } from '@/config/tenant'

const BOOKING_LINK = `${brand().marketingDomain}/book`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const includeSelfGuided = body.include_self_guided === true

  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('id, name, email, next_follow_up_at')
    .eq('id', id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.email) {
    return NextResponse.json({ error: 'No email address for this lead' }, { status: 400 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email is not configured' }, { status: 500 })
  }

  const firstName = (lead.name ?? '').split(' ')[0] || 'there'

  // "3 September" rather than a date stamp — this is a sentence in an email,
  // not a field. Brisbane time, because that is when the coach will act.
  const followUpOn = lead.next_follow_up_at
    ? new Date(lead.next_follow_up_at as string).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        timeZone: 'Australia/Brisbane',
      })
    : null

  const email = buildZoom1NeedsTimeEmail({
    firstName,
    bookingLink: BOOKING_LINK,
    followUpOn,
    includeSelfGuided,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const sent = await resend.emails.send({
    from: fromCoach(),
    to: lead.email,
    // Per feedback_bcc_kade_on_client_sends — a silent copy so the coach can
    // confirm what actually landed without asking.
    bcc: [coach().email],
    subject: email.subject,
    html: email.html,
  })

  if (sent.error) {
    console.error('[send-zoom1-needs-time] send failed:', sent.error)
    return NextResponse.json({ error: sent.error.message }, { status: 502 })
  }

  await logLeadEvent({
    leadId: id,
    type: 'email_sent',
    subject: email.subject,
    resendEmailId: sent.data?.id ?? undefined,
    notes: 'Post-call: needs time',
  })

  let selfGuided: { sent: boolean; error?: string } | null = null
  if (includeSelfGuided) {
    selfGuided = await sendDownsellOffer(id, { name: lead.name as string, email: lead.email as string }, admin)
    if (!selfGuided.sent) {
      // Non-fatal: the recap-and-hold email is the important one and it has
      // already landed. Surface it so the coach knows to send the option by hand.
      console.error('[send-zoom1-needs-time] self-guided offer failed:', selfGuided.error)
    }
  }

  return NextResponse.json({
    sent: true,
    follow_up_on: followUpOn,
    self_guided: selfGuided,
  })
}
