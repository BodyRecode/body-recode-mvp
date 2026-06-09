import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
})

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })

const APP = 'https://app.bodyrecode.au'

// State-matched offers. The PRIMARY low-friction product, the AI deep-dive
// path (if applicable), the higher-intent call path. The bolt-ons sit as
// "start without the call" offers; Zoom is the "talk it through" offer.
const STATE_CONFIG: Record<string, {
  state_lens: string
  primary_product: { name: string; price: number; url: string; promise: string }
  deepdive: { name: string; price: number; url: string; promise: string }
}> = {
  'Depleted State': {
    state_lens: 'Depleted means the regulatory system is running flat. Cortisol curve is elevated and the body cannot recompose from that state regardless of how clean training or food is.',
    primary_product: {
      name: 'The Depleted Field Guide',
      price: 19,
      url: `${APP}/field-guide/depleted`,
      promise: 'Why a clean diet and hard training stop working once Depleted, and the first moves to bring the load down.',
    },
    deepdive: {
      name: 'A Question for Kade',
      price: 29,
      url: `${APP}/library/store/a-question-for-kade`,
      promise: 'Write your specific situation, get a personalised written response in your inbox within 10 minutes.',
    },
  },
  'Transitioning State': {
    state_lens: 'Transitioning means the pattern is identifiable and recoverable but the body has not yet locked into the next phase. This is the highest-leverage state - corrective moves now hold longer than they ever will once locked.',
    primary_product: {
      name: 'The Transitioning Field Guide',
      price: 19,
      url: `${APP}/field-guide/transitioning`,
      promise: 'Your pattern is identified. Here is the corrective sequence before it slips back.',
    },
    deepdive: {
      name: 'Your Custom Block',
      price: 39,
      url: `${APP}/library/store/your-custom-block`,
      promise: 'Describe your situation, get a 2-week training block adapted to your pattern + constraints in your inbox within 10 minutes.',
    },
  },
  'Ready State': {
    state_lens: 'Ready means the system can take demand. Most people in Ready stay there until they overshoot. The lever is structured progression that respects the pattern, not maximum effort that ignores it.',
    primary_product: {
      name: 'The Ready Field Guide',
      price: 19,
      url: `${APP}/field-guide/ready`,
      promise: 'Compound beats novelty. The progression that holds, written for people whose body can already take the work.',
    },
    deepdive: {
      name: 'A Question for Kade',
      price: 29,
      url: `${APP}/library/store/a-question-for-kade`,
      promise: 'Write your specific situation, get a personalised written response in your inbox within 10 minutes.',
    },
  },
}

const SYSTEM_PROMPT = `You are Kade Dunstone, founder of Body Recode, writing a short personalised re-engagement email to a lead who completed the Body State Scorecard and never booked a call.

Voice rules - NON-NEGOTIABLE:
- No em dashes. Use commas, full stops, or restructure.
- No motivational padding ("you got this", "trust the process", "small wins compound", etc).
- No greeting fluff. Open with the observation or a direct line.
- Plain functional language. Mechanism first, instruction second.
- Direct second person. "You" not "the body".
- Concise. Total body under 220 words.
- No exclamation marks.
- No "I hope this finds you well", "just checking in", "no pressure" hedge openers.

Structure:
1. Subject line (under 60 chars). Specific to their state.
2. Body in HTML. Use <p> tags. Open with their first name. Acknowledge their state + score + that some time has passed. Read what that state means for them (1-2 sentences from the state lens). Surface ONE primary product as the low-friction next step (cite the promise). Then surface the higher-intent path (book a call) as the alternative if they want it walked through. Sign off "Kade".

Tone: like a coach who actually paid attention to their result and is offering a real next step, not a generic nurture email.

Output exactly this JSON, no markdown, no preamble:
{
  "subject": "...",
  "preheader": "...",
  "body_html": "<p>...</p><p>...</p><p>...</p>"
}

Section guidance:
- subject (under 60 chars): specific. Mentions their state in some way OR names a tension the state implies. Examples that would be ok: "You came up Depleted - the next move", "Sarah, what your Transitioning result actually points to", "Three weeks since your scorecard. Here is the read."
- preheader (under 100 chars): one line that sits next to the subject in the inbox.
- body_html: ~120-220 words of HTML. <p> tags only (no headings, no images, no inline styles). Include both the primary product URL and the booking URL. The primary product URL should be a real anchor; the booking URL should also be an anchor labelled "book a free strategy call". No more than 2 anchors total.`

async function draftOne(lead: any): Promise<{ subject: string; preheader: string; body_html: string } | null> {
  const state = lead.scorecard_body_state ?? 'Depleted State'
  const cfg = STATE_CONFIG[state] ?? STATE_CONFIG['Depleted State']
  const daysAgo = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000)

  const userPrompt = `Lead: ${lead.name ?? 'there'} <${lead.email}>
Scorecard state: ${state}
Scorecard score: ${lead.scorecard_score}/15
Lead quality flag (Hormozi red-flag check): ${lead.lead_quality ?? 'yellow'}
Days since they completed scorecard: ${daysAgo}

State reading lens you should use: ${cfg.state_lens}

PRIMARY product to offer (the "start now without the call" path):
- Name: ${cfg.primary_product.name}
- Price: $${cfg.primary_product.price}
- URL to link: ${cfg.primary_product.url}
- The promise to communicate: ${cfg.primary_product.promise}

Alternative AI Deep-Dive (mention only if it strengthens the email - skip if it makes it too sales-heavy):
- ${cfg.deepdive.name} ($${cfg.deepdive.price}) - ${cfg.deepdive.promise}
- URL: ${cfg.deepdive.url}

Higher-intent path (the "walked through" alternative):
- Book a free strategy call: ${APP}/book

Return the JSON shape specified in your instructions. No markdown, no preamble.`

  const msg = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })
  const c = msg.content[0]
  if (c.type !== 'text') return null
  const text = c.text
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < 0) return null
  try {
    const parsed = JSON.parse(text.slice(start, end + 1))
    if (!parsed.subject || !parsed.body_html) return null
    // Defensive em-dash strip.
    parsed.subject = parsed.subject.replace(/—/g, ' - ')
    parsed.preheader = (parsed.preheader ?? '').replace(/—/g, ' - ')
    parsed.body_html = parsed.body_html.replace(/—/g, ', ')
    return parsed
  } catch {
    return null
  }
}

async function main() {
  // Load real scorecard completers who never booked a Zoom and aren't declined.
  const { data: leads } = await admin
    .from('leads')
    .select('id, name, email, scorecard_score, scorecard_body_state, lead_quality, status, created_at, zoom_1_date')
    .not('scorecard_score', 'is', null)
    .is('zoom_1_date', null)
    .not('email', 'ilike', '%test%')
    .not('email', 'ilike', '%@bodyrecode.au')
    .neq('status', 'closed_declined')
    .order('created_at', { ascending: false })

  console.log(`Loaded ${leads?.length ?? 0} candidates`)
  if (!leads?.length) return

  const drafts: Array<{
    lead_id: string
    name: string
    email: string
    state: string
    score: number
    quality: string
    days_ago: number
    draft: { subject: string; preheader: string; body_html: string }
  }> = []

  // Throttle to 4 concurrent Anthropic calls
  const concurrency = 4
  let cursor = 0
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (true) {
      const i = cursor++
      if (i >= leads.length) break
      const lead = leads[i]
      try {
        const d = await draftOne(lead)
        if (d) {
          drafts.push({
            lead_id: lead.id,
            name: lead.name ?? '?',
            email: lead.email,
            state: lead.scorecard_body_state ?? '?',
            score: lead.scorecard_score,
            quality: lead.lead_quality ?? 'yellow',
            days_ago: Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000),
            draft: d,
          })
          process.stdout.write('.')
        } else {
          process.stdout.write('x')
        }
      } catch (e) {
        process.stdout.write('!')
      }
    }
  }))
  process.stdout.write('\n')

  // Save JSON for the send script
  const outJson = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-06-10_reengagement_drafts.json'
  writeFileSync(outJson, JSON.stringify({ generated_at: new Date().toISOString(), drafts }, null, 2))
  console.log('\nSaved', drafts.length, 'drafts to', outJson)

  // Save markdown digest for human scanning
  const md = drafts.map((d, i) =>
    `## ${i + 1}. ${d.name} <${d.email}>\n\n` +
    `**State:** ${d.state} · score ${d.score}/15 · quality ${d.quality} · ${d.days_ago}d ago\n\n` +
    `**Subject:** ${d.draft.subject}\n\n` +
    `**Preheader:** ${d.draft.preheader}\n\n` +
    `**Body:**\n\n` +
    d.draft.body_html.replace(/<\/p>/g, '\n\n').replace(/<p>/g, '').replace(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '$2 ($1)').trim() +
    '\n\n---\n'
  ).join('\n')
  const outMd = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-06-10_reengagement_drafts.md'
  writeFileSync(outMd, `# Re-engagement Drafts - 2026-06-10\n\n${drafts.length} drafts generated for cold scorecard completers who never booked a Zoom.\n\nReview, then run \`npx tsx scripts/send-reengagement-emails.ts\` to send.\n\n---\n\n${md}`)
  console.log('Saved digest to', outMd)

  // Console preview of first 4
  console.log('\n--- PREVIEW (first 4) ---\n')
  drafts.slice(0, 4).forEach((d, i) => {
    console.log(`${i + 1}. ${d.name} (${d.state} - ${d.score}/15)`)
    console.log(`   Subject: ${d.draft.subject}`)
    console.log(`   Preheader: ${d.draft.preheader}`)
    console.log(`   Body preview: ${d.draft.body_html.replace(/<[^>]+>/g, '').slice(0, 200)}...`)
    console.log('')
  })
}
main()
