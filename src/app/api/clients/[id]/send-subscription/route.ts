import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { darkEmailSignature } from '@/lib/email-signature'

const PACKAGES: Record<string, { label: string; price: string; stripe: string }> = {
  online: { label: 'Online Coaching', price: '$149/week', stripe: 'https://buy.stripe.com/aFacN72Ey2GW7MH2915ZC02' },
  '2x': { label: 'In-Person 2x', price: '$299/week', stripe: 'https://buy.stripe.com/4gM28t3ICftIff9cNF5ZC00' },
  '3x': { label: 'In-Person 3x', price: '$409/week', stripe: 'https://buy.stripe.com/aFabJ3frk0yO8QL6ph5ZC03' },
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, email, package')
    .eq('id', id)
    .maybeSingle()

  if (clientError) console.error('Client fetch error:', clientError)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })
  if (!client.package) { console.error('No package on client:', client); return NextResponse.json({ error: 'No package selected' }, { status: 400 }) }

  const pkg = PACKAGES[client.package]
  if (!pkg) { console.error('Invalid package value:', client.package); return NextResponse.json({ error: 'Invalid package' }, { status: 400 }) }

  const firstName = client.name.split(' ')[0]
  const subscriptionUrl = `${pkg.stripe}?client_reference_id=${id}`

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: client.email,
    subject: `${firstName}, your Body Recode subscription link`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:40px;">
      <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
    </div>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Hi ${firstName},</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Here is your weekly subscription link for Body Recode Performance Coaching.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 28px;">Package: <strong style="color:#fff;">${pkg.label} at ${pkg.price}</strong></p>
    <a href="${subscriptionUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Set up subscription</a>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">If you have any questions, reply to this email.</p>
    ${darkEmailSignature()}
    <p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${subscriptionUrl}</p>
  </div>
</body>
</html>`,
  })

  console.log('Subscription email sent to:', client.email, 'package:', client.package)
  return NextResponse.json({ sent: true })
}
