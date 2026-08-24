// The Body Decode — the five days.
//
// Replaces the free 14-Day Body Decode Challenge as Funnel B Stage 1. Decided
// 23-24 Aug 2026. The short version of why:
//
//   The doctrine is READ BEFORE YOU PRESCRIBE, and the Challenge did the
//   opposite. It handed over a training plan, a nutrition guide and two daily
//   sequences, then delivered the read on day 14 as a reward for compliance.
//   Every gate costing a minute passed at 69-100%. The gate costing fourteen
//   days of behaviour change passed at 7% — Day 1 to Day 14 lost 14 of the 15
//   people who cleared every form, which is bigger than every other gate
//   combined.
//
//   It was also never true that the read needed fourteen days. The public
//   scorecard already asks every Fat Map discriminator and returns a typed
//   pattern in about four minutes. The Challenge made her wait a fortnight for
//   something another page of ours gives away immediately.
//
// So: she gets her COMPLETE read at minute ten, and the five days are Amanda
// walking her through it.
//
// OPTION B, chosen by Kade 24 Aug 2026. The alternative was to name her pattern
// at minute ten and let each day release one part of the explanation. It was
// rejected because it is the same shape as the $37 report retired the same day
// for selling her something she was about to be handed - pacing what she has
// already earned is still holding it back, one layer in.
//
// The practical rule that falls out: THE DAY GATE PACES THE LESSONS, NEVER THE
// READ. Her full read lives at /decode/[token]/read and is open from minute ten
// with no unlock check on it. The five days exist because nobody absorbs a
// document that long in one sitting, not because it is doled out.
//
// THE MAPPING THAT MAKES THIS CHEAP TO BUILD
//
// The five-part Body Decode Report already exists, and its parts 2-5 are
// already written per pattern in CHECKIN_PATTERNS. Each day walks her through
// one of them. Nothing here invents doctrine; it re-paces content the platform
// already holds, with Amanda presenting it.
//
//   Day 1  her five scores and her floor   (SECTION_READS, not pattern-specific)
//   Day 2  whatItMeans    → report part 2
//   Day 3  whereItShows   → report part 3
//   Day 4  whatItIsNot    → report part 4   (flagged as the most important)
//   Day 5  actions        → report part 5, then the Blueprint
//
// AMANDA TEACHES, KADE READS. Confirmed by Kade 23 Aug. The lessons are
// education and can be delivered by anyone credible; the read is judgement,
// scope and liability, and stays with Kade. The five lesson videos are
// UNIVERSAL — pattern-specific content is the text underneath, drawn from
// CHECKIN_PATTERNS. Five videos and twenty text blocks, not twenty videos.
//
// Related: project_body_decode_five_day_read, project_challenge_leak_fixes,
// feedback_readiness_vocabulary_outward.

import { CHECKIN_PATTERNS, type CheckinPattern } from './checkin-patterns'

/** The pattern fields the five days walk through, in order. */
export type PatternField = 'whatItMeans' | 'whereItShows' | 'whatItIsNot' | 'actions'

export type DecodeDayNumber = 1 | 2 | 3 | 4 | 5

export type DecodeDay = {
  day: DecodeDayNumber
  /** Lesson title. Amanda's script for this day carries the same title. */
  title: string
  /** Short label on the card. */
  eyebrow: string
  /** One sentence, what this day argues. Shown locked and unlocked, because a
   *  locked card that says nothing gives her no reason to come back. */
  premise: string
  /** Which CHECKIN_PATTERNS field this day walks her through. Day 1 is null:
   *  it reads her SCORES, which are hers regardless of pattern, and it is the
   *  one day that works even when typing came back Indeterminate. */
  patternField: PatternField | null
  /** Heading above the pattern block on the day page. */
  patternHeading: string | null
}

export const DECODE_DAYS: readonly DecodeDay[] = [
  {
    day: 1,
    eyebrow: 'Day 1',
    title: 'Your two lowest',
    premise:
      'Sleep and stress load are what decide whether the training turns into anything, and they are the two nobody measures.',
    patternField: null,
    patternHeading: null,
  },
  {
    day: 2,
    eyebrow: 'Day 2',
    title: 'Why your body is holding it',
    premise:
      'Regulation, not metabolism. Your body made a decision to hold on, and restriction reads to it as more load.',
    patternField: 'whatItMeans',
    patternHeading: 'What your pattern means',
  },
  {
    day: 3,
    eyebrow: 'Day 3',
    title: 'Where this shows up',
    premise:
      'A pattern does not arrive as a diagnosis. It arrives as an ordinary week you have stopped noticing is strange.',
    patternField: 'whereItShows',
    patternHeading: 'Where your pattern shows up',
  },
  {
    day: 4,
    eyebrow: 'Day 4',
    title: 'What this is not',
    premise:
      'Laziness, willpower, too many carbs, just getting older. Every wrong explanation is a plan you already tried.',
    patternField: 'whatItIsNot',
    patternHeading: 'What your pattern is not',
  },
  {
    day: 5,
    eyebrow: 'Day 5',
    title: 'What moves it',
    premise:
      'Three actions, aimed at your pattern rather than the average. Start with the regulation ones, not the training one.',
    patternField: 'actions',
    patternHeading: 'Your three actions',
  },
] as const

export const DECODE_LENGTH_DAYS = DECODE_DAYS.length

/**
 * Which day she is on, 1-indexed, where the day she enrols is Day 1.
 *
 * Returns a number that can exceed DECODE_LENGTH_DAYS: a finisher who comes
 * back on day 40 should still see all five unlocked rather than falling off
 * the end. Callers clamp for display, never for access.
 *
 * Deliberately mirrors the Challenge portal's arithmetic rather than reading
 * `current_day` off the enrolment row. That column exists but the Challenge
 * page recalculated from `enrolled_at` and never wrote it, so it cannot be
 * trusted on any row created before this shipped.
 */
export function currentDecodeDay(enrolledAt: string | Date, now: Date = new Date()): number {
  const start = enrolledAt instanceof Date ? enrolledAt : new Date(enrolledAt)
  if (Number.isNaN(start.getTime())) return 1
  const elapsed = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  return Math.max(1, elapsed + 1)
}

/** True when this day has been reached and its LESSON should open. Never
 * applied to her read, which is open from minute ten. */
export function isDayUnlocked(day: DecodeDayNumber, currentDay: number): boolean {
  return currentDay >= day
}

/**
 * The pattern-specific paragraphs for a given day.
 *
 * Returns null when the day is not pattern-keyed (Day 1) or when typing did not
 * land on one of the four zones. The second case is real and must not be
 * treated as an error: typeFatMapProfile() returns 'Indeterminate' for a Ready
 * State, for anyone with no section at the floor, and for a woman who answered
 * "I am not sure" on direction of travel. Those people still get the day, they
 * just get it without the pattern block.
 */
export function patternBlockFor(
  day: DecodeDay,
  patternKey: string | null | undefined,
): { heading: string; paragraphs: string[] } | null {
  if (!day.patternField || !day.patternHeading || !patternKey) return null
  const pattern: CheckinPattern | undefined = CHECKIN_PATTERNS[patternKey]
  if (!pattern) return null
  const paragraphs = pattern[day.patternField]
  if (!paragraphs?.length) return null
  return { heading: day.patternHeading, paragraphs }
}

/**
 * Fat Map profile name → CHECKIN_PATTERNS key.
 *
 * The two vocabularies diverged before either was locked and the mapping is
 * load-bearing in three places now, so it lives here rather than being
 * re-declared per component. 'Indeterminate' deliberately has no entry.
 */
export const PROFILE_TO_PATTERN_KEY: Record<string, string> = {
  'Stress-Stored': 'stress-stored',
  'Insulin-Drift': 'metabolic-drift',
  'Estrogen-Shift': 'hormonal-shift',
  'Androgen-Decline': 'system-overload',
}

export function patternKeyForProfile(profile: string | null | undefined): string | null {
  if (!profile) return null
  return PROFILE_TO_PATTERN_KEY[profile] ?? null
}
