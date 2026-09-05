import type { Section } from './intake-questions'

/**
 * Progress Check — the short re-assessment ("delta intake") a client completes at
 * a milestone (block-end / 12-week cap) so the system can honestly RE-SCORE their
 * body state. It is NOT the 234-point Foundational intake and it is NOT the weekly
 * check-in. See 2026-08-11_Delta_Re-Read_Milestone_Spec.md.
 *
 * Design rules (from the spec):
 *  - Covers only the domains that move STATE: recovery/sleep, stress/load,
 *    training response, nutrition sufficiency + adherence, life/schedule, plus a
 *    "what has changed" block for new injuries or medication changes.
 *  - Deliberately short (~24 questions) so clients actually complete it.
 *  - Does NOT re-ask the Fat Map / storage pattern. Pattern is HELD; only a full
 *    re-read (234 re-intake + fresh photos) can revise it. Fresh measurements and
 *    photos are prompted separately as optional, not here.
 *  - Direction questions ("since your last read") make the then-vs-now comparison
 *    the system produces honest and grounded in the client's own report.
 *
 * Scale convention matches the intake: 0 = Not present ... 4 = Strong / Consistent.
 * Direction selects: "Worse" | "About the same" | "Better".
 */

const DIRECTION = ['Better than last time', 'About the same', 'Worse than last time'] as const

export const PROGRESS_CHECK_SECTIONS: Section[] = [
  {
    id: 'pc_overall',
    title: 'Since your last read',
    description: 'Answer for how things have been across the last few weeks, not just today. There are no right or wrong answers.',
    questions: [
      { id: 'pc_overall_direction', text: 'Overall, how is your body compared to your last read?', type: 'select', options: [...DIRECTION], required: true },
      { id: 'pc_overall_note', text: 'In a line or two, what has actually changed since then, if anything?', type: 'text', required: false },
    ],
  },
  {
    id: 'pc_recovery',
    title: 'Recovery and sleep',
    description: '0 = Not present · 1 = Mild · 2 = Moderate · 3 = Frequent · 4 = Strong / Consistent',
    questions: [
      { id: 'pc_sleep_quality', text: 'I sleep well and wake feeling restored.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'pc_sleep_direction', text: 'Sleep, compared to your last read:', type: 'select', options: [...DIRECTION], required: true },
      { id: 'pc_recovery_between', text: 'I recover well between training sessions.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'pc_morning_energy', text: 'My energy is steady through the day without relying on caffeine.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
    ],
  },
  {
    id: 'pc_stress',
    title: 'Stress and load',
    description: '0 = Not present · 1 = Mild · 2 = Moderate · 3 = Frequent · 4 = Strong / Consistent',
    questions: [
      { id: 'pc_stress_level', text: 'My overall stress load has been high.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'pc_stress_direction', text: 'Stress load, compared to your last read:', type: 'select', options: [...DIRECTION], required: true },
      // promptText: the client keeps the natural phrasing; the generator never
      // sees it. "wired but tired" is on the banned client-facing list, so
      // rendering the question verbatim into the prompt deadlocked the whole
      // Progress Read. See Question.promptText in intake-questions.ts.
      { id: 'pc_wired_tired', text: 'I feel wired but tired.', promptText: 'I feel activated but unable to settle, and rest does not restore me.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
    ],
  },
  {
    id: 'pc_training',
    title: 'Training response',
    description: '0 = Not present · 1 = Mild · 2 = Moderate · 3 = Frequent · 4 = Strong / Consistent',
    questions: [
      { id: 'pc_training_response', text: 'My training is producing progress (strength, capacity, or composition).', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'pc_training_direction', text: 'Training response, compared to your last read:', type: 'select', options: [...DIRECTION], required: true },
      { id: 'pc_sessions_completed', text: 'I completed most of my planned sessions over the last few weeks.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'pc_drive', text: 'My drive and motivation to train have been strong.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
    ],
  },
  {
    id: 'pc_nutrition',
    title: 'Nutrition and fuelling',
    description: '0 = Not present · 1 = Mild · 2 = Moderate · 3 = Frequent · 4 = Strong / Consistent',
    questions: [
      { id: 'pc_nutrition_adherence', text: 'I have been able to follow my nutrition plan.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'pc_eating_enough', text: 'I am eating enough to support my training and recovery.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'pc_nutrition_direction', text: 'Eating and fuelling, compared to your last read:', type: 'select', options: [...DIRECTION], required: true },
      { id: 'pc_appetite_note', text: 'Anything notable about appetite, cravings, or digestion lately?', type: 'text', required: false },
    ],
  },
  {
    id: 'pc_schedule',
    title: 'Life and schedule',
    description: '0 = Not present · 1 = Mild · 2 = Moderate · 3 = Frequent · 4 = Strong / Consistent',
    questions: [
      { id: 'pc_schedule_stable', text: 'My weekly schedule has been stable and predictable.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'pc_capacity', text: 'I have had the time and headspace to train and recover well.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
    ],
  },
  {
    id: 'pc_changes',
    title: 'What has changed',
    description: 'Flag anything new since your last read so nothing gets missed.',
    questions: [
      { id: 'pc_new_injury', text: 'Any new injuries, pain, or physical limitations since your last read?', type: 'select', options: ['No', 'Yes'], required: true },
      { id: 'pc_new_injury_detail', text: 'If yes, describe it briefly.', type: 'text', required: false },
      { id: 'pc_med_change', text: 'Any change to your medications or supplements since your last read?', type: 'select', options: ['No', 'Yes'], required: true },
      { id: 'pc_med_change_detail', text: 'If yes, what changed?', type: 'text', required: false },
      { id: 'pc_anything_else', text: 'Anything else you want on the record before this read?', type: 'text', required: false },
    ],
  },
]

/** Flat list of every Progress Check question id, for validation + storage. */
export const PROGRESS_CHECK_QUESTION_IDS: string[] = PROGRESS_CHECK_SECTIONS.flatMap(s => s.questions.map(q => q.id))
