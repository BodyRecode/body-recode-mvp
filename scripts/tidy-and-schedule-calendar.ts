// Two jobs, so the calendar stops being a wall of missed posts and the finished
// work actually goes out without Kade touching it.
//
//   PARK   Past-dated posts that never published and never can. They keep their
//          copy and graphics, get a BANKED prefix so they read as parked rather
//          than failed, and move to phase='banked' so campaign audits ignore
//          them. Nothing is deleted.
//
//   ARM    Future-dated posts that are genuinely ready get scheduled_publish_at
//          set, which is what igPublisherCron looks for.
//
// ARM IS DELIBERATELY STRICT. The cron does not check for placeholder graphics
// and does not read video_url, so it would happily publish a "TO FILM" card as
// an image post. A row is only armed when it has a real, non-placeholder image
// and a caption. Unfilmed reels stay drafts and cannot fire.
//
// Brisbane is UTC+10 with no DST, so times are built with an explicit +10:00
// offset rather than the machine's locale.
//
// Run: npx tsx --env-file=.env.local scripts/tidy-and-schedule-calendar.ts [--dry]
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DRY = process.argv.includes('--dry')
const NOW = new Date()

const brisbane = (date: string, time: string | null) =>
  new Date(`${date}T${(time ?? '07:00').slice(0, 5)}:00+10:00`)

/** Ready = a real image we can hand to Meta, plus words. */
function readiness(row: any): { ready: boolean; why: string } {
  const g = (row.graphic ?? '').trim()
  if (!g) return { ready: false, why: 'no graphic' }
  if (g.includes('PLACEHOLDER')) return { ready: false, why: 'not filmed yet' }
  if (g.includes('/api/content/graphic')) return { ready: false, why: 'live-render graphic, cron cannot use it' }
  if (!g.startsWith('/') && !g.startsWith('http')) return { ready: false, why: 'graphic is not a path' }
  if (!(row.caption ?? '').trim()) return { ready: false, why: 'no caption' }
  if (row.video_url) return { ready: false, why: 'reel - cron publishes images only, needs the video path' }
  return { ready: true, why: '' }
}

async function main() {
  const { data, error } = await db.from('calendar_posts')
    .select('id, date, time, type, title, caption, graphic, video_url, phase, scheduled, scheduled_publish_at, posted_at')
    .eq('brand', 'body_recode').eq('platform', 'instagram').neq('type', 'story')
    .order('date')
  if (error) { console.log('ERROR', error.message); return }

  const parked: string[] = [], armed: string[] = [], held: string[] = []

  for (const r of data ?? []) {
    if (r.posted_at) continue
    const when = brisbane(r.date, r.time)

    // ---- PARK: in the past, never published, can never publish now.
    if (when < NOW) {
      if (r.phase === 'banked' || (r.title ?? '').startsWith('BANKED ·')) continue
      parked.push(`  ${r.date}  ${(r.title ?? '').slice(0, 58)}`)
      if (!DRY) {
        await db.from('calendar_posts').update({
          title: `BANKED · ${r.title ?? ''}`.slice(0, 300),
          phase: 'banked',
          scheduled: false,
          scheduled_publish_at: null,
          publish_error: null,
        }).eq('id', r.id)
      }
      continue
    }

    // ---- ARM: future, genuinely ready, and safe to fire unattended.
    //
    // The Membership launch arc is deliberately excluded. Those posts announce a
    // product going live around 7 Sep; auto-publishing a launch announcement is a
    // business decision, not a content chore, and it is not reversible once it is
    // on the account. Kade arms those himself when he confirms the launch date.
    if (r.phase === 'membership_launch') {
      held.push(`  ${r.date}  ${(r.title ?? '').slice(0, 46)}  — Membership launch, needs your say-so`)
      continue
    }

    const { ready, why } = readiness(r)
    if (!ready) { held.push(`  ${r.date}  ${(r.title ?? '').slice(0, 46)}  — ${why}`); continue }
    if (r.scheduled_publish_at) { held.push(`  ${r.date}  already scheduled`); continue }

    armed.push(`  ${r.date} ${(r.time ?? '07:00').slice(0, 5)}  ${(r.title ?? '').slice(0, 58)}`)
    if (!DRY) {
      await db.from('calendar_posts').update({
        scheduled: true,
        scheduled_publish_at: when.toISOString(),
        publish_error: null,
      }).eq('id', r.id)
    }
  }

  const head = DRY ? '[dry run] ' : ''
  console.log(`\n${head}PARKED (${parked.length}) — kept in full, marked so they don't read as failures`)
  console.log(parked.join('\n') || '  none')
  console.log(`\n${head}SCHEDULED (${armed.length}) — these will now publish on their own`)
  console.log(armed.join('\n') || '  none')
  console.log(`\nHELD BACK (${held.length}) — deliberately not scheduled`)
  console.log(held.join('\n') || '  none')
}
main()
