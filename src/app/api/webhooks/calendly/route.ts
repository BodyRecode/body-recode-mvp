import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Verify webhook signing key if set
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY
  if (signingKey) {
    const signature = request.headers.get('calendly-webhook-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }
    // Basic presence check — full HMAC verification can be added later
  }

  // Support both Zapier format (flat) and native Calendly webhook format
  const isZapier = !!body.email
  const email = isZapier
    ? (body.email as string)?.toLowerCase().trim()
    : (body.payload?.invitee?.email as string)?.toLowerCase().trim()

  const zoomUrl = isZapier
    ? (body.zoom_url as string) ?? null
    : (body.payload?.event?.location?.join_url as string) ?? null

  const scheduledAt = isZapier
    ? (body.scheduled_at as string) ?? null
    : (body.payload?.event?.start_time as string) ?? null

  if (!email) {
    return NextResponse.json({ error: 'No email in payload' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Find lead by email
  const { data: lead } = await admin
    .from('leads')
    .select('id, status, followup_email_ids')
    .ilike('email', email)
    .maybeSingle()

  if (!lead) {
    // Lead not found — log and return OK (don't error, Calendly will retry)
    console.log(`Calendly webhook: no lead found for email ${email}`)
    return NextResponse.json({ received: true })
  }

  // Update lead with Zoom URL, date, and status
  await admin
    .from('leads')
    .update({
      zoom_meeting_url: zoomUrl,
      zoom_date: scheduledAt,
      status: 'zoom_booked',
      followup_email_ids: null,
    })
    .eq('id', lead.id)

  // Cancel any scheduled follow-up emails
  const followupIds = (lead.followup_email_ids as string[] | null) ?? []
  if (followupIds.length > 0) {
    const resend = new Resend(process.env.RESEND_API_KEY!)
    for (const emailId of followupIds) {
      try {
        await resend.emails.cancel(emailId)
      } catch (e) {
        // May already have sent — not an error
      }
    }
    console.log(`Calendly webhook: cancelled ${followupIds.length} follow-up emails for ${email}`)
  }

  await logLeadEvent({
    leadId: lead.id,
    type: 'zoom_booked',
    notes: scheduledAt
      ? `Zoom booked for ${new Date(scheduledAt).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })} Brisbane`
      : 'Zoom booked',
    sentAt: new Date(),
  })

  console.log(`Calendly webhook: updated lead ${lead.id} for ${email}`)
  return NextResponse.json({ received: true })
}
