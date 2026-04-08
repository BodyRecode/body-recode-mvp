import Stripe from 'stripe'
import { Resend } from 'resend'
import { SupabaseClient } from '@supabase/supabase-js'
import { darkEmailSignature } from '@/lib/email-signature'

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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/program/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/program/cancelled`,
  })

  const checkoutUrl = session.url!
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: lead.email,
    subject: `Your ${stateLabel} State Program - $97`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
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
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Your scorecard came back as ${stateLabel} State. That tells me specifically how your body is handling stress and recovery right now, and what it can actually respond to.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">I have built a 12-week program specifically for ${stateLabel} State. Not a generic plan. Every decision in it, the training volume, intensity, rest periods, and nutrition, is designed around where you are right now.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">It is $97. One-time. Yours to keep.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${checkoutUrl}" style="display:inline-block;padding:14px 28px;background:#10E1C2;color:#0c0a09;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">Get the Program - $97</a></td></tr>
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
    lead_id: leadId,
    type: 'email_sent',
    subject: `Self-Guided Program offer sent (${stateLabel} State - $97)`,
    notes: 'Auto-sent on decline.',
    sent_at: new Date().toISOString(),
  })

  return { sent: true }
}
