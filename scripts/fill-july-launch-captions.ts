// One-shot script to draft starter captions for every empty calendar_posts
// row in the 2026-07-01 to 2026-07-15 launch window.
//
// Per feedback_no_ai_caption_drafts the default is to leave captions blank
// for Kade to write. Override granted explicitly in this session: "i want
// you to write them". These are STARTING DRAFTS - Kade is expected to edit
// before posting.
//
// Match logic: WHERE date = X AND title LIKE '%fragment%'. Idempotent: only
// updates rows where caption IS NULL OR caption = ''.
//
// Run: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/fill-july-launch-captions.ts

import { createClient } from '@supabase/supabase-js'

const captions: Array<{ date: string; titleLike: string; caption: string }> = [

  // ── BR feed posts (body_recode) ─────────────────────────────────────

  {
    date: '2026-07-01',
    titleLike: '%Launch tease%decoded in 14 days%',
    caption: `Three years coaching, ten years coaching, twenty years coaching - the pattern shows up the same way.

People doing the work. Training hard. Eating clean. Sleeping right. And the body still won't move.

It isn't effort. It's pattern.

Your body has settled into a specific state. Until you name that state, you keep prescribing for the wrong one.

I built something to read it. In 14 days. Free. The full reveal in two weeks.

Swipe to see what's coming.

#bodyrecode #bodydecode #patternoverdiscipline #14daybodydecode #fitnessover35`,
  },

  {
    date: '2026-07-03',
    titleLike: '%perimenopause plan%',
    caption: `Perimenopause changes the math.

It changes what your body holds, what it lets go of, what it responds to, what it ignores. The plan that worked at 32 lands differently at 47. Different hormonal landscape. Different recovery curve. Different relationship to load, food, sleep, stress.

That's not opinion. That's biology.

So before I write a perimenopause plan, I read the state. What is the system actually doing? Where is it spending? Where is it depleted? Where is it conserving? What pattern has it settled into?

The plan is downstream of the read. Not the other way around.

If you've been told "you just need to push harder" and your body is screaming the opposite - it might be time for a different conversation.

The 14-Day Body Decode opens 13 July. Free.

#perimenopause #womenshealth #bodyrecode #14daybodydecode`,
  },

  {
    date: '2026-07-03',
    titleLike: '%20 years coaching%origin story%',
    caption: `After 20 years coaching people through the same plateau, the same belief, the same frustration - I built the wrong thing first.

For two decades I built training programs and nutrition systems. Stronger. Leaner. Better.

It worked for the people who needed it.

But for the people who came in already doing the work, already strong, already disciplined, and still stuck - the answer was never another plan.

The answer was a read. What state has the body actually settled into? What pattern is it running?

That should have been my first product. Twenty years late, here it is.

Live Monday 13 July. Free. 14 days.

#bodyrecode #bodydecode #coachingisreading #14daybodydecode`,
  },

  {
    date: '2026-07-05',
    titleLike: '%Three years postnatal%',
    caption: `Three years out and the body still hasn't returned to anything that feels like itself.

The training that worked before children doesn't land the same way now. The food you ate before doesn't sit the same way now. The sleep you got before is a memory. The recovery you took for granted is now the rate-limiting step.

So why would the same plan that worked at 28 work now?

It doesn't. And not because you're failing it. Because it's the wrong plan for the body you have now.

The body is running a different operating system. You don't push harder against the new system. You read it. Then you write a plan calibrated to it.

If you've been doing the work and the body won't budge - it's time to read what's actually happening.

The 14-Day Body Decode opens 13 July. Free.

#postnatal #motherhood #womenshealth #bodyrecode #14daybodydecode`,
  },

  {
    date: '2026-07-05',
    titleLike: '%Date reveal%I built something%',
    caption: `The read should come first.

Before the workout plan, before the nutrition reset, before the supplements, before the bloodwork - what state is your body actually in?

I built a free 14-day diagnostic to answer that. It opens Monday 13 July.

No payment. No upsell at the door. You walk away with a read on what's actually driving the way your body is responding (or not responding) to everything you're doing.

If it lands, the next step gets obvious. If it doesn't, you've spent 14 days with a clearer picture of your own body. You lose nothing.

13 July. Free.

#bodyrecode #bodydecode #readbeforeprescribe #14daybodydecode`,
  },

  {
    date: '2026-07-06',
    titleLike: '%At 45 your body runs%',
    caption: `At 25 the body forgives almost anything. At 45 it forgives almost nothing.

Same training load. Same diet. Same sleep deficit. Two completely different responses.

What worked at 25 - push hard, eat clean, recover fast, repeat - was working on a body running a different operating system. Testosterone in a different range. Insulin sensitivity in a different range. Recovery infrastructure in a different range. Cortisol baseline in a different range.

Most men at 45 are running their 25-year-old playbook on a 45-year-old body and wondering why the numbers won't move.

The playbook isn't broken. It's just the wrong playbook for the body you're in now.

Read the body first. Then write a playbook calibrated to it.

The 14-Day Body Decode opens 13 July. Free.

#mensfitness #fitnessover40 #midlifefitness #bodyrecode #14daybodydecode`,
  },

  {
    date: '2026-07-06',
    titleLike: '%Full Challenge reveal%',
    caption: `Full reveal.

The 14-Day Body Decode Challenge opens one week from today.

What you get across 14 days: training calibrated to your body state, nutrition timed to clear the noise, a daily coaching note, and at Day 14 the read - the pattern your body has actually settled into, what it means, what it isn't (the common misreads), and three actions specific to it.

No payment. No upsell at the door. The result is yours.

This is for the people who've been doing the work and not getting the return on it. The plateau crowd. The "I'm doing everything right and nothing is changing" crowd.

If that's you - 13 July, 7am AEST. Free.

#bodyrecode #bodydecode #14daybodydecode #fitnessover40`,
  },

  {
    date: '2026-07-07',
    titleLike: '%Why I am running this for free%',
    caption: `Not "free trial." Not "first week free." Free.

Here's why.

The read - the diagnostic part, the part that names what your body is actually doing - should never sit behind a paywall.

Most paid programs bury the read inside the sales journey. By the time you find out what your body needs, you're locked in and paying.

I'd rather you take the read first. If it lands, you'll know exactly what the next step is. If it doesn't, you finish the 14 days with a real read on your own body, and you've lost nothing.

That's why it's free.

13 July.

#bodyrecode #bodydecode #14daybodydecode`,
  },

  // Fallback if previous title doesn't match (apostrophe variant)
  {
    date: '2026-07-07',
    titleLike: "%running this%for free%",
    caption: `Not "free trial." Not "first week free." Free.

Here's why.

The read - the diagnostic part, the part that names what your body is actually doing - should never sit behind a paywall.

Most paid programs bury the read inside the sales journey. By the time you find out what your body needs, you're locked in and paying.

I'd rather you take the read first. If it lands, you'll know exactly what the next step is. If it doesn't, you finish the 14 days with a real read on your own body, and you've lost nothing.

That's why it's free.

13 July.

#bodyrecode #bodydecode #14daybodydecode`,
  },

  {
    date: '2026-07-08',
    titleLike: '%Inside the Challenge%',
    caption: `People keep asking what actually happens across 14 days.

Day 1 is setup. You read the structure. You set the baseline. No training yet.

Days 2 to 6 are the reset. Training calibrated to your state. Nutrition timed to clear noise. Recovery is a deliberate input, not an afterthought.

Day 7 is a 5-minute Check-In. That's the signal that makes Day 14 possible.

Days 8 to 13 are the climb. Training intensity rises. Nutrition stays simple. The body settles.

Day 14 is the Report. Your pattern, named. What it means. What it isn't. Three actions specific to it.

That's the 14 days. Free. Opens 13 July.

#bodyrecode #bodydecode #14daybodydecode`,
  },

  // Fallback title fragment for Jul 8 carousel
  {
    date: '2026-07-08',
    titleLike: '%Pattern%inside%',
    caption: `People keep asking what actually happens across 14 days.

Day 1 is setup. You read the structure. You set the baseline. No training yet.

Days 2 to 6 are the reset. Training calibrated to your state. Nutrition timed to clear noise. Recovery is a deliberate input, not an afterthought.

Day 7 is a 5-minute Check-In. That's the signal that makes Day 14 possible.

Days 8 to 13 are the climb. Training intensity rises. Nutrition stays simple. The body settles.

Day 14 is the Report. Your pattern, named. What it means. What it isn't. Three actions specific to it.

That's the 14 days. Free. Opens 13 July.

#bodyrecode #bodydecode #14daybodydecode`,
  },

  {
    date: '2026-07-10',
    titleLike: '%Blueprint tease%',
    caption: `The Challenge reads the pattern. That's free. That's the 14 days.

The Blueprint corrects it. That's the six weeks after.

Read first. Then act. In that order.

If the read at Day 14 lands and you want to actually move on it, the Blueprint is the structured six-week correction specific to your pattern. Not a generic program. The one calibrated to what the read found.

Take the Challenge first. The Blueprint is there if you want it after.

#bodyrecode #bodyblueprint #14daybodydecode`,
  },

  {
    date: '2026-07-12',
    titleLike: '%Tomorrow%',
    caption: `Tomorrow.

7am AEST, Monday 13 July, the doors open on the free 14-Day Body Decode Challenge.

If you've been doing the work and watching the returns drop - this is the first move that works.

Not because it's harder. Because it reads what's actually happening first.

14 days. Free. The result is yours.

Tomorrow.

#bodyrecode #bodydecode #14daybodydecode`,
  },

  {
    date: '2026-07-15',
    titleLike: '%Doors open%',
    caption: `The 14-day read is now open.

Take it whenever you're ready. There's no cohort, no start date, no countdown. You enrol, the 14 days begin from your enrolment, the read lands at Day 14.

Free. No payment at any point.

For the people who've been doing the work and not getting the response. Read first. Then act.

Link in bio.

#bodyrecode #bodydecode #14daybodydecode`,
  },

  // ── Personal brand (@kade_dunstone_) ─────────────────────────────────

  {
    date: '2026-07-04',
    titleLike: '%After 20 years of coaching%',
    caption: `Twenty years coaching, and the first thing I built was a training program.

I should have built the read first.

For two decades I watched smart, capable people grind themselves down chasing the wrong correction because nobody had ever read what their body was actually doing. They were prescribed for a body they no longer had.

I built training. I built nutrition. I built mindset frameworks. They all helped the people who needed them.

But the people who came in already doing the work, and still stuck - they needed the read.

So I built it. Twenty years late, but I built it.

Live 13 July. Free.

#identityrebuild #foundervoice #performancecoaching`,
  },

  {
    date: '2026-07-08',
    titleLike: '%read comes before the prescription%',
    caption: `In every domain that matters - medicine, engineering, strategy, coaching - the read comes before the prescription. Every time.

The cardiologist reads the heart before they write the script. The structural engineer reads the load before they design the brace. The CFO reads the books before they recommend the cut.

In fitness and body composition, somehow we skipped that step.

Most plans get prescribed to a generic body. Generic week. Generic protocol. Generic timing.

Then we wonder why the response is generic - or absent.

Read your body. Then prescribe to it.

That's the work I'm putting in front of the world Monday.

#thinking #performancecoaching #readbeforeprescribe`,
  },

  {
    date: '2026-07-11',
    titleLike: '%body you had%body you have now%',
    caption: `A body at 25 and a body at 45 are running different operating systems.

A body before children and a body after children are running different operating systems.

A body in a calm season and a body in a high-stress season are running different operating systems.

The training and nutrition plans that worked for one rarely work for the other. And the harder you push the old plan on the new body, the further you drift from a useful response.

Most plateaus aren't a failure of effort. They're a failure of read. The plan is calibrated to a body that no longer exists.

The 14-Day Body Decode opens Monday. Free. Built for exactly this.

#body #fitness #readyourbody`,
  },

  {
    date: '2026-07-12',
    titleLike: '%14-Day Body Decode opens%',
    caption: `Tomorrow.

14 days, free, the read your body should have had years ago.

Built for the people who've done the work, hit the wall, and need to know what the wall actually is before they swing harder at it.

7am AEST. Monday.

#bodydecode #launchweek`,
  },

  // ── Archetype hooks (existing pre-session posts, all BR feed) ──────

  {
    date: '2026-07-01',
    titleLike: "%Stuck isn't a discipline problem%",
    caption: `Stuck isn't a discipline problem. It's a state.

The story most people are told - and tell themselves - is that the body isn't moving because they aren't trying hard enough. More discipline. More effort. More restriction. More cardio.

It's almost never true.

What's actually happening: the body has settled into a specific state. A specific pattern. A specific way of holding what it's holding and protecting what it's protecting.

You don't override a state with more discipline. You read it. Then you work with it.

Discipline applied to the wrong read produces nothing but burnout.

#bodyrecode #stateoverdiscipline #patternoverdiscipline`,
  },

  {
    date: '2026-07-07',
    titleLike: '%most disciplined person in the room%',
    caption: `You're the most disciplined person in the room. That's why it isn't working.

Counterintuitive but true.

The clients who plateau hardest are usually the most disciplined. They train more than anyone else, eat cleaner than anyone else, recover better than anyone else - and the body still won't move.

Because discipline applied at full volume to a system that's already in protect-mode just locks the protection in deeper. The body reads "more stress" and responds the same way it always does: hold what you have, slow what you're spending, store what's surplus.

The fix isn't less discipline. It's a different read.

When you know what state the body has actually settled into, the discipline finally has the right job.

The 14-Day Body Decode opens 13 July. Free.

#bodyrecode #performance #14daybodydecode`,
  },

  {
    date: '2026-07-08',
    titleLike: '%wired, tired, holding weight at the middle%',
    caption: `Wired, tired, and holding weight at the middle? That's a cortisol signature.

Three things tend to show up together:

- Hard to wind down at night, hard to wake up in the morning
- Energy that feels borrowed, not earned
- Weight that won't shift from the middle no matter what you do

It's not random. It's a pattern.

When the body has been running high-stress hormonal output for long enough, it shifts into a defensive metabolic state. Fat gets preferentially parked at the middle. Sleep architecture frays. Recovery slows. Training that should be working stops working.

The correction isn't more discipline. It's reading the state correctly and prescribing for it.

The 14-Day Body Decode reads exactly this. Opens 13 July. Free.

#cortisol #stressandfatloss #bodyrecode #14daybodydecode`,
  },

  {
    date: '2026-07-10',
    titleLike: '%mums I coach%never read properly%',
    caption: `The mothers I coach aren't behind. They were never read properly.

After a body holds a pregnancy, then nurses, then sleeps in fragments for years, then carries the cognitive load of everything that comes with it - it's a different body.

Different hormonal profile. Different recovery capacity. Different relationship to load. Different storage logic. Different timing for everything.

Then we hand them a generic plan written for a body that no longer exists. Wonder why nothing moves.

The plan isn't the problem. The starting point is.

Read the body you have now. Then write a plan calibrated to it.

The 14-Day Body Decode opens 13 July. Free.

#postnatal #motherhood #womenshealth #bodyrecode`,
  },

  {
    date: '2026-07-12',
    titleLike: '%every protocol and nothing held%',
    caption: `Tried every protocol and nothing held? Read the state first.

The pattern I see most often:

- Six months on protocol A. Small wins. Lost them.
- Six months on protocol B. Small wins. Lost them.
- Six months on protocol C. Small wins. Lost them.

It looks like a failure of consistency. It usually isn't.

It's a failure of READ. None of the protocols were prescribed to the state the body was actually in. Each one worked for a window because any well-structured input beats none. Then the body adapted, re-settled, and the wins evaporated.

The pattern that breaks the cycle is reading first. What state is the body in right now? Then prescribing to it.

The 14-Day Body Decode opens tomorrow. Free.

#bodyrecode #readbeforeprescribe #14daybodydecode`,
  },

  {
    date: '2026-07-13',
    titleLike: '%Cortisol decides where you store fat%',
    caption: `Cortisol decides where you store fat. Discipline doesn't override it.

Chronic high cortisol preferentially deposits fat at the midsection. Belly. Lower back. Around the organs. This is biology, not failure.

You can train clean, eat clean, sleep when you can, and STILL hold the middle if cortisol is the dominant signal the body is reading.

The fix isn't pushing harder. Pushing harder usually raises cortisol further. Which makes it worse.

The fix is reading cortisol's role correctly and lowering its dominance through the right inputs - which are often counterintuitive to what most people are doing.

The 14-Day Body Decode reads this. Live now. Free.

#cortisol #bellyfat #stress #bodyrecode #14daybodydecode`,
  },

  {
    date: '2026-07-14',
    titleLike: '%More cardio in perimenopause%',
    caption: `More cardio in perimenopause is the fastest way to hold the weight.

This sounds backwards. It isn't.

In perimenopause the system is already running elevated cortisol, lower oestrogen, increasingly insulin-resistant tissue, and a stress-response that's been worn thin by twenty-plus years of life.

Stack high-volume cardio on top of that and the body reads "more stress." It responds the way it always does to more stress: hold what you have, slow what you're spending, preserve fuel reserves.

The correction in perimenopause is usually less cardio, more lifting, more recovery, and food calibrated to insulin signal - not less.

But you have to read the state to know that. Generic "do more cardio" advice is the wrong prescription for the state.

The 14-Day Body Decode reads it. Free.

#perimenopause #womenshealth #cardio #bodyrecode #14daybodydecode`,
  },

  {
    date: '2026-07-15',
    titleLike: '%More training, less food, and you got softer%',
    caption: `More training, less food, and you got softer. Here's what that means.

If you've pushed training up and food down for a sustained period and the body has responded by getting softer, slower, and more stubborn - your body has shifted into a defensive metabolic state.

Specifically: it's reading the elevated training plus reduced food as an existential signal and is now PROTECTING what's left.

- Metabolic rate down to match intake
- Fat storage prioritised over fat release
- Hormonal output (thyroid, gonadal, etc) reduced
- Sleep quality often degraded
- Recovery slower

This is not a discipline problem. This is the body doing exactly what it's built to do under prolonged restriction.

The fix is not more restriction. The fix is reading what state the body is in and prescribing the right correction - which usually involves eating more, training less, and rebuilding the metabolic infrastructure before you ask anything of it.

The 14-Day Body Decode reads exactly this. Live now. Free.

#metabolicadaptation #bodyrecomp #bodyrecode #14daybodydecode`,
  },
]

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env missing - run with `set -a && source .env.local && set +a`')
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  let updated = 0
  let skipped = 0
  let notFound = 0
  const seen = new Set<string>()

  for (const { date, titleLike, caption } of captions) {
    // Find candidate empty rows for (date, title)
    const { data: rows, error } = await supabase
      .from('calendar_posts')
      .select('id, title, caption, type')
      .eq('date', date)
      .neq('type', 'story') // never touch story rows; only feed/long posts get captions
      .ilike('title', titleLike)
    if (error) {
      console.error(`[!] query error for ${date} / ${titleLike}:`, error.message)
      continue
    }
    if (!rows || rows.length === 0) {
      console.log(`[-] no rows: ${date} / ${titleLike}`)
      notFound++
      continue
    }
    for (const row of rows) {
      if (seen.has(row.id)) continue
      if (row.caption && row.caption.trim().length > 0) {
        console.log(`[=] skip filled: ${date} / "${row.title.slice(0, 60)}..." (${row.caption.length} chars existing)`)
        skipped++
        seen.add(row.id)
        continue
      }
      const { error: updErr } = await supabase
        .from('calendar_posts')
        .update({ caption })
        .eq('id', row.id)
      if (updErr) {
        console.error(`[!] update error ${row.id}:`, updErr.message)
        continue
      }
      console.log(`[+] FILLED ${date} / "${row.title.slice(0, 60)}..." (${caption.length} chars)`)
      updated++
      seen.add(row.id)
    }
  }
  console.log(`\nDone. Filled ${updated} · Skipped ${skipped} (already had caption) · Not found ${notFound}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
