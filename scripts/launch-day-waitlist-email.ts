// Launch-day single-send email to product_waitlist subscribers.
//
// Fires manually on Mon 13 Jul 2026 7am AEST (same hour as
// NEXT_PUBLIC_CHALLENGE_LIVE flips). One single-send to every row in
// product_waitlist, segmented by product (challenge / blueprint / membership)
// so each segment gets a product-specific subject + CTA. Includes the
// AF Newstead founding-partner block per the AF Newstead Founding Partner
// Proposal (pending Aimee's sign-off; if she declines we strip the block
// before pressing --live).
//
// Default mode is PREVIEW: sends a single [PREVIEW] copy of each product
// variant to kade@bodyrecode.au so Kade can see the exact look first.
//
// Pass --live to broadcast: loops every row in product_waitlist where
// notified_at IS NULL, sends each its segmented copy, then stamps
// notified_at so re-runs don't double-send.
//
// Usage:
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/launch-day-waitlist-email.ts
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/launch-day-waitlist-email.ts --live
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/launch-day-waitlist-email.ts --live --product=challenge
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/launch-day-waitlist-email.ts --live --no-af-newstead
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/launch-day-waitlist-email.ts --live --wave=2  # wave-2 reopen after Wave 1 fills

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  darkEmailShell,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailFeaturedCard, emailStatusCard, emailCta, emailUrlFallback,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'
import { appUrl } from '../src/lib/app-url'

const LIVE = process.argv.includes('--live')
const NO_AF = process.argv.includes('--no-af-newstead')
const PRODUCT_FILTER = (process.argv.find(a => a.startsWith('--product='))?.split('=')[1] ?? '')
// Wave-tiered cap: --wave=1 is the original launch-day broadcast (founding 50).
// --wave=2/3 fire after the prior wave fills, telling waitlist signups the
// next wave is now open. Defaults to 1 for backward compatibility.
const WAVE = parseInt((process.argv.find(a => a.startsWith('--wave='))?.split('=')[1] ?? '1'), 10)

type Product = 'challenge' | 'blueprint' | 'membership'

interface WaitlistRow {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  product: Product
  body_state: string | null
  source: string | null
  notified_at: string | null
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── CONTENT PER PRODUCT ──────────────────────────────────────────────

function subjectFor(product: Product, firstName: string): string {
  if (WAVE >= 2) {
    if (product === 'challenge') return `${firstName}, Wave ${WAVE} just opened (${WAVE === 4 ? 'evergreen access' : '25 spots'}).`
    if (product === 'blueprint') return `${firstName}, Wave ${WAVE} of the Challenge just opened.`
    return `${firstName}, Wave ${WAVE} of the Challenge just opened.`
  }
  if (product === 'challenge') return `${firstName}, the 14-Day Body Decode Challenge is open.`
  if (product === 'blueprint') return `${firstName}, the 14-Day Challenge is open (Blueprint update inside).`
  return `${firstName}, the 14-Day Challenge is open (Membership update inside).`
}

function previewTextFor(product: Product): string {
  if (product === 'challenge') return 'Free. 14 days. Read your starting point first. Take it whenever you are ready.'
  if (product === 'blueprint') return 'The free 14-Day Challenge is open today. The Blueprint comes next, when your pattern is identified.'
  return 'The free 14-Day Challenge is open today. The Membership is the long-arc, after the read.'
}

function ctaFor(product: Product): { label: string; href: string } {
  if (product === 'challenge') {
    return { label: 'Take the 14-Day Challenge - free', href: `${appUrl()}/challenge?utm_source=email&utm_campaign=launch_day_waitlist&utm_content=challenge_waitlist` }
  }
  if (product === 'blueprint') {
    return { label: 'Start with the free 14-Day Challenge', href: `${appUrl()}/challenge?utm_source=email&utm_campaign=launch_day_waitlist&utm_content=blueprint_waitlist` }
  }
  return { label: 'Start with the free 14-Day Challenge', href: `${appUrl()}/challenge?utm_source=email&utm_campaign=launch_day_waitlist&utm_content=membership_waitlist` }
}

// ── EMAIL BODY ───────────────────────────────────────────────────────

function buildBody(product: Product, firstName: string, includeAfNewstead: boolean): string {
  const cta = ctaFor(product)

  // Headline block - product-aware + wave-aware
  const headline = WAVE >= 2
    ? `Wave ${WAVE} just opened.`
    : product === 'challenge'
    ? 'The 14-Day Body Decode Challenge is open.'
    : product === 'blueprint'
    ? 'The 14-Day Challenge is open (and it comes first).'
    : 'The 14-Day Challenge is open (and it comes before Membership).'

  // Opening - product-aware + wave-aware. Direct, no hype.
  const opening = WAVE >= 2
    ? `Hi ${firstName},<br /><br />Wave ${WAVE - 1} filled. You joined the waitlist for what came next, and Wave ${WAVE} of the 14-Day Body Decode Challenge is now open. ${WAVE === 4 ? 'No cap from here - doors stay open.' : '25 spots, first in first served.'} Free. No payment.`
    : product === 'challenge'
    ? `Hi ${firstName},<br /><br />The 14-Day Body Decode Challenge is now live. Free. No payment. Take it whenever you are ready.`
    : product === 'blueprint'
    ? `Hi ${firstName},<br /><br />You joined the Blueprint waitlist. The Blueprint will open soon, but it lands harder when your pattern has already been identified. That is what the 14-Day Body Decode Challenge does, and it is now live. Free. Take it first.`
    : `Hi ${firstName},<br /><br />You joined the Membership waitlist. The Membership opens soon, but it works on a body that has already been read. The 14-Day Body Decode Challenge is the read, and it is now live. Free.`

  // What the Challenge does - same for all. Note: emailFeaturedCard is a
  // WHITE card on the dark shell, so inner text must be DARK for legibility.
  const whatItDoes = emailFeaturedCard(`
    <p style="margin:0 0 10px;font-size:18px;font-weight:800;color:#1A1A1A;letter-spacing:-0.015em;line-height:1.3;">Reads your body before it prescribes anything to it.</p>
    <p style="margin:0;font-size:15px;color:#3A3A3A;line-height:1.7;">Fourteen days of structure designed to read what your body is actually doing. Day 7 you take a short Check-In. Day 14 the read reveals the pattern your biology has settled into, what it means, what it isnt (the most-common misreads), and the three actions specific to it. No payment.</p>
  `, { eyebrow: 'What the Challenge does' })

  // AF Newstead founding-partner block (skipped with --no-af-newstead)
  const afNewsteadBlock = includeAfNewstead ? `
${emailStatusCard({
  eyebrow: 'Founding partner',
  headline: 'Anytime Fitness Newstead',
  body: 'The Challenge was built over many years of coaching, then pressure-tested on the floor at Anytime Fitness Newstead these past months before launching nationally. AF Newstead is the founding partner of the launch.',
})}` : ''

  // CTA + URL fallback
  const ctaBlock = `
${emailCta({ href: cta.href, label: cta.label })}
${emailUrlFallback(cta.href)}`

  // Sign-off context
  const signOff = product === 'challenge'
    ? 'See you inside.'
    : product === 'blueprint'
    ? 'Take the Challenge first. The Blueprint will be waiting when your pattern is identified.'
    : 'Take the Challenge first. The Membership opens when the read is in.'

  return `
${emailLogo()}
${emailEyebrow('Doors open · 13 July 2026')}
${emailHeading(headline)}
${emailDivider()}
${emailBody(opening, { color: '#3A3A3A', size: 16, bottom: 24 })}
${whatItDoes}
${afNewsteadBlock}
${ctaBlock}
${emailBody(signOff, { color: '#3A3A3A', size: 16, bottom: 24 })}
${darkEmailSignature()}
`
}

// ── ENTRY ────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase env missing')

  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const includeAfNewstead = !NO_AF

  console.log(`[launch-email] Wave ${WAVE} broadcast${WAVE >= 2 ? ` (wave-${WAVE} reopen, not initial launch)` : ' (initial launch)'}`)
  console.log(includeAfNewstead ? '[launch-email] AF Newstead founding-partner block: INCLUDED' : '[launch-email] AF Newstead founding-partner block: STRIPPED (--no-af-newstead)')

  if (!LIVE) {
    // Preview mode: send one copy of each product variant to kade@
    console.log('[launch-email] PREVIEW mode. Sending one [PREVIEW] of each product variant to kade@bodyrecode.au')
    for (const product of ['challenge', 'blueprint', 'membership'] as Product[]) {
      const html = buildBody(product, 'Kade', includeAfNewstead)
      const wrapped = darkEmailShell(html, { previewText: previewTextFor(product) })
      const sent = await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `[PREVIEW · ${product}] ${subjectFor(product, 'Kade')}`,
        html: wrapped,
      })
      if (sent.error) console.error(`[launch-email] PREVIEW ${product} error:`, sent.error)
      else console.log(`[launch-email] PREVIEW ${product} sent. Resend id:`, sent.data?.id)
      await sleep(500)
    }
    return
  }

  // LIVE mode: broadcast to all product_waitlist rows where notified_at IS NULL
  console.log('[launch-email] LIVE mode. Fetching product_waitlist rows where notified_at IS NULL...')
  let query = supabase
    .from('product_waitlist')
    .select('id, email, first_name, last_name, product, body_state, source, notified_at')
    .is('notified_at', null)
  if (PRODUCT_FILTER) {
    if (!['challenge', 'blueprint', 'membership'].includes(PRODUCT_FILTER)) {
      throw new Error(`--product=${PRODUCT_FILTER} not valid (challenge|blueprint|membership)`)
    }
    query = query.eq('product', PRODUCT_FILTER)
  }
  const { data: rows, error } = await query
  if (error) throw error
  if (!rows || rows.length === 0) {
    console.log('[launch-email] No un-notified rows to send. Exiting.')
    return
  }

  console.log(`[launch-email] ${rows.length} rows to send. Looping with 500ms throttle...`)
  let sent = 0, failed = 0
  for (const row of rows as WaitlistRow[]) {
    const firstName = (row.first_name?.trim() || 'there').split(' ')[0]
    const html = buildBody(row.product, firstName, includeAfNewstead)
    const wrapped = darkEmailShell(html, { previewText: previewTextFor(row.product) })
    const result = await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: row.email,
      bcc: 'kade@bodyrecode.au',
      subject: subjectFor(row.product, firstName),
      html: wrapped,
    })
    if (result.error) {
      console.error(`[launch-email] FAILED ${row.email}:`, result.error)
      failed++
    } else {
      // Stamp notified_at so re-runs don't double-send
      await supabase.from('product_waitlist').update({ notified_at: new Date().toISOString() }).eq('id', row.id)
      sent++
      if (sent % 10 === 0) console.log(`[launch-email] ${sent} sent · ${failed} failed · continuing...`)
    }
    await sleep(500)
  }
  console.log(`[launch-email] DONE. Sent ${sent} · Failed ${failed}`)
}

main().catch(err => {
  console.error('[launch-email] fatal:', err)
  process.exit(1)
})
