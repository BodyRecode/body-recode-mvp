// Shared catalogue of the four Body Decode Check-In patterns.
// Used by:
//   - src/lib/challenge-checkin-emails.ts (Day 14 Body Decode Report email)
//   - src/lib/inngest-functions.ts (Day 14 step)
//   - src/app/api/challenge/quiz/route.ts (late-taker Day 14 send)
//   - src/app/challenge/[token]/body-decode-check-in.tsx (in-portal Day 14 view)
// Keep these consumers in lock-step. Edit here, not in the call sites.
//
// Content fields (added 2026-05-30 for the Day 14 pattern-focused rebuild):
//   - desc: 2-3 sentence summary anchor for the pattern hero card.
//   - whatItMeans: 3 paragraphs of doctrinal interpretation. Why the
//     markers manifest the way they do. Mechanism, not symptom list.
//   - whereItShows: 4 bullets of lived expression. How the pattern
//     actually feels in the body and in daily life.
//   - whatItIsNot: 4 bullets of anti-shame misreads. What the pattern
//     is commonly mistaken for, written to defuse the self-blame default
//     (laziness, willpower, ageing, "just calories").
//   - actions: 3 pattern-specific actions for what comes next.

export type CheckinPattern = {
  label: string
  color: string
  desc: string
  whatItMeans: string[]
  whereItShows: string[]
  whatItIsNot: string[]
  actions: string[]
}

export const CHECKIN_PATTERNS: Record<string, CheckinPattern> = {
  'stress-stored': {
    label: 'Stress-Stored Pattern',
    color: '#DC2626',
    desc: 'Your body is storing and retaining in response to a chronic stress load. Cortisol and adrenaline are keeping your system in a state of low-grade alert, which signals your body to hold fat around the midsection as an energy reserve.',
    whatItMeans: [
      'Your nervous system has been operating in low-grade alert for long enough that your body has decided to store as a safety mechanism. Cortisol does not respond to logic. It responds to load. Until the load drops, the storage stays.',
      'The midsection is where this pattern lives because cortisol receptors are densest in abdominal fat. The body is reading high cortisol as a signal to keep an energy reserve close to vital organs. The reset you have done this week begins to lower that signal.',
      'This is a regulation pattern, not a metabolism pattern. The fix is not more effort. The fix is less alert. Most of the corrective work happens overnight, when cortisol curves reset.',
    ],
    whereItShows: [
      'You wake tired but become wired by mid-morning.',
      'You feel like you are doing everything right but the midsection does not move.',
      'Hard sessions leave you flat for two days, not energised.',
      'Fat comes off arms, legs, and face. The waist holds.',
    ],
    whatItIsNot: [
      'Not laziness. You are likely doing more than your nervous system can recover from.',
      'Not a calorie problem. Restricting harder makes cortisol higher, which makes the pattern worse.',
      'Not a willpower failure. Your body is making a regulatory decision, not a moral one.',
      'Not permanent. Cortisol curves correct in weeks once the load drops.',
    ],
    actions: [
      'Sleep is your highest leverage point. Cortisol resets overnight. Prioritise sleep quality above everything else this week.',
      'Keep training intensity moderate. Hard sessions spike cortisol further and can slow progress in this pattern.',
      'Eat breakfast within 60 minutes of waking. This supports your morning cortisol curve and begins the process of hormonal regulation for the day.',
    ],
  },
  'metabolic-drift': {
    label: 'Insulin-Drift Pattern',
    color: '#B7791F',
    desc: 'Your body\'s ability to manage blood sugar has drifted. Insulin is staying elevated longer than it should, which drives energy crashes, persistent cravings, and the heaviness you feel after meals.',
    whatItMeans: [
      'Your body\'s ability to manage insulin has drifted from where it used to sit. Insulin stays elevated longer than it should after meals, which keeps fat-burning suppressed and fuels persistent cravings.',
      'This is most common in people whose training response has changed but whose fuelling pattern has not adjusted. The strategy that worked when output was higher is the strategy that creates drift when output drops.',
      'Insulin sensitivity is not a fixed trait. It is a state. States respond to inputs. Yours has been running on inputs that no longer match your current output, and the nutrition structure this week was designed to begin the rebuild.',
    ],
    whereItShows: [
      'Energy crashes in the mid-afternoon, around 2-4pm.',
      'Cravings hit hardest in the evening, after dinner.',
      'You feel heavy and foggy for an hour after eating.',
      'Weight settles low on the torso. Around the lower abdomen and love handles.',
    ],
    whatItIsNot: [
      'Not pre-diabetes. Insulin drift is a state. Pre-diabetes is a diagnosis. The two share signals; they are not the same thing.',
      'Not "too many carbs." The issue is when and around what they are eaten, not whether they exist in the diet.',
      'Not your age. Insulin sensitivity is one of the most responsive systems in the body. Weeks of correct inputs move it.',
      'Not a permanent metabolic decline. The drift is the signal. The signal corrects when the fuelling structure corrects.',
    ],
    actions: [
      'Never skip breakfast. Blood sugar stability starts with your first meal. Skipping it creates a deficit that drives cravings throughout the rest of the day.',
      'Walk after your evening meal. Even 15-20 minutes significantly lowers post-meal blood sugar.',
      'Keep starchy carbohydrates strictly to the post-training window. Fruit is fine throughout the day. It metabolises differently to refined carbohydrates.',
    ],
  },
  'hormonal-shift': {
    label: 'Estrogen-Shift Pattern',
    color: '#8b5cf6',
    desc: 'Your body is in an oestrogen-driven conservation state. Storing and retaining as a protective mechanism driven by reproductive hormone signalling. Commonly associated with perimenopause, post-hormonal contraceptive adjustment, and states of chronic under-eating.',
    whatItMeans: [
      'Your body is in an oestrogen-driven conservation state. Storage and retention as a protective mechanism, driven by reproductive hormone signalling that is recalibrating.',
      'This is one of the most common patterns in women approaching or moving through perimenopause, post-contraceptive adjustment, or chronic under-eating. It is also one of the most mismanaged. The default response is more restriction. The pattern responds to more restriction by conserving harder.',
      'The fix is not less food or more training. The fix is rebuilding the hormonal environment the body wants to release from. That requires consistent fuelling, recovery, and rhythm rather than effort piled on top of an already stressed system.',
    ],
    whereItShows: [
      'Storage settles in the hips, glutes, and outer thighs.',
      'Bloating and water retention shift unpredictably across the month.',
      'Sleep becomes lighter and more disrupted.',
      'Mood, motivation, and capacity vary more than they used to.',
    ],
    whatItIsNot: [
      'Not "just menopause." Menopause is a transition. This is a pattern within it that responds to inputs.',
      'Not a sign you need to eat less. Caloric restriction in this pattern makes the body conserve harder, not release.',
      'Not a willpower failure. Your hormonal environment has changed; your body is responding to it correctly.',
      'Not the end of progress. It is a different stage of progress with different rules.',
    ],
    actions: [
      'Avoid under-eating. This pattern responds poorly to caloric restriction. The body conserves harder when it perceives scarcity.',
      'Prioritise sleep and recovery. Oestrogen balance is deeply tied to overnight restoration.',
      'Be consistent with meal timing. Irregular eating disrupts the hormonal signals your body uses to decide whether to conserve or release stored energy.',
    ],
  },
  'system-overload': {
    label: 'Androgen-Decline Pattern',
    color: '#1B6DFC',
    desc: 'Your body is in a state of declining androgen function. Testosterone is no longer signalling muscle maintenance and recovery the way it once did. The result is reduced drive, slower recovery, and a sense that capacity is slipping despite consistent effort.',
    whatItMeans: [
      'Your testosterone signalling has declined to a level where the muscle, drive, and recovery you once relied on are no longer being properly supported. The orchestra is missing its conductor.',
      'This commonly presents in men from their mid-thirties onward. It is frequently missed or attributed to ageing as a fixed variable rather than a hormonal state that responds to inputs.',
      'Progress in this pattern requires reducing total system demand and rebuilding the inputs that support testosterone synthesis. Sleep, dietary fat, strength stimulus, and recovery. More volume on a depleted base makes the pattern worse, not better.',
    ],
    whereItShows: [
      'Capacity feels like it is slipping despite consistent effort.',
      'Recovery takes longer than it used to, often double.',
      'Drive and energy feel lower across work and life, not just training.',
      'Storage settles around the lower abdomen and chest while muscle mass quietly recedes.',
    ],
    whatItIsNot: [
      'Not just ageing. Testosterone is a state. States respond to inputs.',
      'Not a sign you need to train harder. More volume on a depleted hormonal base makes the pattern worse.',
      'Not a low-fat-diet problem. Low-fat diets actively suppress testosterone production. Fat is structural, not optional.',
      'Not a permanent decline. The right inputs move testosterone in weeks, not years.',
    ],
    actions: [
      'Protect deep sleep. Testosterone synthesis happens during deep sleep. It is non-negotiable. Prioritise it above everything.',
      'Eat enough protein and fat. Low-fat diets actively suppress testosterone production. Build meals around protein and do not fear dietary fat.',
      'Train hard but rest harder. Strength stimulus is what signals testosterone synthesis. Recovery is what realises it. Do not chase volume.',
    ],
  },
}
