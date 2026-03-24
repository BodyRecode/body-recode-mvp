import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    .select('id, status')
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
    })
    .eq('id', lead.id)

  console.log(`Calendly webhook: updated lead ${lead.id} for ${email}`)
  return NextResponse.json({ received: true })
}
