/**
 * Counts for the sidebar rail.
 *
 * Runs in the dashboard layout, so it runs on EVERY dashboard page. Every
 * query here is a count-only round trip with no rows returned, and the whole
 * thing fails open: if a count errors the badge simply does not render, which
 * is always better than a page that will not load because a badge could not
 * be worked out.
 *
 * Colour rule: blue is a count of work waiting, red is something wrong. An
 * unread message is not an alarm.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { coachFilter, type CoachScope } from '@/lib/coach-scope'

export type NavBadges = Record<string, { count: number; tone: 'info' | 'alert' } | undefined>

/**
 * SCOPED TO THIS COACH, 21 September 2026.
 *
 * These counted every check-in, message and piece of feedback in the system,
 * with the service role, for whoever was looking. A test coach with no clients
 * at all was shown "Messages 1", which was somebody else's client.
 *
 * Two things wrong with that, and the smaller one is the leak. A coach cannot
 * read the message, but a number that moves tells them how busy another coach
 * is. The larger one is that the badge is a lie to its own reader: they click
 * it, find an empty page, and learn that the numbers here cannot be trusted.
 *
 * Fails open as before: a count that errors simply does not render. But it now
 * fails CLOSED on ownership, because an unscoped count is worse than no count.
 */
export async function getNavBadges(scope: CoachScope): Promise<NavBadges> {
  const admin = createAdminClient()
  const onlyCoach = coachFilter(scope)

  // Whose clients to count. Null means the owner, who counts everybody.
  let clientIds: string[] | null = null
  if (onlyCoach) {
    const { data } = await admin.from('clients').select('id').eq('coach_id', onlyCoach)
    clientIds = (data ?? []).map(r => r.id as string)
    // A coach with no clients yet has nothing to count, and must not fall
    // through to counting everyone.
    if (clientIds.length === 0) return {}
  }
  // Written out rather than wrapped in a helper: wrapping the query builder in
  // a generic is what makes TypeScript give up with "type instantiation is
  // excessively deep", which is the same note already on coachFilter. A value
  // and three explicit calls keep the types simple and the filter visible at
  // each call site, which is where it matters.
  const scopedIds = clientIds

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setHours(0, 0, 0, 0)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  try {
    // Sequential and explicit. A conditional inside Promise.all produced a
    // union of two query builder types that TypeScript could not infer through,
    // which is the same "excessively deep" trap noted on coachFilter.
    const checkinQuery = admin
      .from('weekly_checkins')
      .select('id')
      .gte('submitted_at', sevenDaysAgo.toISOString())
      .is('coach_skipped_at', null)
    const checkinRows = scopedIds === null ? await checkinQuery : await checkinQuery.in('client_id', scopedIds)

    const messageQuery = admin
      .from('client_messages')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
    const unreadMessages = scopedIds === null ? await messageQuery : await messageQuery.in('client_id', scopedIds)

    const feedbackQuery = admin
      .from('client_feedback')
      .select('id', { count: 'exact', head: true })
      .is('acknowledged_at', null)
    const unacknowledgedFeedback = scopedIds === null ? await feedbackQuery : await feedbackQuery.in('client_id', scopedIds)

    const ids = (checkinRows.data || []).map(r => r.id)
    let pendingCheckins = 0
    if (ids.length) {
      const { data: answered } = await admin
        .from('weekly_checkin_feedback')
        .select('weekly_checkin_id')
        .in('weekly_checkin_id', ids)
      const answeredIds = new Set((answered || []).map(a => a.weekly_checkin_id))
      pendingCheckins = ids.filter(id => !answeredIds.has(id)).length
    }

    const badges: NavBadges = {}
    if (pendingCheckins > 0) badges['/dashboard/checkins'] = { count: pendingCheckins, tone: 'info' }
    if (unreadMessages.count) badges['/dashboard/messages'] = { count: unreadMessages.count, tone: 'info' }
    if (unacknowledgedFeedback.count) badges['/dashboard/feedback'] = { count: unacknowledgedFeedback.count, tone: 'info' }
    return badges
  } catch {
    // Fail open - no badges is a fine outcome, a broken dashboard is not.
    return {}
  }
}
