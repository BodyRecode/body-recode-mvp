/**
 * What one co-pilot question actually costs.
 *
 * Run: npx tsx scripts/measure-copilot-cost.ts
 *
 * 21 September 2026. We cap how many questions a coach may ask per day and
 * have never measured what one costs, so the cap was a guess dressed as a
 * limit. This builds the real prompt for a real client, sends a real question,
 * and reports the tokens the model actually billed.
 *
 * Reads only. It asks a question and throws the answer away.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildCopilotContext, getCoachPreferences } from '../src/lib/copilot-context'
import { buildCopilotSystemPrompt } from '../src/lib/copilot-prompt'
import { withTemporalContext } from '../src/lib/temporal-context'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Published prices per million tokens, in US dollars.
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
}

// The questions a coach who only has the READ would actually ask.
const QUESTIONS = [
  'Why did she land in this state? Explain it the way I would say it to her.',
  'What is driving her regulation rating this week?',
  'She asked me why the read says her sleep is the limiter. What do I tell her?',
]

const USD_TO_AUD = 1.52

async function main() {
  const { data: clients } = await admin
    .from('clients')
    .select('id, name')
    .is('ended_at', null)
    .is('frozen_at', null)
    .not('coaching_started_at', 'is', null)
    .limit(1)

  const client = clients?.[0]
  if (!client) { console.log('No active client to measure against.'); process.exit(1) }

  const ctx = await buildCopilotContext(admin, client.id as string)
  if (!ctx) { console.log('No context could be built for that client.'); process.exit(1) }
  const prefs = await getCoachPreferences(admin, null)
  const system = withTemporalContext(buildCopilotSystemPrompt(ctx.clientName, ctx.context, prefs))

  console.log(`\nMeasured against a real client file (${ctx.clientName}).`)
  console.log(`The context the model is given: ${system.length.toLocaleString()} characters.\n`)

  let totalUsd = 0
  for (const q of QUESTIONS) {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      // Cached the same way the route now does, so the measurement reflects
      // what a coach actually pays rather than a worse version of it.
      system: [{ type: 'text' as const, text: system, cache_control: { type: 'ephemeral' as const } }],
      messages: [{ role: 'user', content: q }],
    })
    const p = PRICES['claude-sonnet-5']
    const inTok = res.usage.input_tokens
    const outTok = res.usage.output_tokens
    const cached = (res.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0
    const written = (res.usage as { cache_creation_input_tokens?: number }).cache_creation_input_tokens ?? 0
    // Cache writes cost 1.25x input, cache reads 0.1x.
    const usd =
      (inTok / 1_000_000) * p.input +
      (written / 1_000_000) * p.input * 1.25 +
      (cached / 1_000_000) * p.input * 0.1 +
      (outTok / 1_000_000) * p.output
    totalUsd += usd
    console.log(`  "${q.slice(0, 52)}..."`)
    console.log(`     in ${inTok.toLocaleString()} fresh, ${written.toLocaleString()} cache write, ${cached.toLocaleString()} cache read, out ${outTok.toLocaleString()}`)
    console.log(`     US$${usd.toFixed(4)}  ≈  A$${(usd * USD_TO_AUD).toFixed(4)}\n`)
  }

  const avgUsd = totalUsd / QUESTIONS.length
  const avgAud = avgUsd * USD_TO_AUD
  console.log(`AVERAGE PER QUESTION:  US$${avgUsd.toFixed(4)}  ≈  A$${avgAud.toFixed(4)}\n`)
  console.log('What that means at the cap we already enforce:')
  for (const perDay of [10, 25, 50]) {
    console.log(`  ${String(perDay).padStart(3)} questions a day  =  A$${(avgAud * perDay).toFixed(2)}/day  =  A$${(avgAud * perDay * 30).toFixed(2)}/month per coach`)
  }
  console.log('')
}

main().catch(e => { console.error(e); process.exit(1) })
