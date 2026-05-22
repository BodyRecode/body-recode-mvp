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
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody, emailCta,
} from '../src/lib/email-shell'

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

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow(`Self-Guided ${stateLabel} Program`)}
${emailHeading('Here is a fresh link.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('No hassle at all. Here is a fresh link, valid for the next 24 hours.')}
${emailBody(`Same program, same price. 12 weeks built for ${stateLabel} State. Yours to keep, self-paced.`, { bottom: 28 })}
${emailCta({ href: checkoutUrl, label: `Get the program — $97` })}
${emailUrlFallback(checkoutUrl, 'Or paste this link into your browser')}
${emailBody('If it expires again before you get to it, just reply and I will send another.', { size: 14 })}
${darkEmailSignature()}
`, { previewText: `${firstName}, fresh ${stateLabel} program link inside.` })

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
