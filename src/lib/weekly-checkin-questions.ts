export interface CheckInQuestion {
  id: string
  type: 'text' | 'choice'
  text: string
  helper?: string
  options?: string[]
}

export interface CheckInSection {
  title: string
  questions: CheckInQuestion[]
}

export const FORM_A_SECTIONS: CheckInSection[] = [
  {
    title: 'Overall Context',
    questions: [
      {
        id: 'a_week_overview',
        type: 'text',
        text: 'How did this week unfold for you overall?',
        helper: 'If helpful, you might describe the general pace of the week, how it felt moving through it, or whether it felt steady, compressed, or scattered.',
      },
      {
        id: 'a_week_rhythm',
        type: 'choice',
        text: 'Which option best describes the overall rhythm of your week?',
        options: ['Mostly steady', 'Busy but manageable', 'Compressed or rushed', 'Disrupted or unpredictable'],
      },
    ],
  },
  {
    title: 'Salience and Patterns',
    questions: [
      {
        id: 'a_stood_out',
        type: 'text',
        text: 'What stood out most to you this week?',
        helper: 'This could be something that took up a lot of mental space, something that surprised you, or something that lingered emotionally.',
      },
      {
        id: 'a_recurring',
        type: 'text',
        text: 'Was there anything that kept coming back into your mind as the week went on?',
        helper: 'This might be a recurring thought, concern, or focus point that showed up more than once.',
      },
    ],
  },
  {
    title: 'Capacity and Resources',
    questions: [
      {
        id: 'a_depleted',
        type: 'text',
        text: 'What took the most out of you this week?',
        helper: 'This could be work, people, decisions, logistics, or emotional demands.',
      },
      {
        id: 'a_restored',
        type: 'text',
        text: 'What, if anything, helped restore you this week?',
        helper: 'This could be time alone, connection, rest, routine, or moments that felt grounding. It is okay if nothing stood out.',
      },
      {
        id: 'a_capacity',
        type: 'choice',
        text: 'How did your overall physical and mental capacity feel this week?',
        options: ['More available than usual', 'About the same as usual', 'More limited than usual'],
      },
    ],
  },
  {
    title: 'Expression Without Fixing',
    questions: [
      {
        id: 'a_expression',
        type: 'text',
        text: 'Is there anything you want to say about this week without needing it to be fixed?',
        helper: 'This is simply space to express something that feels true for you, without looking for solutions.',
      },
    ],
  },
  {
    title: 'Acknowledgement',
    questions: [
      {
        id: 'a_acknowledgement',
        type: 'text',
        text: 'Is there anything you want acknowledged rather than solved?',
        helper: 'This might be effort, frustration, patience, or something that simply felt hard.',
      },
    ],
  },
  {
    title: 'Recovery Signals',
    questions: [
      {
        id: 'a_recovery',
        type: 'choice',
        text: 'Overall recovery this week?',
        options: [
          '1 — Not recovering',
          '2 — Recovering poorly',
          '3 — Recovering but fragile',
          '4 — Recovering well',
          '5 — Fully recovered',
        ],
      },
      {
        id: 'a_sessions',
        type: 'choice',
        text: 'Compared to last week, how did your main sessions feel?',
        options: ['Easier', 'About the same', 'Harder'],
      },
      {
        id: 'a_sleep',
        type: 'choice',
        text: 'How consistent was your sleep schedule this week?',
        options: [
          'Consistent (within ~1 hour most nights)',
          'Inconsistent',
          'Severely inconsistent',
        ],
      },
    ],
  },
  {
    title: 'Nutrition Signals',
    questions: [
      {
        id: 'a_hunger',
        type: 'choice',
        text: 'Hunger pattern this week',
        options: [
          'Rarely hungry',
          'Predictable hunger between meals',
          'Frequent hunger during the day',
          'Constant hunger',
        ],
      },
      {
        id: 'a_meal_satisfaction',
        type: 'choice',
        text: 'Meal satisfaction this week',
        options: [
          'Meals usually felt satisfying',
          'Meals sometimes left me wanting more',
          'Meals often left me hungry',
          'Meals rarely felt satisfying',
        ],
      },
      {
        id: 'a_digestion',
        type: 'choice',
        text: 'Digestive comfort this week',
        options: [
          'No digestive discomfort',
          'Occasional mild discomfort',
          'Frequent discomfort',
          'Significant digestive issues',
        ],
      },
    ],
  },
]

export const FORM_B_SECTIONS: CheckInSection[] = [
  {
    title: 'Week Friction and Mismatch',
    questions: [
      {
        id: 'b_friction',
        type: 'text',
        text: 'Where did this week feel harder than it should have?',
        helper: 'This might be something that required more effort than expected, felt heavier than usual, or took more out of you than it normally would.',
      },
      {
        id: 'b_week_feel',
        type: 'choice',
        text: 'Which option best reflects how the week felt overall?',
        options: ['Lighter than expected', 'About as expected', 'Heavier than expected'],
      },
    ],
  },
  {
    title: 'Repeating Pressures',
    questions: [
      {
        id: 'b_familiar',
        type: 'text',
        text: 'Did anything this week feel familiar in a way you didn\'t want it to?',
        helper: 'This could be a situation, feeling, or pressure that you\'ve noticed before and hoped wouldn\'t show up again.',
      },
    ],
  },
  {
    title: 'Tensions and Trade-Offs',
    questions: [
      {
        id: 'b_competing',
        type: 'text',
        text: 'Did you feel pulled between competing priorities this week?',
        helper: 'This might look like wanting to be present in one area while being required somewhere else, or feeling torn between two valid demands.',
      },
      {
        id: 'b_wanted_more',
        type: 'text',
        text: 'Was there something you wanted to give more to, but couldn\'t?',
        helper: 'This could be time, attention, care, or involvement that you wished you had more of, but felt limited in offering.',
      },
    ],
  },
  {
    title: 'Capacity Awareness',
    questions: [
      {
        id: 'b_limited',
        type: 'text',
        text: 'What felt most limited for you this week: time, capacity, focus, or something else?',
        helper: 'You can name one thing or several. This is about noticing what felt limited, not judging why.',
      },
      {
        id: 'b_capacity',
        type: 'choice',
        text: 'Compared to a normal week, your overall capacity felt:',
        options: ['More available than usual', 'About the same as usual', 'More limited than usual'],
      },
    ],
  },
  {
    title: 'Meaning Without Action',
    questions: [
      {
        id: 'b_meaning',
        type: 'text',
        text: 'Is there anything about this week that feels important to name, even if it doesn\'t need action?',
        helper: 'This is space to acknowledge something that mattered to you, without needing it to be fixed or changed.',
      },
    ],
  },
  {
    title: 'Closing Reflection',
    questions: [
      {
        id: 'b_coach_understand',
        type: 'text',
        text: 'Looking back, what do you want your coach to understand about this week?',
        helper: 'This could be context, nuance, or something you don\'t want missed when your week is looked at as a whole.',
      },
    ],
  },
  {
    title: 'Recovery Signals',
    questions: [
      {
        id: 'b_recovery',
        type: 'choice',
        text: 'Overall recovery this week?',
        options: [
          '1 — Not recovering',
          '2 — Recovering poorly',
          '3 — Recovering but fragile',
          '4 — Recovering well',
          '5 — Fully recovered',
        ],
      },
      {
        id: 'b_sessions',
        type: 'choice',
        text: 'Compared to last week, how did your main sessions feel?',
        options: ['Easier', 'About the same', 'Harder'],
      },
      {
        id: 'b_sleep',
        type: 'choice',
        text: 'How consistent was your sleep schedule this week?',
        options: [
          'Consistent (within ~1 hour most nights)',
          'Inconsistent',
          'Severely inconsistent',
        ],
      },
    ],
  },
  {
    title: 'Nutrition Signals',
    questions: [
      {
        id: 'b_appetite',
        type: 'choice',
        text: 'Appetite stability this week',
        options: [
          'Appetite felt stable',
          'Appetite fluctuated slightly',
          'Appetite fluctuated a lot',
        ],
      },
      {
        id: 'b_eating_manageable',
        type: 'choice',
        text: 'How manageable did eating feel this week?',
        options: [
          'Easy and predictable',
          'Mostly manageable',
          'More effortful than usual',
          'Difficult to keep steady',
        ],
      },
    ],
  },
]

/** Determine which week number a client is on (1-indexed) based on coaching start date */
// Global system anchor: Monday 23 March 2026 = Week A
// Brisbane timezone = UTC+10 (no DST)
const SYSTEM_ANCHOR_MS = Date.UTC(2026, 2, 23) - 10 * 60 * 60 * 1000 // 23 Mar 2026 00:00 Brisbane
const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000

function nowBrisbane(): Date {
  return new Date(Date.now() + BRISBANE_OFFSET_MS)
}

/** Returns the global system week number (1-based, anchored to 23 Mar 2026) */
export function getSystemWeekNumber(): number {
  const nowUtc = Date.now()
  const diffMs = nowUtc - SYSTEM_ANCHOR_MS
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
}

/** Global form type based on system week — Week 1 = A, Week 2 = B, etc. */
export function getFormType(weekNumber?: number): 'A' | 'B' {
  const w = weekNumber ?? getSystemWeekNumber()
  return w % 2 === 1 ? 'A' : 'B'
}

/** Per-client week number (how many weeks since coaching started) */
export function getWeekNumber(coachingStartedAt: string): number {
  const start = new Date(coachingStartedAt)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}

export interface CheckInWindowStatus {
  isOpen: boolean
  formType: 'A' | 'B'
  opensAt: Date   // next Friday 6pm Brisbane
  closesAt: Date  // this/next Sunday 6:30pm Brisbane
}

/** Test-mode flag for the weekly check-in. Always false in production builds
 * so a stray env var can never bypass the once-per-week gate or flip A↔B. */
export function isCheckinTestMode(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return process.env.CHECKIN_TEST_MODE?.trim().toLowerCase() === 'true'
}

/** Returns whether the check-in window is currently open and which form is active */
export function getCheckInWindowStatus(): CheckInWindowStatus {
  const now = nowBrisbane()
  const day = now.getUTCDay() // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()

  // Window: Friday 6pm (day=5, hour>=18) through Sunday 6:30pm (day=0, hour<18 or hour==18 && min<=30)
  const afterFriday6pm = day === 5 && hour >= 18
  const saturday = day === 6
  const beforeSunday630pm = day === 0 && (hour < 18 || (hour === 18 && minute <= 30))
  const isOpen = afterFriday6pm || saturday || beforeSunday630pm

  const systemWeek = getSystemWeekNumber()
  const formType = getFormType(systemWeek)

  // Calculate next window open (next Friday 6pm Brisbane)
  const daysUntilFriday = (5 - day + 7) % 7 || 7
  const nextFriday = new Date(now)
  nextFriday.setUTCDate(now.getUTCDate() + (isOpen ? 0 : daysUntilFriday))
  nextFriday.setUTCHours(18, 0, 0, 0)
  // Convert back from Brisbane to UTC for storage
  const opensAt = new Date(nextFriday.getTime() - BRISBANE_OFFSET_MS)

  // Calculate window close (Sunday 6:30pm Brisbane)
  const daysUntilSunday = (0 - day + 7) % 7 || 7
  const nextSunday = new Date(now)
  nextSunday.setUTCDate(now.getUTCDate() + (day === 0 ? 0 : daysUntilSunday))
  nextSunday.setUTCHours(18, 30, 0, 0)
  const closesAt = new Date(nextSunday.getTime() - BRISBANE_OFFSET_MS)

  return { isOpen, formType, opensAt, closesAt }
}
