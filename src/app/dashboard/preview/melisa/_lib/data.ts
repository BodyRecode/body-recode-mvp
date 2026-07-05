/**
 * Fake data for Melisa's preview tenant. All names + numbers invented.
 * When the real tenant seeds at provisioning, this file is retired.
 */

export type StudentState = 'settling' | 'building' | 'expression'

export type Student = {
  slug: string
  name: string
  initials: string
  state: StudentState
  block: string
  week: number
  lastCheckin: string
  progressPct: number
  joined: string
  focus: string
}

export const STUDENTS: Student[] = [
  { slug: 'sarah-w',    name: 'Sarah W.',    initials: 'SW', state: 'building',   block: 'Capacity Foundation', week: 3,  lastCheckin: 'Fri', progressPct: 62, joined: '11 wks',  focus: 'Steady practice under a full work week.' },
  { slug: 'emma-p',     name: 'Emma P.',     initials: 'EP', state: 'settling',   block: 'Stabilisation',       week: 2,  lastCheckin: 'Sat', progressPct: 24, joined: '3 wks',   focus: 'Land the morning ritual before adding load.' },
  { slug: 'anaya-r',    name: 'Anaya R.',    initials: 'AR', state: 'expression', block: 'Performance Express.', week: 5, lastCheckin: 'Thu', progressPct: 88, joined: '14 wks',  focus: 'Peak-week attention, not intensity.' },
  { slug: 'jenna-t',    name: 'Jenna T.',    initials: 'JT', state: 'building',   block: 'Capacity Foundation', week: 4,  lastCheckin: 'Fri', progressPct: 71, joined: '9 wks',   focus: 'Breath through the longer Wednesday.' },
  { slug: 'ruth-l',     name: 'Ruth L.',     initials: 'RL', state: 'settling',   block: 'Stabilisation',       week: 1,  lastCheckin: '-',   progressPct: 8,  joined: '1 wk',    focus: 'First-week orientation.' },
  { slug: 'priya-m',    name: 'Priya M.',    initials: 'PM', state: 'expression', block: 'Performance Express.', week: 3, lastCheckin: 'Sun', progressPct: 79, joined: '13 wks',  focus: 'Signal-first pacing; no chasing metrics.' },
  { slug: 'kate-b',     name: 'Kate B.',     initials: 'KB', state: 'building',   block: 'Capacity Foundation', week: 6,  lastCheckin: 'Fri', progressPct: 94, joined: '10 wks',  focus: 'Block close-out; trajectory review coming.' },
]

export type PendingCheckin = {
  studentSlug: string
  studentName: string
  initials: string
  submittedAgo: string
  week: number
  block: string
  summary: string
  fields: {
    trajectory: string
    quote: string
    obstacle: string
    win: string
  }
}

export const PENDING_CHECKINS: PendingCheckin[] = [
  {
    studentSlug: 'sarah-w',
    studentName: 'Sarah W.',
    initials: 'SW',
    submittedAgo: '3h ago',
    week: 3,
    block: 'Capacity Foundation',
    summary: 'Held steady through a heavier work week. Wednesday session was the anchor.',
    fields: {
      trajectory: 'Better than last week - I felt like my body finally let me settle into the Wednesday practice rather than fighting it.',
      quote: 'The breath cues in Friday made the shorter session feel like enough.',
      obstacle: 'Tuesday deadlines meant I skipped the morning routine two days.',
      win: 'First time I actually noticed the sensation of nasal breath through mobility without you telling me to.',
    },
  },
  {
    studentSlug: 'emma-p',
    studentName: 'Emma P.',
    initials: 'EP',
    submittedAgo: '11h ago',
    week: 2,
    block: 'Stabilisation',
    summary: 'Morning ritual landing 4/7 days. Sleep improving; energy still low mid-week.',
    fields: {
      trajectory: 'A bit better. I still feel wobbly by Wednesday afternoon but Saturday I woke up before my alarm which never happens.',
      quote: 'The permission to not push at all this block is doing something I didnt expect.',
      obstacle: 'I keep trying to add "just one thing" and it undoes the settling.',
      win: 'Saturday morning I made time for the practice AND breakfast without rushing.',
    },
  },
]

export type Session = {
  time: string
  label: string
  who: string
  kind: 'group' | '1:1'
}

export const TODAY_SESSIONS: Session[] = [
  { time: '6:00', label: 'Morning group flow', who: '8 members expected', kind: 'group' },
  { time: '10:00', label: 'Sarah W. 1:1', who: 'Studio - block 2 check-in', kind: '1:1' },
  { time: '18:30', label: 'Evening restorative', who: '6 members expected', kind: 'group' },
]

export type Activity = {
  when: string
  what: string
  who?: string
}

export const RECENT_ACTIVITY: Activity[] = [
  { when: 'just now',  what: 'Emma P. submitted her Week 2 check-in', who: 'Emma P.' },
  { when: '2h ago',    what: 'Sarah W. completed her Wednesday session' },
  { when: '4h ago',    what: 'Anaya R. requested a mobility variation for her hip' },
  { when: 'yesterday', what: 'Ruth L. paid the setup fee - onboarding email sent' },
  { when: 'yesterday', what: 'Priya M. reached her block trajectory review' },
  { when: '2 days',    what: 'Jenna T. asked to move Friday practice to Saturday' },
]

export type Plan = {
  title: string
  student: string
  kind: 'program' | 'nutrition'
  block: string
  status: 'published' | 'draft-ready' | 'notify-pending'
  updated: string
}

export const PLANS: Plan[] = [
  { title: 'Capacity Foundation Block 1', student: 'Sarah W.',  kind: 'program',   block: 'Block 1', status: 'published',      updated: '4 days ago' },
  { title: 'Stabilisation Block 1',       student: 'Emma P.',   kind: 'program',   block: 'Block 1', status: 'published',      updated: '2 wks ago' },
  { title: 'Peak Week - Anaya',           student: 'Anaya R.',  kind: 'program',   block: 'Block 3', status: 'draft-ready',    updated: 'just now'  },
  { title: 'Nourishment Foundation',      student: 'Emma P.',   kind: 'nutrition', block: 'Block 1', status: 'notify-pending', updated: '1h ago'    },
  { title: 'Nourishment - Sarah',         student: 'Sarah W.',  kind: 'nutrition', block: 'Block 2', status: 'published',      updated: '5 days ago' },
]

export type ContentPost = {
  when: string
  kind: 'reel' | 'carousel' | 'story' | 'live'
  title: string
  status: 'scheduled' | 'drafting' | 'published'
}

export const CONTENT_CALENDAR: ContentPost[] = [
  { when: 'Today · 07:00',   kind: 'story',    title: 'Studio morning ambient', status: 'published' },
  { when: 'Today · 18:00',   kind: 'carousel', title: 'Three ways to notice the breath in restorative shapes', status: 'scheduled' },
  { when: 'Tomorrow · 07:00', kind: 'reel',    title: '90-second: the settling before the strong', status: 'drafting' },
  { when: 'Thu · 07:00',      kind: 'story',   title: 'What the second month of practice really looks like', status: 'drafting' },
  { when: 'Fri · 19:00',      kind: 'live',    title: 'Q+A: rest as a practice, not a reward', status: 'scheduled' },
  { when: 'Sun · 08:00',      kind: 'carousel', title: 'A gentle Sunday sequence', status: 'drafting' },
]

export const INSIGHTS = {
  mrr: 2800,
  activeStudents: 7,
  waitlist: 4,
  retention12wk: 100, // % - all Founding Ten students still active
  retention24wk: 86,
  npsAvg: 9.2,
  churnRate: 0.0,
  ltvBlended: 6200,
  weeklyEngagement: 0.74,   // % of prescribed practices completed
  contentReach: 3200,       // last 30d
  contentGrowth: 0.11,      // 11% wow
  breakdownMonths: [
    { month: 'Apr', mrr: 1200, students: 3 },
    { month: 'May', mrr: 1600, students: 4 },
    { month: 'Jun', mrr: 2400, students: 6 },
    { month: 'Jul', mrr: 2800, students: 7 },
  ],
}
