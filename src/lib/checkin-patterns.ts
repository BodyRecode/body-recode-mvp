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
    desc: 'Your body is holding on because it has been under a heavy load for a long time. It reads that load as a reason to keep a reserve close, and that reserve sits around your middle.',
    whatItMeans: [
      'Your body has been running on high alert long enough that it has started treating stored fat as a safety net. That is not a decision you can talk it out of. It changes when the load comes down.',
      'The middle is where this one sits, because that is where the body keeps a reserve it might need in a hurry. It is not a sign you have eaten badly. It is a sign your body has decided this is not a good time to let go of anything.',
      'Which is why more effort has not worked. The problem is not that you are doing too little. It is that you are asking your body to recover from more than it currently can. Most of the correction happens while you sleep, which is why sleep is the first thing we look at.',
    ],
    whereItShows: [
      'You wake tired but become wired by mid-morning.',
      'You feel like you are doing everything right but the midsection does not move.',
      'Hard sessions leave you flat for two days, not energised.',
      'Fat comes off arms, legs, and face. The waist holds.',
    ],
    whatItIsNot: [
      'Not laziness. You are likely doing more than your nervous system can recover from.',
      'Not a calorie problem. Eating less puts more stress on the system, and that makes this one worse.',
      'Not a willpower failure. Your body has made a decision about safety, not about your character.',
      'Not permanent. This one moves within weeks once the load comes down.',
    ],
    actions: [
      'Sleep matters more here than anything else you could change. Most of the correction happens overnight, so protect it first.',
      'Keep training moderate for now. Hard sessions add to the load, and in this pattern that slows you down rather than speeding you up.',
      'Eat within an hour of waking. It steadies things early and sets up the rest of the day.',
    ],
  },
  'metabolic-drift': {
    label: 'Insulin-Drift Pattern',
    color: '#B7791F',
    desc: 'Your body has got less good at handling the fuel you give it. Blood sugar stays up longer after meals than it should, which keeps fat burning switched off and keeps you hungry at night.',
    whatItMeans: [
      'After you eat, your body should deal with the fuel and then switch back to burning what it has stored. Yours is staying in the first half of that for too long, so the switch back keeps getting delayed.',
      'This usually turns up in people whose training has changed but whose eating has not. What worked when you were doing more becomes the thing that causes the problem when you are doing less.',
      'It is not permanent and it is not a fixed part of you. It responds to when and what you eat far more than to how much, which is why cutting harder tends to do nothing at all.',
    ],
    whereItShows: [
      'Energy crashes in the mid-afternoon, around 2-4pm.',
      'Cravings hit hardest in the evening, after dinner.',
      'You feel heavy and foggy for an hour after eating.',
      'It sits around the back and sides, so mid back, lower back and love handles more than the front.',
    ],
    whatItIsNot: [
      'Not pre-diabetes. Insulin drift is a state. Pre-diabetes is a diagnosis. The two share signals; they are not the same thing.',
      'Not "too many carbs." The issue is when and around what they are eaten, not whether they exist in the diet.',
      'Not your age. This is one of the quickest things in the body to respond, and weeks of the right changes shift it.',
      'Not a permanent decline. It changes when what you eat, and when you eat it, changes.',
    ],
    actions: [
      'Never skip breakfast. Blood sugar stability starts with your first meal. Skipping it creates a deficit that drives cravings throughout the rest of the day.',
      'Walk after your evening meal. Even 15-20 minutes significantly lowers post-meal blood sugar.',
      'Keep starchy carbs to the meal after training. Fruit is fine any time of day, because your body handles it differently.',
    ],
  },
  'hormonal-shift': {
    label: 'Estrogen-Shift Pattern',
    color: '#8b5cf6',
    desc: 'Oestrogen has changed, and your body has responded by holding on to more than it used to. This is the pattern behind fat that sits on the hips and thighs, or that has started moving towards your middle.',
    whatItMeans: [
      'Oestrogen does more than most people realise, and where your body stores fat is one of the things it decides. As it changes, that decision changes with it, and so does the shape of what you are carrying.',
      'This is one of the most common patterns in women, and one of the most badly handled. The usual advice is to eat less, and this is the one pattern where eating less makes it worse rather than just slower.',
      'The way out is not less food or more training. It is giving your body enough of what it needs, often enough, that it stops treating this as something to protect against. Steady fuelling, real recovery and rhythm, instead of more effort piled on a body that is already stretched.',
    ],
    whereItShows: [
      'It sits on the hips, glutes and outer thighs, and later starts moving towards the middle.',
      'Bloating and water retention shift unpredictably across the month.',
      'Sleep becomes lighter and more disrupted.',
      'Mood, motivation, and capacity vary more than they used to.',
    ],
    whatItIsNot: [
      'Not "just menopause." Menopause is a transition. This is a pattern within it that responds to inputs.',
      'Not a sign you need to eat less. In this pattern, eating less makes your body hold on tighter rather than let go.',
      'Not a willpower failure. What your hormones are doing has changed, and your body is responding exactly as it should.',
      'Not the end of progress. It is a different stage of progress with different rules.',
    ],
    actions: [
      'Do not undereat. This is the pattern where eating less backfires, because your body reads short rations as a reason to hold on.',
      'Protect sleep and recovery. A lot of what needs to settle here settles overnight.',
      'Eat at roughly the same times each day. Irregular eating muddies the signals your body uses to decide whether to hold on or let go.',
    ],
  },
  'system-overload': {
    label: 'Androgen-Decline Pattern',
    color: '#1B6DFC',
    desc: 'Testosterone has dropped to the point where it is no longer supporting muscle, recovery and drive the way it used to. The work still goes in. Less of it comes back.',
    whatItMeans: [
      'Testosterone is what tells your body to build and repair after you train. When it drops, the same training gives you less, and recovery takes longer than it used to.',
      'This usually starts in men from their mid-thirties. It tends to get put down to age and left there, when it is actually a level that moves depending on what you do.',
      'Getting it back means asking less of the system for a while and rebuilding what supports it: sleep, enough fat in the diet, real strength work and proper recovery. More volume on an already depleted base makes it worse.',
    ],
    whereItShows: [
      'Capacity feels like it is slipping despite consistent effort.',
      'Recovery takes longer than it used to, often double.',
      'Drive and energy feel lower across work and life, not just training.',
      'It settles around the lower stomach and chest, while muscle quietly goes the other way.',
    ],
    whatItIsNot: [
      'Not just ageing. This is a level that moves depending on what you do.',
      'Not a sign you need to train harder. More work on an already flat system makes it worse.',
      'Not a low-fat-diet problem. Low-fat diets actively suppress testosterone production. Fat is structural, not optional.',
      'Not a permanent decline. The right changes move it in weeks, not years.',
    ],
    actions: [
      'Protect deep sleep. That is when your body does the rebuilding, so it comes before everything else.',
      'Eat enough protein and fat. Low-fat diets actively suppress testosterone production. Build meals around protein and do not fear dietary fat.',
      'Train hard, rest harder. Lifting is the signal; recovery is what turns it into anything. Do not chase volume.',
    ],
  },
}
