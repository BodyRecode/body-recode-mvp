// Re-point the Week A reel rows at the CURRENT reel scripts doc.
//
// The scripts were rewritten from scratch at v3.0 (lectures -> reads, real
// scorecard data, named formats) and again at v3.1 (endings). The calendar rows
// were seeded from v2.0 and still carried the old copy, which meant two defects
// were sitting in the calendar waiting to be published:
//
//   Wed 12 Aug  typed the Fat Map on LOCATION ALONE ("front of the midsection,
//               that is cortisol"), the exact thing Fat Map v2.0 was locked on
//               31 Jul to prevent.
//   Sun 16 Aug  claimed "nothing to buy at the end of it", which Blueprint
//               going live on 3 Aug makes untrue.
//
// The script doc is the single source of truth. This reads it and writes the
// rows, so the two can never drift again. Re-run it after any script edit.
//
// Run: cd ~/body-recode-mvp && npx tsx --env-file=.env.local \
//        scripts/sync-reel-rows-from-scripts.ts [--dry]

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const SCRIPTS_MD = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_MARKETING/03_ORGANIC_INSTAGRAM/BR_REEL_SCRIPTS_WEEK1.md'
const DRY = process.argv.includes('--dry')

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Everything the row needs that isn't derivable from the script prose.
// `job` drives the caption ending: the content engine's split-the-job rule says
// a post either earns engagement or earns a click, never both.
const DAYS = [
  {
    key: 'Mon', date: '2026-08-10',
    title: 'Mon Authority · REEL · State of the Data · 92 scorecards, training scored highest',
    format: 'State of the Data',
    job: 'engagement' as const,
    notes: 'REEL 1 of 5. Format: State of the Data. Pairs with Ad 5. On screen: the five section names as a REAL bar chart, training tallest, sleep shortest - credibility is in it looking like data. NO LINK, engagement-first. Numbers are live from scripts/state-of-the-data.ts - re-run before filming and say the new number if it moved.',
  },
  {
    key: 'Tue', date: '2026-08-11',
    title: 'Tue Contrarian · REEL · The Autopsy · eat less move more is right about one in four',
    format: 'The Autopsy',
    job: 'engagement' as const,
    notes: 'REEL 2 of 5. Format: The Autopsy. On screen: one tick, three crosses. The last two lines are the whole reel - do not flatten or rush them. NO LINK, engagement-first.',
  },
  {
    key: 'Wed', date: '2026-08-12',
    title: 'Wed Pattern · REEL · What Your Fat Storage Says · two of four (comment MAP)',
    format: 'What Your ___ Says',
    job: 'comment' as const,
    notes: 'REEL 3 of 5. THE MOST IMPORTANT POST OF THE WEEK. Comment-to-DM keyword MAP - reply to every commenter, each one is a warm-audience member and a DM conversation. Deliberately covers only TWO of the four pairs; the other two are the DM reward and "one that isn\'t a place at all" is the line that earns the comment. On screen: body diagram, and show the SIGNAL as text beside each zone, not just the zone. Pairs with Ad 2. THE MANYCHAT MAP REPLY MUST CARRY THE OESTROGEN TWO-PHASE SPLIT AND THE MALE ANDROGEN PAIR WITH THEIR DISCRIMINATORS.',
  },
  {
    key: 'Fri', date: '2026-08-14',
    title: 'Fri Coach · REEL · React to DMs · "clean food, training, no results for months"',
    format: 'React to DMs',
    job: 'share' as const,
    notes: 'REEL 4 of 5. Format: React to DMs. Built on a REAL intake quote - Kade to confirm using a private submission verbatim, paraphrase alternative is in the script doc. On screen: the quote as plain text on black for the first six seconds, then face. Nothing else. Strongest script of the five.',
  },
  {
    key: 'Sun', date: '2026-08-16',
    title: 'Sun Promo · REEL · The Read · 51% come out Transitioning',
    format: 'The Read',
    job: 'click' as const,
    notes: 'REEL 5 of 5. Format: The Read. The ONE click-first reel of the week - this is the only one that gets the link. Opens on a real read of the audience (51% Transitioning, 17% Ready) rather than on the offer. Ends on the cost of staying still, not on the price.',
  },
]

/** Pull a day's spoken lines and its spoken CTA out of the scripts doc. */
function parseDay(md: string, key: string) {
  const parts = md.split(/\n## (Mon|Tue|Wed|Fri|Sun) /)
  for (let i = 1; i < parts.length; i += 2) {
    if (parts[i] !== key) continue
    const body = parts[i + 1].split('\n---')[0]
    // Blockquote lines are the spoken script. Blank '>' lines separate beats.
    const beats: string[] = []
    let cur: string[] = []
    for (const line of body.split('\n')) {
      if (!line.startsWith('>')) continue
      const t = line.replace(/^>\s?/, '').trim()
      if (!t) { if (cur.length) { beats.push(cur.join(' ')); cur = [] } }
      else cur.push(t)
    }
    if (cur.length) beats.push(cur.join(' '))
    const cta = [...body.matchAll(/\*\*CTA, spoken:\*\* "([^"]+)"/g)].map(m => m[1])[0] ?? null
    return { beats, cta }
  }
  return null
}

async function main() {
  const md = readFileSync(SCRIPTS_MD, 'utf8')
  let changed = 0

  for (const d of DAYS) {
    const parsed = parseDay(md, d.key)
    if (!parsed || !parsed.beats.length) { console.log(`SKIP ${d.key}: not found in scripts doc`); continue }

    // The caption is the spoken script as prose, then the ask. Same words the
    // viewer hears, so a muted viewer reading the caption gets the identical read.
    const caption = `${parsed.beats.join('\n\n')}\n\n${parsed.cta ?? ''}`.trim()

    // MUST filter on phase AND platform. Retired content plans (phase='scale')
    // left stale rows on some of these dates, and without the filter this picked
    // whichever row came back first - on 14 Aug that was the dead scale row, so
    // the live campaign row kept its superseded copy and a retired row got
    // overwritten. Never address a calendar row by date alone.
    const { data: rows } = await db.from('calendar_posts')
      .select('id, caption, title, scheduled, phase')
      .eq('brand', 'body_recode').eq('platform', 'instagram')
      .eq('phase', 'ads').neq('type', 'story').eq('date', d.date)

    if (!rows?.length) { console.log(`SKIP ${d.key} ${d.date}: no phase=ads calendar row`); continue }
    if (rows.length > 1) { console.log(`SKIP ${d.key} ${d.date}: ${rows.length} ads rows, ambiguous - resolve by hand`); continue }
    const row = rows[0]
    if (row.scheduled) { console.log(`SKIP ${d.key} ${d.date}: already SCHEDULED, refusing to overwrite`); continue }

    const same = row.caption?.trim() === caption && row.title === d.title
    console.log(`\n${d.key} ${d.date}  ${same ? 'already current' : 'UPDATING'}`)
    if (same) continue

    console.log(`  title:  ${d.title}`)
    console.log(`  format: ${d.format}   job: ${d.job}`)
    console.log(`  opens:  ${parsed.beats[0].slice(0, 90)}...`)
    console.log(`  ends:   ...${parsed.beats[parsed.beats.length - 1].slice(-80)}`)
    console.log(`  cta:    ${parsed.cta ?? '(none)'}`)

    if (!DRY) {
      const { error } = await db.from('calendar_posts')
        .update({ title: d.title, caption, notes: `REEL · ${d.notes}` })
        .eq('id', row.id)
      if (error) { console.log(`  ERROR ${error.message}`); continue }
    }
    changed++
  }

  console.log(`\n${DRY ? '[dry run] ' : ''}${changed} reel rows re-pointed at the current scripts.`)
  if (!DRY && changed) console.log('Captions now match the doc. Re-run after any script edit.')
}
main()
