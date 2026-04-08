import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')

  if (!id) {
    return new NextResponse('Invalid link.', { status: 400 })
  }

  const admin = createAdminClient()

  const { data: session } = await admin
    .from('client_sessions')
    .select('id, scheduled_at, duration_minutes, confirmed_at, clients(name, email)')
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
    return new NextResponse(confirmPage(`You already confirmed this session — ${displayDate} at ${displayTime}.`, true), {
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
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `${(client as { name: string }).name} confirmed their session — ${displayDate}`,
      html: `
        <div style="background:#0a0a0a;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:0 auto;background:#111111;border-radius:16px;padding:36px;">
            <img src="https://bodyrecode.au/logo-teal.png" width="110" style="display:block;margin-bottom:28px;" alt="Body Recode" />
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#ffffff;">Session confirmed</p>
            <p style="margin:0 0 24px;font-size:14px;color:#a8a29e;"><strong style="color:#fff;">${(client as { name: string }).name}</strong> confirmed their attendance.</p>
            <div style="background:#1a1a1a;border-radius:12px;padding:20px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#2dd4bf;text-transform:uppercase;letter-spacing:0.08em;">Session</p>
              <p style="margin:0 0 2px;font-size:16px;font-weight:700;color:#ffffff;">${displayDate}</p>
              <p style="margin:0;font-size:14px;color:#a8a29e;">${displayTime} · ${session.duration_minutes} min · AF Newstead</p>
            </div>
            ${darkEmailSignature()}
          </div>
        </div>
      `,
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
  <title>Session ${success ? 'Confirmed' : 'Not Found'} — Body Recode</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:440px;margin:0 auto;padding:48px 24px;text-align:center;">
    <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin:0 auto 40px;"/>
    <div style="width:56px;height:56px;border-radius:50%;background:${success ? '#0d2d29' : '#1c1010'};display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
      <span style="font-size:24px;">${success ? '✓' : '✗'}</span>
    </div>
    <p style="font-size:18px;font-weight:700;color:#ffffff;margin:0 0 12px;">${success ? 'You\'re confirmed' : 'Something went wrong'}</p>
    <p style="font-size:14px;color:#a8a29e;line-height:1.7;margin:0 0 32px;">${message}</p>
    <a href="https://bodyrecode.au" style="font-size:13px;color:#2dd4bf;text-decoration:none;">bodyrecode.au</a>
  </div>
</body>
</html>`
}
