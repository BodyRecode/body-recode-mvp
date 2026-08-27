/**
 * When a Progress Check may be sent.
 *
 * Two gates, both Kade's call (27 Aug 2026):
 *
 * 1. The block has ended. The Progress Check exists to close a block, so
 *    sending it mid-block asks the client to re-read a block she is still in.
 *
 * 2. That week's weekly check-in is in. Block-end lands inside a normal
 *    check-in week, so without this the client gets the weekly check-in AND a
 *    24-question re-assessment with measurements and three photos in the same
 *    few days. The bigger ask arriving first is the one that gets done, and the
 *    weekly signal - which the CFWS runs on - is the one that quietly gets
 *    dropped. So the routine one goes first.
 *
 *    With one release valve: once the check-in window has closed, waiting any
 *    longer just stalls the milestone, so a missed check-in must not block it
 *    indefinitely.
 *
 * The gate is advisory, not a lock. `force` lets the coach send anyway - there
 * are real reasons to (a client leaving the country on Friday), and a coach
 * being told why is better served than a coach being stopped.
 */

import { getCheckInWindowStatus, getWeekNumber } from '@/lib/weekly-checkin-questions'

export type ProgressCheckBlocker = 'block_not_ended' | 'weekly_checkin_pending'

export type ProgressCheckReadiness = {
  ready: boolean
  blocker: ProgressCheckBlocker | null
  /** Coach-facing sentence. Always set when blocked. */
  reason: string | null
}

export type ProgressCheckReadinessInput = {
  coachingStartedAt: string | null
  /** Current active block: weeks elapsed in it, and its prescribed duration. */
  blockWeek: number | null
  blockDuration: number | null
  /** Weekly check-ins already submitted for the client's CURRENT coaching week. */
  checkinsThisWeek: number
}

export function evaluateProgressCheckReadiness(
  input: ProgressCheckReadinessInput,
): ProgressCheckReadiness {
  const { blockWeek, blockDuration, checkinsThisWeek } = input

  if (blockWeek != null && blockDuration != null && blockWeek < blockDuration) {
    const remaining = blockDuration - blockWeek
    return {
      ready: false,
      blocker: 'block_not_ended',
      reason: `The block still has ${remaining} week${remaining === 1 ? '' : 's'} to run. The Progress Check closes a block, so it is sent once the block is done.`,
    }
  }

  if (checkinsThisWeek === 0) {
    const window = getCheckInWindowStatus()
    if (window.isOpen) {
      return {
        ready: false,
        blocker: 'weekly_checkin_pending',
        reason: 'This week’s check-in is still open and has not come in yet. Sending both at once means the weekly one gets skipped - it will unblock as soon as she submits it, or when the window closes.',
      }
    }
  }

  return { ready: true, blocker: null, reason: null }
}

/** Current coaching week, or null when the client has no start date. */
export function currentCoachingWeek(coachingStartedAt: string | null): number | null {
  return coachingStartedAt ? getWeekNumber(coachingStartedAt) : null
}
