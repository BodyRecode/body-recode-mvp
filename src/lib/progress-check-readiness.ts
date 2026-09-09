/**
 * When a Progress Check may be sent.
 *
 * Two gates, both Kade's call (27 Aug 2026):
 *
 * 1. The block has REACHED ITS FINAL WEEK.
 *
 *    REVISED 31 Aug 2026 (Kade). This used to wait for the calendar end date,
 *    on the reasoning that a block with days left in it is not closed. Two
 *    things broke that:
 *
 *    - The portal has always told the client, in her final week, "finish the
 *      week and send your check-in, and your Progress Check opens next". The
 *      backend did not keep that promise. Razia read it in week 8 of 8, sent
 *      her check-in, and nothing opened, because the end date was six days out.
 *    - Activation dates drift. Her Block 2 was activated eight days before
 *      Block 1 finished, so a rule keyed on a calendar date inherits every bad
 *      activation date in the system. "She reached her final week" does not.
 *
 *    Gate 2 still prevents the inversion this used to guard against: the
 *    check-in must already be in before the bigger ask goes.
 *
 * 2. The most recent weekly check-in is in - regardless of where in the week
 *    we are. Block-end lands inside a normal check-in week, so without this the
 *    client gets the weekly check-in AND a 24-question re-assessment with
 *    measurements and three photos in the same few days. The bigger ask
 *    arriving first is the one that gets done, and the weekly signal - which
 *    the CFWS runs on - is the one that quietly gets dropped.
 *
 *    An earlier version unlocked automatically once the window closed, which
 *    let a Thursday send land BEFORE the weekend's check-in - the exact
 *    inversion the rule exists to prevent. The check-in comes first, full stop.
 *    Where she never submits, the release valve is the coach's own override
 *    below, which is a judgement call and belongs to a person.
 *
 * The gate is advisory, not a lock. `force` lets the coach send anyway - there
 * are real reasons to (a client leaving the country on Friday), and a coach
 * being told why is better served than a coach being stopped.
 */

import { getWeekNumber } from '@/lib/weekly-checkin-questions'

/**
 * The standard: 12 weeks from her last read. Kade's call, 9 Sep 2026.
 *
 * Counted from the READ - not from coaching start, not from a block start -
 * because the read is the only clock Body Recode owns. Coaching start drifts
 * out of step the moment anyone pauses, and a block start does not exist for
 * most coaches. Each completed re-read restarts it, so no client's picture is
 * ever more than 12 weeks old.
 *
 * A CEILING, not a schedule. A dated block reaching its final week brings it
 * forward, and drift detection may later do the same.
 */
export const REREAD_INTERVAL_DAYS = 84

export type ProgressCheckBlocker =
  | 'too_soon'
  | 'no_read_yet'
  | 'block_not_ended'
  | 'weekly_checkin_pending'

export type ProgressCheckReadiness = {
  ready: boolean
  blocker: ProgressCheckBlocker | null
  /** Coach-facing sentence. Always set when blocked. */
  reason: string | null
}

export type ProgressCheckReadinessInput = {
  coachingStartedAt: string | null
  /**
   * When her CURRENT read was produced, in ms: the later of the newest CFFS and
   * the newest completed Progress Check. This is the clock the standard runs
   * on. Each completed re-read restarts it, so it perpetuates itself and means
   * the same thing in every product.
   *
   * Null means she has no read at all, which BLOCKS: a Progress Check is a
   * RE-read, and there is nothing yet to re-read.
   */
  lastReadAtMs: number | null
  /**
   * When the block's FINAL WEEK begins: start + (duration - 1) weeks. Null when
   * the program has no start date or no prescribed duration, or when the coach
   * does not write fixed-length blocks at all. See blockFinalWeekStartMs.
   *
   * OPTIONAL, and deliberately so. A block is Performance Coaching vocabulary
   * (Kade, 9 Sep 2026): other coaches write 4, 8 or 12 week blocks or none, and
   * software embedding the read has no such concept. So it can only ever bring
   * the re-read FORWARD, never hold it back.
   */
  blockFinalWeekStartsAtMs: number | null
  /** Did she submit a weekly check-in in the window that most recently opened? */
  checkedInThisWindow: boolean
}

export function evaluateProgressCheckReadiness(
  input: ProgressCheckReadinessInput,
): ProgressCheckReadiness {
  const { blockFinalWeekStartsAtMs, checkedInThisWindow, lastReadAtMs } = input
  const now = Date.now()

  // GATE 1 - TIME SINCE HER LAST READ. This is the standard, and the only gate
  // that means the same thing for every coach in every product.
  //
  // A dated block reaching its final week ALSO satisfies it, which is what
  // keeps Kade's own practice on its existing rhythm: his blocks run 6-8 weeks,
  // so block-end lands first and nothing about his coaching changes. But it can
  // only bring the re-read forward. A coach who writes no blocks is paced by
  // the 12 weeks instead of - as before - never being paced at all.
  if (lastReadAtMs == null) {
    return {
      ready: false,
      blocker: 'no_read_yet',
      reason:
        'She has no foundational read yet, and a Progress Check is a re-read, so there is nothing for it to compare against. Generate her read first.',
    }
  }

  const daysSinceRead = Math.floor((now - lastReadAtMs) / 86_400_000)
  const blockFinalWeekReached =
    blockFinalWeekStartsAtMs != null && now >= blockFinalWeekStartsAtMs

  if (daysSinceRead < REREAD_INTERVAL_DAYS && !blockFinalWeekReached) {
    const weeksLeft = Math.ceil((REREAD_INTERVAL_DAYS - daysSinceRead) / 7)
    return {
      ready: false,
      blocker: blockFinalWeekStartsAtMs != null ? 'block_not_ended' : 'too_soon',
      reason:
        `Her read is ${daysSinceRead} days old. The re-read opens at ${REREAD_INTERVAL_DAYS} days, so about ` +
        `${weeksLeft} week${weeksLeft === 1 ? '' : 's'} from now` +
        (blockFinalWeekStartsAtMs != null
          ? ', or sooner if she reaches the final week of her block first.'
          : '.'),
    }
  }

  // GATE 2 - her latest weekly check-in is in. Not a coaching concept: it is
  // the weekly signal. Block-end and the 12-week mark both land inside an
  // ordinary check-in week, and if the bigger ask (24 questions, tape measure,
  // three photos) arrives first, it is the one that gets done and the weekly
  // signal - which the CFWS runs on - is the one quietly dropped.
  //
  // An earlier version unlocked automatically once the window closed, which let
  // a Thursday send land BEFORE the weekend's check-in: the exact inversion the
  // rule exists to prevent. The check-in comes first, full stop. Where she never
  // submits, the release valve is the coach's own override, which is a
  // judgement call and belongs to a person.
  if (!checkedInThisWindow) {
    return {
      ready: false,
      blocker: 'weekly_checkin_pending',
      reason: 'Her weekly check-in for this window has not come in yet. The Progress Check goes after it, not before - sending now means the weekly one is the one that gets skipped. It unblocks as soon as she submits.',
    }
  }

  return { ready: true, blocker: null, reason: null }
}

/** Current coaching week, or null when the client has no start date. */
export function currentCoachingWeek(coachingStartedAt: string | null): number | null {
  return coachingStartedAt ? getWeekNumber(coachingStartedAt) : null
}
