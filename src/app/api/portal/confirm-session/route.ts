import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'
import { fromBrand } from '@/lib/email-shell'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')

  if (!id) {
    return new NextResponse('Invalid link.', { status: 400 })
  }

  const admin = createAdminClient()

  const { data: session } = await admin
    .from('client_sessions')
    .select('id, scheduled_at, duration_minutes, confirmed_at, client_id, clients(name, email)')
    .eq('id', id)
    .eq('status', 'scheduled')
    .single()

  if (!session) {
    return new NextResponse(confirmPage('This session could not be found or has already been cancelled.', false), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Already confirmed
  if (session.confirmed_at) {
    const displayTime = new Date(session.scheduled_at).toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Brisbane', hour: 'numeric', minute: '2-digit', hour12: true,
    })
    const displayDate = new Date(session.scheduled_at).toLocaleDateString('en-AU', {
      timeZone: 'Australia/Brisbane', weekday: 'long', day: 'numeric', month: 'long',
    })
    return new NextResponse(confirmPage(`You already confirmed this session: ${displayDate} at ${displayTime}.`, true), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Mark confirmed
  await admin
    .from('client_sessions')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', id)

  const client = Array.isArray(session.clients) ? session.clients[0] : session.clients
  const displayDate = new Date(session.scheduled_at).toLocaleDateString('en-AU', {
    timeZone: 'Australia/Brisbane', weekday: 'long', day: 'numeric', month: 'long',
  })
  const displayTime = new Date(session.scheduled_at).toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Brisbane', hour: 'numeric', minute: '2-digit', hour12: true,
  })

  // Notify coach
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = appUrl()
    const clientName = (client as { name: string }).name
    await resend.emails.send({
      from: fromBrand(),
      to: 'kade@bodyrecode.au',
      subject: `${clientName} confirmed their session: ${displayDate}`,
      html: buildCoachNotificationEmail({
        eyebrow: 'Session Confirmed',
        heading: `${clientName} confirmed their session`,
        body: `${clientName} has confirmed attendance for the upcoming face-to-face session.`,
        details: [
          `<strong style="color:#1A1A1A;">${displayDate}</strong>`,
          `${displayTime} · ${session.duration_minutes} min · AF Newstead`,
        ],
        ctaLabel: 'Open client profile',
        ctaUrl: `${baseUrl}/dashboard/clients/${session.client_id}`,
      }),
    })
  } catch (e) {
    console.error('Coach notification failed:', e)
  }

  return new NextResponse(confirmPage(`You\'re confirmed for ${displayDate} at ${displayTime}. See you then.`, true), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function confirmPage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Session ${success ? 'Confirmed' : 'Not Found'} · Body Recode</title>
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:440px;margin:0 auto;padding:48px 24px;text-align:center;">
    <img src="https://bodyrecode.au/logo-black.png" width="110" alt="Body Recode" style="display:block;margin:0 auto 40px;"/>
    <div style="width:56px;height:56px;border-radius:50%;background:${success ? '#B5CFFC' : '#1c1010'};display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
      <span style="font-size:24px;">${success ? '✓' : '✗'}</span>
    </div>
    <p style="font-size:18px;font-weight:700;color:#1A1A1A;margin:0 0 12px;">${success ? 'You\'re confirmed' : 'Something went wrong'}</p>
    <p style="font-size:14px;color:#6B6B6B;line-height:1.7;margin:0 0 32px;">${message}</p>
    <a href="https://bodyrecode.au" style="font-size:13px;color:#3F85FD;text-decoration:none;">bodyrecode.au</a>
  </div>
</body>
</html>`
}
