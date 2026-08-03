// Who can open the Challenge portal.
//
// Until 2026-08-03 every portal page and form API required status 'active'.
// The Day 14 Inngest step flips status to 'completed' immediately after
// sending the Day 14 email, so the portal went dark the moment someone
// finished: training plan, nutrition guide, coaching notes, the Day 14 Read
// video, all 404 with no warning.
//
// The damaging part was the Body Decode Check-In. It gates the pattern reveal,
// 17 of the first 18 finishers had not done it, and the door shut behind them
// so they could never complete it. The Day 14 fallback email even asks what
// got in the way of completing it, while the page it refers to is already
// unreachable.
//
// The late-taker path in /api/challenge/quiz already handles a post-Day-14
// submission correctly - it sends the full Body Decode Report immediately
// rather than the Day 7 progress email - so reopening access is all that was
// needed to make it reachable.
//
// NOT used by /api/challenge/enroll: that endpoint's `status = 'active'` check
// is duplicate-enrolment detection. Widening it there would stop a past
// participant from ever enrolling again.

export const PORTAL_ACCESS_STATUSES = ['active', 'completed'] as const

/** True when this enrolment status may still open the portal and its forms. */
export function hasPortalAccess(status: string | null | undefined): boolean {
  return status === 'active' || status === 'completed'
}
