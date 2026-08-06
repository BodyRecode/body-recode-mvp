// Pulls REAL aggregate numbers for the "State of the Data" reel format.
// Nothing gets stated as fact in a reel unless it comes out of here.
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const tally = (rows: any[], key: string) => {
  const m = new Map<string, number>()
  for (const r of rows) {
    const v = r[key]
    if (v === null || v === undefined || v === '') continue
    m.set(String(v), (m.get(String(v)) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

const pct = (n: number, d: number) => d ? `${Math.round((n / d) * 100)}%` : '-'

async function main() {
  const { data: leads, error } = await db.from('leads').select('*').limit(5000)
  if (error || !leads) { console.log('ERROR:', error?.message); return }

  const scored = leads.filter(l => l.scorecard_score != null)
  console.log(`TOTAL LEADS ${leads.length} | WITH A SCORECARD SCORE ${scored.length}\n`)

  for (const k of ['scorecard_body_state', 'scorecard_profile', 'fat_storage', 'age_band', 'biological_sex', 'cycle_status']) {
    const t = tally(scored, k)
    const n = t.reduce((s, [, c]) => s + c, 0)
    console.log(`--- ${k}  (n=${n}) ---`)
    for (const [v, c] of t) console.log(`  ${String(c).padStart(4)}  ${pct(c, n).padStart(4)}  ${v}`)
    console.log()
  }

  // Section scores: which foundation is lowest most often. Scale is 1-3 per section.
  const secTotals = new Map<string, { sum: number; n: number; floors: number }>()
  for (const l of scored) {
    const s = l.scorecard_section_scores
    if (!s || typeof s !== 'object') continue
    for (const [name, raw] of Object.entries(s)) {
      const v = Number(raw)
      if (!Number.isFinite(v)) continue
      const cur = secTotals.get(name) ?? { sum: 0, n: 0, floors: 0 }
      cur.sum += v; cur.n += 1; if (v === 1) cur.floors += 1
      secTotals.set(name, cur)
    }
  }
  console.log('--- section scores (1-3 each), worst first ---')
  const rows = [...secTotals.entries()].map(([name, c]) => ({
    name, avg: c.sum / c.n, n: c.n, floors: c.floors, floorPct: pct(c.floors, c.n),
  })).sort((a, b) => a.avg - b.avg)
  for (const r of rows) {
    console.log(`  ${r.avg.toFixed(2)}  scored the floor ${r.floorPct.padStart(4)} of the time (${r.floors}/${r.n})  ${r.name}`)
  }

  // Score distribution across the real 5-15 range.
  const dist = new Map<number, number>()
  for (const l of scored) dist.set(l.scorecard_score, (dist.get(l.scorecard_score) ?? 0) + 1)
  console.log('\n--- score distribution (range 5-15) ---')
  for (const s of [...dist.keys()].sort((a, b) => a - b)) {
    console.log(`  ${String(s).padStart(2)}  ${String(dist.get(s)).padStart(3)}  ${'#'.repeat(dist.get(s)!)}`)
  }

  // Voice of customer. Their words, not ours.
  const sit = leads.map(l => l.situation_text).filter(Boolean)
  console.log(`\n--- situation_text: ${sit.length} in their own words ---`)
  sit.slice(0, 40).forEach((s: string, i) => console.log(`  [${i + 1}] ${s.replace(/\s+/g, ' ').slice(0, 260)}`))
}
main()
