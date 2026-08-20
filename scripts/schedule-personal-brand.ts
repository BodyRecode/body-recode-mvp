// Refill the @kade_dunstone_ calendar from the finished back catalogue.
//
// The account went quiet on 8 August with 71 completed posts sitting behind a
// manual-publishing gate. Publishing is automated as of 20 Aug, so the only
// thing still missing is rows on future dates.
//
// What it skips, and why each one matters:
//   - time-bound copy ("tomorrow", "doors open", "last chance"). Re-running a
//     launch post months later reads as a mistake and burns trust.
//   - anything referencing the AI Co-Founder Method, retired 20 Aug.
//   - prelaunch-type posts, same reason.
//   - anything still pointing at a live-render graphic Meta cannot fetch.
//
// Weighting follows the pillar split set in the brand strategy: coaching leads
// at four in ten. `coach` and `pattern` types carry the coaching angle, so the
// picker takes those first and fills the rest around them.
//
// DRY RUN BY DEFAULT. Pass --commit to write.
//   npx tsx --env-file=.env.local scripts/schedule-personal-brand.ts
//   npx tsx --env-file=.env.local scripts/schedule-personal-brand.ts --commit
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const commit = process.argv.includes('--commit')
const weeksArg = process.argv.find(a => a.startsWith('--weeks='))
const WEEKS = weeksArg ? Number(weeksArg.split('=')[1]) : 4

const TIME_BOUND = /\btomorrow\b|\btoday\b|\bthis week\b|\bopens\b|\bopening\b|\blaunch(es|ing)?\b|\bdoors\b|\bclosing\b|\blast chance\b|\bspots?\b|\bwaitlist\b|\bnext week\b/i
const RETIRED = /co-?founder|aicm/i
const POST_TIME = '07:00'          // Brisbane
const DAYS = [1, 3, 5, 0]          // Mon, Wed, Fri, Sun

// Coaching-flavoured types lead, per the 4/2/2/2 pillar split.
const COACHING = new Set(['coach', 'pattern'])

function nextDates(count: number): string[] {
  const out: string[] = []
  const d = new Date()
  d.setDate(d.getDate() + 1)       // start tomorrow
  while (out.length < count) {
    if (DAYS.includes(d.getDay())) out.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return out
}

async function main() {
  const { data } = await db.from('calendar_posts')
    .select('id, date, type, title, caption, graphic')
    .eq('brand', 'personal_brand').eq('platform', 'instagram')
    .is('posted_at', null).order('date', { ascending: true })

  const all = (data ?? []) as Array<{ id: string; date: string; type: string | null; title: string | null; caption: string | null; graphic: string | null }>

  const usable = all.filter(p => {
    const text = `${p.title ?? ''} ${p.caption ?? ''}`
    if (!p.caption?.trim() || !p.graphic?.trim()) return false
    if (p.graphic.includes('/api/content/graphic')) return false
    if (TIME_BOUND.test(text) || RETIRED.test(text)) return false
    if (p.type === 'prelaunch') return false
    return true
  })

  const slots = nextDates(WEEKS * DAYS.length)

  // Interleave so coaching leads without the feed becoming one long block of it.
  const coaching = usable.filter(p => COACHING.has(p.type ?? ''))
  const other = usable.filter(p => !COACHING.has(p.type ?? ''))
  const picked: typeof usable = []
  while (picked.length < slots.length && (coaching.length || other.length)) {
    // 4 coaching : 6 other, per ten
    for (let i = 0; i < 2 && coaching.length && picked.length < slots.length; i++) picked.push(coaching.shift()!)
    for (let i = 0; i < 3 && other.length && picked.length < slots.length; i++) picked.push(other.shift()!)
  }

  console.log(`\n${all.length} unposted  ->  ${usable.length} usable  ->  scheduling ${picked.length} over ${WEEKS} weeks\n`)
  console.log('date        day  time   type        title')
  console.log('-'.repeat(78))

  const updates: Array<{ id: string; date: string; iso: string }> = []
  picked.forEach((p, i) => {
    const date = slots[i]
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${date}T00:00:00`).getDay()]
    const iso = new Date(`${date}T${POST_TIME}:00+10:00`).toISOString()
    console.log(`${date}  ${day}  ${POST_TIME}  ${String(p.type ?? '').padEnd(10)}  ${String(p.title ?? '').slice(0, 44)}`)
    updates.push({ id: p.id, date, iso })
  })

  if (!commit) {
    console.log(`\nDRY RUN. Nothing written. Re-run with --commit to schedule.`)
    console.log(`Leftover in the bank after this: ${usable.length - picked.length} posts.\n`)
    return
  }

  for (const u of updates) {
    const { error } = await db.from('calendar_posts')
      .update({ date: u.date, time: POST_TIME, scheduled_publish_at: u.iso, publish_error: null, publish_attempts: 0 })
      .eq('id', u.id)
    if (error) console.log(`  FAILED ${u.date}: ${error.message}`)
  }
  console.log(`\nScheduled ${updates.length} posts. First goes out ${updates[0].date} at ${POST_TIME} Brisbane.`)
  console.log(`${usable.length - picked.length} posts left in the bank.`)
  console.log(`\nTo stop any of them: clear scheduled_publish_at on the row in the Content Calendar.`)
}

main()
