// Per-day runbook config for the Today dashboard.
//
// Each date maps to a day-specific block: title (where in the arc),
// checks (recurring ops items to tick off), decisions (time-bound choices
// due today or this week), and notes (any plain-language context).
//
// Mirrors the structured content of:
//   - 2026-06-29_Launch_Day_Runbook_Mon_13_Jul.md (Mon 13 Jul)
//   - 2026-06-30_Post_Launch_Operational_Runbook.md (Tue 14 Jul → Sun 24 Aug)
//   - 2026-06-30_Post_Launch_6_Week_Strategy.md (decision triggers)
//
// Edit this file when the docs change. The Today dashboard reads from here.

// A check can be a plain string (just a tick item) OR an object with
// instructions that render below the task on the Today dashboard.
export type RunbookCheck = string | { task: string; instructions: string }

export interface RunbookEntry {
  date: string // YYYY-MM-DD
  label: string // short title, e.g. "Pre-launch · Week before"
  phase: 'pre_launch' | 'launch_day' | 'week_1' | 'week_2' | 'week_3' | 'week_4' | 'week_5' | 'week_6' | 'post_arc'
  checks: RunbookCheck[] // tickable items (DM sweep, dashboard check, log scan, etc.)
  decisions: string[] // anything time-bound to decide today (or imminent)
  notes?: string[] // free-form context
}

// Recurring daily ritual that fires every weekday Tue 14 Jul onwards.
// Each entry has detailed step-by-step instructions that render under
// the task on the Today dashboard so Kade doesn't need to remember the
// flow each morning.
const DAILY_RITUAL: RunbookCheck[] = [
  {
    task: 'AM dashboard Wave Status + Meta Events Manager Lead-event sweep',
    instructions: [
      '1. Scroll down on this page to the 📊 Live metrics card. Confirm the Wave count is climbing as expected (target: blue/amber dot next to Wave label, not red).',
      '2. Open [Strategy → Paid Ads tab](/dashboard/business/strategy) → Wave Status card for the full detail view + full spot count breakdown.',
      '3. Open [Meta Business Suite (Body Recode)](https://business.facebook.com/latest/home?global_scope_id=1254275259802098&business_id=1254275259802098&page_id=882297731632982&asset_id=882297731632982) → left sidebar → "All tools" → "Events Manager". In Events Manager → Overview tab → confirm Lead events are firing in the last 24h. If zero: check [Vercel runtime logs](https://vercel.com/info-41827747s-projects/body-recode/logs) for /api/challenge/enroll errors AND verify META_CAPI_ACCESS_TOKEN is set in [Vercel env vars](https://vercel.com/info-41827747s-projects/body-recode/settings/environment-variables).',
    ].join('\n'),
  },
  {
    task: 'AM feedback triage dashboard - check unseen',
    instructions: [
      '1. Open [Feedback triage](/dashboard/feedback) → filter chip "Unseen".',
      '2. For each row: read the response. Click "✓ Mark seen". Tag sentiment (😊/😐/😟).',
      '3. If a quote is publishable: click "📧 Send consent email" (fires the 2-step permission flow).',
      '4. If churn risk signal: click "⚠ Flag churn risk".',
      'Target: zero unseen by EOD.',
    ].join('\n'),
  },
  {
    task: 'AM DM / comment / email reply pass (last 12-18h)',
    instructions: [
      '1. Open [Instagram @body_recode_](https://www.instagram.com/body_recode_/) → notifications tab → reply to comments + DMs (priority: paying clients + recent enrolees).',
      '2. Open [Gmail inbox](https://mail.google.com/mail/u/0/#inbox) → reply to any Challenge / Blueprint / coaching questions to kade@bodyrecode.au.',
      '3. Open [LinkedIn notifications](https://www.linkedin.com/notifications/) → reply to comments on most recent executive-reframe post if any.',
      'Target: <12h reply window during launch period. Active reply mode signals high-touch coaching.',
    ].join('\n'),
  },
  {
    task: 'Mid-afternoon Vercel runtime logs - scan for 5xx errors',
    instructions: [
      '1. Open [body-recode runtime logs](https://vercel.com/info-41827747s-projects/body-recode/logs) → Runtime filter.',
      '2. Scan for any 5xx errors in last 4-6h (filter by status >= 500).',
      '3. Common expected non-errors: 409 wave_full (after Wave N fills - this is correct rejection, not a bug).',
      '4. If 5xx errors found: capture the route + timestamp + error message, paste in DM to me, I diagnose + fix.',
      'Skip on weekends if no posts are firing.',
    ].join('\n'),
  },
  {
    task: 'Evening DM / comment sweep',
    instructions: [
      '1. Same as AM ritual - [Instagram](https://www.instagram.com/body_recode_/) + [email](https://mail.google.com/mail/u/0/#inbox) + [LinkedIn](https://www.linkedin.com/notifications/) pass.',
      '2. Catches anything that landed during the work day.',
      '3. Final tidy: any urgent items get scheduled for tomorrow AM if you can\'t address tonight.',
    ].join('\n'),
  },
]

// Week-specific ops bumps that get added to the daily ritual
const WEEK_2_OPS: RunbookCheck[] = [
  {
    task: 'Feedback dashboard daily sweep (Day 14 captures starting to land)',
    instructions: [
      '1. Open [Feedback triage](/dashboard/feedback) → filter chip "Unseen".',
      '2. Filter stage to "challenge" - launch-day cohort Day 14 captures start landing this week.',
      '3. Each row: mark seen + tag sentiment. High-signal ones → fire consent email.',
      'The Day 14 in-portal card is your PEAK testimonial moment - expect 30-60% capture rate.',
    ].join('\n'),
  },
]
const WEEK_3_OPS: RunbookCheck[] = [
  {
    task: 'Watch Blueprint enrolment dashboard daily',
    instructions: [
      '1. Open [Business dashboard](/dashboard/business) → confirm Blueprint sales counting up as Day 14 cohort ascends.',
      '2. Target for Week 3: 5-15 Blueprint enrolments from launch-day Day 14 cohort.',
      '3. If lagging: check Day 14 Report email open + click rates in Resend logs.',
    ].join('\n'),
  },
  {
    task: 'Manually fire consent emails for high-signal feedback',
    instructions: [
      '1. Open [Feedback triage](/dashboard/feedback) → filter "Granted unpublished".',
      '2. For each granted quote: click "📌 Mark published" + note where you published (site homepage, IG story, etc).',
      '3. Also filter "Awaiting consent" → for pending high-signal captures fire the consent email now.',
    ].join('\n'),
  },
]
const WEEK_4_OPS: RunbookCheck[] = [
  {
    task: 'Test Membership LP enrolment flow',
    instructions: [
      '1. Open [Membership LP](https://bodyrecode.au/membership) in incognito.',
      '2. Walk through the enrolment form with throwaway email.',
      '3. Verify: welcome email lands, portal access works, week-1 experience renders.',
      'Do this BEFORE Mon 10 Aug flip. Any bug here blocks Membership launch.',
    ].join('\n'),
  },
  {
    task: 'Review Membership LP copy before Mon 10 Aug flip',
    instructions: [
      '1. Open [Membership LP](https://bodyrecode.au/membership) → read every headline + block.',
      '2. Verify pricing matches locked strategy ($49/wk per memory).',
      '3. Verify Blueprint→Membership ascension flow copy on Blueprint Week 6 completion page.',
    ].join('\n'),
  },
]
const WEEK_5_OPS: RunbookCheck[] = [
  {
    task: 'Reply to Membership enrolment questions',
    instructions: [
      '1. Same as daily DM ritual but priority: Membership questions.',
      '2. Watch for "how is this different from Blueprint?" - answer per Membership LP framing.',
      '3. First-week Members deserve high-touch onboarding - book a 15-min intro Loom for each if capacity allows.',
    ].join('\n'),
  },
  {
    task: 'Walk first new Members through their portal experience',
    instructions: [
      '1. Open [Business dashboard](/dashboard/business) → new Members list.',
      '2. Impersonate 2-3 fresh Member portals - verify week-1 experience is clean.',
      '3. If broken: file the issue in Vercel logs + fix same day (first week impressions matter).',
    ].join('\n'),
  },
]
const WEEK_6_OPS: RunbookCheck[] = [
  {
    task: 'Continue feedback dashboard sweeps',
    instructions: [
      'Same as Week 2-5 pattern. [Feedback triage](/dashboard/feedback) → Unseen → mark seen + tag sentiment + consent-email publishable quotes.',
    ].join('\n'),
  },
  {
    task: 'Publish granted testimonials on /blueprint LP',
    instructions: [
      '1. Open [Feedback triage](/dashboard/feedback) → filter "Granted unpublished".',
      '2. Copy the quote + attribution.',
      '3. Edit blueprint page (src/app/blueprint/page.tsx) → add testimonial to testimonial block → commit + push.',
      '4. Back on dashboard → click "📌 Mark published" on the row, note location.',
    ].join('\n'),
  },
]

export const RUNBOOK: RunbookEntry[] = [
  // ── PRE-LAUNCH (now through Sun 12 Jul) ──
  {
    date: '2026-06-30',
    label: 'Pre-launch · ~2 weeks out',
    phase: 'pre_launch',
    checks: [...DAILY_RITUAL, 'Verify launch readiness - run `npm run check:launch`'],
    decisions: ['Awaiting Aimee response on AF Newstead Founding Partner proposal (target tomorrow Tue 1 Jul)'],
    notes: ['Most build is shipped. Remaining = external action (Aimee, Meta UI, Amanda HeyGen).'],
  },
  {
    date: '2026-07-01',
    label: 'Pre-launch · Aimee deadline',
    phase: 'pre_launch',
    checks: [...DAILY_RITUAL],
    decisions: ['🚨 Aimee response on AF Newstead deadline TODAY - if no answer by EOD, default to "no" path (delete DRAFT assets + email --no-af-newstead flag)'],
  },
  ...generatePreLaunchDays(),

  // ── LAUNCH DAY (Mon 13 Jul) ──
  {
    date: '2026-07-13',
    label: 'LAUNCH DAY · Mon 13 Jul · Wave 1 opens 7am AEST',
    phase: 'launch_day',
    checks: [
      {
        task: '7:00 - Flip NEXT_PUBLIC_CHALLENGE_LIVE=true in Vercel + redeploy',
        instructions: [
          '1. Open [body-recode env vars](https://vercel.com/info-41827747s-projects/body-recode/settings/environment-variables).',
          '2. Find NEXT_PUBLIC_CHALLENGE_LIVE → Edit → change from `false` to `true` → Save.',
          '3. Open [Deployments tab](https://vercel.com/info-41827747s-projects/body-recode/deployments) → click ⋯ on latest → Redeploy.',
          '4. Wait ~90 sec → open [bodyrecode.au/challenge](https://bodyrecode.au/challenge) in incognito → verify signup form shows (NOT waitlist).',
        ].join('\n'),
      },
      {
        task: '7:00 - Same flip on performance-bodyrecode project',
        instructions: [
          '1. Open [performance-bodyrecode env vars](https://vercel.com/info-41827747s-projects/performance-bodyrecode/settings/environment-variables).',
          '2. Same NEXT_PUBLIC_CHALLENGE_LIVE flip → false → true → Save → redeploy.',
          '3. Verify: [scorecard result page](https://performance.bodyrecode.au/scorecard) → Depleted state CTA now points at live Challenge, not waitlist.',
        ].join('\n'),
      },
      {
        task: '7:05 - Activate Stressed Exec ad set in Meta Ads Manager (keep other 2 PAUSED)',
        instructions: [
          '1. Open [Meta Ads Manager](https://adsmanager.facebook.com/adsmanager/manage/adsets) → BR-FunnelB-Leads-2026Q3 campaign.',
          '2. Stressed Exec ad set → toggle to Active.',
          '3. **Leave Perimenopausal + Slipping HP PAUSED** (Option D Phase 1 locked - only unpause them if Sat 19 Jul retro triggers Phase 2 unlock).',
          '4. Verify ad set status column shows Active.',
        ].join('\n'),
      },
      {
        task: '7:08 - Fire Wave 1 broadcast email',
        instructions: [
          '1. Open Terminal.',
          '2. Run: `cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/launch-day-waitlist-email.ts --live --wave=1`',
          '3. Expect console output: `[launch-email] Wave 1 broadcast (initial launch)` then `[launch-email] DONE. Sent N · Failed 0`',
          '4. Spot-check kade@bodyrecode.au inbox for BCC copies arriving (should see ~N BCCs where N = waitlist row count).',
          '5. If Aimee declined AF Newstead partnership: add `--no-af-newstead` flag to strip the founding-partner block.',
        ].join('\n'),
      },
      {
        task: '7:15-end of day - Post stories per the Launch Day Story Posting Checklist',
        instructions: [
          '1. Open the [Launch Day Story Posting Checklist PDF](file:///Users/kadedunstone/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/00_LAUNCH_2026_07_13_FUNNEL_B/2026-06-30_Launch_Day_Story_Posting_Checklist.md) for time-by-time.',
          '2. Also on this dashboard: 📸 Stories today section shows all 6 with tickable list.',
          '3. iCal reminders on your phone fire 5min before each slot (all 6 today).',
          'Story times: 7:30 / 10:00 / 12:30 / 15:00 / 17:30 / 20:00.',
        ].join('\n'),
      },
      {
        task: '7:25 - Post Mon Authority feed post',
        instructions: [
          '1. Open [Content Calendar](/dashboard/business/strategy) → Content Calendar tab → click on Mon 13 Jul.',
          '2. Find the Mon Authority feed post → click Schedule button (or Post now if not already scheduled).',
          'Alternative: since it should already be scheduled from Sun 6 Jul scheduling pass, it fires automatically via our IG publisher cron.',
        ].join('\n'),
      },
      {
        task: '7:30 - Kade personal email to inner circle (10-20 close contacts)',
        instructions: [
          '1. Open [Gmail](https://mail.google.com/mail/u/0/#inbox) → Compose.',
          '2. Personal note (not templated) to 10-20 close contacts: family, friends, past clients who\'d want a direct heads-up.',
          '3. Simple frame: "Doors are open today, would mean a lot to have you in the first wave. Take it or share it: bodyrecode.au/challenge"',
          '4. Send individually, not BCC blast (feels different).',
        ].join('\n'),
      },
      {
        task: 'Active reply mode on DMs / comments / email all day',
        instructions: [
          '1. [Instagram @body_recode_](https://www.instagram.com/body_recode_/) - reply to every comment + DM within 30 min today.',
          '2. [Gmail inbox](https://mail.google.com/mail/u/0/#inbox) - reply to every Challenge enrolment question same-day.',
          '3. [LinkedIn](https://www.linkedin.com/notifications/) - reply to comments on the LinkedIn launch post.',
          'Launch day = high-touch signal. Every reply seen by others creates social proof.',
        ].join('\n'),
      },
    ],
    decisions: ['Monitor Wave Status card every hour - if hitting cap fast, prep Wave 2 announcement'],
  },

  // ── WEEK 1 (Tue 14 Jul - Sun 19 Jul) ──
  {
    date: '2026-07-14',
    label: 'Week 1 Day 2 · Optimisation event swap',
    phase: 'week_1',
    checks: [...DAILY_RITUAL, 'PM - Swap Meta campaign optimisation event from CompleteRegistration → Lead', 'Post Tue Contrarian feed post'],
    decisions: [],
  },
  { date: '2026-07-15', label: 'Week 1 Day 3 · LinkedIn + Pattern', phase: 'week_1', checks: [...DAILY_RITUAL, 'Post Wed Pattern feed post', 'Post LinkedIn long-form (week 1 reflection)'], decisions: [] },
  { date: '2026-07-16', label: 'Week 1 Day 4 · Personal brand day', phase: 'week_1', checks: [...DAILY_RITUAL, 'Post @kade_dunstone_ personal brand card', 'Spot-check Day 0 portal of 2-3 fresh enrolees'], decisions: [] },
  { date: '2026-07-17', label: 'Week 1 Day 5 · Coach feature + Day 5 cohort check', phase: 'week_1', checks: [...DAILY_RITUAL, 'Post Fri Coach feed post', 'PM - Check Day 5 cohort (Mon 13 enrolees) - Week One Progress Session video unlock'], decisions: [] },
  { date: '2026-07-18', label: 'Week 1 Day 6 · Light day', phase: 'week_1', checks: [...DAILY_RITUAL.slice(0, 3), '2-3 stories', 'Catch up on DMs from week'], decisions: [] },
  {
    date: '2026-07-19',
    label: 'Week 1 · SAT RETRO',
    phase: 'week_1',
    checks: [
      {
        task: 'Open Launch Week Retro Template and fill in',
        instructions: [
          '1. Open the [Launch Week Retro Template](file:///Users/kadedunstone/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/00_LAUNCH_2026_07_13_FUNNEL_B/2026-06-30_Launch_Week_Retro_Template.md).',
          '2. **Headline numbers**: Total enrolments, ad spend, CPL, completion rates, unseen feedback count.',
          '3. **Wave dynamics**: Did Wave 1 fill? How many days? Fill rate curve?',
          '4. **Ad-variant performance**: pull top 3 + bottom 3 from [Meta Ads Manager](https://adsmanager.facebook.com/adsmanager/manage/ads).',
          '5. **Funnel drop-off**: where did leads disappear between click → enrolment → Day 0 intake completion?',
          '6. Save as dated copy: `2026-07-19_Launch_Week_Retro.md` (do NOT overwrite the template).',
        ].join('\n'),
      },
      {
        task: 'Sunday Diagnostic post prep',
        instructions: [
          '1. Open [Content Calendar](/dashboard/business/strategy) → find Sun 20 Jul Diagnostic post.',
          '2. Verify it\'s scheduled (⏱ badge). If not → click Schedule.',
        ].join('\n'),
      },
      {
        task: 'Sleep early',
        instructions: [
          'Week 2 starts Monday with high-signal decisions (Phase 2 budget unlock + Wave 2 announcement). Fresh Monday > exhausted Sunday.',
        ].join('\n'),
      },
    ],
    decisions: [
      '🚦 Phase 2 budget gate (Option D): if CPL ≤ $5 AND Wave 1 filled <7 days → unpause Perimenopausal + Slipping HP ad sets at $25/day each. Otherwise hold at $25/day.',
      'Wave decision: if Wave 1 filled → announce + open Wave 2 Mon morning. If not → hold + reassess Sat 26 Jul.',
    ],
  },

  // ── WEEK 2 (Mon 20 Jul - Sun 26 Jul) ──
  {
    date: '2026-07-20',
    label: 'Week 2 Day 1 · Phase 2 ad spend OR Wave 2 announcement',
    phase: 'week_2',
    checks: [...DAILY_RITUAL, ...WEEK_2_OPS, 'Post Mon Authority feed post'],
    decisions: ['Phase 2 unlocked? Activate Peri + Slipping HP ad sets in Meta', 'Wave 2 opening? Set CHALLENGE_CURRENT_WAVE=2 + redeploy + fire wave-2 broadcast email'],
  },
  { date: '2026-07-21', label: 'Week 2 Day 2 · Diagnostic + first Day 14 captures', phase: 'week_2', checks: [...DAILY_RITUAL, ...WEEK_2_OPS, 'Post Tue Diagnostic feed post', 'Post LinkedIn long-form'], decisions: [] },
  { date: '2026-07-22', label: 'Week 2 Day 3 · Pattern + mid-week ad checkpoint', phase: 'week_2', checks: [...DAILY_RITUAL, ...WEEK_2_OPS, 'Quick CPL + enrolment-rate review - pause underperforming ad sets if lagging', 'Post Wed Pattern feed post'], decisions: [] },
  { date: '2026-07-23', label: 'Week 2 Day 4 · Personal brand', phase: 'week_2', checks: [...DAILY_RITUAL, ...WEEK_2_OPS, 'Post personal brand card'], decisions: [] },
  { date: '2026-07-24', label: 'Week 2 Day 5 · Coach feature', phase: 'week_2', checks: [...DAILY_RITUAL, ...WEEK_2_OPS, 'Post Fri Coach feed post (Blueprint deep-dive teaser)'], decisions: [] },
  { date: '2026-07-25', label: 'Week 2 Day 6 · Light + LinkedIn', phase: 'week_2', checks: [...DAILY_RITUAL.slice(0, 3), 'LinkedIn second post of week'], decisions: [] },
  {
    date: '2026-07-26',
    label: 'Week 2 · FIRST DAY 14 REPORTS LAND',
    phase: 'week_2',
    checks: ['Sunday Diagnostic post', '🚨 PM - Day 14 Body Decode Report emails fire automatically for launch-day cohort', 'Priority reply to Day 14 Report email responses', 'Watch Blueprint sales dashboard for first conversions'],
    decisions: [],
  },

  // ── WEEK 3 (Mon 27 Jul - Sun 2 Aug) ──
  { date: '2026-07-27', label: 'Week 3 Day 1 · Wave 3 (if applicable) + Blueprint drive', phase: 'week_3', checks: [...DAILY_RITUAL, ...WEEK_3_OPS, 'Post Mon Authority feed post (Blueprint angle)'], decisions: ['If Wave 2 filled → open Wave 3 (CHALLENGE_CURRENT_WAVE=3) + broadcast + announcement post'] },
  { date: '2026-07-28', label: 'Week 3 Day 2 · First testimonials live', phase: 'week_3', checks: [...DAILY_RITUAL, ...WEEK_3_OPS, 'Publish first granted testimonials on /blueprint LP + 1 IG story per testimonial', 'Post Tue Diagnostic + LinkedIn'], decisions: [] },
  { date: '2026-07-29', label: 'Week 3 Day 3 · Pattern + Blueprint cohort milestone', phase: 'week_3', checks: [...DAILY_RITUAL, ...WEEK_3_OPS, 'Post Wed Pattern feed post'], decisions: [] },
  { date: '2026-07-30', label: 'Week 3 Day 4 · Membership tease + Personal brand', phase: 'week_3', checks: [...DAILY_RITUAL, ...WEEK_3_OPS, 'Post personal brand card', 'Membership LP: confirm waitlist capture firing'], decisions: [] },
  { date: '2026-07-31', label: 'Week 3 Day 5 · Coach feature', phase: 'week_3', checks: [...DAILY_RITUAL, ...WEEK_3_OPS, 'Post Fri Coach feed post'], decisions: [] },
  { date: '2026-08-01', label: 'Week 3 Day 6 · LinkedIn', phase: 'week_3', checks: [...DAILY_RITUAL.slice(0, 3), 'LinkedIn post'], decisions: [] },
  {
    date: '2026-08-02',
    label: 'Week 3 · Blueprint take-rate checkpoint',
    phase: 'week_3',
    checks: ['Sunday Diagnostic post', '🚨 PM - Day 21 feedback emails fire automatically for launch-day cohort'],
    decisions: ['🚦 Blueprint take-rate vs target. If hitting target → activate Membership pre-launch warming heavily Week 4. If lagging → debug Blueprint LP + Day 14 Report email CTA.'],
  },

  // ── WEEK 4 (Mon 3 - Sun 9 Aug) ──
  { date: '2026-08-03', label: 'Week 4 Day 1 · Mid-Blueprint milestone + Wave 4 prep', phase: 'week_4', checks: [...DAILY_RITUAL, ...WEEK_4_OPS, 'Post Mon Authority feed post', 'Manually DM Blueprint Week 3 enrolees to check fit'], decisions: ['If Wave 3 filled → set CHALLENGE_CURRENT_WAVE=4 (evergreen flip) + final wave-announcement post'] },
  { date: '2026-08-04', label: 'Week 4 Day 2 · LinkedIn + first case-study', phase: 'week_4', checks: [...DAILY_RITUAL, ...WEEK_4_OPS, 'Post Tue Contrarian + LinkedIn', 'Stories: 2 dedicated to a granted-permission case study'], decisions: [] },
  { date: '2026-08-05', label: 'Week 4 Day 3 · Pattern + Membership LP review', phase: 'week_4', checks: [...DAILY_RITUAL, ...WEEK_4_OPS, 'Post Wed Pattern feed post', 'Membership LP final copy review + design pass'], decisions: [] },
  { date: '2026-08-06', label: 'Week 4 Day 4 · Personal brand', phase: 'week_4', checks: [...DAILY_RITUAL, ...WEEK_4_OPS, 'Post personal brand card'], decisions: [] },
  { date: '2026-08-07', label: 'Week 4 Day 5 · Coach + Membership pre-launch email', phase: 'week_4', checks: [...DAILY_RITUAL, ...WEEK_4_OPS, 'Post Fri Coach feed post', 'Email to existing Blueprint enrolees teasing Membership availability Mon 10 Aug'], decisions: [] },
  { date: '2026-08-08', label: 'Week 4 Day 6 · LinkedIn + Membership LP sanity test', phase: 'week_4', checks: [...DAILY_RITUAL.slice(0, 3), 'LinkedIn post', 'Test Membership LP enrolment flow end-to-end with throwaway email', 'Test Membership env vars present on Vercel'], decisions: [] },
  {
    date: '2026-08-09',
    label: 'Week 4 · Membership pre-launch ritual',
    phase: 'week_4',
    checks: ['Sunday Diagnostic post', 'Run npm run check:launch (verify Membership-side env vars)', 'Confirm Membership-segmented waitlist signups present', 'Prep Membership broadcast script', 'Devices charged, sleep early'],
    decisions: [],
  },

  // ── WEEK 5 (Mon 10 - Sun 16 Aug) ──
  {
    date: '2026-08-10',
    label: 'Week 5 · MEMBERSHIP LAUNCH DAY',
    phase: 'week_5',
    checks: [
      '7:00 - Flip NEXT_PUBLIC_MEMBERSHIP_LIVE=true in Vercel + redeploy',
      '7:05 - Fire Membership waitlist broadcast: `npx tsx scripts/launch-day-waitlist-email.ts --live --product=membership`',
      '7:10 - Email to all existing Blueprint enrolees with Membership availability',
      '7:15 - Drop Membership launch stories (4-5 across day)',
      '7:25 - Post Mon Authority feed post (Membership launch)',
      'Active reply mode all day',
    ],
    decisions: ['Track Membership LP conversion rate: Blueprint cohort vs cold visitors'],
  },
  { date: '2026-08-11', label: 'Week 5 Day 2 · LinkedIn + Diagnostic', phase: 'week_5', checks: [...DAILY_RITUAL, ...WEEK_5_OPS, 'Post Tue Diagnostic + LinkedIn (Membership angle)'], decisions: [] },
  { date: '2026-08-12', label: 'Week 5 Day 3 · Pattern', phase: 'week_5', checks: [...DAILY_RITUAL, ...WEEK_5_OPS, 'Post Wed Pattern feed post'], decisions: [] },
  { date: '2026-08-13', label: 'Week 5 Day 4 · Personal brand + Blueprint Week 6 cohort', phase: 'week_5', checks: [...DAILY_RITUAL, ...WEEK_5_OPS, 'Post personal brand card', 'Launch-day Blueprint enrolees hit Week 6 - Day 30 sustainability check fires; reach out personally'], decisions: [] },
  { date: '2026-08-14', label: 'Week 5 Day 5 · Coach + first Blueprint→Membership ascensions', phase: 'week_5', checks: [...DAILY_RITUAL, ...WEEK_5_OPS, 'Post Fri Coach feed post', 'Track first Blueprint completer ascensions to Membership'], decisions: [] },
  { date: '2026-08-15', label: 'Week 5 Day 6 · LinkedIn + Membership baseline', phase: 'week_5', checks: [...DAILY_RITUAL.slice(0, 3), 'LinkedIn post'], decisions: [] },
  {
    date: '2026-08-16',
    label: 'Week 5 · Membership baseline checkpoint',
    phase: 'week_5',
    checks: ['Sunday Diagnostic post'],
    decisions: ['🚦 Initial Membership take-rate baseline. Members enrolled this week / Blueprint completers (target 30-50%). Members / cold visitors (target 1-3%).'],
  },

  // ── WEEK 6 (Mon 17 - Sun 24 Aug) ──
  { date: '2026-08-17', label: 'Week 6 Day 1 · Evergreen cadence starts', phase: 'week_6', checks: [...DAILY_RITUAL, ...WEEK_6_OPS, 'Post Mon Authority feed post'], decisions: [] },
  { date: '2026-08-18', label: 'Week 6 Day 2 · Contrarian + LinkedIn', phase: 'week_6', checks: [...DAILY_RITUAL, ...WEEK_6_OPS, 'Post Tue Contrarian + LinkedIn'], decisions: [] },
  { date: '2026-08-19', label: 'Week 6 Day 3 · Pattern', phase: 'week_6', checks: [...DAILY_RITUAL, ...WEEK_6_OPS, 'Post Wed Pattern feed post'], decisions: [] },
  { date: '2026-08-20', label: 'Week 6 Day 4 · Personal brand', phase: 'week_6', checks: [...DAILY_RITUAL, ...WEEK_6_OPS, 'Post personal brand card'], decisions: [] },
  { date: '2026-08-21', label: 'Week 6 Day 5 · Coach', phase: 'week_6', checks: [...DAILY_RITUAL, ...WEEK_6_OPS, 'Post Fri Coach feed post'], decisions: [] },
  { date: '2026-08-22', label: 'Week 6 Day 6 · Personal brand + light', phase: 'week_6', checks: [...DAILY_RITUAL.slice(0, 3), 'Post personal brand'], decisions: [] },
  {
    date: '2026-08-24',
    label: 'Week 6 · 6-WEEK FULL SYSTEM RETRO',
    phase: 'week_6',
    checks: [
      '2-hour retro session - full audit (enrolments per stage, ascension rates, CPL trends, ad-variant performance, content engagement, feedback summary, churn signals)',
      'Document findings in new doc: 2026-08-24_Post_Launch_6_Week_Retro.md',
      'Plan next 6 weeks: write 2026-08-25_Weeks_7_to_12_Strategy.md',
    ],
    decisions: ['Which Phase 2 feedback moments to build (Blueprint Week 6 outcome, Membership monthly NPS, block-end)', 'Funnel A re-activation timing', 'Personal brand + LinkedIn cadence evolution', 'Membership content cadence (weekly Loom from Kade?)'],
  },
]

function generatePreLaunchDays(): RunbookEntry[] {
  // Wed 2 Jul → Sun 12 Jul
  const days: RunbookEntry[] = []
  const dates = ['2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', '2026-07-11']
  for (const d of dates) {
    days.push({
      date: d,
      label: 'Pre-launch · post-content sweep',
      phase: 'pre_launch',
      checks: [...DAILY_RITUAL.slice(0, 3), 'Schedule next-day posts via Content Calendar Schedule button if not done yet'],
      decisions: ['Meta Ads UI work pending (target Fri 10 Jul EOB)', 'Amanda HeyGen reel chase'],
    })
  }
  // Sun 12 Jul = launch eve, special
  days.push({
    date: '2026-07-12',
    label: 'Pre-launch · DAY BEFORE LAUNCH',
    phase: 'pre_launch',
    checks: [
      'AM - Final end-to-end test enrolment (throwaway email)',
      'AM - Run npm run check:launch → 🟢 GO',
      'AM - Confirm Vercel env vars on BOTH projects (NEXT_PUBLIC_CHALLENGE_LIVE=false, CHALLENGE_CURRENT_WAVE=1, META_CAPI_ACCESS_TOKEN set)',
      'AM - Confirm Meta campaign PAUSED + 3 ad sets ready',
      'AM - Check Wave Status card on dashboard',
      'PM - Sunday Diagnostic post (last "tomorrow" countdown)',
      'PM - Run launch-day email preview one more time',
      'Evening - Devices charged, alarms set, coffee setup',
      'By 9pm - Phone off / Do Not Disturb, sleep',
    ],
    decisions: [],
  })
  return days
}

export function getRunbookForDate(dateIso: string): RunbookEntry | null {
  return RUNBOOK.find(e => e.date === dateIso) ?? null
}

export function getUpcomingDecisions(dateIso: string, daysAhead = 7): { date: string; label: string; decisions: string[] }[] {
  const today = new Date(dateIso + 'T00:00:00Z')
  const cutoff = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  return RUNBOOK
    .filter(e => {
      const d = new Date(e.date + 'T00:00:00Z')
      return e.decisions.length > 0 && d >= today && d <= cutoff
    })
    .map(e => ({ date: e.date, label: e.label, decisions: e.decisions }))
}
