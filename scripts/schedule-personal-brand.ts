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
//   - COLOUR photo cards. Kade, 20 Aug: "dont use colour images of me either".
//     Note he said colour, not photos. The first pass excluded photo cards
//     outright, which was the wrong fix and left the feed as a flat wall of
//     cream. They are greyscale now (scripts/greyscale-photo-cards.py) and back
//     in the mix, where they are the only tonal break the feed has.
//   - SPLIT photo cards. Kade, same day: "i like the whole images card". Two
//     layouts exist; the split gives half the frame to a clay panel and he wants
//     the full-bleed one, image across the whole card with the type over it.
//   - the BARE card variant: a rule and a headline, no eyebrow label, no
//     subline. Kade flagged it on sight. It reads unfinished beside the
//     labelled cards, and it is also where the weakest copy hides, because a
//     line with no label has to carry the whole post on its own.
//   - repeats. "The body is not broken" was scheduled THREE times in six weeks.
//   - video-type posts with no video_url. All six of these are scripts with a
//     cover image and no footage, two of them written in May and never filmed.
//     Left unguarded, the publisher would push the cover out as a static card,
//     which is a reel cover masquerading as a post.
//
// COMPOSED TO A FORMAT QUOTA, not picked by pillar and hoped over. Earlier
// passes selected on pillar weighting and the format mix fell out of whatever
// happened to be left, which produced four straight weeks of single clay cards
// against a strategy calling for photos and carousels. The week now has a
// SHAPE and each slot is filled with the treatment it asks for:
//
//   Mon  full-bleed greyscale photo
//   Wed  clay card
//   Fri  solid terracotta
//   Sun  carousel, falling back to another photo when the two run out
//
// Reels replace Wed and Sun from the week of 1 Sep, once filming has happened.
//
// Weighting follows the pillar split set in the brand strategy: coaching leads
// at four in ten. `coach` and `pattern` types carry the coaching angle, so the
// picker takes those first and fills the rest around them.
//
// --sheet renders the PROPOSAL as a visual sheet and opens it, writing nothing.
// Kade's standing rule, 20 Aug: he sees it on screen before it enters the
// calendar. The first version of this read from the DB instead, which meant it
// could only ever show what had already been written - useless as an approval
// step, and it left a stale sheet on his screen showing rejected posts.
//
// DRY RUN BY DEFAULT. Pass --commit to write.
//   npx tsx --env-file=.env.local scripts/schedule-personal-brand.ts
//   npx tsx --env-file=.env.local scripts/schedule-personal-brand.ts --commit
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const commit = process.argv.includes('--commit')
const weeksArg = process.argv.find(a => a.startsWith('--weeks='))
const WEEKS = weeksArg ? Number(weeksArg.split('=')[1]) : 4

const TIME_BOUND = /\btomorrow\b|\btoday\b|\bthis week\b|\bopens\b|\bopening\b|\blaunch(es|ing)?\b|\bdoors\b|\bclosing\b|\blast chance\b|\bspots?\b|\bwaitlist\b|\bnext week\b/i
const RETIRED = /co-?founder|aicm/i
const POST_TIME = '07:00'          // Brisbane
const DAYS = [1, 3, 5, 0]          // Mon, Wed, Fri, Sun

// Pillar weighting, v3.0 (20 Aug): 4 body read / 3 thinking / 2 build / 1 origin.
// The body read leads because it is closest to what Kade sells. ORIGIN - the
// three rebuilds - drops to one in ten and changes job: it is why he thinks this
// way, not a recurring theme. It used to be a quarter of the feed and it pointed
// backwards at him rather than at the reader.
const BODY_READ = new Set(['coach', 'pattern'])
const ORIGIN = /rebuil|identity|discharg|walked away|20[- ]year relationship|became someone new|from scratch|\bat 21\b|would he be proud|my father|the army|soldier/i
const ORIGIN_MAX_SHARE = 0.1

// Written by scripts/audit-personal-cards.py, which measures each graphic
// rather than trusting its filename.
const CARD_AUDIT: Record<string, { photo: boolean; labelled: boolean; layout: string }> =
  JSON.parse(readFileSync('scripts/personal-card-audit.json', 'utf8'))

/** Strip punctuation and case so near-identical headlines collapse together. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

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
    .select('id, date, type, title, caption, graphic, video_url')
    .eq('brand', 'personal_brand').eq('platform', 'instagram')
    .is('posted_at', null).order('date', { ascending: true })

  const all = (data ?? []) as Array<{ id: string; date: string; type: string | null; title: string | null; caption: string | null; graphic: string | null; video_url: string | null }>

  const usable = all.filter(p => {
    const text = `${p.title ?? ''} ${p.caption ?? ''}`
    if (!p.caption?.trim() || !p.graphic?.trim()) return false
    if (p.graphic.includes('/api/content/graphic')) return false
    if (TIME_BOUND.test(text) || RETIRED.test(text)) return false
    if (p.type === 'prelaunch') return false
    // A reel with no footage is a cover image. Publishing it would put a video
    // thumbnail on the feed as though it were a card.
    if (p.type === 'video' && !p.video_url?.trim()) return false
    // Judge the card by what is actually in the image, not its filename.
    const first = p.graphic.split(',')[0].trim()
    const card = CARD_AUDIT[first]
    // Greyscale full-bleed photos are wanted. Split-layout photos and bare
    // clay cards are not.
    if (card?.layout === 'split') return false
    if (card && !card.photo && !card.labelled) return false
    return true
  })

  // One headline, once. Keep the earliest-written version of any repeat.
  const seen = new Set<string>()
  const deduped = usable.filter(p => {
    const key = norm((p.caption ?? '').split('\n')[0] || p.title || '')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  const slideCount = (g: string | null) => (g ?? '').split(',').filter(Boolean).length

  const slots = nextDates(WEEKS * DAYS.length)

  const isOrigin = (p: typeof deduped[0]) => ORIGIN.test(`${p.title ?? ''} ${p.caption ?? ''}`)

  // Origin is capped BEFORE picking. Capping inside the loop leaked: when a
  // treatment pool had no non-origin alternative left it fell through and
  // scheduled the origin post anyway, which put four rebuild posts in sixteen
  // against a one-in-ten target.
  const originCap = Math.max(1, Math.round(slots.length * ORIGIN_MAX_SHARE))
  const originKeep = deduped.filter(isOrigin).slice(0, originCap)
  const trimmed = deduped.filter(p => !isOrigin(p) || originKeep.includes(p))
  console.log(`origin posts: ${deduped.filter(isOrigin).length} available, capped to ${originKeep.length} (1 in 10)`)

  const layoutOf = (p: typeof deduped[0]) =>
    slideCount(p.graphic) > 1 ? 'carousel' : (CARD_AUDIT[(p.graphic ?? '').split(',')[0].trim()]?.layout ?? 'card')

  const pool: Record<string, typeof deduped> = {
    carousel: trimmed.filter(p => layoutOf(p) === 'carousel'),
    'full-bleed': trimmed.filter(p => layoutOf(p) === 'full-bleed'),
    solid: trimmed.filter(p => layoutOf(p) === 'solid'),
    card: trimmed.filter(p => layoutOf(p) === 'card'),
  }
  for (const k of Object.keys(pool)) {
    pool[k].sort((a, b) =>
      Number(isOrigin(a)) - Number(isOrigin(b)) ||
      Number(BODY_READ.has(b.type ?? '')) - Number(BODY_READ.has(a.type ?? '')))
  }

  // Mon / Wed / Fri / Sun, in the order nextDates() returns them.
  // Two photo slots a week, not one. Kade, 20 Aug: "can we use more images".
  const WEEK_SHAPE = ['full-bleed', 'card', 'solid', 'carousel']
  const FALLBACK: Record<string, string[]> = {
    carousel: ['full-bleed', 'solid', 'card'],   // a second photo before a card
    'full-bleed': ['solid', 'card'],
    solid: ['card', 'full-bleed'],
    card: ['solid', 'full-bleed'],
  }

  const picked: typeof usable = []
  const usedFormat: string[] = []
  for (let i = 0; i < slots.length; i++) {
    const want = WEEK_SHAPE[i % WEEK_SHAPE.length]
    let take = pool[want]?.length ? want : FALLBACK[want].find(f => pool[f]?.length)
    if (!take) break
    picked.push(pool[take].shift()!)
    usedFormat.push(take)
  }

  // ── coverage, on the PROPOSED set ───────────────────────────────────────
  // Same discipline as @body_recode_: test the words in the post, not the
  // intent. The personal pillars are Body Read 4 / Thinking 3 / Build 2 /
  // Origin 1 per ten, and the body-read slots are where neurowellness and
  // readiness have to actually land. A post can read exactly like this brand
  // and name neither.
  const NEURO = /\bsleep|\bstress|regulat|nervous system|recover|wired|3am|waking|rested|protection mode/i
  const READY = /readiness|capacity|absorb|take the load|\bready\b|transitioning|depleted|what your body can/i
  const BUILD = /software|platform|built my own|coding|the system i/i
  const FEM   = /\bwomen\b|\bwoman\b|\bshe\b|\bher\b/i
  const JARGON = /floor sleep|score the floor|body state|capacity is fine|regulation is gone|n=\d+/i
  const txt = (p: typeof picked[0]) => `${p.title ?? ''} ${p.caption ?? ''}`
  const count = (re: RegExp) => picked.filter(p => re.test(txt(p))).length
  const per10 = (n: number) => (10 * n / Math.max(picked.length, 1)).toFixed(1)

  const cov: Array<[string, number, string, string]> = [
    ['neurowellness', count(NEURO), '3+', 'the biggest lane, and the spine of the ad round'],
    ['readiness',     count(READY), '1+', 'never reached the BR feed either until yesterday'],
    ['the build',     count(BUILD), '2+', 'the platform story, his and nobody else\'s'],
    ['origin',        picked.filter(isOrigin).length, '<=2', 'context, not a theme'],
    ['names women',   count(FEM),   `${picked.length}`, '93% female - every post'],
  ]
  console.log('\nCOVERAGE of the proposed set')
  for (const [k, n, target, why] of cov) {
    const want = target.startsWith('<=') ? n <= Number(target.slice(2)) : n >= Number(target.replace('+', ''))
    console.log(`  ${want ? 'PASS' : 'FAIL'}  ${k.padEnd(15)} ${String(n).padStart(2)}/${target.padEnd(4)} (${per10(n)} per ten)  ${why}`)
  }
  const jg = picked.filter(p => JARGON.test(txt(p)))
  console.log(`  ${jg.length ? 'FAIL' : 'PASS'}  ${'no jargon'.padEnd(15)} ${jg.length} found`)
  for (const p of jg) console.log(`        "${txt(p).match(JARGON)?.[0]}"  ${String(p.title).slice(0, 40)}`)

  console.log(`\n${all.length} unposted  ->  ${usable.length} pass the card rules  ->  ${deduped.length} after dedupe  ->  scheduling ${picked.length} over ${WEEKS} weeks\n`)
  console.log('date        day  time   format       type        title')
  console.log('-'.repeat(86))

  const updates: Array<{ id: string; date: string; iso: string }> = []
  picked.forEach((p, i) => {
    const date = slots[i]
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${date}T00:00:00`).getDay()]
    const iso = new Date(`${date}T${POST_TIME}:00+10:00`).toISOString()
    const n = slideCount(p.graphic)
    const fmt = n > 1 ? `CAROUSEL x${n}` : usedFormat[i]
    console.log(`${date}  ${day}  ${POST_TIME}  ${fmt.padEnd(12)} ${String(p.type ?? '').padEnd(10)}  ${String(p.title ?? '').slice(0, 38)}`)
    updates.push({ id: p.id, date, iso })
  })

  if (process.argv.includes('--sheet')) {
    const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const cards = picked.map((p, i) => {
      const slides = (p.graphic ?? '').split(',').map(x => x.trim()).filter(Boolean)
      const date = slots[i]
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${date}T00:00:00`).getDay()]
      const cap = (p.caption ?? '').split('\n').filter(l => l.trim())
        .map(l => l.trim().startsWith('#') ? `<p class="t">${esc(l)}</p>` : `<p>${esc(l)}</p>`).join('')
      return `<article><div class="w"><b>${i + 1}</b><span>${day} ${date}</span><span>${POST_TIME}</span>
        <em>${slides.length > 1 ? `Carousel · ${slides.length}` : 'Card'}</em></div>
        <div class="p">${slides.map(u => `<img src="file://${process.cwd()}/public${u}">`).join('')}</div>
        <div class="c"><h3>${esc(p.title ?? '')}</h3>${cap}</div></article>`
    }).join('')
    const out = '/private/tmp/claude-501/-Users-kadedunstone/a957f6f2-3385-4ca0-b65f-aa046fb50c30/scratchpad/proposal.html'
    writeFileSync(out, `<style>
body{background:#faf9f7;font-family:-apple-system,sans-serif;padding:26px;max-width:1400px;margin:0 auto}
h1{font-size:23px;margin:0 0 4px}.s{color:#6b6b6b;font-size:13.5px;margin:0 0 20px;line-height:1.6}
.s b{color:#1a1a1a}
article{display:grid;grid-template-columns:108px 1fr 380px;gap:20px;background:#fff;border:1px solid #e6e3de;
border-radius:13px;padding:18px 20px;margin-bottom:12px;align-items:start}
.w{font-size:12px;color:#6b6b6b;display:flex;flex-direction:column;gap:2px}
.w b{font-size:19px;color:#1a1a1a}.w em{font-style:normal;font-size:11px;color:#9a9a9a;margin-top:4px}
.p{display:flex;gap:5px;flex-wrap:wrap}
.p img{width:150px;height:auto;border-radius:7px;border:1px solid #e6e3de;display:block}
.c h3{font-size:15px;margin:0 0 8px}.c p{font-size:13.5px;line-height:1.55;color:#4a4a4a;margin:0 0 7px}
.c p.t{color:#9a9a9a;font-size:11.5px}
</style><h1>PROPOSED · ${picked.length} posts, not yet scheduled</h1>
<p class="s">Nothing has been written to the calendar. Carousels show every slide.<br>
<b>Excluded automatically:</b> colour photos of Kade, bare cards with no eyebrow label,
repeated headlines, unfilmed reels, time-bound copy, anything naming the retired AI product.</p>${cards}`)
    execSync(`open "${out}"`)
    console.log(`\nProposal sheet opened. ${picked.length} posts. NOTHING WRITTEN.`)
    return
  }

  if (!commit) {
    console.log(`\nDRY RUN. Nothing written. Re-run with --commit to schedule.`)
    console.log(`Leftover in the bank after this: ${deduped.length - picked.length} posts.`)
    console.log(`\nNOTHING WRITTEN. Review the sheet first, then re-run with --commit.\n`)
    return
  }

  for (const u of updates) {
    const { error } = await db.from('calendar_posts')
      .update({ date: u.date, time: POST_TIME, scheduled_publish_at: u.iso, publish_error: null, publish_attempts: 0 })
      .eq('id', u.id)
    if (error) console.log(`  FAILED ${u.date}: ${error.message}`)
  }
  console.log(`\nScheduled ${updates.length} posts. First goes out ${updates[0].date} at ${POST_TIME} Brisbane.`)
  console.log(`${deduped.length - picked.length} posts left in the bank.`)
  console.log(`\nTo stop any of them: clear scheduled_publish_at on the row in the Content Calendar.`)
}

main()
