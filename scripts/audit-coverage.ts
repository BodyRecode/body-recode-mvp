// COVERAGE SPEC for a fortnight of @body_recode_ posts, and the audit that
// enforces it.
//
// Locked 20 Aug 2026 after four separate gaps were caught one at a time by eye:
// no readiness at all, no carousels, no photo of Kade, and nothing naming the
// oestrogen population. Each was found only because Kade looked at a sheet. A
// checklist that runs is worth more than four corrections.
//
// Everything here tests the WORDS IN THE POST, not the intent behind it. A post
// that reads on-brand while naming none of the pillars is the exact failure this
// is for: "interpretation before prescription" sounds like Body Recode and
// mentions neither sleep, stress, capacity nor a profile.
//
// Run: npx tsx --env-file=.env.local scripts/audit-coverage.ts --from=2026-09-01 --to=2026-09-14
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const arg = (k: string, d: string) => process.argv.find(a => a.startsWith(`--${k}=`))?.split('=')[1] ?? d
const FROM = arg('from', '2026-09-01')
const TO = arg('to', '2026-09-14')

// ── the spec ────────────────────────────────────────────────────────────────
const CHECKS = [
  // The two profile types that actually turn up. Ratios, never decimals: the
  // pattern split is n=27 and a decimal will move.
  { id: 'profile · stress-stored', min: 2, re: /stress|cortisol|wired|protection mode|central from the start/i,
    why: 'roughly half of profiles' },
  { id: 'profile · oestrogen-shift', min: 2, re: /oestrogen|estrogen|perimenopaus|menopaus|hips and thighs|the transition|moved to the middle/i,
    why: 'about a third of profiles, and 60% of the group is peri or post' },

  // The three states, together, at least once. Naming one alone does not teach
  // the model.
  { id: 'the three states', min: 1, re: /depleted[\s\S]{0,400}transitioning[\s\S]{0,400}ready|three states/i,
    why: '31 / 51 / 18 - the thing the scorecard actually outputs' },

  // Pillar airtime, 6 / 3 / 1 per ten.
  { id: 'pillar · neurowellness', min: 4, re: /\bsleep|\bstress|regulat|nervous system|recover|3am|waking|rested/i,
    why: 'target 6 in 10' },
  { id: 'pillar · readiness', min: 3, re: /readiness|capacity|absorb|take the load|\bready\b|transitioning|depleted/i,
    why: 'target 3 in 10' },
  { id: 'pillar · metabolic', min: 1, max: 2, re: /insulin|carb|blood sugar/i,
    why: 'target 1 in 10, and it works as a disqualifier not a claim' },

  // Audience. 93% female, so the copy has to say so.
  { id: 'names women', min: 10, re: /\bwomen\b|\bwoman\b|\bshe\b|\bher\b/i,
    why: '93% female - every post, not most of them' },
]

// Age framing: 59% are 45+, which means four in ten are younger. Narrowing to
// "45+" or "over 40" quietly excludes a large part of the audience.
const AGE_NARROW = /\bover 40\b|\b40\+|\b45\+|\bover 45\b|\bwomen in their fifties\b/i

// Our vocabulary, not theirs. These read as jargon cold.
const JARGON = /floor sleep|score the floor|body state|capacity is fine|regulation is gone|n=\d+|section 0\d/i

async function main() {
  const { data } = await db.from('calendar_posts')
    .select('date, title, caption, graphic, type')
    .eq('brand', 'body_recode').eq('platform', 'instagram')
    .neq('type', 'story')
    .gte('date', FROM).lte('date', TO).order('date')
  const rows = (data ?? []) as Array<Record<string, string | null>>
  const text = (p: typeof rows[0]) => `${p.title ?? ''} ${p.caption ?? ''}`
  const slides = (p: typeof rows[0]) => (p.graphic ?? '').split(',').filter(Boolean).length

  console.log(`\nCOVERAGE · @body_recode_ · ${FROM} to ${TO} · ${rows.length} feed posts\n`)
  let fails = 0

  for (const c of CHECKS) {
    const hits = rows.filter(p => c.re.test(text(p)))
    const ok = hits.length >= c.min && (!c.max || hits.length <= c.max)
    if (!ok) fails++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.id.padEnd(28)} ${String(hits.length).padStart(2)}/${c.min}${c.max ? `-${c.max}` : '+'}   ${c.why}`)
  }

  // formats
  const carousels = rows.filter(p => slides(p) > 1).length
  const photos = rows.filter(p => /_neuro\.png|_readiness\.png|_metabolic\.png/.test(p.graphic ?? '') === false && slides(p) === 1).length
  const fmtOk = carousels >= 2
  if (!fmtOk) fails++
  console.log(`${fmtOk ? 'PASS' : 'FAIL'}  ${'formats · carousels'.padEnd(28)} ${String(carousels).padStart(2)}/2+   dwell time, and a set of singles has none`)

  // clarity
  const jargon = rows.filter(p => JARGON.test(text(p)))
  const narrow = rows.filter(p => AGE_NARROW.test(text(p)))
  if (jargon.length) fails++
  if (narrow.length) fails++
  console.log(`${jargon.length ? 'FAIL' : 'PASS'}  ${'clarity · no jargon'.padEnd(28)} ${jargon.length} found     our vocabulary, not theirs`)
  for (const p of jargon) console.log(`        ${p.date}  "${text(p).match(JARGON)?.[0]}"`)
  console.log(`${narrow.length ? 'FAIL' : 'PASS'}  ${'audience · age not narrowed'.padEnd(28)} ${narrow.length} found     4 in 10 are under 45`)
  for (const p of narrow) console.log(`        ${p.date}  "${text(p).match(AGE_NARROW)?.[0]}"`)

  console.log(fails ? `\n${fails} FAILING. Fix before scheduling.\n` : '\nAll checks pass.\n')
}
main()
