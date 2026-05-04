import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { darkEmailSignature } from '@/lib/email-signature'
import { logLeadEvent } from '@/lib/log-lead-event'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: lead } = await supabase
    .from('leads')
    .select('id, name, email, converted_to_client_id')
    .eq('id', id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.converted_to_client_id) return NextResponse.json({ error: 'Already converted' }, { status: 400 })
  if (!lead.email) return NextResponse.json({ error: 'No email address for this lead' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: lead.email,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: 24000,
          product_data: {
            name: 'Body Recode - Commencement Fee',
            description: 'One-time commencement fee for Body Recode Performance Coaching.',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      lead_id: id,
      type: 'commencement_fee',
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${id}`,
  })

  const firstName = lead.name.split(' ')[0]
  const resend = new Resend(process.env.RESEND_API_KEY)

  const sendResult = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: lead.email,
    subject: `${firstName}, your $240 commencement link`,
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
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Here is the $240 commencement link to get started. This covers the foundational read I do on your body before coaching begins, so the program you start on is built around your actual state, not a template.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 28px;">Once payment is in, your portal access, intake, and the first foundational steps unlock automatically. You will get a welcome email with everything you need to start the next stage.</p>
    <a href="${session.url}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Pay commencement fee</a>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">If anything comes up before you pay, reply to this email.</p>
    ${darkEmailSignature()}
    <p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${session.url}</p>
  </div>
</body>
</html>`,
  })

  await logLeadEvent({
    leadId: id,
    type: 'email_sent',
    subject: 'Commencement fee link sent',
    resendEmailId: sendResult.data?.id,
    notes: `Stripe session: ${session.id}. Link expires ${new Date(session.expires_at * 1000).toISOString()}.`,
    sentAt: new Date(),
  })

  return NextResponse.json({ sent: true })
}
