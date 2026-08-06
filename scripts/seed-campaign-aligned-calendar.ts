// Rebuild the BR Instagram feed calendar to the campaign spine (Fri 7 Aug -> Sun 30 Aug 2026).
//
// WHY: the calendar was full but built for the previous plan. Of 12 feed posts in this
// window, only 2 mentioned the Challenge, two actively pushed the SCORECARD while every
// Round 1 ad routes to /challenge, and the closest four-patterns post sat on 19 Aug -
// nearly two weeks after the ads that lead on it. Weekday labels had also drifted from
// the actual dates ("Sat Pattern" on a Sunday).
//
// THE SPINE (strategy 11b): the live ad sets the week's theme. One concept, four angles,
// plus the Sunday invite.
//   Mon Authority   - the live ad's claim, expanded
//   Tue Contrarian  - the obvious objection, killed
//   Wed Pattern     - self-diagnosis + comment-to-DM (the warm-audience engine)
//   Fri Coach       - proof it holds
//   Sun Promo       - Challenge invite
//
// ROUTING: every post points at /challenge, not the scorecard, for as long as paid is
// live. The read is not skipped because the scorecard IS Day 0. Reverts to scorecard-first
// when paid goes dark. Scoped exception, decided 5 Aug.
//
// WEEK A is the reel week and uses the five scripts verbatim from
// 07_MARKETING/03_ORGANIC_INSTAGRAM/BR_REEL_SCRIPTS_WEEK1.md. Batch-film them in one
// sitting in Captions.
//
// WEEKS B and C are themed against Ad 6 and Ads 12/14 respectively. RE-POINT THEM at the
// Round 1 winner once the day 5-7 kill decision is made - that is the whole point of the
// spine, and these are a sensible default rather than a fixed plan.
//
// Safe to re-run: deletes only unpublished, unscheduled BR IG feed posts in the window.
//
// Run: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/seed-campaign-aligned-calendar.ts

import { createClient } from '@supabase/supabase-js'

const FROM = '2026-08-07'
const TO = '2026-08-30'

interface Post {
  date: string
  time: string
  type: 'authority' | 'contrarian' | 'pattern' | 'coach' | 'diagnostic'
  title: string
  format: 'Reel' | 'Carousel' | 'Static'
  caption: string
  notes: string
}

const CTA = 'Link in bio.'

const posts: Post[] = [
  // ── RAMP · Fri 7 - Sun 9 Aug. Ads go live. Warm the ground. ──
  {
    date: '2026-08-07', time: '07:00', type: 'coach', format: 'Static',
    title: 'Fri Coach · the read comes before the prescription',
    notes: 'Ramp post. Ads go live around now. Sets the frame the whole campaign runs on.',
    caption: `Prescribing before reading is guessing.

That sounds obvious until you notice how much of the industry does it. A plan gets handed over before anyone has established whether the body in front of them can currently use it.

A body in protection mode cannot spend on adaptation. Give it a harder block and it does not turn that into muscle, and it does not release fat. It turns it into fatigue.

So the same program that transforms one person does nothing for another, and the second person concludes they are the problem.

They are not. The sequence was wrong.

Read the state. Bring the foundation up. Then correct the pattern holding the fat where it sits.

${CTA}`,
  },
  {
    date: '2026-08-09', time: '09:00', type: 'diagnostic', format: 'Static',
    title: 'Sun Promo · Challenge invite (ramp)',
    notes: 'First Sunday invite of the campaign. Free, 14 days, nothing to buy.',
    caption: `Fourteen days. Free. Nothing to buy at the end of it.

Day 0, an intake that reads what state your body is actually in right now.

Day 7, eight markers scored against where they sat on day one. The ones that move matter less than the ones that do not.

Day 14, the full pattern read. Which of the four drivers is holding your fat where it sits, and what that specific one answers to.

That is the whole thing. No program waiting at the end, no upsell on day 14.

If you have been putting in the right effort at the wrong target, this is a cheap way to find out.

${CTA}`,
  },

  // ── WEEK A · Mon 10 - Sun 16 Aug · FOUR PATTERNS · THE REEL WEEK ──
  // Matches Ad 5 (four patterns) and Ad 2 (Fat Map), which is three quarters of Round 1.
  // All five are the scripts from BR_REEL_SCRIPTS_WEEK1.md. Film in one sitting.
  {
    date: '2026-08-10', time: '07:00', type: 'authority', format: 'Reel',
    title: 'Mon Authority · REEL · twenty years, and effort was never the variable',
    notes: 'REEL 1 of 5. Script in BR_REEL_SCRIPTS_WEEK1.md. ~45s. On screen: four pattern names appear one at a time. Pairs with Ad 5.',
    caption: `Twenty years of coaching, and effort was almost never the thing that separated people.

Plenty of the ones who got nowhere were working harder than the ones who got somewhere.

What separated them was whether the body was in a state that could use the effort going in.

Put a hard block of training into a body that is protecting itself and it does not come back as muscle. It does not come off as fat. It comes back as fatigue.

There are four patterns that do this, and each one answers to a different correction.

Which is why two people carrying the same fat can need opposite plans.

${CTA}`,
  },
  {
    date: '2026-08-11', time: '07:00', type: 'contrarian', format: 'Reel',
    title: 'Tue Contrarian · REEL · eat less move more is right about one of four',
    notes: 'REEL 2 of 5. ~46s. On screen: ticks and crosses, one per pattern. This is the objection to Monday, killed.',
    caption: `Eat less and move more is not wrong. It is just only right about one of the four patterns.

On a stress-driven pattern, cutting food harder adds another stressor to a system already defending itself. It holds tighter.

On an oestrogen-driven pattern, restriction reads as scarcity. The body conserves harder, and the harder you push the tighter the hold.

On a testosterone-driven pattern, aggressive dieting costs you muscle, and muscle is the thing you were trying to protect.

So the same advice that fixes one pattern actively makes two others worse.

That is not a discipline problem. That is a targeting problem.

${CTA}`,
  },
  {
    date: '2026-08-12', time: '12:00', type: 'pattern', format: 'Reel',
    title: 'Wed Pattern · REEL · where it sits tells you which hormone (comment MAP)',
    notes: 'REEL 3 of 5. ~42s. THE MOST IMPORTANT POST OF THE WEEK. Comment-to-DM keyword MAP. Every commenter is a warm-audience member AND a DM conversation - reply to all of them. On screen: body diagram, zones highlight as named. Pairs with Ad 2.',
    caption: `Where your body stores fat narrows down which hormone is holding it there.

Front of the midsection, while your arms and legs stay lean. That is cortisol.

Mid-back, lower back and the flanks, with the front relatively spared. That is insulin.

Hips, glutes and outer thighs, and later it starts moving toward the middle. That is oestrogen.

And one that is not a place at all. The middle fills while muscle, tone and drive fall together. That is testosterone, and the giveaway is the muscle going, not the fat arriving.

Where it sits narrows it. What comes with it decides.

Comment MAP and I will send you the full breakdown.`,
  },
  {
    date: '2026-08-14', time: '07:00', type: 'coach', format: 'Reel',
    title: 'Fri Coach · REEL · why most plans half work',
    notes: 'REEL 4 of 5. ~45s. On screen: nothing. Face and words only. This is the proof post.',
    caption: `Most plans half work. There is a reason, and it is not you.

A plan built for the wrong driver still does something. You get a bit of movement early, then it stalls, and the obvious conclusion is that you need to try harder.

That is the trap. The half-result is what convinces people the plan was right and they were the problem.

Run a cortisol correction on an insulin pattern and almost nothing moves. Same effort, wrong target.

Which is why the read comes before the prescription. Prescribing before reading is guessing, and guessing is expensive when the cost is a year of your life.

${CTA}`,
  },
  {
    date: '2026-08-16', time: '09:00', type: 'diagnostic', format: 'Reel',
    title: 'Sun Promo · REEL · Challenge invite',
    notes: 'REEL 5 of 5. ~43s. Spoken CTA: link is in the bio.',
    caption: `Fourteen days, free, and there is nothing to buy at the end of it.

Day zero, you do the intake and it reads what state your body is actually in right now.

Day seven, eight markers get scored against where they were on day one. The ones that move matter less than the ones that do not.

Day fourteen, you get the full pattern read. Which of the four is running yours, and what that specific one answers to.

If it turns out you have been running the right effort at the wrong target, fourteen days is a cheap way to find out.

${CTA}`,
  },

  // ── WEEK B · Mon 17 - Sun 23 Aug · INSULIN DRIFT / TIMING ──
  // Themed against Ad 6. RE-POINT at the Round 1 winner after the day 5-7 kill decision.
  {
    date: '2026-08-17', time: '07:00', type: 'authority', format: 'Reel',
    title: 'Mon Authority · REEL · the 3pm crash is a signal, not a willpower gap',
    notes: 'Week B theme = insulin drift, matching Ad 6. RE-POINT if a different concept won Round 1. Reel, film with week B batch.',
    caption: `The afternoon crash, the evening cravings and the fat that will not shift are not three problems. They are one signal.

When insulin stays elevated longer after meals than it should, fat burning stays switched off and cravings get louder. That is the whole mechanism.

The tells line up in a specific order. Energy dips hard between 2 and 4pm. Heavy and foggy for about an hour after eating. Cravings hit hardest after dinner. Storage sits around the back and the sides rather than the front.

Most common in people whose output has changed but whose fuelling has not.

It is not pre-diabetes. That is a diagnosis. This is a state, and states respond to inputs.

${CTA}`,
  },
  {
    date: '2026-08-18', time: '07:00', type: 'contrarian', format: 'Carousel',
    title: 'Tue Contrarian · it is not how many carbs, it is when',
    notes: '6-slide carousel. The objection to Monday. Saveable framework, which is what carousels are for.',
    caption: `Cutting carbs is the first thing people try. It is rarely the thing that was wrong.

Insulin sensitivity is not a fixed number you were issued at birth. It moves with sleep, with muscle mass, with how long you have been sitting, and with what a meal sits next to.

So two people can eat the same carbohydrate and get different outcomes, and the one getting the worse outcome concludes carbs are the enemy.

What actually shifts it: eating them when the body is primed to use them, putting protein and fibre alongside them, and moving within an hour of the meal.

None of that is a restriction strategy. All of it is a timing strategy.

It is not age either. Insulin sensitivity is one of the most responsive systems in the body.

${CTA}`,
  },
  {
    date: '2026-08-19', time: '12:00', type: 'pattern', format: 'Carousel',
    title: 'Wed Pattern · the four timing tells (comment TELLS)',
    notes: 'Comment-to-DM keyword TELLS. Second warm-audience engine post. Carousel, one tell per slide.',
    caption: `Four tells. If three of them are yours, you are probably looking at an insulin pattern.

One. Energy dips hard between 2 and 4pm, and it is not about how you slept.

Two. Heavy and foggy for about an hour after eating, particularly after lunch.

Three. Cravings arrive hardest after dinner, when the day is done and the discipline is gone.

Four. Storage sits around the back, the flanks and the sides, while the front of the stomach stays comparatively flat.

That last one is the discriminator most people miss. Everyone checks the front. The pattern shows itself at the back.

Comment TELLS and I will send you the full set.`,
  },
  {
    date: '2026-08-21', time: '07:00', type: 'coach', format: 'Static',
    title: 'Fri Coach · when the plan should go down, not up',
    notes: 'Proof post. Describes the mechanic, NOT a specific client. Do not attach numbers to a named person.',
    caption: `Most people read a good check-in as permission to push harder. It is usually the opposite.

If a body is holding fat while sleep is broken and energy is crashing, it is protecting itself. Adding a fourth hard session to a protecting body does not change composition. It confirms the threat and the body holds tighter.

The load has to drop far enough that adaptation switches back on. Then the training builds something. Then the composition moves.

This is the part that feels backwards. Fewer sessions, better result.

It only makes sense once you accept that the body is not being stubborn. It is responding exactly as it should to the signals it is being given.

${CTA}`,
  },
  {
    date: '2026-08-23', time: '09:00', type: 'diagnostic', format: 'Static',
    title: 'Sun Promo · Challenge invite (insulin angle)',
    notes: 'Sunday invite, angled at the week B theme.',
    caption: `If the afternoon crash and the evening cravings are yours, fourteen days will tell you whether insulin is the driver.

Day 0, the intake reads your current state. Day 7, eight markers scored against day one. Day 14, the full pattern read.

Free. Nothing to buy at the end of it.

The reason to know which of the four is running yours is simple. Each one answers to a different correction, and running the wrong correction is why so much effort produces so little.

${CTA}`,
  },

  // ── WEEK C · Mon 24 - Sun 30 Aug · IT WAS NEVER DISCIPLINE ──
  // Themed against Ads 12 and 14. RE-POINT at the Round 1 winner.
  {
    date: '2026-08-24', time: '07:00', type: 'authority', format: 'Reel',
    title: 'Mon Authority · REEL · right actions, wrong order',
    notes: 'Week C theme = targeting, matching Ads 12 and 14. Reel, film with week C batch.',
    caption: `Five days a week in the gym, food tracked, alcohol gone, and the shape of the body has not changed in a year.

That is not a discipline problem. The discipline is already proven. It is a sequencing problem.

Composition only changes when a body can afford to spend. A body in protection mode cannot. So the harder someone pushes against it the more it protects, and the exact effort that should be producing the result is what holds it in place.

The order that works is three steps. Read the state. Bring the foundation up. Correct the pattern.

Prescribing before reading is guessing, which is why so many plans half work.

${CTA}`,
  },
  {
    date: '2026-08-25', time: '07:00', type: 'contrarian', format: 'Static',
    title: 'Tue Contrarian · discipline is the most over-diagnosed problem in fitness',
    notes: 'The objection to Monday. Strong standalone quote-style static.',
    caption: `Discipline is the most over-diagnosed problem in this industry.

It is the default explanation because it is the easiest one, and because it puts the failure back on the person rather than on the plan.

Someone showing up five days a week, tracking their food and cutting alcohol has already demonstrated more discipline than most people manage in a decade.

Telling them to want it more is not a diagnosis. It is a shrug.

Four different drivers hold fat in four different ways. Correct the wrong one and the effort still goes in, it just does not come back out as a change in composition.

Same effort. Wrong target. That is a solvable problem, and it has nothing to do with willpower.

${CTA}`,
  },
  {
    date: '2026-08-26', time: '12:00', type: 'pattern', format: 'Carousel',
    title: 'Wed Pattern · which correction does yours answer to (comment ORDER)',
    notes: 'Comment-to-DM keyword ORDER. Third warm-audience engine post.',
    caption: `Four patterns, four different corrections. Running the wrong one is why plans half work.

Cortisol holds it on the front of the middle while the limbs stay lean. It answers to load coming down and sleep being protected, not to more training.

Insulin holds it across the mid-back, lower back and flanks. It answers to meal timing and what sits alongside the carbohydrate, not to cutting them out.

Oestrogen holds it at the hips and thighs, then starts moving it central. It answers to consistent fuelling, not to restriction, which makes it worse.

Testosterone is not a place at all. The middle fills while muscle and drive fall. It answers to protecting muscle first.

Comment ORDER and I will send you which correction goes with which.`,
  },
  {
    date: '2026-08-28', time: '07:00', type: 'coach', format: 'Static',
    title: 'Fri Coach · the markers move before the mirror does',
    notes: 'Proof post. Ties the Day 7 check-in to why 14 days is enough to read something real.',
    caption: `Fourteen days is not long enough to change how a body looks. It is long enough to find out why it is not changing.

Day 7 of the Challenge scores eight markers against where they sat on day one. Morning energy. Afternoon energy. Puffiness and bloating. Sleep. Cravings. Mental clarity. Mood. Digestion.

None of those are body composition. All of them decide it.

A body that is not sleeping, not clearing fluid and crashing at 3pm does not give up fat, whatever the training looks like. The markers move first. The shape follows.

Which is why the ones that improve are not the interesting part. The ones sitting flat are.

${CTA}`,
  },
  {
    date: '2026-08-30', time: '09:00', type: 'diagnostic', format: 'Static',
    title: 'Sun Promo · Challenge invite (targeting angle)',
    notes: 'Sunday invite, angled at the week C theme.',
    caption: `If the effort has been there and the result has not, the problem is probably the target.

Fourteen days, free, and nothing to buy at the end.

Day 0 reads your current state. Day 7 scores eight markers against day one. Day 14 gives you the pattern, which is the one thing that tells you what your effort should have been pointed at the whole time.

You have already proven you will do the work. This just tells you which work.

${CTA}`,
  },
]

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  const db = createClient(url, key)

  // Only ever remove drafts. A published or scheduled post is never touched.
  const { data: existing, error: readErr } = await db
    .from('calendar_posts')
    .select('id, date, title, ig_post_id, scheduled')
    .eq('brand', 'body_recode')
    .eq('platform', 'instagram')
    .neq('type', 'story')
    .gte('date', FROM)
    .lte('date', TO)
  if (readErr) throw readErr

  const removable = (existing ?? []).filter(r => !r.ig_post_id && !r.scheduled)
  const protectedRows = (existing ?? []).filter(r => r.ig_post_id || r.scheduled)
  if (protectedRows.length) {
    console.log(`Leaving ${protectedRows.length} published/scheduled post(s) alone:`)
    protectedRows.forEach(r => console.log(`   ${r.date}  ${r.title}`))
  }
  if (removable.length) {
    const { error } = await db.from('calendar_posts').delete().in('id', removable.map(r => r.id))
    if (error) throw error
    console.log(`Removed ${removable.length} draft post(s) built for the previous plan.`)
  }

  const rows = posts.map(p => ({
    date: p.date,
    time: p.time,
    brand: 'body_recode',
    platform: 'instagram',
    type: p.type,
    phase: 'ads',
    title: p.title,
    caption: p.caption,
    // graphic holds the rendered image PATH (the dashboard filters to values
    // starting with / or http). The format belongs in notes, not here, or it
    // gets overwritten the moment a graphic is generated for this slot.
    graphic: null,
    notes: `${p.format.toUpperCase()} · ${p.notes}`,
    scheduled: false,
  }))

  const { error: insErr } = await db.from('calendar_posts').insert(rows)
  if (insErr) throw insErr

  const reels = posts.filter(p => p.format === 'Reel').length
  const dms = posts.filter(p => p.notes.includes('Comment-to-DM') || p.caption.includes('Comment ')).length
  console.log(`\nInserted ${rows.length} campaign-aligned posts (${FROM} to ${TO}).`)
  console.log(`   ${reels} reels, ${posts.length - reels} carousel/static, ${dms} comment-to-DM engines.`)
  console.log(`   Every post routes to /challenge while paid is live (strategy 11b).`)
  console.log(`\nNEXT: re-point weeks B and C at whichever concept wins Round 1 (day 5-7).`)
}

main().catch(e => { console.error(e); process.exit(1) })
