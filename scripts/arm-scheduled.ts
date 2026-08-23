// Give every future post that is FLAGGED scheduled the timestamp that actually
// makes it publish.
//
// Written 24 Aug 2026. `scheduled` is a flag the dashboard reads. The publisher
// selects on scheduled_publish_at being set and in the past. Setting one without
// the other produces a post that looks queued on every surface and never runs.
//
// The entire personal-brand queue was in that state: 11 posts flagged scheduled,
// none armed, which is why only one ever published. All 23 September Body Recode
// posts were loaded the same way on 23 Aug.
//
// Only touches posts in the FUTURE. Back-dating a publish time makes the next
// cron tick fire old content immediately, which is a decision for a person.
//
// Run: npx tsx --env-file=.env.local scripts/arm-scheduled.ts [--apply]
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const APPLY = process.argv.includes('--apply')

async function main() {
  // BRISBANE DATE, NOT UTC. toISOString() is UTC, and at 9am in Brisbane that is
  // still yesterday, so the first version of this offered to arm a post whose
  // 07:00 slot had already passed. Arming a past time makes the next cron tick
  // fire it immediately, which is the one thing this script must not do by itself.
  const today = new Date(Date.now() + 10 * 3600_000).toISOString().slice(0, 10)
  const { data } = await db.from('calendar_posts')
    .select('id, date, time, brand, title')
    .eq('scheduled', true).is('scheduled_publish_at', null).is('posted_at', null)
    .gt('date', today).order('date')

  const rows = data ?? []
  if (!rows.length) return console.log('  nothing to arm')

  // Brisbane is UTC+10, no daylight saving. Two posts on one day at one time
  // would collide, so the second moves to the afternoon slot.
  const taken = new Set<string>()
  const plan = rows.map(r => {
    const NEXT_SLOT: Record<string, string> = { '07:00': '12:30', '12:30': '17:30', '17:30': '19:30' }
    let time = (r.time ?? '07:00').slice(0, 5)
    while (taken.has(`${r.date} ${time}`)) {
      time = NEXT_SLOT[time] ?? '19:30'
    }
    taken.add(`${r.date} ${time}`)
    return { ...r, at: `${r.date}T${time}:00+10:00`, moved: time !== (r.time ?? '').slice(0, 5) }
  })

  const past = plan.filter(p => new Date(p.at) <= new Date())
  if (past.length) {
    console.log(`  REFUSING: ${past.length} of these are already in the past and would fire on the next tick.`)
    for (const p of past) console.log(`    ${p.date} ${p.at.slice(11, 16)}  ${p.title}`)
    return
  }

  for (const p of plan) {
    console.log(`  ${p.date} ${p.at.slice(11, 16)}${p.moved ? ' (moved)' : '        '} ${String(p.brand).padEnd(14)} ${String(p.title).slice(0, 40)}`)
  }
  if (!APPLY) return console.log(`\n  ${plan.length} would be armed. Re-run with --apply.`)

  for (const p of plan) {
    const { error } = await db.from('calendar_posts').update({ scheduled_publish_at: p.at }).eq('id', p.id)
    if (error) return console.log(`  ERROR ${error.message}`)
  }
  console.log(`\n  armed ${plan.length} posts`)
}
main()
