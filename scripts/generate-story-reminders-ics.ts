// Generate a one-off .ics file of IG story posting reminders for a date range,
// saved to the Desktop. This is the manual-import fallback; the primary path is
// now the LIVE subscription feed at /api/calendar/feed/stories (subscribe once,
// updates flow in automatically). Both share src/lib/story-reminders-ics.ts so
// they render identically.
//
// Date range defaults to today (Brisbane) through +90 days. Override:
//   npx tsx scripts/generate-story-reminders-ics.ts 2026-07-27 2026-08-23
//
// Run: cd ~/body-recode-mvp && set -a && source .env.local && set +a && \
//        npx tsx scripts/generate-story-reminders-ics.ts

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { buildStoryRemindersIcs, type StoryRow } from '../src/lib/story-reminders-ics'

// Brisbane is UTC+10 year-round (no DST).
function brisbaneToday(): string {
  const nowBrisbane = new Date(Date.now() + 10 * 60 * 60 * 1000)
  return nowBrisbane.toISOString().slice(0, 10)
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

const START_DATE = process.argv[2] ?? brisbaneToday()
const END_DATE = process.argv[3] ?? addDays(START_DATE, 90)
const OUT = `/Users/kadedunstone/Desktop/body-recode-story-reminders-${START_DATE}-to-${END_DATE}.ics`

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env missing')
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: rows, error } = await supabase
    .from('calendar_posts')
    .select('date, time, title, caption, graphic')
    .eq('type', 'story')
    .eq('brand', 'body_recode')
    .gte('date', START_DATE)
    .lte('date', END_DATE)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) throw error
  if (!rows || rows.length === 0) {
    console.error(`No Body Recode story rows between ${START_DATE} and ${END_DATE}. Aborting.`)
    process.exit(1)
  }

  const ics = buildStoryRemindersIcs(rows as StoryRow[])
  writeFileSync(OUT, ics, 'utf-8')

  const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length
  console.log(`Generated ${eventCount} story reminder events (${rows[0].date} → ${rows[rows.length - 1].date}).`)
  console.log(`Saved to: ${OUT}`)
  console.log('Every event has a 5-minute alert.')
  console.log('')
  console.log('Preferred path is the live feed (subscribe once): /api/calendar/feed/stories?key=...')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
