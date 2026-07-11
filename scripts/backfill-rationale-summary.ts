// Backfill the coach-facing "At a glance" rationale_summary onto CFFS + CFWS
// rows that were generated BEFORE the 2026-07-11 rationale-compression shipped
// (rationale_summary IS NULL). It does NOT rewrite the existing interpretation:
// for each row it reads the already-saved verbose fields and asks the model to
// compress them into the summary shape only. The enum pills (body_state /
// resolution) are forced from the stored row so they can never drift from the
// existing classification.
//
// Safe by default: DRY RUN unless --write is passed (prints what it would do).
//   --client <id>   limit to a single client (for a test run)
//   --write         actually persist rationale_summary to the DB
//   --type cffs|cfws|all   which artefact(s) to backfill (default: all)
//
// Usage:
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && \
//     npx tsx scripts/backfill-rationale-summary.ts --client 905b05a5-c7cd-430d-8535-f0a4d15aaf37 --write

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { extractFirstJsonObject } from '../src/lib/extract-json'

const argv = process.argv.slice(2)
const WRITE = argv.includes('--write')
const clientId = argv.includes('--client') ? argv[argv.indexOf('--client') + 1] : undefined
const typeArg = (argv.includes('--type') ? argv[argv.indexOf('--type') + 1] : 'all') as 'cffs' | 'cfws' | 'all'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

function stripEmDashes<T>(v: T): T {
  if (typeof v === 'string') return v.replace(/\s*—\s*/g, ', ') as T
  if (Array.isArray(v)) return v.map(stripEmDashes) as T
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, stripEmDashes(x)])) as T
  }
  return v
}

// Compress already-written report prose into the summary shape only. Returns
// the parsed object or null after 3 attempts (truncation / parse guarded).
async function summarise(system: string, user: string): Promise<Record<string, unknown> | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const block = message.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') continue
    if (message.stop_reason === 'max_tokens') continue
    const json = extractFirstJsonObject(block.text)
    if (!json) continue
    try { return JSON.parse(json) } catch { /* retry */ }
  }
  return null
}

const CFFS_SYSTEM = `You compress an already-written Body Recode Coach-Facing Foundational Synthesis into a short at-a-glance summary. You do NOT re-interpret, diagnose, or add any new claim. Summarise ONLY what the supplied fields already state. Output valid JSON only, no markdown, no commentary:
{
  "headline": "2-3 lines MAX. Where this client's body is + the single most important reason it matters. Plain, direct, for a coach scanning the client cold.",
  "scan": { "binding_constraint": "3-4 words MAX naming the single biggest current limiter", "flags_count": "integer count of distinct risk/watch items present" },
  "operating_rules": ["3-5 bullets MAX, one line each, <=12 words. What the coach must hold in mind. Scan-and-remember only."]
}
QUALITY BAR: headline <=3 lines; operating_rules <=5 bullets, <=12 words each; no duplicated prose. Draw only from the supplied text.`

const CFWS_SYSTEM = `You compress an already-written Body Recode Coach-Facing Weekly Synthesis into a short at-a-glance summary. You do NOT re-interpret or add new claims. Summarise ONLY what the supplied fields already state. Output valid JSON only, no markdown, no commentary:
{
  "headline": "2-3 lines MAX. How this week went + the one thing that matters going into the coaching conversation. Plain, direct.",
  "scan": { "trajectory": "one of: Improving | Holding steady | Mixed | Regressing", "binding_constraint": "3-4 words MAX naming the biggest limiter this week", "flags_count": "integer count of distinct weekly risk flags present" },
  "operating_rules": ["3-5 bullets MAX, one line each, <=12 words. What the coach should hold or do this week."]
}
QUALITY BAR: headline <=3 lines; operating_rules <=5 bullets, <=12 words each; no duplicated prose. Draw only from the supplied text.`

async function backfillCFFS() {
  let q = supabase
    .from('cffs')
    .select('id, client_id, body_state_classification, resolution_state, client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items, tensions_and_tradeoffs, explicit_non_directives, closing_interpretive_notes')
    .is('rationale_summary', null)
  if (clientId) q = q.eq('client_id', clientId)
  const { data, error } = await q
  if (error) { console.error('[cffs] fetch error:', error.message); return }
  console.log(`[cffs] ${data?.length ?? 0} row(s) missing a summary${clientId ? ` for client ${clientId}` : ''}`)

  for (const row of data ?? []) {
    const user = [
      `Body State: ${row.body_state_classification}`,
      `Resolution: ${row.resolution_state}`,
      `Client Context Summary: ${row.client_context_summary}`,
      `Primary Patterns and Signals: ${row.primary_patterns_and_signals}`,
      `Capacity Constraints and Guardrails: ${row.capacity_constraints_and_guardrails}`,
      `Risk Flags and Watch Items: ${row.risk_flags_and_watch_items}`,
      `Tensions and Trade-Offs: ${row.tensions_and_tradeoffs}`,
      `Explicit Non-Directives: ${row.explicit_non_directives}`,
      `Closing Interpretive Notes: ${row.closing_interpretive_notes}`,
    ].join('\n\n')
    const raw = await summarise(CFFS_SYSTEM, user)
    if (!raw) { console.error(`  ✗ ${row.id} — could not produce summary, skipped`); continue }
    // Force enum pills from the stored row so they can never drift.
    const scan = { ...(raw.scan as Record<string, unknown> ?? {}), body_state: row.body_state_classification, resolution: row.resolution_state }
    const summary = stripEmDashes({ headline: raw.headline, scan, operating_rules: raw.operating_rules })
    console.log(`  • ${row.id}: ${String(summary.headline).slice(0, 90)}…`)
    if (WRITE) {
      const { error: uErr } = await supabase.from('cffs').update({ rationale_summary: summary }).eq('id', row.id)
      if (uErr) console.error(`    ✗ write failed: ${uErr.message}`)
      else console.log('    ✓ written')
    }
  }
}

async function backfillCFWS() {
  let q = supabase
    .from('cfws')
    .select('id, client_id, week_number, resolution_state, client_context_snapshot, dominant_weekly_patterns, weekly_capacity_constraints, weekly_risk_flags, weekly_tensions_tradeoffs, explicit_weekly_non_directives, closing_weekly_notes')
    .is('rationale_summary', null)
  if (clientId) q = q.eq('client_id', clientId)
  const { data, error } = await q
  if (error) { console.error('[cfws] fetch error:', error.message); return }
  console.log(`[cfws] ${data?.length ?? 0} row(s) missing a summary${clientId ? ` for client ${clientId}` : ''}`)

  for (const row of data ?? []) {
    const user = [
      `Resolution: ${row.resolution_state}`,
      `Context Snapshot: ${row.client_context_snapshot}`,
      `Dominant Weekly Patterns: ${row.dominant_weekly_patterns}`,
      `Weekly Capacity Constraints: ${row.weekly_capacity_constraints}`,
      `Weekly Risk Flags: ${row.weekly_risk_flags}`,
      `Weekly Tensions and Trade-Offs: ${row.weekly_tensions_tradeoffs}`,
      `Explicit Weekly Non-Directives: ${row.explicit_weekly_non_directives}`,
      `Closing Weekly Notes: ${row.closing_weekly_notes}`,
    ].join('\n\n')
    const raw = await summarise(CFWS_SYSTEM, user)
    if (!raw) { console.error(`  ✗ ${row.id} (wk ${row.week_number}) — could not produce summary, skipped`); continue }
    const scan = { ...(raw.scan as Record<string, unknown> ?? {}), resolution: row.resolution_state }
    const summary = stripEmDashes({ headline: raw.headline, scan, operating_rules: raw.operating_rules })
    console.log(`  • ${row.id} (wk ${row.week_number}): ${String(summary.headline).slice(0, 90)}…`)
    if (WRITE) {
      const { error: uErr } = await supabase.from('cfws').update({ rationale_summary: summary }).eq('id', row.id)
      if (uErr) console.error(`    ✗ write failed: ${uErr.message}`)
      else console.log('    ✓ written')
    }
  }
}

async function main() {
  console.log(`Backfill rationale_summary — ${WRITE ? 'WRITE' : 'DRY RUN'}${clientId ? ` · client ${clientId}` : ' · ALL clients'} · type ${typeArg}`)
  if (typeArg === 'cffs' || typeArg === 'all') await backfillCFFS()
  if (typeArg === 'cfws' || typeArg === 'all') await backfillCFWS()
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
