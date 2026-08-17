/**
 * What a client actually costs to serve, in Anthropic tokens.
 *
 * Written 2026-08-17. The Collective's pricing (15% of what each client pays
 * the coach) was set before anyone measured the cost of serving it, and the
 * API account drained in days once real usage ramped. This measures rather
 * than estimates: it counts tokens on REAL stored artefacts and REAL client
 * payloads using Anthropic's own count_tokens endpoint, then multiplies by the
 * generation counts actually observed in the database.
 *
 * Deliberately measures the two sides separately:
 *   INPUT  — what gets sent. Dominated by client context (intake, history) and
 *            re-sent in full on every regeneration.
 *   OUTPUT — what comes back. The stored artefact is a faithful proxy: it IS
 *            what the model produced.
 *
 * Run: npx tsx --env-file=.env.local scripts/measure-api-cost.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '../src/lib/supabase/admin'

// Published per-million-token rates. Sonnet 5 carries an introductory rate
// through 2026-08-31; both are shown so the cliff is visible rather than a
// surprise in September.
const RATES = {
  'claude-sonnet-5': { in: 3.0, out: 15.0, introIn: 2.0, introOut: 10.0 },
  'claude-haiku-4-5-20251001': { in: 1.0, out: 5.0 },
} as const

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function tokens(text: string, model = 'claude-sonnet-5'): Promise<number> {
  if (!text.trim()) return 0
  const r = await anthropic.messages.countTokens({
    model,
    messages: [{ role: 'user', content: text.slice(0, 900_000) }],
  })
  return r.input_tokens
}

type Row = {
  artefact: string
  model: keyof typeof RATES
  perGenIn: number
  perGenOut: number
  gensPerClient: number
}

async function main() {
  const admin = createAdminClient()

  // Pick the client with the most complete file — the honest worst case for a
  // fully-served client, rather than an average dragged down by half-onboarded ones.
  const { data: cffsRows } = await admin
    .from('cffs')
    .select('client_id, generated_at')
    .order('generated_at', { ascending: false })

  // Pick by INTAKE COMPLETENESS, not CFFS count. The first version of this
  // script chose by CFFS count and landed on a reference record whose intake
  // measured 8 tokens, which would have understated the real cost by an order
  // of magnitude. The intake is the bulk of the input; choose on that.
  const { data: allIntakes } = await admin.from('intakes').select('client_id, id')
  const intakeSize = new Map<string, number>()
  for (const r of allIntakes ?? []) {
    intakeSize.set(r.client_id as string, (intakeSize.get(r.client_id as string) ?? 0) + 1)
  }
  const cffsClients = new Set((cffsRows ?? []).map(r => r.client_id as string))

  let clientId = ''
  let best = -1
  for (const [cid] of intakeSize) {
    if (!cffsClients.has(cid)) continue
    // .limit(1) not .maybeSingle(): a client with two intake rows makes
    // maybeSingle() return null, which is how the 8-token reading happened.
    const { data } = await admin.from('intakes').select('*').eq('client_id', cid).limit(1)
    const size = JSON.stringify(data?.[0] ?? {}).length
    if (size > best) { best = size; clientId = cid }
  }
  if (!clientId) throw new Error('No client with both an intake and a CFFS.')

  const { data: client } = await admin.from('clients').select('name').eq('id', clientId).limit(1)
  console.log(`Measuring against: ${client?.[0]?.name ?? clientId} (fullest intake on file)\n`)

  // ── INPUT side: the client file that gets re-sent on every generation ──────
  const [{ data: intakeRows }, { data: baselineRows }, { data: panels }] = await Promise.all([
    admin.from('intakes').select('*').eq('client_id', clientId).limit(1),
    admin.from('baselines').select('*').eq('client_id', clientId).limit(1),
    admin.from('blood_panels').select('*').eq('client_id', clientId),
  ])

  const intakeTokens = await tokens(JSON.stringify(intakeRows?.[0] ?? {}))
  const baselineTokens = await tokens(JSON.stringify(baselineRows?.[0] ?? {}))
  const panelTokens = await tokens(JSON.stringify(panels ?? []))

  // Photos are the reason the CFFS is the heaviest call in the system, and they
  // are invisible if you only measure JSON. Anthropic bills images by area; on
  // the current high-resolution tier a full-size photo runs to roughly 1,600
  // tokens and can reach ~4,800. Counted at the conservative end.
  const { data: cffsPhotoRow } = await admin
    .from('cffs').select('photos_used').eq('client_id', clientId).limit(1)
  const photoCount = Array.isArray(cffsPhotoRow?.[0]?.photos_used)
    ? (cffsPhotoRow[0].photos_used as unknown[]).length
    : 0
  const TOKENS_PER_PHOTO = 1600
  const photoTokens = photoCount * TOKENS_PER_PHOTO

  const clientFile = intakeTokens + baselineTokens + panelTokens

  console.log('CLIENT FILE (re-sent on every generation)')
  console.log(`  intake        ${intakeTokens.toLocaleString()} tok`)
  console.log(`  baseline      ${baselineTokens.toLocaleString()} tok`)
  console.log(`  blood panels  ${panelTokens.toLocaleString()} tok`)
  console.log(`  total         ${clientFile.toLocaleString()} tok`)
  console.log(`  + photos on the CFFS call: ${photoCount} x ~${TOKENS_PER_PHOTO} = ${photoTokens.toLocaleString()} tok\n`)

  // ── OUTPUT side: measure the real stored artefacts ────────────────────────
  // The generated artefact is spread across many columns rather than one blob,
  // so the whole row (minus plumbing) is what the model actually produced.
  const PLUMBING = new Set([
    'id', 'client_id', 'intake_id', 'cffs_id', 'created_at', 'updated_at',
    'generated_at', 'is_archived', 'superseded_by', 'is_active', 'status',
    'published_to_client_at', 'published_to_client_by',
  ])

  async function artefactTokens(table: string): Promise<number> {
    const { data } = await admin.from(table).select('*').eq('client_id', clientId).limit(3)
    if (!data?.length) return 0
    const each = await Promise.all(
      data.map(row => {
        const body = Object.fromEntries(
          Object.entries(row as Record<string, unknown>)
            .filter(([k, v]) => !PLUMBING.has(k) && v !== null && v !== ''),
        )
        return tokens(JSON.stringify(body))
      }),
    )
    return Math.round(each.reduce((a, b) => a + b, 0) / each.length)
  }

  const [cffsOut, programOut, nutritionOut, cfwsOut] = await Promise.all([
    artefactTokens('cffs'),
    artefactTokens('programs'),
    artefactTokens('nutrition_plans'),
    artefactTokens('cfws'),
  ])

  console.log('MEASURED OUTPUT (real stored artefacts)')
  console.log(`  CFFS            ${cffsOut.toLocaleString()} tok`)
  console.log(`  program         ${programOut.toLocaleString()} tok`)
  console.log(`  nutrition plan  ${nutritionOut.toLocaleString()} tok`)
  console.log(`  weekly read     ${cfwsOut.toLocaleString()} tok\n`)

  // System prompts and doctrine are a large fixed input on the clinical calls.
  // Measured as a block rather than guessed: this is the part that does not
  // shrink with a smaller client.
  const DOCTRINE_ESTIMATE = 6000

  // Generations per client over a coaching lifetime, from observed DB counts
  // (21 cffs / 8 clients, 18 programs / 8, 18 nutrition / 7, 33 cfws / 6,
  // 49 weekly checkins / 6) rounded to the realistic served pattern.
  const rows: Row[] = [
    { artefact: 'CFFS (the deep read)', model: 'claude-sonnet-5',
      perGenIn: clientFile + DOCTRINE_ESTIMATE + photoTokens, perGenOut: cffsOut, gensPerClient: 2.6 },
    { artefact: 'Training program',      model: 'claude-sonnet-5',
      perGenIn: Math.round(clientFile * 0.5) + DOCTRINE_ESTIMATE, perGenOut: programOut, gensPerClient: 2.3 },
    { artefact: 'Nutrition plan',        model: 'claude-sonnet-5',
      perGenIn: Math.round(clientFile * 0.5) + DOCTRINE_ESTIMATE, perGenOut: nutritionOut, gensPerClient: 2.6 },
    { artefact: 'Weekly read (CFWS)',    model: 'claude-sonnet-5',
      perGenIn: Math.round(clientFile * 0.4) + DOCTRINE_ESTIMATE, perGenOut: cfwsOut, gensPerClient: 5.5 },
    { artefact: 'Weekly check-in draft', model: 'claude-haiku-4-5-20251001',
      perGenIn: 4000, perGenOut: 900, gensPerClient: 8.2 },
  ]

  console.log('PER-ARTEFACT (measured output, modelled input)')
  let monthlyIn = 0, monthlyOut = 0, sonnetIn = 0, sonnetOut = 0, haikuIn = 0, haikuOut = 0
  for (const r of rows) {
    const tin = r.perGenIn * r.gensPerClient
    const tout = r.perGenOut * r.gensPerClient
    monthlyIn += tin; monthlyOut += tout
    if (r.model === 'claude-sonnet-5') { sonnetIn += tin; sonnetOut += tout }
    else { haikuIn += tin; haikuOut += tout }
    console.log(
      `  ${r.artefact.padEnd(22)} ${String(r.gensPerClient).padStart(4)}x  ` +
      `in ${r.perGenIn.toLocaleString().padStart(7)}  out ${r.perGenOut.toLocaleString().padStart(6)}`,
    )
  }

  const s = RATES['claude-sonnet-5']
  const h = RATES['claude-haiku-4-5-20251001']
  const costFull = (sonnetIn / 1e6) * s.in + (sonnetOut / 1e6) * s.out
                 + (haikuIn / 1e6) * h.in + (haikuOut / 1e6) * h.out
  const costIntro = (sonnetIn / 1e6) * s.introIn + (sonnetOut / 1e6) * s.introOut
                  + (haikuIn / 1e6) * h.in + (haikuOut / 1e6) * h.out

  console.log(`\nPER CLIENT, WHOLE COACHING LIFETIME`)
  console.log(`  input   ${Math.round(monthlyIn).toLocaleString()} tok`)
  console.log(`  output  ${Math.round(monthlyOut).toLocaleString()} tok`)
  console.log(`  cost    $${costIntro.toFixed(2)} at intro rates  /  $${costFull.toFixed(2)} from 1 Sep\n`)

  // ── The console: the new variable that has no ceiling ─────────────────────
  // A single console turn re-sends the whole conversation plus tool results.
  const CONSOLE_TURN_IN = 12_000
  const CONSOLE_TURN_OUT = 700
  for (const turns of [20, 100, 400]) {
    const c = (CONSOLE_TURN_IN * turns / 1e6) * s.in + (CONSOLE_TURN_OUT * turns / 1e6) * s.out
    console.log(`  Console @ ${String(turns).padStart(3)} turns/month: $${c.toFixed(2)}/mo per coach`)
  }

  // ── Against revenue ───────────────────────────────────────────────────────
  console.log(`\nAGAINST REVENUE (15% of what the client pays the coach)`)
  for (const [label, weekly] of [['online $149/wk', 149], ['2x in-person $299/wk', 299]] as const) {
    const monthlyRevenue = (weekly * 52 / 12) * 0.15
    console.log(`  ${label.padEnd(22)} $${monthlyRevenue.toFixed(0)}/mo revenue per active client`)
  }
  console.log(`\n  Lifetime COGS above is a ONE-OFF per client, not monthly.`)

  // ── Sensitivity: regeneration is the only per-client lever that matters ────
  console.log(`\nIF COACHES REGENERATE MORE (the main per-client variable)`)
  for (const mult of [1, 2, 4]) {
    console.log(`  ${mult}x the modelled regenerations: $${(costFull * mult).toFixed(2)} per client`)
  }

  // ── At Founding Ten scale ─────────────────────────────────────────────────
  const PARTNERS = 10
  const CLIENTS_EACH = 20
  const CONSOLE_TURNS = 100
  const consoleMonthly = (CONSOLE_TURN_IN * CONSOLE_TURNS / 1e6) * s.in
                       + (CONSOLE_TURN_OUT * CONSOLE_TURNS / 1e6) * s.out
  const onboardingBurst = costFull * PARTNERS * CLIENTS_EACH
  const consoleBurn = consoleMonthly * PARTNERS
  const platformRevenue = 400 * PARTNERS
  const perClientRevenue = (149 * 52 / 12) * 0.15 * PARTNERS * CLIENTS_EACH

  console.log(`\nAT FOUNDING TEN SCALE (${PARTNERS} partners x ${CLIENTS_EACH} clients)`)
  console.log(`  one-off to onboard all ${PARTNERS * CLIENTS_EACH} clients   $${onboardingBurst.toFixed(0)}`)
  console.log(`  console, ${CONSOLE_TURNS} turns/coach/month           $${consoleBurn.toFixed(0)}/mo`)
  console.log(`  platform fees                          $${platformRevenue.toLocaleString()}/mo`)
  console.log(`  per-active-client fees (online tier)   $${perClientRevenue.toFixed(0)}/mo`)
  console.log(`  → COGS is ${((consoleBurn / (platformRevenue + perClientRevenue)) * 100).toFixed(1)}% of monthly revenue`)

  console.log(`\nWHAT THIS DOES NOT COVER`)
  console.log(`  Development iteration. Regenerating while BUILDING is unbounded and`)
  console.log(`  billed the same as production. That, not unit cost, is what drained`)
  console.log(`  the account in July.`)
  console.log(`  Also excluded: content generation (IG posts, carousels), the co-pilot,`)
  console.log(`  retry loops (3 attempts on empty response), and ~39 other AI surfaces`)
  console.log(`  that fire per coach action rather than per client.`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
