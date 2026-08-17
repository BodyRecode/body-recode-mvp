import Stripe from 'stripe'
import { tenantStripe } from '@/lib/tenant-stripe'
import { Resend } from 'resend'
import { SupabaseClient } from '@supabase/supabase-js'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'
import { fromCoach, darkEmailShell, emailBody, emailCta } from '@/lib/email-shell'


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

export async function sendDownsellOffer(
  leadId: string,
  lead: { name: string; email: string },
  admin: SupabaseClient
): Promise<{ sent: boolean; error?: string }> {
  if (!lead.email) return { sent: false, error: 'No email address' }
  if (!process.env.RESEND_API_KEY) return { sent: false, error: 'Email not configured' }

  // Get body state from scorecard
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

  if (!stateKey) return { sent: false, error: 'No body state found' }

  const stateLabel = STATE_LABELS[stateKey]
  const firstName = lead.name.split(' ')[0]

  // Resolved here rather than at module scope: getTenant() reads a per-request
  // cache, so a module-level client would route every tenant to Body Recode.
  const { stripe, opts } = tenantStripe()

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
    },
    success_url: `${appUrl()}/program/success`,
    cancel_url: `${appUrl()}/program/cancelled`,
  }, opts)

  const checkoutUrl = session.url!
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: fromCoach(),
    to: lead.email,
    subject: `${firstName}, the self-guided ${stateLabel} program - $97`,
    html: darkEmailShell(`
${emailBody(`Hi ${firstName},`)}
${emailBody(`Coaching is not the right fit right now. Understood. Most people in ${stateLabel} State still need to act on the read though, and that is what this is for.`)}
${emailBody(`12 weeks of training and nutrition built specifically for ${stateLabel} State. Volume, intensity, rest, and food sequenced around where your body actually is. Not a generic plan you guess your way through.`)}
${emailBody(`$97. One-time. Yours to keep. Self-paced.`)}
${emailCta({ href: checkoutUrl, label: 'Get the program - $97' })}
${emailBody(`Or copy this link: ${checkoutUrl}`, { size: 13, color: '#6B6B6B' })}
${darkEmailSignature()}
`, { previewText: `${firstName}, the self-guided ${stateLabel} program - $97` }),
  })

  await admin.from('lead_events').insert({
    lead_id: leadId,
    type: 'email_sent',
    subject: `Self-Guided Program offer sent (${stateLabel} State - $97)`,
    notes: 'Auto-sent on decline.',
    sent_at: new Date().toISOString(),
  })

  return { sent: true }
}
