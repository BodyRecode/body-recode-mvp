import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const POSTS = [
 ['2026-09-01','readiness','authority','Only 18 women in 100 could handle a hard plan',
  `Eighty-eight women have now been assessed.\n\nEighteen in every hundred came out able to handle a hard training plan.\n\nThe rest get one anyway. That is how plans are written: they assume a body that can absorb the work, then the same programme goes to the woman who can and the woman who cannot.\n\nOnly one of them gets a result.\n\nThe free 14-day Challenge tells you which one you are on day one.`],
 ['2026-09-02','readiness','contrarian','Same symptoms. Opposite fix.',
  `Two women walk in with the same complaint. Tired all the time, flat sessions, a body that will not change.\n\nOne of them needs to do more.\n\nThe other is already doing too much, and every extra session makes it worse.\n\nFrom the outside they look identical. That is why the woman training hardest in any group is so often the one getting the least back.\n\nThe difference is capacity: what her body can absorb this week, not how willing she is.`],
 ['2026-09-03','neurowellness','pattern','Four in ten sleep badly',
  `They did not come to us about sleep.\n\nThey came about fat that would not move, a plan that stopped working, a body that used to respond.\n\nThen we score them and sleep comes out bottom of the five. Awake at 2am. Up at 6 feeling like they never went to bed.\n\nYour body does not change during the session. It changes overnight.`],
 ['2026-09-04','readiness','contrarian','How hard can you go? Wrong question.',
  `Every plan asks how hard you can go.\n\nNobody asks whether your body can take it right now.\n\nYou already have the willingness. What changes week to week is what your body can actually absorb, and that moves with sleep, stress, and whatever the last six months have been.\n\nPush a body that cannot absorb it and it does not get fitter. It holds on.`],
 ['2026-09-05','neurowellness','authority','You can still train hard. You just cannot recover.',
  `Across 86 completed scorecards, training response is the best-scoring thing we measure and sleep is the worst.\n\nSo the thing this group works hardest at is the least broken thing about them, and the thing most broken has never been looked at.\n\nEvery plan they are sold starts by adding more training.`],
 ['2026-09-08','readiness','pattern','The same plan does three different things',
  `Depleted, transitioning, ready. Same programme, three completely different outcomes.\n\nThirty-one per cent are depleted, and the plan makes things worse.\n\nFifty-one per cent are in the middle, and get half a result before it stalls.\n\nEighteen per cent are ready, and for them the plan does exactly what it says.`],
 ['2026-09-09','neurowellness','coach','Twenty-five years of training harder',
  `Something she said on a call this week.\n\n"Twenty-five years. Every time something stopped working I would train harder or cut more."\n\nThat was the thing keeping it stuck.\n\nHer sleep, her energy and her stress all scored at the bottom. Nobody had ever asked.`],
 ['2026-09-10','metabolic','contrarian','Your problem is probably not insulin',
  `The internet has told you to cut the carbs, skip breakfast, fast for sixteen hours.\n\nIn the women we assess, insulin is about one in twenty-five.\n\nThe other twenty-four are doing all of that for a problem they do not have.\n\nInsulin is real. It is just not what is going on in most women over 40.`],
 ['2026-09-11','readiness','authority','Most plans are not wrong. They are early.',
  `There is a version of you that plan would work brilliantly for.\n\nShe is about eight weeks away.\n\nAlmost nobody says this out loud, because there is no money in telling someone to wait. But give the same woman the same programme two months later, once her body can actually absorb the load, and it does what it was meant to do.\n\nThe first question is never what to do. It is what you are ready for.`],
 ['2026-09-12','neurowellness','pattern','Sleep scored worst. Training scored best.',
  `Five things, each scored out of three, across 86 women.\n\nTraining response 2.06. Fat loss response 2.00. Energy 1.93. Stress load 1.86. Sleep 1.80.\n\nThe two lowest are the two nobody ever assessed.\n\nThe free 14-day Challenge scores all five on day one.`],
] as const

async function main(){
  const commit = process.argv.includes('--commit')
  for (const [date, pillar, type, title, caption] of POSTS) {
    const slug = date.replace(/-/g,'-')
    const graphic = `/calendar/br-${date}_${pillar === 'neurowellness' ? 'neuro' : pillar}.png`
    if (!commit) { console.log(`${date}  ${String(pillar).padEnd(14)} ${title}`); continue }
    const { data: existing } = await db.from('calendar_posts').select('id')
      .eq('brand','body_recode').eq('platform','instagram').eq('date',date).eq('type',type).limit(1)
    const row = { brand:'body_recode', platform:'instagram', date, time:'07:00', type,
      title, caption, graphic, phase:'scale' }
    if (existing?.length) await db.from('calendar_posts').update(row).eq('id', existing[0].id)
    else await db.from('calendar_posts').insert(row)
    console.log(`  ${date}  ${pillar}`)
  }
  if (!commit) console.log('\nDRY RUN. --commit to write.')
}
main()
