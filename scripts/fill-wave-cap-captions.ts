// Add wave-1 founding-member CTA + waitlist mention to the pre-launch
// captions (Jul 4-12). Replaces the generic "doors open 13 July" CTA
// across the existing captions with the explicit "Wave 1 = 50 founding
// member spots, join the waitlist now" framing.
//
// Per the strategic decision documented in project_funnel_b_wave_cap_strategy:
// pre-launch posts route to waitlist; launch-day onwards route to direct enrol.
//
// Run: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/fill-wave-cap-captions.ts

import { createClient } from '@supabase/supabase-js'

interface CaptionUpdate {
  date: string
  titleLike: string
  appendBlock: string // appended above the hashtag line
}

// Wave-aware extension blocks. Appended to the existing caption between the
// last paragraph and the hashtag line. Idempotent: only inserts if "Wave 1"
// is not already in the caption.
const WAVE_BLOCK_PRELAUNCH = `

Wave 1 opens Monday 13 July - 50 founding member spots. Join the waitlist now and we will text you the moment doors open.`

const WAVE_BLOCK_LAUNCH_DAY = `

Wave 1 is live. 50 founding member spots, first 50 to enrol get in. Doors close when full.`

const WAVE_BLOCK_LAUNCH_WEEK = `

Wave 1 (50 founding member spots) is live. Once it fills, Wave 2 opens. Take a spot now or join the waitlist for the next wave.`

const updates: CaptionUpdate[] = [
  // Pre-launch (Jul 1-12) - "join the waitlist now"
  { date: '2026-07-01', titleLike: '%Launch tease%decoded%',                            appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-01', titleLike: "%Stuck isn't a discipline problem%",                appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-03', titleLike: '%perimenopause plan%',                              appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-03', titleLike: '%20 years coaching%origin%',                        appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-04', titleLike: '%After 20 years of coaching%built first%',          appendBlock: WAVE_BLOCK_PRELAUNCH }, // personal brand
  { date: '2026-07-05', titleLike: '%Three years postnatal%',                           appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-05', titleLike: '%Date reveal%I built something%',                   appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-06', titleLike: '%At 45 your body runs%',                            appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-06', titleLike: '%Full Challenge reveal%',                           appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-07', titleLike: '%most disciplined person%',                         appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-07', titleLike: '%Why I am running this for free%',                  appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-08', titleLike: '%wired, tired, holding weight%',                    appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-08', titleLike: '%Inside the Challenge%',                            appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-08', titleLike: '%read comes before the prescription%',              appendBlock: WAVE_BLOCK_PRELAUNCH }, // personal brand
  { date: '2026-07-10', titleLike: '%mums I coach%',                                    appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-10', titleLike: '%Blueprint tease%',                                 appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-11', titleLike: '%body you had%body you have now%',                  appendBlock: WAVE_BLOCK_PRELAUNCH }, // personal brand
  { date: '2026-07-12', titleLike: '%every protocol%',                                  appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-12', titleLike: '%Tomorrow%urgency%',                                appendBlock: WAVE_BLOCK_PRELAUNCH },
  { date: '2026-07-12', titleLike: '%14-Day Body Decode opens%',                        appendBlock: WAVE_BLOCK_PRELAUNCH }, // personal brand

  // Launch day (Jul 13)
  { date: '2026-07-13', titleLike: '%Cortisol decides%',                                appendBlock: WAVE_BLOCK_LAUNCH_DAY },

  // Launch week (Jul 14-15) - blend of urgency + waitlist
  { date: '2026-07-14', titleLike: '%More cardio in perimenopause%',                    appendBlock: WAVE_BLOCK_LAUNCH_WEEK },
  { date: '2026-07-15', titleLike: '%More training, less food%',                        appendBlock: WAVE_BLOCK_LAUNCH_WEEK },
  { date: '2026-07-15', titleLike: '%Doors open%14-day read%',                          appendBlock: WAVE_BLOCK_LAUNCH_WEEK },
]

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env missing')
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const seen = new Set<string>()
  let updated = 0, skipped = 0, notFound = 0

  for (const { date, titleLike, appendBlock } of updates) {
    const { data: rows, error } = await supabase
      .from('calendar_posts')
      .select('id, title, caption, type')
      .eq('date', date)
      .neq('type', 'story')
      .ilike('title', titleLike)
    if (error) { console.error(`[!] query ${date} / ${titleLike}:`, error.message); continue }
    if (!rows || !rows.length) { console.log(`[-] not found: ${date} / ${titleLike}`); notFound++; continue }
    for (const row of rows) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      const existing = row.caption ?? ''
      if (/Wave 1/i.test(existing)) {
        console.log(`[=] already has Wave mention: ${date} / "${row.title.slice(0, 50)}..."`)
        skipped++
        continue
      }
      // Insert append block before the first hashtag line (or at end)
      const hashtagIdx = existing.search(/\n\n#\w/)
      const newCaption = hashtagIdx > 0
        ? existing.slice(0, hashtagIdx) + appendBlock + existing.slice(hashtagIdx)
        : existing + appendBlock
      const { error: updErr } = await supabase.from('calendar_posts').update({ caption: newCaption }).eq('id', row.id)
      if (updErr) { console.error(`[!] update ${row.id}:`, updErr.message); continue }
      console.log(`[+] +${appendBlock.length} chars: ${date} / "${row.title.slice(0, 50)}..."`)
      updated++
    }
  }
  console.log(`\nDone. Updated ${updated} · Skipped ${skipped} (already had Wave 1 mention) · Not found ${notFound}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
