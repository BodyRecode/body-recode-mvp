import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { darkEmailSignature } from '@/lib/email-signature'
import { fromCoach, darkEmailShell } from '@/lib/email-shell'
import { logLeadEvent } from '@/lib/log-lead-event'
import { appUrl } from '@/lib/app-url'
import { logoUrl } from '@/config/tenant'

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
    return NextResponse.json({ error: 'Foundational Read is already paid for this lead.' }, { status: 400 })
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
          unit_amount: 29700,
          product_data: {
            name: 'Body Recode - Foundational Read',
            description: 'One-time Foundational Read for Body Recode Performance Coaching.',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      lead_id: id,
      // Internal tracking key — unchanged so the Stripe webhook + downstream logic keep working.
      type: 'commencement_fee',
    },
    success_url: `${appUrl()}/payment-success`,
    cancel_url: `${appUrl()}/dashboard/leads/${id}`,
  })

  const firstName = lead.name.split(' ')[0]
  const resend = new Resend(process.env.RESEND_API_KEY)

  const subject = `${firstName}, your $297 Foundational Read link`

  const explainer = `Here is the $297 Foundational Read link to get started. This covers the full read I do on your body before coaching begins, so the program you start on is built around your actual state, not a template.`

  const sendResult = await resend.emails.send({
    from: fromCoach(),
    to: lead.email,
    subject,
    html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="${logoUrl()}" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${explainer}</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Once the payment is in, your portal access, intake, and the first foundational steps unlock automatically. You will get a welcome email with everything you need to start the next stage.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:8px;">
            <a href="${session.url}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Pay for your Foundational Read</a>
          </td>
        </tr>
      </table>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">If anything comes up before you pay, reply to this email.</p>
      ${darkEmailSignature()}
      <p style="margin:20px 0 0;font-size:13px;color:#6B6B6B;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${session.url}</p>
`, { previewText: `${firstName}, your $297 Foundational Read link.` }),
  })

  await logLeadEvent({
    leadId: id,
    type: 'email_sent',
    subject: 'Foundational Read link sent',
    resendEmailId: sendResult.data?.id,
    notes: `Stripe session: ${session.id}. Mode: payment ($297 one-off). Link expires ${new Date(session.expires_at * 1000).toISOString()}.`,
    sentAt: new Date(),
  })

  return NextResponse.json({ sent: true, sessionId: session.id, sessionUrl: session.url })
}
