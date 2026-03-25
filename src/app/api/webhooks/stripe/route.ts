import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // Handle weekly subscription payment
  if (session.mode === 'subscription' && session.client_reference_id) {
    const admin = createAdminClient()
    await admin
      .from('clients')
      .update({ subscription_active: true })
      .eq('id', session.client_reference_id)
    return NextResponse.json({ received: true })
  }

  if (session.metadata?.type !== 'commencement_fee') {
    return NextResponse.json({ received: true })
  }

  const leadId = session.metadata.lead_id
  if (!leadId) return NextResponse.json({ error: 'No lead_id in metadata' }, { status: 400 })

  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.converted_to_client_id) return NextResponse.json({ received: true }) // already done

  // Create client
  const { data: client, error: clientError } = await admin
    .from('clients')
    .insert({ coach_id: lead.coach_id, name: lead.name, email: lead.email ?? null })
    .select()
    .single()

  if (clientError || !client) {
    console.error('Failed to create client:', clientError)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }

  // Create intake invitation
  const { data: invitation, error: invError } = await admin
    .from('intake_invitations')
    .insert({ client_id: client.id })
    .select()
    .single()

  if (invError || !invitation) {
    console.error('Failed to create intake invitation:', invError)
    return NextResponse.json({ error: 'Failed to create intake invitation' }, { status: 500 })
  }

  // Update lead
  await admin
    .from('leads')
    .update({
      converted_to_client_id: client.id,
      converted_at: new Date().toISOString(),
      status: 'commencement_fee_paid',
    })
    .eq('id', leadId)

  // Send intake email
  if (lead.email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const firstName = lead.name.split(' ')[0]
    const intakeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/intake/${invitation.token}`

    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: lead.email,
      subject: `Welcome to Body Recode, ${firstName}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f5f5f4;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a8a29e;">Body Recode</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#1c1917;line-height:1.3;">Hi ${firstName},</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
                Your commencement fee has been received - you're officially in.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
                Before we begin, I need you to complete your foundational intake. This is how I build an accurate picture of where you're starting from - your training history, recovery patterns, stress load, sleep, and lifestyle. It takes around 15-20 minutes and there are no right or wrong answers. Just answer based on your typical experience, not your best or worst days.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">
                This intake forms the foundation of everything we do together, so take your time with it.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:12px;background:#1c1917;">
                    <a href="${intakeUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
                      Complete my intake
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:15px;color:#57534e;line-height:1.6;">
                Looking forward to getting started.<br/><br/>Kade
              </p>
              <p style="margin:16px 0 0;font-size:13px;color:#a8a29e;line-height:1.5;">
                Or copy this link: <span style="color:#78716c;">${intakeUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f5f5f4;">
              <p style="margin:0;font-size:12px;color:#a8a29e;">This link is unique to you. Reply to this email if you have any questions.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })
  }

  return NextResponse.json({ received: true })
}
