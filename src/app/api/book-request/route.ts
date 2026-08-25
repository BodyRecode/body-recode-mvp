import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultCoachId } from '@/lib/default-coach'
import { logLeadEvent } from '@/lib/log-lead-event'
import { appUrl } from '@/lib/app-url'
import { fromCoach, fromBrand } from '@/lib/email-shell'
import { buildCustomTimeRequestEmail, buildBookingConfirmationEmail } from '@/lib/booking-emails'
import { coach, brand } from '@/config/tenant'
import { inngest } from '@/lib/inngest'
import { fireMetaCapiEvent, extractClientContext } from '@/lib/meta-capi'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, phone, preferredTime, note } = body

  if (!name || !email || !preferredTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim()
  const cleanPhone = phone?.trim() || null
  const cleanPreferredTime = preferredTime.trim()
  const cleanNote = note?.trim() || null

  const admin = createAdminClient()

  // Find or create lead
  let lead
  const { data: existingLead } = await admin
    .from('leads')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle()

  if (existingLead) {
    lead = existingLead
  } else {
    const coachId = await getDefaultCoachId(admin)
    const { data: newLead, error: leadError } = await admin
      .from('leads')
      .insert({
        coach_id: coachId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        source: 'direct',
        status: 'new_check_in',
      })
      .select()
      .single()

    if (leadError || !newLead) {
      return NextResponse.json({ error: 'Failed to record request' }, { status: 500 })
    }
    lead = newLead
  }

  const eventNotes = cleanNote
    ? `Preferred time: ${cleanPreferredTime}\n\nNote: ${cleanNote}`
    : `Preferred time: ${cleanPreferredTime}`

  await logLeadEvent({
    leadId: lead.id,
    type: 'custom_time_requested',
    notes: eventNotes,
    sentAt: new Date(),
  })

  const prepUrl = `${brand().marketingDomain}/book/prep/${lead.id}`

  // Notify coach
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const leadUrl = `${appUrl()}/dashboard/leads/${lead.id}`
    const coachEmail = buildCustomTimeRequestEmail({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      preferredTime: cleanPreferredTime,
      note: cleanNote,
      leadUrl,
    })
    const coachSend = await resend.emails.send({
      from: fromBrand(),
      to: coach().email,
      replyTo: cleanEmail,
      subject: coachEmail.subject,
      html: coachEmail.html,
    })
    await logLeadEvent({
      leadId: lead.id,
      type: 'custom_time_coach_notified',
      subject: coachEmail.subject,
      resendEmailId: coachSend.data?.id ?? undefined,
      notes: coachSend.error
        ? `SEND FAILED: ${coachSend.error.message}`
        : `Sent to ${coach().email}, reply-to ${cleanEmail}.`,
    })

    // Confirmation to lead. This is the ONLY place the pre-call form link is
    // ever surfaced, so whether it sent matters — hence the event.
    const leadEmail = buildBookingConfirmationEmail({
      firstName: cleanName.split(' ')[0],
      preferredTime: cleanPreferredTime,
      prepUrl,
    })
    const leadSend = await resend.emails.send({
      from: fromCoach(),
      to: cleanEmail,
      subject: leadEmail.subject,
      html: leadEmail.html,
    })
    await logLeadEvent({
      leadId: lead.id,
      type: 'booking_confirmation_sent',
      subject: leadEmail.subject,
      resendEmailId: leadSend.data?.id ?? undefined,
      notes: leadSend.error
        ? `SEND FAILED: ${leadSend.error.message}`
        : `Sent to ${cleanEmail}. Carries the pre-call form link: ${prepUrl}`,
    })
  }

  // Kick off the pre-call form chase. Best-effort: a failed enqueue must not
  // fail the booking request itself.
  try {
    await inngest.send({
      name: 'booking/time-requested',
      data: {
        leadId: lead.id,
        email: cleanEmail,
        firstName: cleanName.split(' ')[0],
        prepUrl,
      },
    })
  } catch (e) {
    console.error('[book-request] inngest.send failed:', e)
  }

  // Tell Meta a call was booked.
  //
  // MEASUREMENT, NOT OPTIMISATION. This route fired nothing before 25 Aug 2026,
  // so every strategy call the funnel produced was invisible to Meta and the
  // algorithm was being trained away from an outcome worth many multiples of a
  // $97 Blueprint. Do NOT make Schedule an ad set's conversion event: bookings
  // are rare next to Body Decode signups, and at $25/day optimising on the rare
  // event starves the learning phase. Keep the ad sets on Lead.
  //
  // Non-blocking, like every other CAPI call here: a Meta failure must never
  // cost someone their booking.
  try {
    const { clientIp, clientUserAgent } = extractClientContext(request)
    const [bookFirstName, ...bookLastNameParts] = cleanName.split(' ')
    await fireMetaCapiEvent({
      eventName: 'Schedule',
      eventSourceUrl: `${brand().marketingDomain}/book`,
      actionSource: 'website',
      userData: {
        email: cleanEmail,
        phone: cleanPhone ?? undefined,
        firstName: bookFirstName,
        lastName: bookLastNameParts.join(' ') || undefined,
        country: 'AU',
        clientIp,
        clientUserAgent,
      },
      customData: {
        content_name: 'strategy_call_requested',
        source: 'book_request_form',
        preferred_time: cleanPreferredTime,
      },
    })
  } catch (capiErr) {
    console.error('[book-request] CAPI fire threw (non-fatal):', capiErr)
  }

  return NextResponse.json({ success: true })
}
