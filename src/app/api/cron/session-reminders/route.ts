import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Find sessions in the next 20–28 hours that haven't had a reminder sent
  const windowStart = new Date(Date.now() + 20 * 60 * 60 * 1000)
  const windowEnd = new Date(Date.now() + 28 * 60 * 60 * 1000)

  const { data: sessions } = await admin
    .from('client_sessions')
    .select('id, client_id, scheduled_at, duration_minutes, clients(id, name, email)')
    .eq('status', 'scheduled')
    .is('reminder_sent_at', null)
    .gte('scheduled_at', windowStart.toISOString())
    .lte('scheduled_at', windowEnd.toISOString())

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const session of sessions) {
    const client = Array.isArray(session.clients) ? session.clients[0] : session.clients
    if (!client?.email) continue

    const firstName = (client.name as string).split(' ')[0]
    const sessionDate = new Date(session.scheduled_at)

    const displayDate = sessionDate.toLocaleDateString('en-AU', {
      timeZone: 'Australia/Brisbane',
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const displayTime = sessionDate.toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Brisbane',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })

    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/portal/confirm-session?id=${session.id}`

    try {
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: client.email as string,
        subject: `Session reminder — tomorrow at ${displayTime}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0a" style="background:#0a0a0a;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111111" style="max-width:520px;background:#111111;border-radius:16px;border:1px solid #222;overflow:hidden;">
        <tr>
          <td style="padding:28px 40px;border-bottom:1px solid #1e1e1e;">
            <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 40px;">
            <p style="margin:0 0 16px;font-size:15px;color:#a8a29e;line-height:1.75;">Hi ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#a8a29e;line-height:1.75;">Just a reminder that you have a session tomorrow.</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#2dd4bf;text-transform:uppercase;letter-spacing:0.08em;">Face-to-Face Session</p>
                  <p style="margin:0 0 2px;font-size:16px;font-weight:700;color:#ffffff;">${displayDate}</p>
                  <p style="margin:0 0 20px;font-size:14px;color:#a8a29e;">${displayTime} · ${session.duration_minutes} min · AF Newstead</p>
                  <a href="${confirmUrl}" style="display:inline-block;padding:12px 28px;background:#10E1C2;color:#000000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Confirm attendance →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#57534e;line-height:1.6;">If you can't make it, log in to your portal and reschedule — or reply to this email.</p>
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      })

      await admin
        .from('client_sessions')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', session.id)

      sent++
    } catch (e) {
      console.error(`Reminder failed for session ${session.id}:`, e)
    }
  }

  return NextResponse.json({ sent })
}
