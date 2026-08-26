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

export type NavBadges = Record<string, { count: number; tone: 'info' | 'alert' } | undefined>

export async function getNavBadges(): Promise<NavBadges> {
  const admin = createAdminClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setHours(0, 0, 0, 0)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  try {
    const [checkinRows, unreadMessages, unacknowledgedFeedback] = await Promise.all([
      // Pending = submitted in the window, not skipped, and no feedback row
      // yet. Two small selects rather than a join so the shape stays obvious.
      admin
        .from('weekly_checkins')
        .select('id')
        .gte('submitted_at', sevenDaysAgo.toISOString())
        .is('coach_skipped_at', null),
      admin
        .from('client_messages')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null),
      admin
        .from('client_feedback')
        .select('id', { count: 'exact', head: true })
        .is('acknowledged_at', null),
    ])

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
