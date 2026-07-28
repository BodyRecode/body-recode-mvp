/**
 * Temporal context for every AI generation in the platform.
 *
 * A language model has no inherent sense of "today". Left unstated, it cannot
 * reason about anything time-bound, and it will not tell you it can't — it
 * produces a confident, plausible answer anchored to nothing.
 *
 * That cost us a real plan on 2026-07-28: a client with a dated event
 * ("7 Bridges walk in late October") was given a 24-week macro arc whose
 * walk-readiness block started two weeks AFTER the walk. The model had been
 * handed the words "late October" and no way on earth to know how far away
 * that was. It wasn't a bad answer to the question asked. It was the wrong
 * question.
 *
 * At the time, 1 of 32 AI routes told the model the date.
 *
 * Rule: every prompt that could touch a date, a deadline, a duration, a
 * progression or a "how long until" gets this block. Cheap to include, and the
 * failure mode when it is missing is silent.
 */

/** AEST year-round. Queensland does not observe daylight saving. */
const AEST_OFFSET_HOURS = 10

function aestNow(now: Date): Date {
  return new Date(now.getTime() + AEST_OFFSET_HOURS * 60 * 60 * 1000)
}

/**
 * The block to drop into any system prompt. Keep it near the top: a date buried
 * under two thousand tokens of context gets treated as trivia.
 */
export function temporalContext(now: Date = new Date()): string {
  const aest = aestNow(now)
  const iso = aest.toISOString().slice(0, 10)
  const readable = aest.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC', // already shifted to AEST wall time
  })
  return `CURRENT DATE
Today is ${readable} (${iso}), Australian Eastern Standard Time.
Use this for anything time-bound: how far away a date is, how many weeks a plan has to work with, whether something is overdue, how long ago something happened. Never assume a date from your training data. If a required date is missing from the context, say so rather than estimating.`
}

/** Prepends the date block to a system prompt. Use at every generation call site. */
export function withTemporalContext(systemPrompt: string, now: Date = new Date()): string {
  return `${temporalContext(now)}\n\n${systemPrompt}`
}

/** Whole weeks between now and a target date. Negative when already passed. */
export function weeksUntil(target: Date, now: Date = new Date()): number {
  return Math.round((target.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

/**
 * Best-effort parse of a free-text client timeline into a date.
 *
 * Intake asks "desired timeline" as free text, so it arrives as things like
 * "Be ready for 7 Bridges walk in late October" or "in about 3 months". This
 * recognises the common shapes and returns null otherwise — a wrong date is
 * far worse than no date, so anything ambiguous is left for the coach.
 */
export function parseTimelineToDate(text: string | null | undefined, now: Date = new Date()): Date | null {
  if (!text) return null
  const t = text.toLowerCase()

  const relative = t.match(/(\d+)\s*(week|month)s?/)
  if (relative) {
    const n = parseInt(relative[1], 10)
    const d = new Date(now)
    if (relative[2] === 'week') d.setDate(d.getDate() + n * 7)
    else d.setMonth(d.getMonth() + n)
    return d
  }

  const MONTHS = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ]
  const monthIdx = MONTHS.findIndex(m => t.includes(m))
  if (monthIdx === -1) return null

  // "early" = 7th, "mid" = 15th, "late" = 24th, unqualified = mid.
  const day = /\blate\b/.test(t) ? 24 : /\bearly\b/.test(t) ? 7 : 15
  const year = now.getFullYear()
  let candidate = new Date(Date.UTC(year, monthIdx, day))
  // A month already past this year almost always means next year.
  if (candidate.getTime() < now.getTime() - 14 * 24 * 60 * 60 * 1000) {
    candidate = new Date(Date.UTC(year + 1, monthIdx, day))
  }
  return candidate
}

/**
 * A hard planning constraint for a dated goal, or null when there isn't one.
 * Deliberately emphatic: the previous failure was a date sitting in context as
 * one soft line among fifteen, formatted identically to "Sex: Female".
 */
export function deadlineConstraint(
  timelineText: string | null | undefined,
  now: Date = new Date(),
): string | null {
  const target = parseTimelineToDate(timelineText, now)
  if (!target) return null
  const weeks = weeksUntil(target, now)
  if (weeks < 0) return null

  return `DATED GOAL - HARD CONSTRAINT
The client has a fixed target: "${timelineText}"
That is approximately ${target.toISOString().slice(0, 10)}, which is ${weeks} week${weeks === 1 ? '' : 's'} from today.

This is a constraint, not background. Everything you plan before that date must fit inside ${weeks} weeks. Do not produce a plan that runs past it, and do not place preparation for the event after the event. State the week each block starts and ends so the arithmetic is checkable.
The final block before the target must reduce load, not raise it. Peaking into a fixed date is a programming error.`
}
