// Hashtags for the warm-up posts.
//
// They do far less than they used to - Instagram removed hashtag following and
// has said they are not a meaningful ranking factor - but they cost nothing and
// still help topic classification and search surfacing. What actually drives
// discovery now is the CAPTION text being indexed, which is handled separately.
//
// Rules applied here:
//   - 5 per post. That is the cap Kade works to, and it forces the right
//     discipline anyway: no room for the huge generic tags.
//   - Matched to the post, not one block pasted everywhere. Identical tags on
//     every post is the pattern Instagram treats as spammy.
//   - Weighted to the real audience: 93% female, 59% aged 45+, 60% peri or
//     post-menopausal. Not generic fitness tags.
//   - Mid-size over huge. #fitness is 500m posts and invisible;
//     #perimenopauseweightloss is findable.
//   - Placed last. appendBrFooter puts the sign-off ABOVE them at publish.
//
// Run: npx tsx --env-file=.env.local scripts/add-warmup-hashtags.ts [--dry]

import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DRY = process.argv.includes('--dry')

// Always on: the brand tag, plus the one term that defines 60% of the
// audience. #menopause was dropped when the cap went to 5 - it is an enormous
// tag where a post disappears instantly, and the specific variants below do
// more work per slot.
const CORE = ['#bodyrecode', '#perimenopause']

const TAGS: Record<string, string[]> = {
  // the data / recovery posts
  '2026-08-15': ['#recovery', '#overtraining', '#womenshealth'],
  '2026-08-24': ['#sleep', '#recovery', '#cortisol'],
  '2026-08-31': ['#womenshealth', '#hormonehealth', '#fatlossover40'],
  // state / promo
  '2026-08-16': ['#hormonehealth', '#womenover40', '#weightlossjourney'],
  '2026-08-23': ['#hormonehealth', '#womenover40', '#fatlossover40'],
  '2026-08-30': ['#hormonalweightgain', '#fatlossover40', '#womenover50'],
  // effort / discipline
  '2026-08-17': ['#womenover40', '#hormonehealth', '#fatlossover40'],
  '2026-08-25': ['#womenover40', '#hormonalweightgain', '#midlifehealth'],
  '2026-08-21': ['#womenover40', '#hormonalweightgain', '#fatlossover40'],
  // the pattern posts - most specific, most findable
  '2026-08-18': ['#hormonalweightgain', '#cortisol', '#womenover40'],
  '2026-08-19': ['#bellyfat', '#cortisolbelly', '#hormonalbellyfat'],
  '2026-08-26': ['#perimenopauseweightloss', '#menopauseweightgain', '#hormonalbellyfat'],
  '2026-08-28': ['#perimenopauseweightloss', '#hormonalweightgain', '#womenover40'],
}

async function main() {
  const { data, error } = await db.from('calendar_posts')
    .select('id, date, title, caption, posted_at')
    .eq('brand', 'body_recode').eq('phase', 'warmup').order('date')
  if (error) { console.log('ERROR', error.message); return }

  let n = 0
  for (const p of data ?? []) {
    if (p.posted_at) { console.log(`SKIP ${p.date}: already published`); continue }
    const extra = TAGS[p.date]
    if (!extra) { console.log(`SKIP ${p.date}: no tag set defined`); continue }
    if (/#\w/.test(p.caption ?? '')) { console.log(`SKIP ${p.date}: already has tags`); continue }

    const tags = [...CORE, ...extra].join(' ')
    const caption = `${(p.caption ?? '').trimEnd()}\n\n${tags}`
    console.log(`  ${p.date}  ${tags}`)
    if (!DRY) {
      const { error: e } = await db.from('calendar_posts').update({ caption }).eq('id', p.id)
      if (e) { console.log(`    ERROR ${e.message}`); continue }
    }
    n++
  }
  console.log(`\n${DRY ? '[dry run] ' : ''}${n} posts tagged, 5 each.`)
  console.log('The sign-off is placed ABOVE the tags at publish by appendBrFooter.')
}
main()
