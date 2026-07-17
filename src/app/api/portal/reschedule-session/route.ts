import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { appUrl } from '@/lib/app-url'
import { fromBrand } from '@/lib/email-shell'
import { buildSessionConfirmedEmail } from '@/lib/booking-emails'
import { coach } from '@/config/tenant'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { slot, clientId, token } = await req.json()
  if (!slot || !clientId || !token) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify this client belongs to the authenticated user
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, fixed_session_duration')
    .eq('id', clientId)
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const slotDate = new Date(slot)
  const durationMinutes = client.fixed_session_duration ?? 60

  // Check slot is not already taken by another client
  const { data: existing } = await admin
    .from('client_sessions')
    .select('id')
    .eq('scheduled_at', slotDate.toISOString())
    .eq('status', 'scheduled')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'That time is no longer available.' }, { status: 409 })
  }

  // Create the booking
  const { error: bookingError } = await admin
    .from('client_sessions')
    .insert({
      client_id: clientId,
      scheduled_at: slotDate.toISOString(),
      duration_minutes: durationMinutes,
      status: 'scheduled',
    })

  if (bookingError) {
    console.error('Booking insert error:', JSON.stringify(bookingError))
    return NextResponse.json({ error: `Failed to create booking: ${bookingError.message}` }, { status: 500 })
  }

  // Format display time
  const displayDate = slotDate.toLocaleDateString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const displayTime = slotDate.toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Brisbane',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  const firstName = client.name?.split(' ')[0] ?? 'there'

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const sessionEmail = buildSessionConfirmedEmail({
      firstName,
      displayDate,
      displayTime,
      durationMinutes,
    })
    await resend.emails.send({
      from: fromBrand(),
      to: client.email,
      subject: sessionEmail.subject,
      html: sessionEmail.html,
    })

    const baseUrl = appUrl()
    await resend.emails.send({
      from: fromBrand(),
      to: coach().email,
      subject: `${client.name} booked a session: ${displayDate} at ${displayTime}`,
      html: buildCoachNotificationEmail({
        eyebrow: 'Session Booked',
        heading: `${client.name} booked a face-to-face session`,
        body: `${client.name} has booked a session via the client portal.`,
        details: [
          `<strong style="color:#1A1A1A;">${displayDate}</strong>`,
          `${displayTime} · ${durationMinutes} min · AF Newstead`,
        ],
        ctaLabel: 'Open client profile',
        ctaUrl: `${baseUrl}/dashboard/clients/${client.id}`,
      }),
    })
  } catch (e) {
    console.error('Email error:', e)
  }

  return NextResponse.json({ success: true })
}
