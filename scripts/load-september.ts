// Put September's approved posts on the calendar.
//
// The rows come from emit_sept_calendar.py, which reads sept_content.py and the
// schedule and produces exactly what the 50 cards were rendered from. Nothing is
// retyped here, so the calendar cannot disagree with the contact sheet.
//
// THE 11 VIDEO POSTS GO ON UNSCHEDULED. Filming is 30-31 Aug and a scheduled post
// with no video is a publish failure waiting to happen. They sit as drafts so the
// month reads correctly and get switched on when the takes land.
//
// Refuses to run if September already has posts: this writes, it does not merge.
// Back up first with backup-calendar.ts. Restore with calendar-restore.ts.
//
// Run: npx tsx --env-file=.env.local scripts/load-september.ts [--dry]
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DRY = process.argv.includes('--dry')

async function main() {
  const rows = JSON.parse(readFileSync('/tmp/sept_rows.json', 'utf8')) as Array<Record<string, unknown>>

  const { data: existing } = await db.from('calendar_posts')
    .select('id, date, title').eq('brand', 'body_recode').eq('platform', 'instagram')
    .neq('type', 'story').gte('date', '2026-09-01').lte('date', '2026-09-30')
  if (existing?.length) {
    console.log(`REFUSING: September already has ${existing.length} posts. This writes, it does not merge.`)
    for (const e of existing.slice(0, 5)) console.log(`  ${e.date}  ${e.title}`)
    return
  }

  const sched = rows.filter(r => r.scheduled).length
  console.log(`${rows.length} rows: ${sched} scheduled, ${rows.length - sched} video drafts`)
  if (DRY) { for (const r of rows) console.log(`  ${r.date} ${r.time}  ${r.scheduled ? 'SCHED' : 'draft'}  ${r.title}`); return }

  const { error } = await db.from('calendar_posts').insert(rows)
  if (error) { console.log(`ERROR ${error.message}`); return }
  console.log(`loaded ${rows.length} posts`)
}
main()
