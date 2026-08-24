/**
 * The Body Decode cohort report.
 *
 *   npx tsx --env-file=.env.local scripts/decode-cohort.ts --since 2026-09-01
 *
 * WHY THIS EXISTS. The Challenge ran for two months and its central number was
 * reconstructed afterwards from gates that happened to log. Portal visits were
 * logged nowhere at all until 14 Aug. This exists so the first Body Decode
 * cohort can be read on demand instead of excavated later.
 *
 * WHAT IT ANSWERS, in the order the questions actually matter:
 *
 *   1. Did the diagnosis LAND?  accuracy on `decode_read`
 *      The product's core claim, and the only thing no funnel metric can tell
 *      us. A high completion rate on a read that does not sound like her is a
 *      WORSE result than a low one: it means we are confidently wrong.
 *   2. Did they get THROUGH?    portal opens by day
 *      The Challenge lost 14 of 15 between day 1 and day 14. This is the number
 *      the whole redesign is a bet against.
 *   3. Was it WORTH it?         NPS on `decode_day5`
 *
 * COHORT BOUNDARY, and its limitation. The Body Decode writes the same
 * `challenge_enrollments` rows as the Challenge, so there is no product column
 * to filter on. `--since` is the boundary instead, which is sound only because
 * /challenge has had no traffic since 7 Aug and /decode is the only thing being
 * pointed at. If both ever run at once this needs a real marker on the row.
 */

import { createClient } from '@supabase/supabase-js'

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

function bar(n: number, max: number, width = 28): string {
  if (max <= 0) return ''
  return '█'.repeat(Math.max(n > 0 ? 1 : 0, Math.round((n / max) * width)))
}

async function main() {
  const since = arg('since', '2026-09-01')
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  console.log(`\nTHE BODY DECODE — cohort enrolled on or after ${since}\n${'='.repeat(58)}`)

  const { data: enrolments, error } = await admin
    .from('challenge_enrollments')
    .select('id, lead_id, enrolled_at, status')
    .gte('enrolled_at', since)
    .order('enrolled_at')

  if (error) { console.error(error); return }
  const total = enrolments?.length ?? 0
  if (!total) {
    console.log('\nNo enrolments in this window yet.\n')
    return
  }
  const ids = enrolments!.map(e => e.id)
  console.log(`\nEnrolled: ${total}`)

  // ---- 2. Did they get through? -------------------------------------------
  // logPortalVisit writes one `challenge_portal_opened` per enrolment per day,
  // with the day in the note marker.
  const { data: visits } = await admin
    .from('lead_events')
    .select('notes, lead_id')
    .eq('type', 'challenge_portal_opened')
    .gte('sent_at', since)

  const byDay = new Map<number, Set<string>>()
  for (const v of visits ?? []) {
    const m = /enrollment:([\w-]+) day:(\d+)/.exec(String(v.notes ?? ''))
    if (!m || !ids.includes(m[1])) continue
    const d = Number(m[2])
    if (!byDay.has(d)) byDay.set(d, new Set())
    byDay.get(d)!.add(m[1])
  }

  console.log(`\nHOW FAR THEY GOT  (unique people opening the portal on each day)`)
  console.log(`  Challenge baseline: day 1 to day 14 kept 1 of 15, about 7%.\n`)
  const d1 = byDay.get(1)?.size ?? 0
  for (let d = 1; d <= 5; d++) {
    const n = byDay.get(d)?.size ?? 0
    const pct = d1 ? Math.round((n / d1) * 100) : 0
    console.log(`  Day ${d}  ${String(n).padStart(3)}  ${String(pct).padStart(3)}% of day 1  ${bar(n, d1)}`)
  }
  const beyond = [...byDay.entries()].filter(([d]) => d > 5).reduce((a, [, s]) => a + s.size, 0)
  if (beyond) console.log(`  (${beyond} opens after day 5)`)

  // ---- 1 & 3. Feedback ----------------------------------------------------
  const { data: fb } = await admin
    .from('feedback_responses')
    .select('moment, accuracy_score, nps_score, response_text, created_at')
    .in('moment', ['decode_read', 'decode_day5'])
    .gte('created_at', since)
    .order('created_at')

  const reads = (fb ?? []).filter(f => f.moment === 'decode_read')
  const day5s = (fb ?? []).filter(f => f.moment === 'decode_day5')

  console.log(`\nDID THE DIAGNOSIS LAND?  accuracy 1-5, n=${reads.length}`)
  if (!reads.length) {
    console.log('  Nothing yet.')
  } else {
    const counts = [1, 2, 3, 4, 5].map(v => reads.filter(r => r.accuracy_score === v).length)
    const max = Math.max(...counts)
    counts.forEach((n, i) => console.log(`  ${i + 1}  ${String(n).padStart(3)}  ${bar(n, max)}`))
    const scored = reads.filter(r => typeof r.accuracy_score === 'number')
    const avg = scored.reduce((a, r) => a + (r.accuracy_score as number), 0) / (scored.length || 1)
    const landed = scored.filter(r => (r.accuracy_score as number) >= 4).length
    console.log(`  avg ${avg.toFixed(2)} · ${landed} of ${scored.length} scored 4+`)
    console.log(`  READ THE 1s AND 2s FIRST. A miss tells you more than a hit.`)
  }

  console.log(`\nWAS IT WORTH IT?  recommend 0-10, n=${day5s.length}`)
  if (!day5s.length) {
    console.log('  Nothing yet.')
  } else {
    const scored = day5s.filter(r => typeof r.nps_score === 'number')
    const prom = scored.filter(r => (r.nps_score as number) >= 9).length
    const det = scored.filter(r => (r.nps_score as number) <= 6).length
    const avg = scored.reduce((a, r) => a + (r.nps_score as number), 0) / (scored.length || 1)
    console.log(`  avg ${avg.toFixed(1)} · promoters ${prom} · detractors ${det}`)
    if (scored.length < 10) console.log(`  n is small. Read the sentences, do not compute an NPS from ${scored.length}.`)
  }

  const withText = (fb ?? []).filter(f => f.response_text?.trim())
  if (withText.length) {
    console.log(`\nWHAT THEY SAID  (${withText.length})`)
    for (const f of withText) {
      const tag = f.moment === 'decode_read' ? `read ${f.accuracy_score ?? '-'}/5` : `day5 ${f.nps_score ?? '-'}/10`
      console.log(`\n  [${tag}] ${f.response_text!.trim()}`)
    }
  }
  console.log('')
}

main()
