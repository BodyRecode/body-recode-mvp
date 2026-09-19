import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { tenantStripe } from '@/lib/tenant-stripe'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { buildCommencementFeeEmail } from '@/lib/commencement-fee-email'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { logLeadEvent } from '@/lib/log-lead-event'
import { appUrl } from '@/lib/app-url'


export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { stripe, opts } = tenantStripe()
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
    return NextResponse.json({ error: 'The commencement fee is already paid for this lead.' }, { status: 400 })
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
            name: 'Body Recode - Coaching Commencement Fee',
            description: 'Covers your onboarding and Foundational Read before coaching begins, and your Progress Check at 12 weeks.',
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
  }, opts)

  const firstName = lead.name.split(' ')[0]
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { subject, html } = buildCommencementFeeEmail({ firstName, checkoutUrl: session.url ?? '' })

  const sendResult = await resend.emails.send({
    from: fromCoach(),
    to: lead.email,
    // Kade, 19 Sep 2026: copy him on the ONBOARDING emails, because this is the
    // window where he needs to see that a new client is actually receiving
    // things. Session reminders, check-in windows and drip steps stay uncopied.
    bcc: COACH_BCC,
    subject,
    html,
  })

  await logLeadEvent({
    leadId: id,
    type: 'email_sent',
    subject: 'Commencement fee link sent',
    resendEmailId: sendResult.data?.id,
    notes: `Stripe session: ${session.id}. Mode: payment ($297 commencement fee). Link expires ${new Date(session.expires_at * 1000).toISOString()}.`,
    sentAt: new Date(),
  })

  return NextResponse.json({ sent: true, sessionId: session.id, sessionUrl: session.url })
}
