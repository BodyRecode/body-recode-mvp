import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import {
  darkEmailShell,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailDivider,
  emailBody,
  emailFeaturedCard,
  emailCta,
  emailUrlFallback,
  EMAIL_FF,
  EMAIL_GRAPHITE,
  EMAIL_BODY,
  EMAIL_BLUE_DARK,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'

readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
})

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)

const DRAFTS_PATH = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-06-10_reengagement_drafts.json'

const APP = 'https://app.bodyrecode.au'

// Per-state offer payload. Mirrors STATE_CONFIG in draft-reengagement-emails.ts
// so the send script can render a structured branded featured card + CTA
// rather than relying on inline anchors Claude wrote into the prose.
const STATE_OFFER: Record<string, {
  eyebrow: string
  product_name: string
  product_price: number
  product_url: string
  product_promise: string
  cta_label: string
}> = {
  'Depleted State': {
    eyebrow: 'Depleted State follow-up',
    product_name: 'The Depleted Field Guide',
    product_price: 19,
    product_url: `${APP}/field-guide/depleted`,
    product_promise: 'Why clean eating and hard training stop working once you are here, and the first moves to bring the load down.',
    cta_label: 'Read the Depleted Field Guide',
  },
  'Transitioning State': {
    eyebrow: 'Transitioning State follow-up',
    product_name: 'The Transitioning Field Guide',
    product_price: 19,
    product_url: `${APP}/field-guide/transitioning`,
    product_promise: 'Your pattern is identifiable. The corrective sequence to lock the next phase before it slips back.',
    cta_label: 'Read the Transitioning Field Guide',
  },
  'Ready State': {
    eyebrow: 'Ready State follow-up',
    product_name: 'The Ready Field Guide',
    product_price: 19,
    product_url: `${APP}/field-guide/ready`,
    product_promise: 'Compound beats novelty. The progression that holds, written for people whose body can already take the work.',
    cta_label: 'Read the Ready Field Guide',
  },
}

const BOOK_URL = `${APP}/book`

/**
 * Strip the CTA paragraphs and signoff out of Claude's freeform draft, leaving
 * just the reading paragraphs. Those reading paragraphs get re-flowed through
 * emailBody() so they pick up the branded font + colour, and the CTA / signoff
 * are re-rendered as a proper featured card + signature.
 */
function extractProseParagraphs(body_html: string): string[] {
  const matches = [...body_html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  return matches
    .map(m => m[1].trim())
    .filter(text => {
      if (!text) return false
      // Drop "Kade" / "Kade." signoff line; we render a real signature.
      if (/^Kade\.?$/i.test(text.replace(/<[^>]+>/g, '').trim())) return false
      // Drop CTA-only paragraphs (single anchor with no surrounding prose).
      const stripped = text.replace(/<\/?(strong|em|b|i)>/gi, '').trim()
      if (/^<a\b[^>]*>[^<]*<\/a>\.?$/i.test(stripped)) return false
      // Drop "If you want this walked through, book a free strategy call." style
      // paragraphs — we re-render the booking option after the CTA explicitly.
      const visible = stripped.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1').toLowerCase()
      if (/(book a free|strategy call|walk(ed)? through with me|talk it through)/.test(visible) && stripped.includes('<a')) return false
      return true
    })
    // Strip any stray inline anchors out of the prose (we surface them as buttons).
    .map(p => p.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1'))
}

function firstName(name: string, email: string): string {
  const n = (name ?? '').trim().split(/\s+/)[0]
  if (n && n !== '?') return n
  return email.split('@')[0]
}

function buildBranded(d: {
  name: string
  email: string
  state: string
  score: number
  draft: { subject: string; preheader: string; body_html: string }
}): { subject: string; html: string } {
  const offer = STATE_OFFER[d.state] ?? STATE_OFFER['Depleted State']
  const prose = extractProseParagraphs(d.draft.body_html)
  const fn = firstName(d.name, d.email)

  // Featured card body: small eyebrow + headline + promise line.
  const cardInner = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:${EMAIL_GRAPHITE};letter-spacing:-0.01em;font-family:${EMAIL_FF};line-height:1.35;">${offer.product_name}</p>
    <p style="margin:0 0 14px;font-size:13px;color:${EMAIL_BLUE_DARK};font-weight:700;font-family:${EMAIL_FF};">$${offer.product_price} · ~20 minute read</p>
    <p style="margin:0;font-size:14px;color:${EMAIL_BODY};line-height:1.65;font-family:${EMAIL_FF};">${offer.product_promise}</p>
  `

  // Booking option rendered as a small secondary line under the CTA.
  const bookingLine = `<p style="margin:24px 0 0;font-size:14px;color:${EMAIL_BODY};line-height:1.65;font-family:${EMAIL_FF};">If you would rather walk it through, <a href="${BOOK_URL}" style="color:${EMAIL_BLUE_DARK};font-weight:700;text-decoration:underline;">book a free strategy call</a>.</p>`

  const inner = `
${emailLogo()}
${emailEyebrow(offer.eyebrow)}
${emailHeading(`${fn}, your scorecard read.`)}
${emailDivider()}
${prose.map(p => emailBody(p)).join('\n')}
${emailFeaturedCard(cardInner, { eyebrow: 'Start here' })}
${emailCta({ href: offer.product_url, label: offer.cta_label })}
${emailUrlFallback(offer.product_url, 'Or paste this link into your browser')}
${bookingLine}
${darkEmailSignature()}
`

  return {
    subject: d.draft.subject,
    html: darkEmailShell(inner, { previewText: d.draft.preheader }),
  }
}

// Optional flags:
//   --preview      -> only send the first 3 to kade@bodyrecode.au (subject prefixed [PREVIEW])
//   --live         -> send to real recipients
//   --only=email   -> only send to a specific email (testing)
async function main() {
  const args = process.argv.slice(2)
  const isPreview = args.includes('--preview')
  const isLive = args.includes('--live')
  const onlyArg = args.find(a => a.startsWith('--only='))
  const onlyEmail = onlyArg?.split('=')[1]

  if (!isPreview && !isLive && !onlyEmail) {
    console.error('Usage: --preview (sends first 3 to kade for review), --live (sends to real recipients), or --only=email@x.com')
    process.exit(1)
  }

  const { drafts } = JSON.parse(readFileSync(DRAFTS_PATH, 'utf8')) as {
    generated_at: string
    drafts: Array<{
      lead_id: string
      name: string
      email: string
      state: string
      score: number
      quality: string
      days_ago: number
      draft: { subject: string; preheader: string; body_html: string }
    }>
  }

  let targets = drafts
  if (isPreview) targets = drafts.slice(0, 3)
  if (onlyEmail) targets = drafts.filter(d => d.email.toLowerCase() === onlyEmail.toLowerCase())

  console.log(`Sending ${targets.length} emails${isPreview ? ' (PREVIEW to kade)' : ''}...`)

  let sent = 0, failed = 0
  for (const d of targets) {
    const to = isPreview ? 'kade@bodyrecode.au' : d.email
    const { subject, html } = buildBranded(d)
    const wrappedSubject = isPreview ? `[PREVIEW for ${d.name}] ${subject}` : subject

    try {
      const r = await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to,
        subject: wrappedSubject,
        html,
        replyTo: 'kade@bodyrecode.au',
      })
      if (r.error) {
        console.error(`  ! ${d.email}: ${r.error.message}`)
        failed++
      } else {
        sent++
        console.log(`  ✓ ${d.email}  (${d.state} ${d.score}/15)`)
        if (!isPreview) {
          // lead_events columns are lead_id, type, subject, sent_at, resend_email_id, notes
          // (NOT event_type/metadata — that silently failed every prior send).
          const { error: logErr } = await admin.from('lead_events').insert({
            lead_id: d.lead_id,
            type: 'reengagement_email_sent',
            subject: d.draft.subject,
            resend_email_id: r.data?.id,
            notes: `${d.state} ${d.score}/15`,
          })
          if (logErr) console.error(`    (log failed for ${d.email}: ${logErr.message})`)
        }
      }
    } catch (e) {
      console.error(`  ! ${d.email}: ${(e as Error).message}`)
      failed++
    }
    // Throttle to 600ms per send to stay under Resend's 2 req/sec cap
    await new Promise(r => setTimeout(r, 600))
  }
  console.log(`\nDone. Sent ${sent}, failed ${failed}.`)
}
main()
