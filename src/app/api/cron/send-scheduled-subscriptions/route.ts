import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { fromCoach, darkEmailShell } from '@/lib/email-shell'
import { getCoachingPackage } from '@/lib/coaching-packages'
import { logClientCommunication } from '@/lib/client-communications'
import { createSubscriptionCheckoutForClient } from '@/lib/subscription-checkout'
import { logoUrl } from '@/config/tenant'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Find clients with a scheduled send date that has passed and hasn't been sent yet
  const { data: clients } = await admin
    .from('clients')
    .select('id, name, email, package, onboarding_token')
    // Offboarded or frozen clients receive nothing. Gated on clients.ended_at (final) and clients.frozen_at (paused) rather than
    // on an active plan, so a coach can archive a former client's file without
    // it silently re-enabling contact. See offboard-client.ts.
    .is('ended_at', null)
    .is('frozen_at', null)
    .lte('subscription_link_send_at', new Date().toISOString())
    .is('subscription_link_sent_at', null)
    .not('subscription_link_send_at', 'is', null)

  if (!clients || clients.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  for (const client of clients) {
    if (!client.email || !client.package) continue

    const pkg = getCoachingPackage(client.package)
    if (!pkg) continue
    // Non-billing packages have no Stripe link — skip silently. Coach should
    // never have scheduled a send for one of these but guard anyway.
    if (!pkg.stripe) continue

    const firstName = client.name.split(' ')[0]

    let subscriptionUrl: string
    let sessionId: string
    try {
      const session = await createSubscriptionCheckoutForClient({
        client: { id: client.id, email: client.email, onboarding_token: client.onboarding_token },
        pkg,
      })
      subscriptionUrl = session.url
      sessionId = session.sessionId
    } catch (err) {
      console.error('Failed to create subscription checkout session for client:', client.id, err)
      continue
    }

    const subject = `${firstName}, your Body Recode subscription link`

    try {
      await resend.emails.send({
        from: fromCoach(),
        to: client.email,
        subject,
        html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="${logoUrl()}" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Here is your weekly subscription link for Body Recode Performance Coaching.</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Package: <strong style="color:#1A1A1A;">${pkg.label} at ${pkg.price}</strong></p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:8px;">
            <a href="${subscriptionUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Set up subscription</a>
          </td>
        </tr>
      </table>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">If you have any questions, reply to this email.</p>
      ${darkEmailSignature()}
      <p style="margin:20px 0 0;font-size:13px;color:#6B6B6B;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${subscriptionUrl}</p>
`, { previewText: `${firstName}, your ${pkg.label} subscription link.` }),
      })

      // Mark as sent
      const sentAt = new Date().toISOString()
      await admin
        .from('clients')
        .update({ subscription_link_sent_at: sentAt })
        .eq('id', client.id)

      await logClientCommunication(admin, {
        clientId: client.id,
        kind: 'subscription_link',
        subject,
        toAddress: client.email,
        sentAt,
        meta: { package: client.package, package_label: pkg.label, price: pkg.price, url: subscriptionUrl, trigger: 'scheduled', stripe_session_id: sessionId },
      })

      sent++
    } catch (err) {
      console.error('Failed to send scheduled subscription for client:', client.id, err)
    }
  }

  return NextResponse.json({ sent })
}
