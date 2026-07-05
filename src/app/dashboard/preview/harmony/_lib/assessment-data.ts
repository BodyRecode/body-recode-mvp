/**
 * Practice Readiness Assessment - question set + scoring for Harmony.
 * Twelve questions across three domains (Body / Week / History), each
 * scored 0-2 (max 24). The total maps to one of three practice states:
 *
 *   Settling    (0-8)   - nervous system needs restoration first
 *   Building    (9-16)  - steady progress possible with tailored practice
 *   Expressive  (17-24) - high-capacity practitioner ready for peak work
 *
 * Mirrors the Body Recode scorecard shape (multi-question -> state
 * typing -> paid unlock) in Melisa's yoga voice.
 */

export type Option = { label: string; score: 0 | 1 | 2 }
export type Question = { id: string; domain: 'body' | 'week' | 'history'; text: string; options: Option[] }

export const QUESTIONS: Question[] = [
  // ── Domain 1: The Body ──────────────────────────────────────────────
  {
    id: 'tension',
    domain: 'body',
    text: 'Where is your body carrying tension right now?',
    options: [
      { label: 'Everywhere. It is hard to name a place that feels neutral.', score: 0 },
      { label: 'Mostly through the shoulders and jaw.', score: 1 },
      { label: 'One or two specific spots, but the rest feels open.', score: 2 },
      { label: 'Not much. The body feels relatively at ease.', score: 2 },
    ],
  },
  {
    id: 'sleep',
    domain: 'body',
    text: 'How is your sleep this week?',
    options: [
      { label: 'Fragmented. I am waking tired.', score: 0 },
      { label: 'Interrupted, but I am functioning.', score: 1 },
      { label: 'Decent most nights.', score: 2 },
      { label: 'Rested and unbroken.', score: 2 },
    ],
  },
  {
    id: 'injury',
    domain: 'body',
    text: 'Any injury or physical restriction we should hold the practice around?',
    options: [
      { label: 'Yes - something active that I am currently working around.', score: 0 },
      { label: 'A managed chronic - I know how to move around it.', score: 1 },
      { label: 'A historical injury that only occasionally shows up.', score: 2 },
      { label: 'None. The body is intact.', score: 2 },
    ],
  },
  {
    id: 'energy',
    domain: 'body',
    text: 'Where does your energy sit at 6pm on a typical work-day?',
    options: [
      { label: 'Crashed. I can barely think.', score: 0 },
      { label: 'Depleted, but I am still upright.', score: 1 },
      { label: 'Steady. I can still meet the evening.', score: 2 },
      { label: 'Reserved. I have more in the tank if the day asks for it.', score: 2 },
    ],
  },

  // ── Domain 2: The Week ──────────────────────────────────────────────
  {
    id: 'workweek',
    domain: 'week',
    text: 'What is the shape of your typical work-week?',
    options: [
      { label: 'Heavy. Long hours, high stakes, little recovery.', score: 0 },
      { label: 'Moderate. Full but manageable.', score: 1 },
      { label: 'Light. Space between the demands.', score: 2 },
      { label: 'Flexible. I set the shape myself.', score: 2 },
    ],
  },
  {
    id: 'practice-count',
    domain: 'week',
    text: 'How many practices per week are realistic for you right now?',
    options: [
      { label: 'Zero to one. Life is loud.', score: 0 },
      { label: 'Two to three.', score: 1 },
      { label: 'Four to five.', score: 2 },
      { label: 'Six or more if the practice is right.', score: 2 },
    ],
  },
  {
    id: 'time-of-day',
    domain: 'week',
    text: 'What time of day does your body actually meet the practice?',
    options: [
      { label: 'Only early morning. Nothing else works.', score: 1 },
      { label: 'Only evening. Mornings are impossible.', score: 1 },
      { label: 'Middle of the day, if I can arrange it.', score: 2 },
      { label: 'Flexible. My body is available.', score: 2 },
    ],
  },
  {
    id: 'life-shift',
    domain: 'week',
    text: 'Any recent life shift that is still settling?',
    options: [
      { label: 'Yes - a major one. I am still finding footing.', score: 0 },
      { label: 'A moderate one. I am adjusting.', score: 1 },
      { label: 'One that is now settling.', score: 2 },
      { label: 'Nothing recent. Life is steady.', score: 2 },
    ],
  },

  // ── Domain 3: The History ────────────────────────────────────────────
  {
    id: 'duration',
    domain: 'history',
    text: 'How long have you been practising, in any form?',
    options: [
      { label: 'Under six months.', score: 0 },
      { label: 'Between six months and two years.', score: 1 },
      { label: 'Two to five years.', score: 2 },
      { label: 'More than five years.', score: 2 },
    ],
  },
  {
    id: 'lineage',
    domain: 'history',
    text: 'Where are you with lineage and style?',
    options: [
      { label: 'Still finding one that works for me.', score: 0 },
      { label: 'Exploring several, no primary yet.', score: 1 },
      { label: 'One primary that I have committed to.', score: 2 },
      { label: 'A mature relationship with one, informed by others.', score: 2 },
    ],
  },
  {
    id: 'last-felt-right',
    domain: 'history',
    text: 'When did the practice last feel like it was actually working with you?',
    options: [
      { label: 'It has not, honestly. Not really.', score: 0 },
      { label: 'Some months ago.', score: 1 },
      { label: 'Recently. Within the last month.', score: 2 },
      { label: 'Today. That is why I am here.', score: 2 },
    ],
  },
  {
    id: 'meditation',
    domain: 'history',
    text: 'Meditation, or something like it?',
    options: [
      { label: 'None. I have never sustained one.', score: 0 },
      { label: 'Casual. When the mood is right.', score: 1 },
      { label: 'A formal practice that I return to.', score: 2 },
      { label: 'Daily. It is the ground the rest is built on.', score: 2 },
    ],
  },
]

export type PracticeState = 'settling' | 'building' | 'expressive'

export function stateFromScore(score: number): PracticeState {
  if (score <= 8) return 'settling'
  if (score <= 16) return 'building'
  return 'expressive'
}

export const STATE_META: Record<PracticeState, {
  label: string
  eyebrow: string
  headline: string
  intro: string
  bodySignal: string
  practiceReadPreview: string[]
  callToAction: string
}> = {
  settling: {
    label: 'Settling',
    eyebrow: 'Practice State · 01',
    headline: 'The body is asking to be restored before it is asked to do.',
    intro: 'Your answers point to a nervous system that is carrying more than it can currently metabolise. The body is not weak - it is loaded. The practice for you this month is not about progress in the way you might have known it. It is about giving the body something reliable to settle into.',
    bodySignal: 'Restorative-heavy. Breath first, shapes second. Two to three short sessions a week are enough. Anything more is noise. Steadiness comes from repetition, not intensity.',
    practiceReadPreview: [
      'What we noticed: a body that has been carrying more than one shape at a time, for long enough that the layers stopped feeling like layers.',
      'What to hold this month: three short practices a week, each under 25 minutes, all breath-first. If the day is heavy, the practice is a five-minute settling. That still counts.',
      'What to leave alone: any inclination to add strong shapes to prove something to yourself. Not this month.',
    ],
    callToAction: 'Your Practice Read continues for another five pages. Melisa signs every one personally within 24 hours.',
  },
  building: {
    label: 'Building',
    eyebrow: 'Practice State · 02',
    headline: 'The body is ready for steady work. Not big work.',
    intro: 'Your answers point to a practitioner who is present and available, but who benefits from a plan that holds the intensity for you so you do not have to decide each day whether today is a strong day or a soft one. The practice for you is about building capacity through consistency, not through volume.',
    bodySignal: 'Three to four practices a week, with one clear anchor session and one clear restorative. The rest sit between. Strong shapes are earned by the third or fourth week of a block, not the first.',
    practiceReadPreview: [
      'What we noticed: a practitioner ready for depth, held back by a week-shape that does not always give the practice a clear place to land.',
      'What to hold this month: one anchor practice a week (Wednesday is often best), one restorative (Sunday), and two flexible middles. The anchor holds most of the strength patterning.',
      'What to leave alone: comparing the week to last week. The measure is monthly, not weekly.',
    ],
    callToAction: 'Your Practice Read continues for another five pages. Melisa signs every one personally within 24 hours.',
  },
  expressive: {
    label: 'Expressive',
    eyebrow: 'Practice State · 03',
    headline: 'The body is asking for expression. This month is a peak month.',
    intro: 'Your answers point to a mature practitioner in a settled phase of life. The body is available; the history is deep. What matters now is not restraint but attention - noticing where the practice can express itself without slipping into force. The plan for you is a peak plan, held together by the discipline of noticing.',
    bodySignal: 'Four to five practices a week, at least one long. Strong shapes are the anchor; restoration surrounds them. Meditation carries its own place, not as recovery but as its own axis.',
    practiceReadPreview: [
      'What we noticed: a body carrying capacity that most practitioners would envy, met by a nervous system mature enough to keep it honest.',
      'What to hold this month: a peak month. One long practice a week (75-90 minutes), two mid-length, one restorative, and a daily meditation seat. Notice where effort turns into force, and step back from that edge every time.',
      'What to leave alone: the assumption that peak means all-week. Peak is one month, then a reset month follows.',
    ],
    callToAction: 'Your Practice Read continues for another five pages. Melisa signs every one personally within 24 hours.',
  },
}
