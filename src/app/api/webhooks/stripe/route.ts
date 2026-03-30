import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'

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

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const clientRefId = subscription.metadata?.client_id
    if (clientRefId) {
      const admin = createAdminClient()
      await admin
        .from('clients')
        .update({ subscription_active: false })
        .eq('id', clientRefId)
    }
    return NextResponse.json({ received: true })
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

  // Notify coach
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `Payment received — ${lead.name}`,
      html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#aaa;">
  <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${lead.name} just paid.</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">Commencement fee confirmed. Welcome email and intake link have been sent to ${lead.email}.</p>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${lead.id}" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">View lead</a>
</div>`,
    })
  }

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
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:40px;">
      <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
    </div>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Hi ${firstName},</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your commencement fee has been received. You're officially in.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Before we begin, I need you to complete your foundational intake. This is how I build an accurate picture of where you're starting from - your training history, recovery patterns, stress load, sleep, and lifestyle. It takes around 15-20 minutes and there are no right or wrong answers. Just answer based on your typical experience, not your best or worst days.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 28px;">This intake forms the foundation of everything we do together, so take your time with it.</p>
    <a href="${intakeUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Complete my intake</a>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">While you're getting set up, take a read through your <a href="https://app.bodyrecode.au/coaching-guide" style="color:#10E1C2;font-weight:600;text-decoration:none;">Active Coaching Client Guide</a>. It covers how the coaching process works, what to expect each week, and how we build progress together.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Looking forward to getting started.</p>
    ${darkEmailSignature()}
    <p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${intakeUrl}</p>
  </div>
</body>
</html>`,
    })
  }

  return NextResponse.json({ received: true })
}
