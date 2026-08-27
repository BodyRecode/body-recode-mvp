/**
 * When a Progress Check may be sent.
 *
 * Two gates, both Kade's call (27 Aug 2026):
 *
 * 1. The block has FINISHED - the final week is done, not merely reached.
 *    "Block end" elsewhere in the app means the client is IN her last week,
 *    which is right for showing a countdown but wrong for this: the Progress
 *    Check closes the block, and a block with days left in it is not closed.
 *    Sending during the final week also lands the ask before the check-in that
 *    completes that week, which is the inversion gate 2 exists to prevent.
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
   * When the block finishes: generated_at + duration weeks. Null when the
   * program has no start date or no prescribed duration, in which case the
   * block gate cannot be evaluated and is skipped.
   */
  blockEndsAtMs: number | null
  /** Did she submit a weekly check-in in the window that most recently opened? */
  checkedInThisWindow: boolean
}

export function evaluateProgressCheckReadiness(
  input: ProgressCheckReadinessInput,
): ProgressCheckReadiness {
  const { blockEndsAtMs, checkedInThisWindow } = input

  if (blockEndsAtMs != null && Date.now() < blockEndsAtMs) {
    const days = Math.ceil((blockEndsAtMs - Date.now()) / 86_400_000)
    return {
      ready: false,
      blocker: 'block_not_ended',
      reason:
        days > 7
          ? `The block has ${Math.ceil(days / 7)} weeks still to run. The Progress Check closes a block, so it goes once the block is finished.`
          : `She is still in the final week - ${days} day${days === 1 ? '' : 's'} to go. The Progress Check goes after she has finished it and sent the check-in that closes it out.`,
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
