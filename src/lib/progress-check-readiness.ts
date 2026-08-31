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

export type ProgressCheckBlocker = 'block_not_ended' | 'weekly_checkin_pending'

export type ProgressCheckReadiness = {
  ready: boolean
  blocker: ProgressCheckBlocker | null
  /** Coach-facing sentence. Always set when blocked. */
  reason: string | null
}

export type ProgressCheckReadinessInput = {
  coachingStartedAt: string | null
  /**
   * When the block's FINAL WEEK begins: start + (duration - 1) weeks. Null when
   * the program has no start date or no prescribed duration, in which case the
   * block gate cannot be evaluated and is skipped. See blockFinalWeekStartMs.
   */
  blockFinalWeekStartsAtMs: number | null
  /** Did she submit a weekly check-in in the window that most recently opened? */
  checkedInThisWindow: boolean
}

export function evaluateProgressCheckReadiness(
  input: ProgressCheckReadinessInput,
): ProgressCheckReadiness {
  const { blockFinalWeekStartsAtMs, checkedInThisWindow } = input

  if (blockFinalWeekStartsAtMs != null && Date.now() < blockFinalWeekStartsAtMs) {
    const days = Math.ceil((blockFinalWeekStartsAtMs - Date.now()) / 86_400_000)
    return {
      ready: false,
      blocker: 'block_not_ended',
      reason:
        days > 7
          ? `The block has ${Math.ceil(days / 7)} weeks to run before its final week. The Progress Check closes a block, so it opens once she reaches that last week.`
          : `She reaches her final week in ${days} day${days === 1 ? '' : 's'}. The Progress Check opens then, once her check-in is also in.`,
    }
  }

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
