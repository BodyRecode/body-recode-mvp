// Resend a self-guided program offer with a fresh Stripe checkout link.
//
// Reason this exists: Stripe Checkout Sessions expire ~24h after creation.
// When a lead replies days later asking for a new link, we need to mint a
// new session and send them a short personal reply (not the canonical
// downsell template, which feels weird re-fired).
//
// Usage:
//   set -a && source .env.local && set +a
//   npx tsx scripts/resend-program-offer.ts <leadId>
//
// Guards:
//   - Lead must exist and have an email
//   - Lead must have a `scorecard_completed` event with a parseable body state
//   - Re-send is logged as a `lead_events` row of type 'email_sent' so you
//     can see it in the lead timeline

import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { darkEmailSignature } from '../src/lib/email-signature'

const STATE_MAP: Record<string, string> = {
  'Depleted State': 'depleted',
  'Transitioning State': 'transitioning',
  'Ready State': 'ready',
}
const STATE_LABELS: Record<string, string> = {
  depleted: 'Depleted',
  transitioning: 'Transitioning',
  ready: 'Ready',
}
const PROGRAM_NAMES: Record<string, string> = {
  depleted: 'Self-Guided Program - Depleted State',
  transitioning: 'Self-Guided Program - Transitioning State',
  ready: 'Self-Guided Program - Ready State',
}

async function main() {
  const leadId = process.argv[2]
  if (!leadId) {
    console.error('Usage: tsx scripts/resend-program-offer.ts <leadId>')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY')
    process.exit(1)
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY')
    process.exit(1)
  }

  const admin = createClient(url, key)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: lead } = await admin
    .from('leads')
    .select('id, name, email, status')
    .eq('id', leadId)
    .maybeSingle()

  if (!lead || !lead.email) {
    console.error('Lead not found or missing email:', lead)
    process.exit(1)
  }

  const { data: scorecardEvent } = await admin
    .from('lead_events')
    .select('notes')
    .eq('lead_id', leadId)
    .eq('type', 'scorecard_completed')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const bodyState = scorecardEvent?.notes?.match(/Body state: (.+?)\./)?.[1]
  const stateKey = bodyState ? STATE_MAP[bodyState] : null
  if (!stateKey) {
    console.error('No body state on lead. Notes:', scorecardEvent?.notes)
    process.exit(1)
  }

  const stateLabel = STATE_LABELS[stateKey]
  const firstName = (lead.name || '').split(' ')[0] || 'there'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: lead.email,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: 9700,
          product_data: {
            name: PROGRAM_NAMES[stateKey],
            description: '12-week self-guided training and nutrition program tailored to your body state.',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'self_guided_program',
      lead_id: leadId,
      body_state: stateKey,
      name: lead.name,
      email: lead.email,
      source: 'resend-program-offer',
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/program/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/program/cancelled`,
  })

  const checkoutUrl = session.url!

  const subject = `Re: ${firstName}, the self-guided ${stateLabel} program - $97`

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#888888;">
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Hi ${firstName},</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">No hassle at all. Here is a fresh link, valid for the next 24 hours.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Same program, same price. 12 weeks built for ${stateLabel} State. Yours to keep, self-paced.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${checkoutUrl}" style="display:inline-block;padding:14px 28px;background:#10E1C2;color:#0c0a09;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">Get the program - $97</a></td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:13px;color:#555555;line-height:1.75;">Or copy this link: ${checkoutUrl}</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">If it expires again before you get to it, just reply and I will send another.</p>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`

  const sendResult = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: lead.email,
    subject,
    html,
  })

  if ((sendResult as { error?: unknown }).error) {
    console.error('Resend error:', (sendResult as { error: unknown }).error)
    process.exit(1)
  }

  await admin.from('lead_events').insert({
    lead_id: leadId,
    type: 'email_sent',
    subject: `Self-Guided Program offer RESENT (${stateLabel} State - $97)`,
    notes: `Lead replied asking for a new link. Fresh Stripe session ${session.id} minted; canonical downsell flow not re-fired.`,
    sent_at: new Date().toISOString(),
  })

  console.log('✓ Resent program offer')
  console.log('  to:        ', lead.email)
  console.log('  state:     ', stateLabel)
  console.log('  session:   ', session.id)
  console.log('  url:       ', checkoutUrl)
  console.log('  expires:   ', session.expires_at ? new Date(session.expires_at * 1000).toISOString() : '~24h')
}

main().catch(e => { console.error(e); process.exit(1) })
