// Shared catalogue of the four Body Decode Check-In patterns.
// Used by:
//   - src/app/api/challenge/quiz/route.ts (Day 7 immediate-send fallback if a participant submits on/after Day 14)
//   - src/lib/inngest-functions.ts (Day 14 Result Reveal email)
//   - src/app/challenge/[token]/body-decode-check-in.tsx (in-portal result display)
// Keep these three consumers in lock-step. Edit here, not in the call sites.

export type CheckinPattern = {
  label: string
  color: string
  desc: string
  actions: string[]
}

export const CHECKIN_PATTERNS: Record<string, CheckinPattern> = {
  'stress-stored': {
    label: 'Stress-Stored Pattern',
    color: '#DC2626',
    desc: 'Your body is storing and retaining in response to a chronic stress load. Cortisol and adrenaline are keeping your system in a state of low-grade alert, which signals your body to hold fat around the midsection as an energy reserve. The reset you have done this week is directly targeting this. The full picture requires understanding exactly how your stress hormones are behaving across the day.',
    actions: [
      'Sleep is your highest leverage point. Cortisol resets overnight. Prioritise sleep quality above everything else this week.',
      'Keep training intensity moderate. Hard sessions spike cortisol further and can slow progress in this pattern.',
      'Eat breakfast within 60 minutes of waking. This supports your morning cortisol curve and begins the process of hormonal regulation for the day.',
    ],
  },
  'metabolic-drift': {
    label: 'Insulin-Drift Pattern',
    color: '#B7791F',
    desc: 'Your body\'s ability to manage blood sugar has drifted. Insulin is staying elevated longer than it should, which drives energy crashes, persistent cravings, and the heaviness you feel after meals. Common in former athletes whose training response has changed but whose fuelling strategy has not adjusted. The nutrition structure you have been following this week is designed specifically for this. Restricting starchy carbohydrates to the post-training window forces your body to rebuild insulin sensitivity over time.',
    actions: [
      'Never skip breakfast. Blood sugar stability starts with your first meal. Skipping it creates a deficit that drives cravings throughout the rest of the day.',
      'Walk after your evening meal. Even 15-20 minutes significantly lowers post-meal blood sugar.',
      'Keep starchy carbohydrates strictly to the post-training window. Fruit is fine throughout the day. It metabolises differently to refined carbohydrates.',
    ],
  },
  'hormonal-shift': {
    label: 'Estrogen-Shift Pattern',
    color: '#8b5cf6',
    desc: 'Your body is in an oestrogen-driven conservation state. Storing and retaining as a protective mechanism driven by reproductive hormone signalling. Commonly associated with perimenopause, post-hormonal contraceptive adjustment, and states of chronic under-eating. One of the most common patterns and one of the most mismanaged. Typically treated with more restriction, which makes it worse.',
    actions: [
      'Avoid under-eating. This pattern responds poorly to caloric restriction. The body conserves harder when it perceives scarcity.',
      'Prioritise sleep and recovery. Oestrogen balance is deeply tied to overnight restoration.',
      'Be consistent with meal timing. Irregular eating disrupts the hormonal signals your body uses to decide whether to conserve or release stored energy.',
    ],
  },
  'system-overload': {
    label: 'Androgen-Decline Pattern',
    color: '#1B6DFC',
    desc: 'Your body is in a state of declining androgen function. Testosterone is no longer signalling muscle maintenance and recovery the way it once did. The result is reduced drive, slower recovery, and a sense that capacity is slipping despite consistent effort. Commonly presenting in men from their mid-thirties onward, and frequently missed or attributed to ageing as a fixed variable rather than a manageable hormonal state. Progress requires reducing total system demand and rebuilding the inputs that support testosterone signalling.',
    actions: [
      'Protect deep sleep. Testosterone synthesis happens during deep sleep. It is non-negotiable. Prioritise it above everything.',
      'Eat enough protein and fat. Low-fat diets actively suppress testosterone production. Build meals around protein and do not fear dietary fat.',
      'Train hard but rest harder. Strength stimulus is what signals testosterone synthesis. Recovery is what realises it. Do not chase volume.',
    ],
  },
}
