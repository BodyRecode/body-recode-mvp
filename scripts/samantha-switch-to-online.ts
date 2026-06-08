// Samantha is travelling 5 Jun to 5 Jul 2026. Switch her from the 2x_launch
// in-person sub to an online_launch sub for the travel block.
//
// Actions (idempotent — re-running is safe, each step is a no-op if already done):
//   1. Cancel sub_1TTvNXQovwo9QLBUPPCbsfB7 with cancel_at_period_end=true so
//      she keeps the already-paid week (ends ~Wed 10 Jun) but no renewal fires.
//   2. Create a fresh single-use Checkout Session at the online_launch price
//      ($74.50/wk) via createSubscriptionCheckoutForClient().
//   3. Email her a branded link (+ Kade BCC) and log to client_communications.
//   4. On her return, Kade manually re-sends the 2x_launch link.

import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { COACHING_PACKAGES } from '@/lib/coaching-packages'
import { createSubscriptionCheckoutForClient } from '@/lib/subscription-checkout'
import {
  darkEmailShell,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailDivider,
  emailBody,
  emailFeaturedCard,
  emailStatusCard,
  emailCta,
  emailUrlFallback,
  COACH_BCC,
} from '@/lib/email-shell'
import { darkEmailSignature } from '@/lib/email-signature'
import { logClientCommunication } from '@/lib/client-communications'

const SAMANTHA_ID = '403af6c4-136a-40e9-bd90-7d8e1dd101b9'
const KEEPER_SUB_ID = 'sub_1TTvNXQovwo9QLBUPPCbsfB7'

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // --- 1. Verify client state ---
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, onboarding_token, package, subscription_active')
    .eq('id', SAMANTHA_ID).single()
  if (!client) throw new Error('Samantha not found')
  if (!client.email) throw new Error('No email on file')
  console.log(`Client: ${client.name} <${client.email}> | package=${client.package}\n`)

  // --- 2. Cancel-at-period-end on the active sub ---
  console.log(`--- Step 1: cancel_at_period_end on ${KEEPER_SUB_ID} ---`)
  const before = await stripe.subscriptions.retrieve(KEEPER_SUB_ID)
  if (before.status !== 'active') {
    console.log(`  Sub status is ${before.status}, not active. Skipping cancel step.`)
  } else if (before.cancel_at_period_end) {
    console.log(`  Already set to cancel_at_period_end. No change.`)
  } else {
    const updated = await stripe.subscriptions.update(KEEPER_SUB_ID, {
      cancel_at_period_end: true,
      metadata: {
        ...before.metadata,
        cancel_reason: 'samantha-travel-block-2026-06-05-to-2026-07-05',
        cancel_set_at: new Date().toISOString(),
      },
    })
    console.log(`  cancel_at_period_end set: ${updated.cancel_at_period_end}`)
    const cae = updated.cancel_at ? new Date(updated.cancel_at * 1000).toISOString() : 'period_end'
    console.log(`  Will cancel at: ${cae}`)
  }

  // --- 3. Create the new online_launch Checkout Session ---
  console.log(`\n--- Step 2: create new online_launch ($74.50/wk) Checkout Session ---`)
  const onlineLaunch = COACHING_PACKAGES.find(p => p.value === 'online_launch')
  if (!onlineLaunch) throw new Error('online_launch package not found in catalogue')
  const { url, sessionId, expiresAt } = await createSubscriptionCheckoutForClient({
    client: { id: client.id, email: client.email, onboarding_token: client.onboarding_token },
    pkg: onlineLaunch,
  })
  console.log(`  session: ${sessionId}`)
  console.log(`  url: ${url}`)
  console.log(`  expires: ${expiresAt.toISOString()}`)

  // --- 4. Email her with the new link ---
  console.log(`\n--- Step 3: email Samantha + Kade BCC ---`)
  const firstName = client.name.split(' ')[0]
  const subject = `${firstName}, your online coaching rate while you're away`
  const html = darkEmailShell(`
${emailLogo(150)}
${emailEyebrow('Account update')}
${emailHeading('Online rate for your time away.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`I have switched your coaching over to the online rate for the four weeks you are away. Your current weekly fee is paused at the end of the week you have already paid for, so nothing extra comes out at the usual time on Wednesday.`)}
${emailBody(`The new online weekly rate is <strong>$74.50 AUD</strong>. The link below opens a fresh checkout to set that up. It is single-use and expires in 24 hours, so use it today.`)}
${emailFeaturedCard(`
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#1056D6;letter-spacing:0.12em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Online Coaching · Travel block</p>
  <p style="margin:0;font-size:20px;font-weight:800;color:#1A1A1A;letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">$74.50 AUD <span style="font-size:13px;font-weight:700;color:#6B6B6B;">per week</span></p>
`)}
${emailCta({ href: url, label: 'Set up online coaching →' })}
${emailUrlFallback(url)}
${emailStatusCard({
  eyebrow: 'When you are back',
  headline: 'We return to in-person on 6 July.',
  body: 'I will send you a new link to switch back to the in-person rate when you return. Nothing for you to action on that, I will reach out.',
})}
${emailBody(`If anything looks off, reply to this and I will sort it.`)}
${darkEmailSignature()}
`, { previewText: 'Switched to online rate for your four weeks away.' })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data: sent, error } = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: client.email,
    bcc: COACH_BCC,
    subject,
    html,
  })
  if (error) { console.error(error); process.exit(1) }
  console.log(`  Sent. Resend id: ${sent?.id}`)

  // --- 5. Log to client_communications ---
  await logClientCommunication(supabase, {
    clientId: client.id,
    kind: 'subscription_link',
    subject,
    toAddress: client.email,
    sentBy: null,
    meta: {
      package: 'online_launch',
      stripe_session_id: sessionId,
      stripe_session_url: url,
      replaces_sub_id: KEEPER_SUB_ID,
      reason: 'travel-block-2026-06-05-to-2026-07-05',
    },
  })
  console.log(`  Logged to client_communications.`)

  console.log(`\nDone.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
