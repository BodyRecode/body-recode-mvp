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
// Carousels are FRONT-LOADED. There are only two in the whole back catalogue and
// the first pass buried both, producing four weeks of nothing but single cards -
// exactly the format mix the strategy had just moved away from.
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

// Coaching-flavoured types lead, per the 4/2/2/2 pillar split.
const COACHING = new Set(['coach', 'pattern'])

// Written by scripts/audit-personal-cards.py, which measures each graphic
// rather than trusting its filename.
const CARD_AUDIT: Record<string, { photo: boolean; labelled: boolean }> =
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
    // Photo cards are allowed again now they are greyscale. Bare cards are not.
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

  // Carousels first. There are only two and they are the best dwell-time format
  // we own, so they must not sink to the bottom of a date-ordered list again.
  const carousels = deduped.filter(p => slideCount(p.graphic) > 1)
  const singles = deduped.filter(p => slideCount(p.graphic) <= 1)
  const coaching = singles.filter(p => COACHING.has(p.type ?? ''))
  const other = singles.filter(p => !COACHING.has(p.type ?? ''))

  const picked: typeof usable = []
  // Space the carousels out rather than stacking them: one early, one mid-run.
  const carouselSlots = new Set([1, Math.floor(slots.length / 2)])
  for (let i = 0; i < slots.length; i++) {
    if (carouselSlots.has(i) && carousels.length) { picked.push(carousels.shift()!); continue }
    // 4 coaching : 6 other, per ten
    const wantCoaching = picked.filter(p => COACHING.has(p.type ?? '')).length / Math.max(picked.length, 1) < 0.4
    const pool = wantCoaching && coaching.length ? coaching : (other.length ? other : coaching)
    if (!pool.length) break
    picked.push(pool.shift()!)
  }

  console.log(`\n${all.length} unposted  ->  ${usable.length} pass the card rules  ->  ${deduped.length} after dedupe  ->  scheduling ${picked.length} over ${WEEKS} weeks\n`)
  console.log('date        day  time   format       type        title')
  console.log('-'.repeat(86))

  const updates: Array<{ id: string; date: string; iso: string }> = []
  picked.forEach((p, i) => {
    const date = slots[i]
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${date}T00:00:00`).getDay()]
    const iso = new Date(`${date}T${POST_TIME}:00+10:00`).toISOString()
    const n = slideCount(p.graphic)
    const fmt = n > 1 ? `CAROUSEL x${n}` : 'card'
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
        <div class="p">${slides.map(u => `<img src="https://bodyrecode.au${u}">`).join('')}</div>
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
