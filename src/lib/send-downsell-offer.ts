import Stripe from 'stripe'
import { Resend } from 'resend'
import { SupabaseClient } from '@supabase/supabase-js'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'
import { fromCoach } from '@/lib/email-shell'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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
  })

  const checkoutUrl = session.url!
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: fromCoach(),
    to: lead.email,
    subject: `${firstName}, the self-guided ${stateLabel} program - $97`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#999999;">
              <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Hi ${firstName},</p>
              <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Coaching is not the right fit right now. Understood. Most people in ${stateLabel} State still need to act on the read though, and that is what this is for.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">12 weeks of training and nutrition built specifically for ${stateLabel} State. Volume, intensity, rest, and food sequenced around where your body actually is. Not a generic plan you guess your way through.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">$97. One-time. Yours to keep. Self-paced.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${checkoutUrl}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">Get the program - $97</a></td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:13px;color:#999999;line-height:1.75;">Or copy this link: ${checkoutUrl}</p>
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
    lead_id: leadId,
    type: 'email_sent',
    subject: `Self-Guided Program offer sent (${stateLabel} State - $97)`,
    notes: 'Auto-sent on decline.',
    sent_at: new Date().toISOString(),
  })

  return { sent: true }
}
