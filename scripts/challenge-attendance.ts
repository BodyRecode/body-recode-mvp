// Where across the 14 days do people go quiet?
//
// Nothing answered this before 14 Aug 2026, because portal visits were not
// logged anywhere. Run this once a cohort has had a fortnight to run - the
// answer decides what to fix. A drop at day 2 means the daily content never
// held them; a drop at day 9 means it held and then stopped.
//
// Run: npx tsx --env-file=.env.local scripts/challenge-attendance.ts
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: events } = await db
    .from('lead_events')
    .select('lead_id, notes')
    .eq('type', 'challenge_portal_opened')

  const rows = (events ?? []) as { lead_id: string; notes: string | null }[]
  if (!rows.length) {
    console.log('\nNo portal visits logged yet. Logging started 14 Aug 2026, so')
    console.log('this stays empty until a cohort enrols after that date.\n')
    return
  }

  // day -> set of people who opened the portal on that day of their 14
  const byDay = new Map<number, Set<string>>()
  for (const r of rows) {
    const m = r.notes?.match(/day:(\d+)/)
    if (!m) continue
    const d = Number(m[1])
    if (!byDay.has(d)) byDay.set(d, new Set())
    byDay.get(d)!.add(r.lead_id)
  }

  const dayOne = byDay.get(1)?.size ?? 0
  console.log('\nPORTAL ATTENDANCE ACROSS THE 14 DAYS')
  console.log(`Everyone who opened it at least once on day 1: ${dayOne}\n`)
  console.log('day   opened   of day 1')
  for (let d = 1; d <= 14; d++) {
    const n = byDay.get(d)?.size ?? 0
    const share = dayOne ? Math.round((n / dayOne) * 100) : 0
    const bar = '#'.repeat(Math.round(share / 4))
    console.log(` ${String(d).padStart(2)}   ${String(n).padStart(6)}   ${String(share).padStart(3)}%  ${bar}`)
  }

  // the biggest single fall between consecutive days is where to aim
  let worstDay = 0, worstFall = 0
  for (let d = 2; d <= 14; d++) {
    const fall = (byDay.get(d - 1)?.size ?? 0) - (byDay.get(d)?.size ?? 0)
    if (fall > worstFall) { worstFall = fall; worstDay = d }
  }
  if (worstDay) console.log(`\nBiggest single drop: day ${worstDay - 1} to day ${worstDay}, losing ${worstFall}.\n`)
}

main()
