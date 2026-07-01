/**
 * Client-stage commencement fee send.
 *
 * The lead-stage endpoint (POST /api/leads/[id]/send-commencement-fee)
 * exists for the standard funnel: lead → fee → client created on webhook.
 * This endpoint covers the inverse case where the client already exists
 * (typically a non-billing package — contra, comp — that the coach has
 * decided to charge the $240 commencement on after all). Same Stripe
 * checkout shape; metadata.client_id distinguishes the path from the
 * lead one inside the webhook handler.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { fromCoach, darkEmailShell } from '@/lib/email-shell'
import { logClientCommunication } from '@/lib/client-communications'
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

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', id)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.email) {
    return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })
  }

  // Guard against double-charging: if the plan row already shows the fee
  // received, refuse with a clear message.
  const { data: existingPlan } = await admin
    .from('client_payment_plan')
    .select('commencement_fee_paid_at')
    .eq('client_id', id)
    .maybeSingle()
  if (existingPlan?.commencement_fee_paid_at) {
    return NextResponse.json(
      { error: 'Commencement fee is already marked paid for this client.' },
      { status: 400 },
    )
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: client.email,
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
      client_id: id,
      type: 'commencement_fee',
    },
    success_url: `${appUrl()}/payment-success`,
    cancel_url: `${appUrl()}/dashboard/clients/${id}`,
  })

  const firstName = client.name.split(' ')[0]
  const resend = new Resend(process.env.RESEND_API_KEY)

  const subject = `${firstName}, your $240 commencement link`
  const sendResult = await resend.emails.send({
    from: fromCoach(),
    to: client.email,
    subject,
    html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="${logoUrl()}" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Here is the $240 commencement link. This covers the foundational read I do on your body before coaching begins, so the program you start on is built around your actual state, not a template.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:8px;">
            <a href="${session.url}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Pay commencement fee</a>
          </td>
        </tr>
      </table>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Any questions, reply to this email.</p>
      ${darkEmailSignature()}
      <p style="margin:20px 0 0;font-size:13px;color:#6B6B6B;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${session.url}</p>
`, { previewText: `${firstName}, your $240 commencement link inside.` }),
  })

  await logClientCommunication(admin, {
    clientId: id,
    kind: 'commencement_fee_link',
    channel: 'email',
    subject,
    toAddress: client.email,
    sentBy: user.id,
    meta: {
      stripe_session_id: session.id,
      stripe_session_expires_at: new Date(session.expires_at * 1000).toISOString(),
      url: session.url,
      resend_email_id: sendResult.data?.id ?? null,
      trigger: 'manual',
    },
  })

  return NextResponse.json({ sent: true })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Lightweight helper for the UI: "have we sent a commencement link to
  // this client lately, and is it still valid?" Reads the most recent
  // client_communications row of kind=commencement_fee_link.
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('client_communications')
    .select('sent_at, meta')
    .eq('client_id', id)
    .eq('kind', 'commencement_fee_link')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ lastSent: data })
}

/**
 * Generate a fresh checkout link without sending an email — used by the
 * "Copy Link" button so the coach can paste it elsewhere (DM, SMS).
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, email')
    .eq('id', id)
    .maybeSingle()
  if (!client?.email) return NextResponse.json({ error: 'No email on client' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: client.email,
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
    metadata: { client_id: id, type: 'commencement_fee' },
    success_url: `${appUrl()}/payment-success`,
    cancel_url: `${appUrl()}/dashboard/clients/${id}`,
  })

  return NextResponse.json({ url: session.url })
}
