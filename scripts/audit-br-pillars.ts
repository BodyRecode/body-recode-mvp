// Does @body_recode_'s queue actually carry the two pillars locked 14 Aug?
//
// The rule is 6 neurowellness / 3 readiness / 1 metabolic per ten. A post that
// merely sounds like the brand does not count - the audit tests the words in the
// post, because "interpretation before prescription" reads on-brand while naming
// neither sleep nor stress nor capacity.
//
// Run: npx tsx --env-file=.env.local scripts/audit-br-pillars.ts [--from=YYYY-MM-DD]
import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const NEURO = /\bsleep|\bstress|regulat|nervous system|recover|wired|cortisol|\b3am\b|waking|rested|switch off|protection mode|under-recover/i
const READY = /readiness|capacity|absorb|take the load|\bpushed\b|\bready\b|can your body|transitioning|depleted/i
const METAB = /insulin|blood sugar|carb|metabolic/i

const fromArg = process.argv.find(a => a.startsWith('--from='))
const FROM = fromArg ? fromArg.split('=')[1] : new Date().toISOString().slice(0, 10)

async function main() {
  const { data } = await db.from('calendar_posts')
    .select('date, type, title, caption, graphic, scheduled_publish_at, posted_at')
    .eq('brand', 'body_recode').eq('platform', 'instagram')
    .gte('date', FROM).order('date')
  const rows = (data ?? []) as Array<Record<string, string | null>>

  const tally: Record<string, number> = {}
  console.log(`\n@body_recode_ from ${FROM} · ${rows.length} rows\n`)
  for (const p of rows) {
    const t = `${p.title ?? ''} ${p.caption ?? ''}`
    const hit = NEURO.test(t) ? 'NEUROWELLNESS' : READY.test(t) ? 'READINESS'
      : METAB.test(t) ? 'metabolic' : 'neither'
    tally[hit] = (tally[hit] ?? 0) + 1
    const state = p.posted_at ? 'posted' : p.scheduled_publish_at ? 'queued' : 'NOT SCHEDULED'
    console.log(`${p.date}  ${state.padEnd(14)} ${hit.padEnd(14)} ${String(p.title ?? '').slice(0, 42)}`)
  }
  const n = rows.length || 1
  console.log('\ntally:', tally)
  console.log('target per ten: 6 neurowellness / 3 readiness / 1 metabolic')
  console.log(`actual per ten: ${(10 * (tally.NEUROWELLNESS ?? 0) / n).toFixed(1)} / ${(10 * (tally.READINESS ?? 0) / n).toFixed(1)} / ${(10 * (tally.metabolic ?? 0) / n).toFixed(1)}`)
  if (tally.neither) console.log(`\n${tally.neither} posts carry NEITHER pillar.`)
}
main()
