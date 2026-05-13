import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { darkEmailSignature } from '@/lib/email-signature'
import { darkEmailShell } from '@/lib/email-shell'
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
    .select('id, name, email, converted_to_client_id, status')
    .eq('id', id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  // Allow when the lead has been converted but the fee hasn't landed yet.
  // Block once the fee is recorded as paid (or the client is past that point).
  const PAID_STATUSES = ['commencement_fee_paid', 'active_deliberate_start', 'active_coaching']
  if (PAID_STATUSES.includes(lead.status)) {
    return NextResponse.json({ error: 'Commencement fee is already paid for this lead.' }, { status: 400 })
  }
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
    html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Here is the $240 commencement link to get started. This covers the foundational read I do on your body before coaching begins, so the program you start on is built around your actual state, not a template.</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Once payment is in, your portal access, intake, and the first foundational steps unlock automatically. You will get a welcome email with everything you need to start the next stage.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#10E1C2" style="background-color:#10E1C2;border-radius:8px;">
            <a href="${session.url}" style="display:inline-block;padding:14px 28px;color:#000000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Pay commencement fee</a>
          </td>
        </tr>
      </table>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">If anything comes up before you pay, reply to this email.</p>
      ${darkEmailSignature()}
      <p style="margin:20px 0 0;font-size:13px;color:#a8a29e;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${session.url}</p>
`, { previewText: `${firstName}, your $240 commencement link.` }),
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
