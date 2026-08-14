// The warm-up calendar: Sat 15 Aug -> Mon 31 Aug, building to the 1 Sep ad restart.
//
// Three decisions shape every post here.
//
// 1. ROUTES TO THE CHALLENGE, NOT THE SCORECARD. The Day 0 intake is the same
//    instrument as the public scorecard - same five sections, same qualifiers,
//    same Fat Map typing - so an enroller gets state-typed either way. Routing
//    to /challenge therefore gets the state capture AND an enrolment AND, most
//    importantly, a person who actually tests whether the Day 7 Check-In prompt
//    works. Scorecard completions test nothing, and proving that fix before ads
//    resume is the whole reason this warm-up exists.
//    Scorecard-first stays correct for COLD paid traffic, where 14 days is too
//    big an ask from a stranger. This audience already follows us.
//
// 2. NO COMMENT-TO-DM KEYWORDS. None of the four ManyChat layers are built. The
//    playbook's own rule is that a dead keyword is worse than no CTA, and the
//    last calendar shipped two of them.
//
// 3. EVERY SLOT PUBLISHES WITHOUT A CAMERA. The last calendar put five reels in
//    six days and none were filmed, so three slots went empty. Here each day has
//    a static or carousel that can go out on its own. Five days carry a reel
//    script as an OPTIONAL upgrade - film it and we swap the video in, don't and
//    the post still runs.
//
// Numbers are real, pulled 13 Aug 2026 from scripts/state-of-the-data.ts across
// 88 completed scorecards. Re-run before publishing and correct any that moved.
//
// Run: npx tsx --env-file=.env.local scripts/seed-warmup-calendar.ts [--dry]

import { createClient } from '@supabase/supabase-js'
import { appendBrFooter } from '../src/lib/br-post-footer'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DRY = process.argv.includes('--dry')

// Routes to the CHALLENGE, not the scorecard. The Day 0 intake is the same
// instrument as the public scorecard, so a Challenge enroller gets state-typed
// either way - routing there gets the state capture AND an enrolment AND a
// person who actually tests the Day 7 check-in fix before ads resume. Scorecard
// completions test nothing, which is the one thing this warm-up exists to do.
// Scorecard-first remains correct for COLD paid traffic; organic already
// follows us, so the 14-day ask is not too big.
const CHALLENGE = 'The free 14-day Body Decode Challenge reads which state you are actually in.'

type Post = {
  date: string; type: 'authority' | 'contrarian' | 'pattern' | 'coach' | 'diagnostic'
  time: string; title: string; caption: string; notes: string; reel?: string
}

const POSTS: Post[] = [
  {
    date: '2026-08-15', type: 'authority', time: '07:00',
    title: 'Sat · State of the Data · 88 scorecards, training scored highest',
    reel: 'State of the Data',
    notes: 'RESTART POST. Opens the account back up with proof rather than an apology for being quiet. On screen: real bar chart of the five foundations, training tallest, sleep shortest - it has to look like data, not decoration. REEL OPTIONAL: script in BR_REEL_SCRIPTS_WEEK1.md (Mon slot). Engagement-first, question CTA.',
    caption: `Eighty-eight people have now finished our scorecard, and I went through the whole set this week. One number stopped me.

It scores five things out of three. Energy, sleep, stress load, how you respond to training, and how you respond to fat loss.

Have a guess which one came out strongest.

Training. Training response was the highest scoring of the five. So this group isn't under-training. That's the part they've got right.

The lowest was sleep. Thirty-eight per cent of them scored the floor on it, and the floor reads "waking through the night, not rested in the morning."

So the thing they're best at is effort, and the thing they're worst at is repair. And they're all sitting there wondering why the effort isn't landing.

Whatever's holding your body back, it probably isn't the part you're trying hardest at.

Out of those five, which one would you score lowest?`,
  },
  {
    date: '2026-08-16', type: 'diagnostic', time: '09:00',
    title: 'Sun Promo · 51% come out Transitioning',
    notes: 'Click-first. The one post this week that carries the link. Reads the audience back to itself before offering anything.',
    caption: `Half the people who finish our scorecard land in the same place. Fifty-one per cent come out Transitioning.

Not depleted, not ready. Stuck in the middle. Doing the work and waiting for it to show up.

Only eighteen per cent come out Ready.

If you're in that middle group, the thing that changes it isn't more effort. It's knowing which of the four drivers is holding the result, because they don't answer to the same correction.

The free 14-day Body Decode Challenge reads it properly. Day zero types your state, day seven scores eight markers against your own baseline, day fourteen gives you the pattern.`,
  },
  {
    date: '2026-08-17', type: 'authority', time: '07:00',
    title: 'Mon Authority · effort was almost never the variable',
    notes: 'Engagement-first, no link. Twenty years of coaching earns the claim in line two rather than spending it in line one.',
    caption: `The hardest workers I have coached were often the ones getting nowhere.

Twenty years, and effort was almost never what separated people.

It was whether the body was in a state that could use the effort going in.

Train hard into a body that is protecting itself and it does not come back as muscle, and it does not come off as fat. It comes back as fatigue.

Four patterns do that. Each one answers to a different correction.

Which is why two people carrying the same fat can need opposite plans.`,
  },
  {
    date: '2026-08-18', type: 'contrarian', time: '07:00',
    title: 'Tue Contrarian · The Autopsy · right about one body in four',
    reel: 'The Autopsy',
    notes: 'On screen: one tick, three crosses. The last two lines are the whole post - do not soften them. REEL OPTIONAL. Engagement-first.',
    caption: `Eat less, move more.

Let's do the autopsy on that one, because it isn't wrong. It's just right about one body in four.

It's right about insulin. Cut the load on an insulin pattern and it responds. Fair enough.

Now run it on a stress pattern. You've just added a stressor to a body that's already defending itself, so it holds tighter.

Run it on falling oestrogen, where restriction reads as scarcity, and the body conserves harder.

Run it on low testosterone and the aggressive diet takes your muscle, which was the one thing you were trying to keep.

One in four. And here's the part that gets me. When it doesn't work on the other three, nobody ever says the advice was wrong. They say you didn't stick to it.

You did stick to it. It was pointed at the wrong body.`,
  },
  {
    date: '2026-08-19', type: 'pattern', time: '12:00',
    title: 'Wed Pattern · 44% store it around the middle, and that tells you nothing',
    reel: 'What Your Fat Storage Says',
    notes: 'On screen: body diagram with the SIGNAL as text beside each zone, not just the zone. NO COMMENT KEYWORD - ManyChat is not built, and a dead keyword is worse than no CTA. Routes to /challenge instead. REEL OPTIONAL.',
    caption: `Forty-four per cent of the people who've done our intake say they store it around the middle.

And on its own, that tells me nothing. Which is exactly the problem.

Three of the four hormones that drive this push fat to the middle. So "belly fat means cortisol" is the most confidently repeated wrong thing in this industry.

Here's the difference. Front of the belly, while your arms and legs are getting thinner? That's cortisol, and the limbs thinning is the tell, not the belly filling.

Mid-back, lower back and the flanks, and you're crashing in the afternoon and craving at night? Same middle. Completely different driver. That one's insulin.

Same place. Opposite corrections.

Where it sits narrows it down. What comes with it is what decides. ${CHALLENGE}`,
  },
  {
    date: '2026-08-21', type: 'coach', time: '18:00',
    title: 'Fri Coach · React to DMs · "clean food, training, no results for months"',
    reel: 'React to DMs',
    notes: 'Strongest post of the fortnight. On screen: the quote as plain text on black for the first six seconds, then face. Nothing else. REEL OPTIONAL. Share CTA, no link.',
    caption: `Someone wrote this on our intake form. This is word for word.

"Consistent clean food. Strength training. No results for months."

That's it. That's the whole thing she wrote.

And I want to point at what isn't in there, because there's no confession in it. No "I fell off." No "I've been slack." She knows exactly what she's doing and she's doing it.

When someone's doing everything right and getting nothing back, nine times out of ten they're running a plan built for a driver they haven't got.

And a plan aimed at the wrong driver still does something. You get a bit of movement early, then it stalls. That half-result is the cruel part, because it's what convinces you the plan was fine and you were the problem.

So if that's you, it isn't discipline. Nobody without discipline asks this question.

Send this to whoever needs to hear it.`,
  },
  {
    date: '2026-08-23', type: 'diagnostic', time: '09:00',
    title: 'Sun Promo · the read comes before the prescription',
    reel: 'The Read',
    notes: 'Click-first. REEL OPTIONAL.',
    caption: `Most plans half work. There is a reason, and it is not you.

A plan built for the wrong driver still does something. A bit of movement early, then it stalls. The obvious conclusion is that you need to try harder.

That is the trap. The half-result convinces people the plan was right and they were the problem.

Which is why the read comes before the prescription. Guessing is expensive when the cost is a year of your life.

${CHALLENGE} It takes two minutes and it costs nothing.`,
  },
  {
    date: '2026-08-24', type: 'authority', time: '07:00',
    title: 'Mon Authority · sleep is the lowest-scoring foundation of the five',
    notes: 'Second State of the Data beat, different number from the 15th so it does not repeat. Engagement-first, question CTA.',
    caption: `Of the five foundations we score, sleep comes out worst. Thirty-eight per cent of people score the floor on it.

The floor reads: waking through the night, not rested in the morning.

Here's why that matters more than it sounds. Nearly everything you want from training happens while you're asleep, not while you're in the gym. The session is the request. Sleep is where the body actually answers it.

So a body that trains hard and sleeps badly isn't building. It's accumulating.

And the group we're looking at scores highest on training and lowest on sleep. They are doing the requesting brilliantly and giving the body no room to answer.

If you had to fix one of those two this month, it wouldn't be the training.`,
  },
  {
    date: '2026-08-25', type: 'contrarian', time: '07:00',
    title: 'Tue Contrarian · discipline is the most over-diagnosed problem in fitness',
    notes: 'Engagement-first. The enemy is the eat-less-move-more machine, not the audience.',
    caption: `Discipline is the most over-diagnosed problem in this industry.

Almost everyone who comes to me has been told, in one way or another, that they need to want it more. Usually by someone selling them the next thing.

Here's what I notice instead. The people who arrive frustrated are almost always the ones already doing the most. Tracking. Training. Up early. Saying no to things.

You don't get to that level of consistency by lacking discipline.

What they're actually missing is a read. Nobody has told them which of the four drivers is holding the result, so they've been applying pressure evenly across everything and hoping.

That's not a character problem. It's an aim problem. And you cannot fix an aim problem by pulling the trigger harder.`,
  },
  {
    date: '2026-08-26', type: 'pattern', time: '12:00',
    title: 'Wed Pattern · the oestrogen one has two phases and they need opposite things',
    notes: 'Real number: 60% of the women who gave cycle status are peri or post-menopausal. Doctrine: phase 1 vs phase 2, and cycle status plus direction of travel is the discriminator. NO COMMENT KEYWORD.',
    caption: `Sixty per cent of the women who complete our scorecard are perimenopausal or past it. So this one matters more than any other here.

The oestrogen pattern has two phases, and they look nothing alike.

Phase one, while the cycle is still regular: it sits on the hips, glutes and outer thighs. That's the one genuinely distinctive location on the whole map.

Phase two, as oestrogen falls away: that same fat starts moving to the middle, and lean mass goes with it.

Here's the trap. In phase two it looks exactly like a stress pattern. Same place, same shape. You cannot tell them apart by looking, and plenty of women get typed wrong because of it.

What separates them is the movement. Stress was central from the start. Oestrogen arrives at the middle from somewhere else.

So the question that decides it isn't where it sits. It's whether where it sits has changed. ${CHALLENGE}`,
  },
  {
    date: '2026-08-28', type: 'coach', time: '18:00',
    title: 'Fri Coach · what a read actually changes',
    notes: 'Engagement-first. Shows the mechanism without a case study, because there is no verified client story to use here. Do not invent one.',
    caption: `People ask what difference a read actually makes, so here it is in plain terms.

Two women, same age, same amount of fat around the middle, same complaint that nothing is moving.

The first one is thinning through the arms and legs while the middle fills, and she is training six days a week. Her correction is to take load out. Fewer hard sessions, protect the sleep, stop asking a defending body for more.

The second one holds it across the back and the flanks, crashes at three in the afternoon, and raids the cupboard after dinner. Her correction is about when she eats and what she eats it with. Her training is fine.

Identical presenting problem. Opposite instructions.

Give either woman the other one's plan and she gets a bit of early movement, then a stall, then the conclusion that she must be the problem.

That is the whole argument for reading before prescribing.`,
  },
  {
    date: '2026-08-30', type: 'diagnostic', time: '09:00',
    title: 'Sun Promo · the strongest Challenge push of the warm-up',
    notes: 'Click-first. Last promo before the ads restart on 1 Sep. Hardest push of the fortnight. Routes to /challenge - wave 1 was at 29 of 50 on 13 Aug, so watch the cap.',
    caption: `If the effort has been there and the result hasn't, the problem is almost never the effort. It's the target.

Four drivers. Four different corrections. Aim at the wrong one and you get a bit of movement, then a stall, then a year of your life.

The scorecard reads which state your body is in right now, in about two minutes. Five questions. No email gymnastics, no upsell at the end of it.

It won't give you a plan. It'll tell you what a plan would need to account for, which is the part almost everyone skips.

${CHALLENGE}`,
  },
  {
    date: '2026-08-31', type: 'authority', time: '07:00',
    title: 'Mon Authority · what the last fortnight of numbers actually said',
    notes: 'Closes the warm-up the day before ads restart. Engagement-first. If ANY number here has moved, re-run state-of-the-data.ts and correct it before this publishes.',
    caption: `Two weeks of numbers, and the same thing keeps showing up.

Of the five foundations we score, training response comes out highest. Sleep comes out lowest. Half of everyone lands in the middle state, doing the work and waiting for it to show.

Put those together and you get a fairly unflattering picture of the advice this industry gives.

We have an entire market telling people to train harder and eat less, aimed at a group whose training is already the strongest thing they've got and whose recovery is the weakest.

That's not a motivation gap. It's a targeting failure, and it's been dressed up as a character flaw for about thirty years.

Read the state first. Then decide what to change. In that order, every time.`,
  },
]

async function main() {
  // Refuse to touch anything already live.
  const { data: existing } = await db.from('calendar_posts')
    .select('id, date, posted_at, scheduled_publish_at')
    .eq('brand', 'body_recode').gte('date', '2026-08-15').lte('date', '2026-08-31')
  const live = (existing ?? []).filter(r => r.posted_at || r.scheduled_publish_at)
  if (live.length) { console.log(`ABORT: ${live.length} rows in range are posted or scheduled.`); return }

  console.log(`${DRY ? '[dry run] ' : ''}Seeding ${POSTS.length} posts, 15-31 Aug\n`)
  for (const p of POSTS) {
    const words = p.caption.split(/\s+/).length
    console.log(`  ${p.date} ${p.time}  ${p.type.padEnd(11)} ${p.reel ? '[reel opt] ' : '           '}${p.title.slice(0, 54)}`)
    console.log(`      ${words} words   ${/scorecard/i.test(p.caption) ? 'LINK' : 'engagement'}`)
    if (DRY) continue
    const { error } = await db.from('calendar_posts').insert({
      brand: 'body_recode', platform: 'instagram', phase: 'warmup',
      date: p.date, time: p.time, type: p.type, title: p.title,
      // Store the sign-off, matching what the dashboard does on save. Otherwise
      // the calendar shows a caption that differs from what publishes.
      caption: appendBrFooter(p.caption), notes: p.reel ? `REEL OPTIONAL (${p.reel}) · ${p.notes}` : p.notes,
    })
    if (error) console.log(`      ERROR ${error.message}`)
  }
  console.log(`\n${DRY ? '[dry run] ' : ''}Done. Graphics attach separately.`)
}
main()
