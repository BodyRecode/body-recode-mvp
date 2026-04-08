import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('id, name, email')
    .eq('id', id)
    .maybeSingle()

  if (!lead || !lead.email) {
    return NextResponse.json({ error: 'Lead not found or no email' }, { status: 404 })
  }

  // Get body state
  const { data: scorecardEvent } = await admin
    .from('lead_events')
    .select('notes')
    .eq('lead_id', id)
    .eq('type', 'scorecard_completed')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const bodyState = scorecardEvent?.notes?.match(/Body state: (.+?)\./)?.[1]

  const stateMap: Record<string, string> = {
    'Depleted State': 'depleted',
    'Transitioning State': 'transitioning',
    'Ready State': 'ready',
  }
  const stateKey = bodyState ? stateMap[bodyState] : null

  if (!stateKey) {
    return NextResponse.json({ error: 'No body state found for this lead' }, { status: 400 })
  }

  const stateLabels: Record<string, string> = {
    depleted: 'Depleted',
    transitioning: 'Transitioning',
    ready: 'Ready',
  }
  const stateLabel = stateLabels[stateKey]

  const stateProgramNames: Record<string, string> = {
    depleted: 'Self-Guided Program - Depleted State',
    transitioning: 'Self-Guided Program - Transitioning State',
    ready: 'Self-Guided Program - Ready State',
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: lead.email,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: 9700,
          product_data: {
            name: stateProgramNames[stateKey],
            description: '12-week self-guided training and nutrition program tailored to your body state.',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'self_guided_program',
      lead_id: lead.id,
      body_state: stateKey,
      name: lead.name,
      email: lead.email,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/program/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/program/cancelled`,
  })

  const firstName = lead.name.split(' ')[0]
  const checkoutUrl = session.url!

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: lead.email,
    subject: `Your ${stateLabel} State Program - $97`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111111" style="max-width:520px;background-color:#111111;border-radius:16px;border:1px solid #222222;overflow:hidden;">
          <tr>
            <td bgcolor="#111111" style="background-color:#111111;padding:28px 40px;border-bottom:1px solid #1e1e1e;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111111" style="background-color:#111111;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#888888;">
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Hi ${firstName},</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Your scorecard came back as ${stateLabel} State. That result tells you specifically how your body is handling stress and recovery right now, and what it can actually respond to.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">I have built a 12-week program specifically for ${stateLabel} State. Not a generic plan. Every decision in it, the training volume, intensity, rest periods, and nutrition, is designed around where you are right now.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">It is $97. One-time. Yours to keep and refer back to.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${checkoutUrl}" style="display:inline-block;padding:14px 28px;background:#10E1C2;color:#0a0a0a;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">Get the Program - $97</a></td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:13px;color:#555555;line-height:1.75;">Or copy this link: ${checkoutUrl}</p>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`,
  })

  await admin.from('lead_events').insert({
    lead_id: lead.id,
    type: 'email_sent',
    subject: `Self-Guided Program offer sent (${stateLabel} State)`,
    notes: `$97 downsell offer email sent.`,
    sent_at: new Date().toISOString(),
  })

  return NextResponse.json({ sent: true })
}
