/**
 * Body Recode IG story posting reminders → iCalendar (.ics).
 *
 * Shared builder used by BOTH:
 *   - the live subscription feed  (src/app/api/calendar/feed/stories/route.ts)
 *   - the one-off Desktop file    (scripts/generate-story-reminders-ics.ts)
 * so the two can never drift.
 *
 * Each story slot becomes one all-info reminder with a 5-minute alert. The
 * SUMMARY (what the alert shows) carries the slot (e.g. 3/4), the story kind,
 * and the caption; the body repeats the caption plus the graphic download URL
 * and the correct link-sticker destination.
 *
 * Brisbane is AEST UTC+10 year-round (no DST).
 */

const ALERT_MINUTES = 5
const LINK_CHALLENGE = 'bodyrecode.au/challenge'
const LINK_BLUEPRINT = 'bodyrecode.au/blueprint'

export interface StoryRow {
  date: string // "2026-07-30"
  time: string | null // "17:00"
  title: string // "Blueprint · W3 4"
  caption: string | null
  graphic: string | null // "/stories/filled/story_xxx.png"
}

/** "Hook · W3 1" -> "Hook". The "W3 1" suffix is an internal week/slot code. */
function storyKind(title: string): string {
  return (title || 'Story').split('·')[0].trim() || 'Story'
}

/** Blueprint stories drive to /blueprint; everything else to /challenge. */
function linkSticker(kind: string): string {
  return kind.toLowerCase().includes('blueprint') ? LINK_BLUEPRINT : LINK_CHALLENGE
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

/** "2026-06-30" + "14:00" -> "20260630T140000" (Brisbane LOCAL time, no Z). */
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
  const newMm = (totalMin + 24 * 60) % 60
  if (totalMin >= 0 && totalMin < 24 * 60) {
    return { date: `${y}-${pad(m)}-${pad(d)}`, time: `${pad(newHh)}:${pad(newMm)}` }
  }
  const nextDate = new Date(Date.UTC(y, m - 1, d + (totalMin >= 24 * 60 ? 1 : -1)))
  return {
    date: `${nextDate.getUTCFullYear()}-${pad(nextDate.getUTCMonth() + 1)}-${pad(nextDate.getUTCDate())}`,
    time: `${pad(newHh)}:${pad(newMm)}`,
  }
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/**
 * Build the full VCALENDAR string (CRLF-terminated) from story rows. Rows should
 * already be filtered/sorted (date asc, time asc); rows without a time are skipped.
 *
 * `refreshMinutes` adds REFRESH-INTERVAL so subscribed clients re-pull on their
 * own — set it for the live feed, omit it for a one-off imported file.
 */
export function buildStoryRemindersIcs(
  rows: StoryRow[],
  opts?: { calName?: string; refreshMinutes?: number },
): string {
  const calName = opts?.calName ?? 'Body Recode · IG Story Posting'

  // Number each story within its day (1/3, 2/3, 3/3) from the time order.
  const perDayTotal: Record<string, number> = {}
  for (const r of rows) if (r.time) perDayTotal[r.date] = (perDayTotal[r.date] ?? 0) + 1
  const perDaySeen: Record<string, number> = {}

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Body Recode//Story Posting Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:Australia/Brisbane',
  ]
  if (opts?.refreshMinutes) {
    lines.push(`REFRESH-INTERVAL;VALUE=DURATION:PT${opts.refreshMinutes}M`)
    lines.push(`X-PUBLISHED-TTL:PT${opts.refreshMinutes}M`)
  }

  // Brisbane timezone block (UTC+10 year-round, no DST)
  lines.push(
    'BEGIN:VTIMEZONE',
    'TZID:Australia/Brisbane',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+1000',
    'TZOFFSETTO:+1000',
    'TZNAME:AEST',
    'END:STANDARD',
    'END:VTIMEZONE',
  )

  for (const row of rows) {
    if (!row.time) continue
    const startDt = toIcsLocalDateTime(row.date, row.time)
    const endTime = addMinutes(row.date, row.time, 15) // 15-min "block"
    const endDt = toIcsLocalDateTime(endTime.date, endTime.time)

    const kind = storyKind(row.title)
    const caption = row.caption?.trim() || ''
    const slotIdx = (perDaySeen[row.date] = (perDaySeen[row.date] ?? 0) + 1)
    const slotTotal = perDayTotal[row.date] ?? slotIdx

    const summaryText = caption
      ? `📸 Story ${slotIdx}/${slotTotal} · ${kind}: ${caption}`
      : `📸 Story ${slotIdx}/${slotTotal} · ${kind}`
    const title = escapeIcs(summaryText)

    const filename = row.graphic?.split('/').pop() ?? ''
    const description = escapeIcs(
      [
        `${kind} story — post ${slotIdx} of ${slotTotal} today on @body_recode_.`,
        ``,
        `ON-STORY TEXT:`,
        caption || '(see graphic)',
        ``,
        `GRAPHIC: ${filename}`,
        `Download to phone: https://bodyrecode.au${row.graphic ?? ''}`,
        ``,
        `Add the link sticker → ${linkSticker(kind)}`,
      ].join('\n'),
    )

    // UID keyed on date+time ONLY so an inserted slot never shifts other UIDs;
    // subscribers update events in place instead of duplicating.
    const uid = `body-recode-story-${row.date}-${row.time.replace(':', '')}@bodyrecode.au`

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:20260630T000000Z`,
      `DTSTART;TZID=Australia/Brisbane:${startDt}`,
      `DTEND;TZID=Australia/Brisbane:${endDt}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:Instagram - @body_recode_`,
      `CATEGORIES:Body Recode,Stories`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `TRIGGER:-PT${ALERT_MINUTES}M`,
      `DESCRIPTION:${title}`,
      'END:VALARM',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
