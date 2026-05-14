import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { darkEmailShell, COACH_BCC } from '@/lib/email-shell'
import { getCoachingPackage } from '@/lib/coaching-packages'
import { logClientCommunication } from '@/lib/client-communications'

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
    .select('id, name, email, package')
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
  const subscriptionUrl = `${pkg.stripe}?client_reference_id=${id}`

  const resend = new Resend(process.env.RESEND_API_KEY)

  const subject = `${firstName}, lock in your weekly subscription`

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: client.email,
    bcc: COACH_BCC,
    subject,
    html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your CFFS is in. Your program is being built around it. The last step before we start coaching is locking in your weekly subscription.</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Package: <strong style="color:#ffffff;">${pkg.label} at ${pkg.price}</strong></p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#10E1C2" style="background-color:#10E1C2;border-radius:8px;">
            <a href="${subscriptionUrl}" style="display:inline-block;padding:14px 28px;color:#000000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Set up subscription</a>
          </td>
        </tr>
      </table>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Once payment is active, we lock in your sessions and set your start date. Usually three to seven days out.</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Any questions, reply to this email.</p>
      ${darkEmailSignature()}
      <p style="margin:20px 0 0;font-size:13px;color:#a8a29e;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${subscriptionUrl}</p>
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
    meta: { package: client.package, package_label: pkg.label, price: pkg.price, url: subscriptionUrl, trigger: 'manual' },
  })

  console.log('Subscription email sent to:', client.email, 'package:', client.package)
  return NextResponse.json({ sent: true, sent_at: sentAt })
}
