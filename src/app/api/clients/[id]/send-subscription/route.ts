import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { fromCoach, darkEmailShell } from '@/lib/email-shell'
import { getCoachingPackage } from '@/lib/coaching-packages'
import { logClientCommunication } from '@/lib/client-communications'
import { createSubscriptionCheckoutForClient } from '@/lib/subscription-checkout'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, name, email, package, onboarding_token')
    .eq('id', id)
    .maybeSingle()

  if (clientError) console.error('Client fetch error:', clientError)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })
  if (!client.package) { console.error('No package on client:', client); return NextResponse.json({ error: 'No package selected' }, { status: 400 }) }

  const pkg = getCoachingPackage(client.package)
  if (!pkg) { console.error('Invalid package value:', client.package); return NextResponse.json({ error: 'Invalid package' }, { status: 400 }) }
  if (!pkg.stripe) {
    return NextResponse.json(
      { error: `No subscription link to send: ${pkg.label} is a non-billing package` },
      { status: 400 },
    )
  }

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
  } catch (e) {
    console.error('Failed to create subscription checkout session:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const subject = `${firstName}, lock in your weekly subscription`

  await resend.emails.send({
    from: fromCoach(),
    to: client.email,
    subject,
    html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your CFFS is in. Your program is being built around it. The last step before we start coaching is locking in your weekly subscription.</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Package: <strong style="color:#1A1A1A;">${pkg.label} at ${pkg.price}</strong></p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:8px;">
            <a href="${subscriptionUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Set up subscription</a>
          </td>
        </tr>
      </table>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Once payment is active, we lock in your sessions and set your start date. Usually three to seven days out.</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Any questions, reply to this email.</p>
      ${darkEmailSignature()}
      <p style="margin:20px 0 0;font-size:13px;color:#6B6B6B;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${subscriptionUrl}</p>
`, { previewText: `${firstName}, lock in your ${pkg.label} subscription.` }),
  })

  // Mark as sent on the client row so the dashboard knows
  const sentAt = new Date().toISOString()
  await admin
    .from('clients')
    .update({ subscription_link_sent_at: sentAt })
    .eq('id', id)

  // Log to the unified communications feed
  await logClientCommunication(admin, {
    clientId: id,
    kind: 'subscription_link',
    subject,
    toAddress: client.email,
    sentAt,
    sentBy: user.id,
    meta: { package: client.package, package_label: pkg.label, price: pkg.price, url: subscriptionUrl, trigger: 'manual', stripe_session_id: sessionId },
  })

  console.log('Subscription email sent to:', client.email, 'package:', client.package)
  return NextResponse.json({ sent: true, sent_at: sentAt })
}
