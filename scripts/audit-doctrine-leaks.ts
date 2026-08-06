// Sweep every unpublished calendar post and story for the two defects found in
// the reel scripts, in case they were seeded more widely.
//
//   1. LOCATION-ONLY FAT MAP. Fat Map v2.0 (locked 31 Jul) is four
//      location-PLUS-SIGNAL pairs. Three of four drivers push fat central, so
//      naming a location without its discriminator misclassifies. Any copy that
//      says "<location> = <hormone>" with no signal attached is a doctrine bug.
//   2. "NOTHING TO BUY". Blueprint went live 3 Aug and challenge->Blueprint is
//      the ascension path, so the claim is untrue.
//
// Read-only. Prints what it finds; fixes nothing.
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const NOTHING_TO_BUY = /nothing to (buy|sell)|no(t|thing)\s+.{0,12}sell you|free.{0,30}nothing to buy/i

// A location claim tied straight to a hormone. The discriminators that make it
// legitimate are checked for separately.
const LOCATION_CLAIM = /(midsection|mid-back|lower back|flank|belly|hips|glutes|outer thigh)[^.!?]{0,80}\b(that is|that's|is|means|=)\s*(cortisol|insulin|oestrogen|estrogen|testosterone)/i
const DISCRIMINATORS = /limbs?\s+(thin|shrink)|arms and legs.{0,30}(thin|lean)|afternoon crash|evening craving|craving at night|cycle.{0,20}(regular|status)|direction of travel|muscle.{0,20}(going|falling|fall)|travelling to the middle|oestrogen leaving/i

const strip = (s: string) => (s ?? '').replace(/\s+/g, ' ')

async function main() {
  const { data: posts, error } = await db.from('calendar_posts')
    .select('id, date, brand, type, title, caption, notes, scheduled, posted_at')
    .gte('date', '2026-08-06').order('date')
  if (error) { console.log('ERROR', error.message); return }

  const live = (posts ?? []).filter(p => !p.posted_at)
  console.log(`Scanning ${live.length} unpublished posts from 6 Aug onward.\n`)

  const hits: string[] = []
  for (const p of live) {
    const text = `${p.title ?? ''} ${p.caption ?? ''}`
    if (NOTHING_TO_BUY.test(text)) {
      hits.push(`  [nothing-to-buy] ${p.date} ${p.brand} ${p.type}\n      ${strip(text).slice(0, 160)}`)
    }
    if (LOCATION_CLAIM.test(text) && !DISCRIMINATORS.test(text)) {
      hits.push(`  [location-only fat map] ${p.date} ${p.brand} ${p.type}\n      ${strip(text).slice(0, 200)}`)
    }
  }

  if (hits.length) {
    console.log(`${hits.length} problem(s):\n`)
    console.log(hits.join('\n\n'))
  } else {
    console.log('No location-only Fat Map claims and no "nothing to buy" claims remain.')
  }

  // Stories carry their text baked into the PNG, so a caption fix is not enough.
  const { data: stories } = await db.from('story_posts')
    .select('id, date, slug, hook_1, sub_1')
    .gte('date', '2026-08-06').limit(500)
  if (stories?.length) {
    const bad = stories.filter(s => {
      const t = `${s.hook_1 ?? ''} ${s.sub_1 ?? ''}`
      return (LOCATION_CLAIM.test(t) && !DISCRIMINATORS.test(t)) || NOTHING_TO_BUY.test(t)
    })
    console.log(`\nStories scanned: ${stories.length}. Problems: ${bad.length}`)
    for (const s of bad) console.log(`  ${s.date} ${s.slug}: ${strip(`${s.hook_1} ${s.sub_1 ?? ''}`).slice(0, 140)}`)
    if (bad.length) console.log('\n  NOTE: story text is baked into the PNG. Fixing means re-rendering, not editing the row.')
  } else {
    console.log('\nNo story_posts table rows in range (or table named differently).')
  }
}
main()
