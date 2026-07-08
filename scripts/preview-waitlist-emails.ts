// Preview the Product-Waitlist Welcome + Coach-Notify Pair by sending
// all 4 variants to Kade's inbox. Zero DB writes. Same shell/copy the
// live route emits on a real signup.
//
// Usage:
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && \
//     npx tsx scripts/preview-waitlist-emails.ts

import { Resend } from 'resend'
import {
  buildProductWaitlistWelcomeEmail,
  sendCoachWaitlistNotification,
  type WaitlistProduct,
} from '../src/lib/product-waitlist-welcome-email'
import { fromCoach } from '../src/lib/email-shell'
import { coach } from '../src/config/tenant'

async function main() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const to = coach().email

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const firstName = 'Kade'

  console.log(`[preview] Sending 4 [PREVIEW] emails to ${to}\n`)

  // 1-3: joiner welcome (challenge / blueprint / membership)
  for (const product of ['challenge', 'blueprint', 'membership'] as WaitlistProduct[]) {
    const { subject, html } = buildProductWaitlistWelcomeEmail({ firstName, product })
    const res = await resend.emails.send({
      from: fromCoach(),
      to,
      subject: `[PREVIEW · ${product}] ${subject}`,
      html,
    })
    if (res.error) console.error(`  ✗ ${product} welcome:`, res.error.message)
    else console.log(`  ✓ ${product} welcome sent · id ${res.data?.id}`)
    await sleep(400)
  }

  // 4: coach-notify (using a plausible fake lead)
  const notify = await sendCoachWaitlistNotification({
    email: 'sarah.example@gmail.com',
    firstName: 'Sarah',
    lastName: 'Whittaker',
    phone: '+61412000111',
    gender: 'female',
    bodyState: 'transitioning',
    product: 'challenge',
    source: 'ig_bio_link',
    smsOptIn: true,
  })
  if (!notify.ok) console.error(`  ✗ coach notify:`, notify.error)
  else console.log(`  ✓ coach notify sent · id ${notify.id}`)

  console.log(`\n[preview] Done. Check ${to}.`)
}

main().catch((err) => { console.error(err); process.exit(1) })
