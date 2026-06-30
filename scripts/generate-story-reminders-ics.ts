// Generate a single .ics calendar file with one event per scheduled IG story
// from today (2026-06-30) through launch day (2026-07-13). User double-clicks
// the .ics file on macOS to import to Calendar; events sync to iPhone via
// iCloud automatically. 5-minute alert fires before each story slot.
//
// Run: cd ~/body-recode-mvp && set -a && source .env.local && set +a && \
//        npx tsx scripts/generate-story-reminders-ics.ts

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'

const OUT = '/Users/kadedunstone/Desktop/body-recode-story-reminders.ics'
const ALERT_MINUTES = 5

interface Row {
  date: string
  time: string | null
  title: string
  graphic: string | null
  brand: string | null
}

function pad(n: number) { return n.toString().padStart(2, '0') }

// Convert "2026-06-30" + "14:00" → "20260630T140000" (Brisbane LOCAL time, no Z)
// Brisbane is AEST UTC+10 year-round (no DST).
function toIcsLocalDateTime(date: string, time: string): string {
  const [y, m, d] = date.split('-')
  const [hh, mm] = time.split(':')
  return `${y}${m}${d}T${pad(parseInt(hh))}${pad(parseInt(mm))}00`
}

function addMinutes(date: string, time: string, mins: number): { date: string; time: string } {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const totalMin = hh * 60 + mm + mins
  const newHh = Math.floor((totalMin + 24 * 60) / 60) % 24
  const newMm = ((totalMin + 24 * 60) % 60)
  // If the addition didn't cross midnight, date stays same. We never schedule across midnight, so simplify:
  if (totalMin >= 0 && totalMin < 24 * 60) {
    return { date: `${y}-${pad(m)}-${pad(d)}`, time: `${pad(newHh)}:${pad(newMm)}` }
  }
  // Cross-midnight case (rare here): bump date by one day
  const nextDate = new Date(Date.UTC(y, m - 1, d + (totalMin >= 24 * 60 ? 1 : -1)))
  return {
    date: `${nextDate.getUTCFullYear()}-${pad(nextDate.getUTCMonth() + 1)}-${pad(nextDate.getUTCDate())}`,
    time: `${pad(newHh)}:${pad(newMm)}`,
  }
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env missing')
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: rows, error } = await supabase
    .from('calendar_posts')
    .select('date, time, title, graphic, brand')
    .eq('type', 'story')
    .gte('date', '2026-06-30')
    .lte('date', '2026-07-13')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) throw error
  if (!rows || rows.length === 0) {
    console.error('No story rows in scope. Aborting.')
    process.exit(1)
  }

  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//Body Recode//Story Posting Reminders//EN')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:PUBLISH')
  lines.push('X-WR-CALNAME:Body Recode · IG Story Posting')
  lines.push('X-WR-TIMEZONE:Australia/Brisbane')

  // Brisbane timezone block (UTC+10 year-round, no DST)
  lines.push('BEGIN:VTIMEZONE')
  lines.push('TZID:Australia/Brisbane')
  lines.push('BEGIN:STANDARD')
  lines.push('DTSTART:19700101T000000')
  lines.push('TZOFFSETFROM:+1000')
  lines.push('TZOFFSETTO:+1000')
  lines.push('TZNAME:AEST')
  lines.push('END:STANDARD')
  lines.push('END:VTIMEZONE')

  let count = 0
  for (const row of rows as Row[]) {
    if (!row.time) continue
    const startDt = toIcsLocalDateTime(row.date, row.time)
    const endTime = addMinutes(row.date, row.time, 15) // 15-min "block" for the story
    const endDt = toIcsLocalDateTime(endTime.date, endTime.time)

    const title = escapeIcs(`📸 IG Story: ${row.title}`)
    const filename = row.graphic?.split('/').pop() ?? ''
    const description = escapeIcs([
      `Post this story now on @body_recode_.`,
      ``,
      `File: ${filename}`,
      `Path: ~/body-recode-mvp${row.graphic ?? ''}`,
      ``,
      `Public URL (for AirDrop / phone download):`,
      `https://bodyrecode.au${row.graphic ?? ''}`,
      ``,
      `Don't forget to add the link sticker → bodyrecode.au/challenge`,
    ].join('\n'))

    const uid = `body-recode-story-${row.date}-${row.time.replace(':', '')}-${count}@bodyrecode.au`

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:20260630T000000Z`) // arbitrary fixed stamp (creation time)
    lines.push(`DTSTART;TZID=Australia/Brisbane:${startDt}`)
    lines.push(`DTEND;TZID=Australia/Brisbane:${endDt}`)
    lines.push(`SUMMARY:${title}`)
    lines.push(`DESCRIPTION:${description}`)
    lines.push(`LOCATION:Instagram - @body_recode_`)
    lines.push(`CATEGORIES:Body Recode,Stories,Launch`)
    // Reminder: 5 minutes before
    lines.push('BEGIN:VALARM')
    lines.push('ACTION:DISPLAY')
    lines.push(`TRIGGER:-PT${ALERT_MINUTES}M`)
    lines.push(`DESCRIPTION:${title}`)
    lines.push('END:VALARM')
    lines.push('END:VEVENT')

    count++
  }

  lines.push('END:VCALENDAR')

  // .ics requires CRLF line endings
  const ics = lines.join('\r\n') + '\r\n'
  writeFileSync(OUT, ics, 'utf-8')

  console.log(`Generated ${count} story reminder events.`)
  console.log(`Date range: ${rows[0].date} → ${rows[rows.length - 1].date}`)
  console.log(`Saved to: ${OUT}`)
  console.log(`Size: ${ics.length} bytes`)
  console.log('')
  console.log('Next steps for Kade:')
  console.log('  1. Double-click the .ics file on Desktop')
  console.log('  2. macOS Calendar opens + asks which calendar to import to')
  console.log('  3. Recommend creating a new calendar "Body Recode Stories" so you can hide/show it independently')
  console.log('  4. Events sync to iPhone automatically via iCloud')
  console.log('  5. Each event fires a notification 5 min before its slot')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
