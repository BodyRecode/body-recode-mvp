import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'

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
      from: 'Body Recode <kade@bodyrecode.au>',
      to: client.email,
      subject: `Session booked — ${displayDate} at ${displayTime}`,
      html: `
        <div style="background:#0a0a0a;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:0 auto;background:#111111;border-radius:16px;padding:36px;">
            <img src="https://bodyrecode.au/logo-teal.png" width="110" style="display:block;margin-bottom:28px;" alt="Body Recode" />
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#ffffff;">Session confirmed</p>
            <p style="margin:0 0 24px;font-size:14px;color:#a8a29e;line-height:1.6;">Hey ${firstName}, your session has been booked.</p>
            <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#2dd4bf;text-transform:uppercase;letter-spacing:0.08em;">Face-to-Face Session</p>
              <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#ffffff;">${displayDate}</p>
              <p style="margin:0;font-size:14px;color:#a8a29e;">${displayTime} · ${durationMinutes} min · AF Newstead</p>
            </div>
            <p style="margin:0 0 24px;font-size:14px;color:#a8a29e;line-height:1.6;">
              If you need to make any changes, log in to your client portal and visit the Sessions page.
            </p>
            ${darkEmailSignature()}
          </div>
        </div>
      `,
    })

    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `${client.name} booked a session — ${displayDate} at ${displayTime}`,
      html: `
        <div style="background:#0a0a0a;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:0 auto;background:#111111;border-radius:16px;padding:36px;">
            <img src="https://bodyrecode.au/logo-teal.png" width="110" style="display:block;margin-bottom:28px;" alt="Body Recode" />
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#ffffff;">Session booked via portal</p>
            <p style="margin:0 0 24px;font-size:14px;color:#a8a29e;line-height:1.6;"><strong style="color:#fff;">${client.name}</strong> has booked a face-to-face session.</p>
            <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#2dd4bf;text-transform:uppercase;letter-spacing:0.08em;">Booking Details</p>
              <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#ffffff;">${displayDate}</p>
              <p style="margin:0;font-size:14px;color:#a8a29e;">${displayTime} · ${durationMinutes} min · AF Newstead</p>
            </div>
            ${darkEmailSignature()}
          </div>
        </div>
      `,
    })
  } catch (e) {
    console.error('Email error:', e)
  }

  return NextResponse.json({ success: true })
}
