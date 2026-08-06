// Campaign-aligned Instagram stories, Fri 7 Aug -> Mon 31 Aug 2026.
//
// WHY: the story slate was generic ("Hook · W5 1", "Quote · W6 3") and reinforced
// nothing in particular, while 58 slots sat inside the paid campaign window. Stories
// are the daily drumbeat, so they should hammer the same concept the week's feed posts
// and the live ad are running. It also ran dry after 23 Aug, leaving the last week of
// the month empty.
//
// Themes follow the feed spine (strategy 11b), one concept per week:
//   Ramp  7-9 Aug    read before prescribe, first Challenge invites
//   Wk A  10-16 Aug  FOUR PATTERNS      (matches Ads 5 + 2, the reel week)
//   Wk B  17-23 Aug  INSULIN TIMING     (matches Ad 6)
//   Wk C  24-30 Aug  TARGETING          (matches Ads 12 + 14)
//   31 Aug           bridge into the Membership arc
//
// Three per day at 07:30 / 12:30 / 19:30. Every Sunday evening slot is a Challenge
// invite. All 75 are unique - no recycling inside a week.
//
// This writes the MANIFEST only. Render the PNGs first, then seed:
//   1. npx tsx scripts/seed-campaign-stories.ts --manifest
//   2. scripts/ig-generator/render-manifest.sh scripts/ig-generator/campaign-stories.json
//   3. set -a && source .env.local && set +a && npx tsx scripts/seed-campaign-stories.ts --seed
//
// Safe to re-run: only deletes unpublished, unscheduled BR stories in the window.

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'

const FROM = '2026-08-07'
const TO = '2026-08-31'
const OUT_DIR = '/Users/kadedunstone/body-recode-mvp/public/stories/filled'
const MANIFEST = '/Users/kadedunstone/body-recode-mvp/scripts/ig-generator/campaign-stories.json'

type Cat = 'hook' | 'pattern' | 'quote' | 'inside_challenge' | 'photo_overlay'
interface Story {
  category: Cat
  label?: string
  pattern_name?: string
  day_num?: string
  photo?: string
  hook_1: string
  hook_2?: string
  sub_1?: string
}

// ── RAMP · 7-9 Aug · read before prescribe ──────────────────────────────────
const RAMP: Story[][] = [
  [ // Fri 7
    { category: 'hook', label: 'THE SEQUENCE', hook_1: 'Prescribing before reading is guessing.', sub_1: 'It just happens to be the industry default.' },
    { category: 'photo_overlay', photo: '1', hook_1: 'Read the state. Then prescribe.', sub_1: 'In that order, or the plan is a coin toss.' },
    { category: 'quote', hook_1: 'A body in protection mode cannot spend on adaptation.' },
  ],
  [ // Sat 8
    { category: 'hook', label: 'WHY IT STALLS', hook_1: 'The same program transforms one person and does nothing for another.', sub_1: 'That is not the program. That is the starting state.' },
    { category: 'inside_challenge', day_num: 'Day 0', hook_1: 'It starts with a read, not a plan.', sub_1: 'What state your body is in right now, before anything gets prescribed.' },
    { category: 'quote', hook_1: 'Effort you cannot use is just fatigue.' },
  ],
  [ // Sun 9
    { category: 'hook', label: 'FOURTEEN DAYS', hook_1: 'Fourteen days is not long enough to change a body.', sub_1: 'It is long enough to find out why it is not changing.' },
    { category: 'pattern', label: 'THE FOUR', pattern_name: 'Four drivers', hook_1: 'Four patterns. Four different corrections.', sub_1: 'Run the wrong one and almost nothing moves.' },
    { category: 'photo_overlay', photo: '2', hook_1: 'Free. Fourteen days. Nothing to buy.', sub_1: 'Link in bio.' },
  ],
]

// ── WEEK A · 10-16 Aug · FOUR PATTERNS ──────────────────────────────────────
const WEEK_A: Story[][] = [
  [ // Mon 10
    { category: 'hook', label: 'TWENTY YEARS', hook_1: 'Effort was almost never the thing that separated them.', sub_1: 'Whether the body could use it was.' },
    { category: 'pattern', label: '01 · CORTISOL', pattern_name: 'Stress-Stored', hook_1: 'Front of the middle, arms and legs still lean.', sub_1: 'A reserve held close to the organs because the stress never resolved.' },
    { category: 'quote', hook_1: 'Two people with the same fat can need opposite plans.' },
  ],
  [ // Tue 11
    { category: 'hook', label: 'THE OBJECTION', hook_1: 'Eat less and move more is right about one pattern out of four.', sub_1: 'On two of the others it actively makes things worse.' },
    { category: 'pattern', label: '02 · INSULIN', pattern_name: 'Insulin-Drift', hook_1: 'Mid-back, lower back, the flanks. Front relatively spared.', sub_1: 'Everyone checks the front. This one shows itself at the back.' },
    { category: 'quote', hook_1: 'Restriction reads as scarcity. The body conserves harder.' },
  ],
  [ // Wed 12
    { category: 'hook', label: 'COMMENT MAP', hook_1: 'Where it sits narrows it. What comes with it decides.', sub_1: 'Comment MAP on today’s post for the full breakdown.' },
    { category: 'pattern', label: '03 · OESTROGEN', pattern_name: 'Estrogen-Shift', hook_1: 'Hips, glutes and outer thighs, then moving central.', sub_1: 'A conservation state, not a willpower failure.' },
    { category: 'quote', hook_1: 'The body is not being stubborn. It is responding correctly.' },
  ],
  [ // Thu 13
    { category: 'hook', label: '04 · THE ODD ONE', hook_1: 'The fourth one is not a place at all.', sub_1: 'The middle fills while muscle, tone and drive fall together.' },
    { category: 'pattern', label: '04 · TESTOSTERONE', pattern_name: 'Androgen-Decline', hook_1: 'The giveaway is the muscle going, not the fat arriving.', sub_1: 'Which is why it gets missed for years.' },
    { category: 'photo_overlay', photo: '3', hook_1: 'Three of the four sit somewhere. One does not.', sub_1: 'Find out which is yours. Free, fourteen days.' },
  ],
  [ // Fri 14
    { category: 'hook', label: 'THE TRAP', hook_1: 'Most plans half work, and the half-result is the trap.', sub_1: 'It convinces you the plan was right and you were the problem.' },
    { category: 'inside_challenge', day_num: 'Day 7', hook_1: 'Eight markers, scored against where they sat on day one.', sub_1: 'The ones that refuse to move are the read.' },
    { category: 'quote', hook_1: 'Same effort. Wrong target. That is a solvable problem.' },
  ],
  [ // Sat 15
    { category: 'hook', label: 'THE ORDER', hook_1: 'Read the state. Bring the foundation up. Correct the pattern.', sub_1: 'Skip step one and the other two are guesswork.' },
    { category: 'photo_overlay', photo: '4', hook_1: 'You already proved the discipline.', sub_1: 'Right actions, wrong order, is a different problem.' },
    { category: 'quote', hook_1: 'Where the fat sits tells you which hormone is holding it there.' },
  ],
  [ // Sun 16
    { category: 'hook', label: 'FOUR DRIVERS', hook_1: 'Cortisol. Insulin. Oestrogen. Testosterone.', sub_1: 'One of them is running yours.' },
    { category: 'inside_challenge', day_num: 'Day 14', hook_1: 'The full pattern read, and what that one answers to.', sub_1: 'No program to buy at the end of it.' },
    { category: 'photo_overlay', photo: '5', hook_1: 'Fourteen days. Free. Find out which of the four.', sub_1: 'Link in bio.' },
  ],
]

// ── WEEK B · 17-23 Aug · INSULIN TIMING ─────────────────────────────────────
const WEEK_B: Story[][] = [
  [ // Mon 17
    { category: 'hook', label: 'ONE SIGNAL', hook_1: 'The 3pm crash, the evening cravings, the fat that will not shift.', sub_1: 'Not three problems. One signal.' },
    { category: 'pattern', label: 'TELL 01', pattern_name: 'The 2-4pm dip', hook_1: 'Energy drops hard between 2 and 4pm.', sub_1: 'And it is not about how you slept.' },
    { category: 'quote', hook_1: 'Insulin sensitivity is one of the most responsive systems in the body.' },
  ],
  [ // Tue 18
    { category: 'hook', label: 'NOT THE CARBS', hook_1: 'It is not how many carbs. It is when, and what they sit next to.', sub_1: 'Cutting them is the first thing people try and rarely the thing that was wrong.' },
    { category: 'pattern', label: 'TELL 02', pattern_name: 'The post-meal hour', hook_1: 'Heavy and foggy for about an hour after eating.', sub_1: 'Particularly after lunch.' },
    { category: 'quote', hook_1: 'That is a timing strategy, not a restriction strategy.' },
  ],
  [ // Wed 19
    { category: 'hook', label: 'COMMENT TELLS', hook_1: 'If three of the four tells are yours, it is probably insulin.', sub_1: 'Comment TELLS on today’s post for the full set.' },
    { category: 'pattern', label: 'TELL 03', pattern_name: 'The evening craving', hook_1: 'Cravings hit hardest after dinner.', sub_1: 'When the day is done and the discipline is gone.' },
    { category: 'quote', hook_1: 'It is not pre-diabetes. That is a diagnosis. This is a state.' },
  ],
  [ // Thu 20
    { category: 'hook', label: 'TELL 04', hook_1: 'Storage sits at the back and the sides, front comparatively flat.', sub_1: 'The discriminator most people never check.' },
    { category: 'photo_overlay', photo: '6', hook_1: 'Everyone checks the front.', sub_1: 'This pattern shows itself at the back.' },
    { category: 'quote', hook_1: 'States respond to inputs. That is the whole point of reading one.' },
  ],
  [ // Fri 21
    { category: 'hook', label: 'BACKWARDS', hook_1: 'Sometimes the right move is fewer sessions, not more.', sub_1: 'A protecting body reads a fourth hard session as another threat.' },
    { category: 'inside_challenge', day_num: 'Day 7', hook_1: 'The load has to drop far enough that adaptation switches back on.', sub_1: 'Then the training builds something.' },
    { category: 'quote', hook_1: 'Adding stimulus to a body that is defending itself is not progress.' },
  ],
  [ // Sat 22
    { category: 'hook', label: 'OUTPUT vs FUEL', hook_1: 'Most common in people whose output changed but whose fuelling did not.', sub_1: 'The habits stayed. The context moved.' },
    { category: 'photo_overlay', photo: '7', hook_1: 'Fat burning stays switched off longer than it should.', sub_1: 'That is the mechanism. Everything else is a symptom.' },
    { category: 'quote', hook_1: 'The tells line up in a specific order. That order is the read.' },
  ],
  [ // Sun 23
    { category: 'hook', label: 'FOURTEEN DAYS', hook_1: 'Fourteen days tells you whether insulin is the driver.', sub_1: 'Or whether it was one of the other three all along.' },
    { category: 'inside_challenge', day_num: 'Day 0', hook_1: 'Day 0 reads the state. Day 7 scores eight markers. Day 14 gives the pattern.', sub_1: 'Free, and nothing to buy at the end.' },
    { category: 'photo_overlay', photo: '8', hook_1: 'Free. Fourteen days. Find your driver.', sub_1: 'Link in bio.' },
  ],
]

// ── WEEK C · 24-30 Aug · TARGETING, NOT DISCIPLINE ──────────────────────────
const WEEK_C: Story[][] = [
  [ // Mon 24
    { category: 'hook', label: 'THE SEQUENCE', hook_1: 'Five days a week, food tracked, and the shape has not moved in a year.', sub_1: 'That is not a discipline problem.' },
    { category: 'pattern', label: 'STEP 01', pattern_name: 'Read the state', hook_1: 'Whether the body is currently able to change at all.', sub_1: 'Everything else depends on this answer.' },
    { category: 'quote', hook_1: 'Composition only changes when a body can afford to spend.' },
  ],
  [ // Tue 25
    { category: 'hook', label: 'OVER-DIAGNOSED', hook_1: 'Discipline is the most over-diagnosed problem in this industry.', sub_1: 'It is the easiest explanation, so it is the default one.' },
    { category: 'pattern', label: 'STEP 02', pattern_name: 'Raise the foundation', hook_1: 'Sleep, energy and stress load, far enough that the body can act.', sub_1: 'Skipped more often than any other step.' },
    { category: 'quote', hook_1: 'Telling someone to want it more is not a diagnosis. It is a shrug.' },
  ],
  [ // Wed 26
    { category: 'hook', label: 'COMMENT ORDER', hook_1: 'Four patterns, four different corrections.', sub_1: 'Comment ORDER on today’s post for which goes with which.' },
    { category: 'pattern', label: 'STEP 03', pattern_name: 'Correct the pattern', hook_1: 'Where it sits and what comes with it names the driver.', sub_1: 'Each one answers to something different.' },
    { category: 'quote', hook_1: 'Cortisol answers to load coming down, not to more training.' },
  ],
  [ // Thu 27
    { category: 'hook', label: 'WRONG TARGET', hook_1: 'The effort still goes in. It just does not come back out as composition.', sub_1: 'That is what a targeting problem looks like from the inside.' },
    { category: 'photo_overlay', photo: '1', hook_1: 'It was never discipline. It was the target.', sub_1: 'One of those you can actually fix.' },
    { category: 'quote', hook_1: 'Oestrogen answers to consistent fuelling. Restriction makes it worse.' },
  ],
  [ // Fri 28
    { category: 'hook', label: 'MARKERS FIRST', hook_1: 'The markers move before the mirror does.', sub_1: 'Sleep, energy, fluid, cravings. None of them are composition. All of them decide it.' },
    { category: 'inside_challenge', day_num: 'Day 7', hook_1: 'Eight markers scored against day one.', sub_1: 'The ones sitting flat are the interesting ones.' },
    { category: 'quote', hook_1: 'A body that is not sleeping does not give up fat, whatever the training looks like.' },
  ],
  [ // Sat 29
    { category: 'hook', label: 'PROVEN ALREADY', hook_1: 'You have already proven you will do the work.', sub_1: 'This just tells you which work.' },
    { category: 'photo_overlay', photo: '2', hook_1: 'Prescribing before reading is guessing.', sub_1: 'Guessing is expensive when the cost is a year.' },
    { category: 'quote', hook_1: 'Testosterone answers to protecting muscle first, not to a harder cut.' },
  ],
  [ // Sun 30
    { category: 'hook', label: 'THE READ', hook_1: 'If the effort has been there and the result has not, look at the target.', sub_1: 'Fourteen days is a cheap way to check.' },
    { category: 'inside_challenge', day_num: 'Day 14', hook_1: 'The one thing that tells you what your effort should have been pointed at.', sub_1: 'Free. Nothing to buy at the end.' },
    { category: 'photo_overlay', photo: '3', hook_1: 'Same effort. Right target.', sub_1: 'Link in bio.' },
  ],
]

// ── 31 Aug · bridge into the Membership arc ─────────────────────────────────
const BRIDGE: Story[][] = [
  [
    { category: 'hook', label: 'WHAT COMES NEXT', hook_1: 'The read is the start, not the finish.', sub_1: 'Knowing the pattern and correcting it are two different jobs.' },
    { category: 'quote', hook_1: 'A pattern is a read, and reads are allowed to change as the evidence improves.' },
    { category: 'photo_overlay', photo: '4', hook_1: 'Fourteen days. Free. Still the best place to start.', sub_1: 'Link in bio.' },
  ],
]

const TIMES = ['07:30', '12:30', '19:30']

function datesFrom(start: string, n: number): string[] {
  const out: string[] = []
  const d = new Date(start + 'T00:00:00Z')
  for (let i = 0; i < n; i++) {
    out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

const schedule: { date: string; story: Story; time: string; theme: string }[] = []
const blocks: [Story[][], string, string][] = [
  [RAMP, '2026-08-07', 'Ramp · read before prescribe'],
  [WEEK_A, '2026-08-10', 'Week A · four patterns'],
  [WEEK_B, '2026-08-17', 'Week B · insulin timing'],
  [WEEK_C, '2026-08-24', 'Week C · targeting'],
  [BRIDGE, '2026-08-31', 'Bridge · into Membership arc'],
]
for (const [block, start, theme] of blocks) {
  const dates = datesFrom(start, block.length)
  block.forEach((day, i) => {
    day.forEach((story, j) => schedule.push({ date: dates[i], story, time: TIMES[j] ?? '19:30', theme }))
  })
}

const slugFor = (date: string, i: number) => `story_camp_${date.replace(/-/g, '').slice(4)}_${i + 1}`

function writeManifest() {
  const posts = schedule.map((s, i) => {
    const idx = schedule.filter(x => x.date === s.date).indexOf(s)
    return { slug: slugFor(s.date, idx), type: 'story', ...s.story }
  })
  writeFileSync(MANIFEST, JSON.stringify({ _meta: { out_dir: OUT_DIR }, posts }, null, 1))
  console.log(`Manifest written: ${posts.length} stories -> ${MANIFEST}`)
  console.log(`Next: scripts/ig-generator/render-manifest.sh ${MANIFEST}`)
}

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  const db = createClient(url, key)

  const { data: existing, error: readErr } = await db
    .from('calendar_posts').select('id, date, title, ig_post_id, scheduled')
    .eq('brand', 'body_recode').eq('type', 'story').gte('date', FROM).lte('date', TO)
  if (readErr) throw readErr

  const removable = (existing ?? []).filter(r => !r.ig_post_id && !r.scheduled)
  const kept = (existing ?? []).length - removable.length
  if (kept) console.log(`Leaving ${kept} published/scheduled story/stories alone.`)
  if (removable.length) {
    const { error } = await db.from('calendar_posts').delete().in('id', removable.map(r => r.id))
    if (error) throw error
    console.log(`Removed ${removable.length} generic draft stories.`)
  }

  const rows = schedule.map(s => {
    const idx = schedule.filter(x => x.date === s.date).indexOf(s)
    const slug = slugFor(s.date, idx)
    return {
      date: s.date, time: s.time, brand: 'body_recode', platform: 'instagram',
      type: 'story', phase: 'ads',
      title: `${s.story.label ?? s.story.day_num ?? s.story.category} · ${s.theme.split(' · ')[0]}`,
      caption: [s.story.hook_1, s.story.sub_1].filter(Boolean).join(' '),
      graphic: `/stories/filled/${slug}.png`,
      notes: `${s.theme}. Category: ${s.story.category}.`,
      scheduled: false,
    }
  })
  const { error: insErr } = await db.from('calendar_posts').insert(rows)
  if (insErr) throw insErr
  console.log(`Inserted ${rows.length} campaign-aligned stories (${FROM} to ${TO}).`)
}

const mode = process.argv[2]
if (mode === '--manifest') writeManifest()
else if (mode === '--seed') seed().catch(e => { console.error(e); process.exit(1) })
else { console.error('Usage: --manifest | --seed'); process.exit(1) }
