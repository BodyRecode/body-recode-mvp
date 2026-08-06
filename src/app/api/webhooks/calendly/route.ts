import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'

/**
 * Calendly signs each webhook with an HMAC over `<timestamp>.<raw body>`, sent
 * as `Calendly-Webhook-Signature: t=<timestamp>,v1=<hex digest>`.
 *
 * Completed 2026-08-06 (Security Sweep Phase 1). The previous version checked
 * only that the header was PRESENT — any string passed. An unverified booking
 * webhook is an unauthenticated write: it moves a lead's status, stores a Zoom
 * URL against them, and triggers confirmation email.
 *
 * The timestamp is checked as well as the digest. Without it a valid signature
 * captured once can be replayed forever.
 */
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60

function calendlySignatureValid(rawBody: string, header: string | null, key: string): boolean {
  if (!header) return false

  const parts = Object.fromEntries(
    header.split(',').map(p => {
      const [k, ...rest] = p.trim().split('=')
      return [k, rest.join('=')]
    })
  )
  const timestamp = parts.t
  const supplied = parts.v1
  if (!timestamp || !supplied) return false

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return false

  const expected = createHmac('sha256', key).update(`${timestamp}.${rawBody}`).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(supplied, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  // Read the body as text first: the signature covers the exact bytes sent, so
  // it cannot be recomputed from a re-serialised object.
  const rawBody = await request.text()

  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY
  if (signingKey) {
    if (!calendlySignatureValid(rawBody, request.headers.get('calendly-webhook-signature'), signingKey)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else {
    // Bookings also arrive via a Zapier hop that cannot sign. Left accepting
    // unsigned payloads so that path keeps working; set the key once Zapier is
    // retired and this closes.
    console.warn('[webhooks/calendly] CALENDLY_WEBHOOK_SIGNING_KEY unset — accepting unverified webhook')
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
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
      zoom_1_date: scheduledAt,
      status: 'zoom_1_booked',
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
