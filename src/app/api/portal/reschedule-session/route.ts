import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'
import {
  fromBrand,
  darkEmailShell,
  emailLogo,
  emailHeading,
  emailBody,
  emailFeaturedCard,
  EMAIL_GRAPHITE,
  EMAIL_MUTED,
  EMAIL_BLUE_DARK,
  EMAIL_FF,
} from '@/lib/email-shell'
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

    await resend.emails.send({
      from: fromBrand(),
      to: client.email,
      subject: `Session booked: ${displayDate} at ${displayTime}`,
      html: darkEmailShell(
        `${emailLogo(130)}
${emailHeading('Session confirmed', { size: 28 })}
${emailBody(`Hey ${firstName}, your session has been booked.`)}
${emailFeaturedCard(
          `<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${EMAIL_BLUE_DARK};letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FF};">Face-to-Face Session</p>
<p style="margin:0 0 4px;font-size:18px;font-weight:800;color:${EMAIL_GRAPHITE};font-family:${EMAIL_FF};">${displayDate}</p>
<p style="margin:0;font-size:14px;color:${EMAIL_MUTED};font-family:${EMAIL_FF};">${displayTime} · ${durationMinutes} min · AF Newstead</p>`,
        )}
${emailBody('If you need to make any changes, log in to your client portal and visit the Sessions page.')}
${darkEmailSignature()}`,
        { previewText: `Session booked: ${displayDate} at ${displayTime}` },
      ),
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
