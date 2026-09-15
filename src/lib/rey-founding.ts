/**
 * The Rey price test: questions, price, pass mark and the result summary.
 *
 * Kade agreed 14 Sep 2026: test $199 a year with $29 a month alongside it, and
 * decide the pass mark BEFORE any results come in, so the data cannot be read
 * into whatever it turns out to say:
 *
 *   of the women who saw the price, 1 in 5 or more join  -> go ahead
 *   fewer than 1 in 10 join                               -> rethink the price or the offer
 *   anything between                                      -> keep testing, not a yes
 *
 * Built on Daniel Priestley's scorecard method: a short questionnaire, a result
 * that creates tension without handing over the plan, then the offer. The five
 * scored areas are the Readiness Scorecard's own, with the same not-training
 * wording, so a result here reads the same as anywhere else. The four unscored
 * questions are the ones Priestley calls "pure gold": they say who is ready.
 *
 * The app is NOT named on the page. The Rey trade mark is not cleared, so it is
 * "a new app from Body Recode" until it is.
 */

export const PRICE_YEAR = 199
export const PRICE_MONTH = 29
export const PRICE_WEEK = '3.83'

export const PASS_MARK_GO = 1 / 5
export const PASS_MARK_RETHINK = 1 / 10

export type TrainingStatus = 'regular' | 'on_off' | 'none'
export type SectionKey = '01' | '02' | '03' | '04' | '05'
type Row = { score: number; desc: string }
type SectionDef = { key: SectionKey; title: string; rows: Row[] }

export const SECTIONS: SectionDef[] = [
  { key: '01', title: 'Energy', rows: [
    { score: 1, desc: 'Tired most of the day. Relying on caffeine. Crashes after lunch or training.' },
    { score: 2, desc: 'Inconsistent. Some good days, some bad. Not reliable.' },
    { score: 3, desc: 'Steady energy through the day. No need for caffeine to function.' },
  ] },
  { key: '02', title: 'Sleep', rows: [
    { score: 1, desc: 'Poor quality. Waking through the night. Not rested in the morning.' },
    { score: 2, desc: 'Okay most nights but not consistently recovering.' },
    { score: 3, desc: 'Sleeping well. Waking rested. Recovery feels solid.' },
  ] },
  { key: '03', title: 'Stress Load', rows: [
    { score: 1, desc: 'High stress. Work, life, or emotional load is significant and ongoing.' },
    { score: 2, desc: 'Moderate. Manageable most of the time but not low.' },
    { score: 3, desc: 'Low to moderate. Not carrying a heavy chronic stress load right now.' },
  ] },
  { key: '04', title: 'Training Response', rows: [
    { score: 1, desc: 'Not progressing. Performance is flat or declining. Body feels beaten up.' },
    { score: 2, desc: 'Some progress but inconsistent. Hard to build momentum.' },
    { score: 3, desc: 'Responding well. Getting stronger, fitter, recovering between sessions.' },
  ] },
  { key: '05', title: 'Fat Loss Response', rows: [
    { score: 1, desc: 'Nothing is moving despite effort. Diet is clean, training is consistent. No result.' },
    { score: 2, desc: 'Slow or stalled. Some movement but not matching the input.' },
    { score: 3, desc: 'Body is responding. Composition is shifting in the right direction.' },
  ] },
]

const NOT_TRAINING: Record<'04' | '05', Omit<SectionDef, 'key'>> = {
  '04': { title: 'Everyday Capacity', rows: [
    { score: 1, desc: 'A busy day or a long walk wipes you out. It takes days to feel normal again.' },
    { score: 2, desc: 'You get through, but you feel it the next day more than you used to.' },
    { score: 3, desc: 'You handle a full, active day and bounce back overnight.' },
  ] },
  '05': { title: 'Body Shape', rows: [
    { score: 1, desc: 'Your shape is changing and you have not changed anything. Weight is settling where it never used to.' },
    { score: 2, desc: 'Some drift. Clothes fit differently to a year or two ago.' },
    { score: 3, desc: 'Your shape is steady and still feels like yours.' },
  ] },
}

export function sectionsFor(training: TrainingStatus | null): SectionDef[] {
  return SECTIONS.map(s =>
    training === 'none' && (s.key === '04' || s.key === '05') ? { ...s, ...NOT_TRAINING[s.key] } : s,
  )
}

export const TRAINING_OPTIONS: { value: TrainingStatus; label: string }[] = [
  { value: 'regular', label: 'Yes, regularly' },
  { value: 'on_off', label: 'On and off' },
  { value: 'none', label: 'Not at the moment' },
]

export const SEX_OPTIONS = [
  { value: 'F', label: 'Female' },
  { value: 'M', label: 'Male' },
] as const

export const AGE_OPTIONS = [
  { value: 'under_35', label: 'Under 35' },
  { value: '35_44', label: '35-44' },
  { value: '45_54', label: '45-54' },
  { value: '55_plus', label: '55+' },
] as const

export const STORAGE_OPTIONS = [
  { value: 'midsection', label: 'Belly and front of the stomach' },
  { value: 'posterior', label: 'Lower back, love handles and upper back' },
  { value: 'hips_thighs', label: 'Hips, thighs and lower body' },
  { value: 'all_over', label: "It's fairly even, I couldn't pick one spot" },
  { value: 'low_tone', label: 'Losing muscle tone and definition' },
] as const

export const DIRECTION_OPTIONS = [
  { value: 'gluteofemoral', label: 'It has stayed on my hips, thighs and glutes' },
  { value: 'to_middle', label: 'It used to be hips and thighs, now it is moving to my middle' },
  { value: 'always_central', label: 'It has always been my middle' },
  { value: 'always_even', label: 'It has always been fairly even all over' },
  { value: 'unsure', label: 'I am not sure' },
] as const

// Her periods, and the ovaries follow-up when they stopped after surgery or
// treatment. One definition shared with the scorecard and the Body Decode.
export { CYCLE_QUESTION, CYCLE_CHOICE_OPTIONS, OVARIES_QUESTION, OVARIES_OPTIONS } from '@/lib/fat-map-profile'

// ── The four unscored questions ─────────────────────────────────────────

export const START_OPTIONS = [
  { value: 'this_month', label: 'This month' },
  { value: 'three_months', label: 'In the next three months' },
  { value: 'just_looking', label: 'Just looking for now' },
] as const

export const SPENT_OPTIONS = [
  { value: 'under_200', label: 'Under $200' },
  { value: '200_1000', label: '$200 to $1,000' },
  { value: '1000_3000', label: '$1,000 to $3,000' },
  { value: 'over_3000', label: 'Over $3,000' },
] as const

export const WHERE_OPTIONS = [
  { value: 'gym', label: 'At a gym' },
  { value: 'home', label: 'At home' },
  { value: 'both', label: 'Both' },
  { value: 'not_sure', label: 'Not sure yet' },
] as const

export const VOICE_OPTIONS = [
  { value: 'yes', label: 'Yes, that is what I would want' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'No, I would rather read it' },
] as const

export const PRICE_REACTION_OPTIONS = [
  { value: 'no_brainer', label: 'A no-brainer' },
  { value: 'considering', label: 'Worth considering' },
  { value: 'too_much', label: 'Too much for me' },
] as const

import { CYCLE_STATUSES } from '@/lib/fat-map-profile'

const valuesOf = <T extends readonly { value: string }[]>(opts: T) => opts.map(o => o.value) as string[]
export const ALLOWED = {
  training: valuesOf(TRAINING_OPTIONS),
  sex: valuesOf(SEX_OPTIONS),
  age: valuesOf(AGE_OPTIONS),
  storage: valuesOf(STORAGE_OPTIONS),
  direction: valuesOf(DIRECTION_OPTIONS),
  cycle: CYCLE_STATUSES as string[],
  start: valuesOf(START_OPTIONS),
  spent: valuesOf(SPENT_OPTIONS),
  where: valuesOf(WHERE_OPTIONS),
  voice: valuesOf(VOICE_OPTIONS),
  reaction: valuesOf(PRICE_REACTION_OPTIONS),
}

// ── Her result ──────────────────────────────────────────────────────────

export type StateName = 'Depleted State' | 'Transitioning State' | 'Ready State'

export function stateFor(total: number): StateName {
  return total <= 8 ? 'Depleted State' : total <= 11 ? 'Transitioning State' : 'Ready State'
}

/**
 * The Performance scorecard's wording, both versions, minus its "cortisol is
 * elevated, metabolism is suppressed" line: a two-minute questionnaire on a
 * consumer page cannot know that, and wellness wording keeps it clear of
 * medical claims.
 */
export function stateDescription(state: StateName, training: TrainingStatus | null): string {
  if (training === 'none') {
    if (state === 'Depleted State') return 'Your body has decided this is not a safe time to let go of stored fat. It is holding on by design, and that is a big part of why it does not feel like yours right now. The usual answer, starting hard training and cutting food, would make it worse. It has to come out of this first, and that starts gently.'
    if (state === 'Transitioning State') return 'Mixed signals. Your body has capacity but it is not consistent. Something is limiting it: sleep, stress, recovery, or the load your days already carry. You are close, but the specific bottleneck needs finding before you add anything new.'
    return 'Your biology is in a position to respond. If your body still does not feel like yours at this score, the missing piece is what you are giving it: movement, nutrition, or both. You have the foundation. Now it needs building on.'
  }
  if (state === 'Depleted State') return 'Your body has decided this is not a safe time to let go of stored fat. It is holding on by design. Pushing harder with more training and less food makes that worse. It has to come out of this first. Being given a program before anyone worked out why is the reason you are stuck.'
  if (state === 'Transitioning State') return 'Mixed signals. Your body has capacity but it is not consistent. Something is limiting your response: sleep, stress, recovery, or a mismatch between your training load and your current biological state. You are close, but you need to identify the specific bottleneck before adding more input.'
  return 'Your biology is in a position to respond. If fat loss or performance is not happening at this score, the issue is in the prescription. Training, nutrition, or both need to be adjusted. You have the foundation. Now it needs to be optimised.'
}

// ── The board's reading of the test ─────────────────────────────────────

export type FoundingRow = {
  biological_sex: string | null
  training_status: string | null
  saw_price_at: string | null
  joined_at: string | null
  price_reaction: string | null
  start_timing: string | null
  voice_coach: string | null
}

export type Split = { saw: number; joined: number }

export type FoundingSummary = {
  /** Women who saw the price. The pass mark is measured on these. */
  women: Split
  training: Split
  notTraining: Split
  /** Men are recorded but kept out of the pass mark: the test is for her. */
  men: Split
  reactions: Record<string, number>
  startTiming: Record<string, number>
  voice: Record<string, number>
  verdict: 'too_early' | 'go' | 'rethink' | 'keep_testing'
  /** Women needed before the rate is worth reading at all. */
  minimumSample: number
}

export const MINIMUM_SAMPLE = 30

function tally(rows: FoundingRow[]): Split {
  const seen = rows.filter(r => r.saw_price_at)
  return { saw: seen.length, joined: seen.filter(r => r.joined_at).length }
}

function countBy(rows: FoundingRow[], key: keyof FoundingRow): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) {
    const v = r[key]
    if (v) out[v] = (out[v] ?? 0) + 1
  }
  return out
}

export function summariseFounding(rows: FoundingRow[]): FoundingSummary {
  const women = rows.filter(r => r.biological_sex !== 'M' && r.saw_price_at)
  const w = tally(women)
  const rate = w.saw ? w.joined / w.saw : 0
  const verdict: FoundingSummary['verdict'] =
    w.saw < MINIMUM_SAMPLE ? 'too_early'
      : rate >= PASS_MARK_GO ? 'go'
        : rate < PASS_MARK_RETHINK ? 'rethink'
          : 'keep_testing'
  return {
    women: w,
    training: tally(women.filter(r => r.training_status !== 'none')),
    notTraining: tally(women.filter(r => r.training_status === 'none')),
    men: tally(rows.filter(r => r.biological_sex === 'M')),
    reactions: countBy(women, 'price_reaction'),
    startTiming: countBy(women, 'start_timing'),
    voice: countBy(women, 'voice_coach'),
    verdict,
    minimumSample: MINIMUM_SAMPLE,
  }
}
