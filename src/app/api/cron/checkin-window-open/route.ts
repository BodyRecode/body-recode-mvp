import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { darkEmailShell } from '@/lib/email-shell'
import { sendSms, formatPhone } from '@/lib/twilio'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Get all active clients with a portal token
  const { data: clients } = await admin
    .from('clients')
    .select('id, name, email, phone, onboarding_token, coaching_started_at')
    .not('onboarding_token', 'is', null)

  if (!clients || clients.length === 0) {
    return NextResponse.json({ emailsSent: 0, smsSent: 0 })
  }

  // Build the set of client_ids that have an ACTIVE training program.
  // Weekly check-ins evaluate training response — there is nothing to
  // evaluate (and nothing for the client to report on) until a program is
  // live, so we mirror the portal-side gate (see project_weekly_checkin_program_gate
  // in feature registry) and skip anyone without one.
  const { data: activePrograms } = await admin
    .from('programs')
    .select('client_id')
    .eq('is_active', true)
  const clientsWithActiveProgram = new Set(
    (activePrograms ?? []).map((p: { client_id: string }) => p.client_id)
  )

  let emailsSent = 0
  let smsSent = 0
  let skippedNoProgram = 0

  for (const client of clients) {
    if (!client.onboarding_token) continue

    // Only notify clients who have started coaching
    if (!client.coaching_started_at) continue
    const startDate = new Date(client.coaching_started_at)
    if (startDate > new Date()) continue

    // No active training program = nothing to check in against. Skip.
    if (!clientsWithActiveProgram.has(client.id)) {
      skippedNoProgram++
      continue
    }

    const firstName = client.name.split(' ')[0]
    const portalUrl = `${appUrl()}/portal/${client.onboarding_token}`

    const subject = 'Your weekly check-in is now open'

    // Email
    if (client.email) {
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: client.email,
        subject,
        html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your weekly check-in window is now open. Complete it before Sunday 6pm Brisbane time.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#10E1C2" style="background-color:#10E1C2;border-radius:8px;">
            <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#000000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Open my portal →</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${portalUrl}</p>
      ${darkEmailSignature()}
`, { previewText: `${firstName}, your weekly check-in is open until Sunday 6pm.` }),
      })
      await logClientCommunication(admin, {
        clientId: client.id,
        kind: 'checkin_window_open',
        channel: 'email',
        subject,
        toAddress: client.email,
        meta: { url: portalUrl, trigger: 'cron' },
      })
      emailsSent++
    }

    // SMS
    if (client.phone) {
      await sendSms({
        to: formatPhone(client.phone),
        message: `Hi ${firstName}, your Body Recode weekly check-in is now open. Close Sunday 6pm. Open your portal: ${portalUrl}`,
      })
      await logClientCommunication(admin, {
        clientId: client.id,
        kind: 'checkin_window_open',
        channel: 'sms',
        subject: null,
        toAddress: client.phone,
        meta: { url: portalUrl, trigger: 'cron' },
      })
      smsSent++
    }
  }

  return NextResponse.json({ emailsSent, smsSent, skippedNoProgram })
}
