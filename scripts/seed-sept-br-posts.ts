import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const POSTS = [
 ['2026-09-01','readiness','authority','Only 18 women in 100 could handle a hard plan',
  `Eighty-eight women have now been assessed.\n\nEighteen in every hundred came out able to handle a hard training plan.\n\nThe rest get one anyway. That is how plans are written: they assume a body that can absorb the work, then the same programme goes to the woman who can and the woman who cannot.\n\nOnly one of them gets a result.\n\nThe free 14-day Challenge tells you which one you are on day one.`],
 ['2026-09-02','readiness','pattern','Same place. Different cause.',
  `Nearly half the women we assess say the fat sits in the middle.\n\nWhich on its own tells you almost nothing, because three of the four causes push it there.\n\nStress was central from the start, and the arms and legs get thinner while the middle fills.\n\nFalling oestrogen is different. It started at the hips and thighs and moved to the middle over the last few years.\n\nSame place. Nothing like the same correction. And in the second phase they look identical, which is where most women get typed wrong.\n\nSo the question is not where it sits. It is whether it moved.`],
 ['2026-09-03','neurowellness','contrarian','Awake at 3am, and told it is just your age',
  `Sixty per cent of the women we profile are perimenopausal or past it, and the broken sleep gets waved off as part of the deal.\n\nIt is not nothing. Four in ten of the women we assess come out worst on sleep, and not one of them came to us about it. They came about fat that would not move.\n\nHer body does not change during the session. It changes overnight, and it has not had a proper night in two years.\n\nBeing in the transition explains why it is happening. It does not mean nothing can be done about it.`],
 ['2026-09-04','readiness','contrarian','How hard can you go? Wrong question.',
  `Every plan a woman is handed asks how hard she can go.\n\nNobody asks whether her body can take it right now.\n\nShe already has the willingness. What changes week to week is what her body can actually absorb, and that moves with sleep, stress, and whatever the last six months have been.\n\nPush a body that cannot absorb it and it does not get fitter. It holds on.`],
 ['2026-09-05','neurowellness','authority','You can still train hard. You just cannot recover.',
  `Across 86 women, training response is the best-scoring thing we measure and sleep is the worst.\n\nSo the thing these women work hardest at is the least broken thing about them, and the thing most broken has never been looked at.\n\nEvery plan they are sold starts by adding more training.`],
 ['2026-09-08','readiness','pattern','The same plan does three different things',
  `Depleted, transitioning, ready. Same programme, three completely different outcomes.\n\nThirty-one per cent of the women we assess are depleted, and the plan makes things worse.\n\nFifty-one per cent are in the middle, and get half a result before it stalls.\n\nOnly eighteen per cent are ready, and for them the plan does exactly what it says.\n\nSame plan. Same effort. Three different women.`],
 ['2026-09-09','neurowellness','coach','Twenty-five years of training harder',
  `Something she said on a call this week.\n\n"Twenty-five years. Every time something stopped working I would train harder or cut more."\n\nThat was the thing keeping it stuck.\n\nHer sleep, her energy and her stress all scored at the bottom. Nobody had ever asked.`],
 ['2026-09-10','metabolic','contrarian','Your problem is probably not insulin',
  `The internet has told you to cut the carbs, skip breakfast, fast for sixteen hours.\n\nIn the women we assess, insulin is about one in twenty-five.\n\nThe other twenty-four are doing all of that for a problem they do not have.\n\nInsulin is real. It is just not what is going on in most of the women we see.`],
 ['2026-09-11','readiness','authority','Most plans are not wrong. They are early.',
  `There is a version of you that plan would work brilliantly for.\n\nShe is about eight weeks away.\n\nAlmost nobody says this out loud, because there is no money in telling someone to wait. But give the same woman the same programme two months later, once her body can actually absorb the load, and it does what it was meant to do.\n\nThe first question is never what to do. It is what you are ready for.`],
 ['2026-09-12','neurowellness','pattern','Sleep scored worst. Training scored best.',
  `Five things, each scored out of three, across 86 women.\n\nTraining response 2.06. Fat loss response 2.00. Energy 1.93. Stress load 1.86. Sleep 1.80.\n\nThe two lowest are the two nobody ever assessed.\n\nThe free 14-day Challenge scores all five on day one.`],
] as const

async function main(){
  const commit = process.argv.includes('--commit')
  for (const [date, pillar, type, title, caption] of POSTS) {
    const slug = date.replace(/-/g,'-')
    // Two of the ten are carousels; their graphic is the comma-separated slides.
    const base = `br-${date}_${pillar === 'neurowellness' ? 'neuro' : pillar}`
    const CAROUSELS: Record<string, number> = { '2026-09-08': 5, '2026-09-12': 4 }
    const graphic = CAROUSELS[date]
      ? Array.from({ length: CAROUSELS[date] }, (_, n) => `/calendar/${base}-s${n + 1}.png`).join(',')
      : `/calendar/${base}.png`
    if (!commit) { console.log(`${date}  ${String(pillar).padEnd(14)} ${title}`); continue }
    // Match on DATE ONLY. Matching on (date, type) meant changing a post's type
    // created a second row rather than updating the first, and left a
    // superseded duplicate on the same day.
    const { data: existing } = await db.from('calendar_posts').select('id')
      .eq('brand','body_recode').eq('platform','instagram').eq('date',date).neq('type','story').limit(1)
    const row = { brand:'body_recode', platform:'instagram', date, time:'07:00', type,
      title, caption, graphic, phase:'scale' }
    if (existing?.length) await db.from('calendar_posts').update(row).eq('id', existing[0].id)
    else await db.from('calendar_posts').insert(row)
    console.log(`  ${date}  ${pillar}`)
  }
  if (!commit) console.log('\nDRY RUN. --commit to write.')
}
main()
