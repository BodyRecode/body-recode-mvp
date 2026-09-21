/**
 * A coach's own practice: who is slipping away, and what their book is made of.
 *
 * 21 September 2026. Two things a coach cannot see anywhere, and both fall out
 * of data we already hold.
 *
 * WHO IS ABOUT TO LEAVE. The system already watches readiness drift, meaning
 * her body: notch drops, reds, instability. It has never watched ENGAGEMENT
 * drift, meaning whether she is still turning up. Those are different
 * questions, and a client can hold perfect readiness while being three weeks
 * from cancelling. A solo coach almost always finds out at the cancellation. We
 * can see it four weeks earlier, and nothing else in their stack can, because
 * nothing else sees the weekly answers.
 *
 * WHAT THE BOOK IS MADE OF. "Eleven of your fourteen are regulation-limited"
 * tells a coach what to get better at, what to build an offer around, and which
 * clients to stop taking. No coach has ever been able to see that about their
 * own practice.
 *
 * WHAT THIS DELIBERATELY IS NOT. It does not score the client, rank her, or
 * predict anything about her body. It reports what she has done: whether she
 * answered, whether she opened her read. Turning attendance into a judgement
 * about a woman is the line, and it is not crossed here.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type Attendance = 'steady' | 'slipping' | 'quiet' | 'too_new'

export type ClientStanding = {
  id: string
  name: string
  /** Whole weeks since her last check-in. Null when she has never sent one. */
  weeksSinceCheckin: number | null
  /** Of the last six weeks, how many she answered. */
  answeredOfSix: number
  /** True when her most recent published read was opened by her. */
  openedLastRead: boolean | null
  attendance: Attendance
  /** Why the verdict says what it says, in words a coach can act on. */
  because: string
  readiness: string | null
  pattern: string | null
}

export type PracticeView = {
  clients: ClientStanding[]
  slipping: ClientStanding[]
  byReadiness: { label: string; count: number }[]
  byPattern: { label: string; count: number }[]
  totalActive: number
  /** Weeks of history there are to judge on. Under four, say so rather than pretend. */
  thinEvidence: boolean
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function weeksBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / WEEK_MS)
}

/**
 * Read one coach's practice.
 *
 * Never throws: a page that will not load is worse than a page missing a
 * column. On failure it returns an empty view rather than a wrong one.
 */
export async function practiceView(admin: SupabaseClient, coachId: string | null): Promise<PracticeView> {
  const empty: PracticeView = {
    clients: [], slipping: [], byReadiness: [], byPattern: [], totalActive: 0, thinEvidence: true,
  }

  try {
    let q = admin
      .from('clients')
      .select('id, name, coaching_started_at')
      .is('ended_at', null)
      .is('frozen_at', null)
      .not('coaching_started_at', 'is', null)
    if (coachId) q = q.eq('coach_id', coachId)

    const { data: clients } = await q
    const rows = clients ?? []
    if (rows.length === 0) return empty

    const ids = rows.map(r => r.id as string)
    const sixWeeksAgo = new Date(Date.now() - 6 * WEEK_MS).toISOString()

    const [{ data: checkins }, { data: reads }] = await Promise.all([
      admin.from('weekly_checkins').select('client_id, submitted_at')
        .in('client_id', ids).gte('submitted_at', sixWeeksAgo),
      admin.from('cffs').select('client_id, body_state_classification, pattern_classification, client_opened_at, client_reading_email_sent_at, generated_at')
        .in('client_id', ids).eq('is_archived', false),
    ])

    const byClient = new Map<string, Date[]>()
    for (const c of checkins ?? []) {
      if (!c.submitted_at) continue
      const list = byClient.get(c.client_id as string) ?? []
      list.push(new Date(c.submitted_at as string))
      byClient.set(c.client_id as string, list)
    }

    const readByClient = new Map<string, Record<string, unknown>>()
    for (const r of reads ?? []) readByClient.set(r.client_id as string, r)

    const now = new Date()
    const standings: ClientStanding[] = rows.map(c => {
      const dates = (byClient.get(c.id as string) ?? []).sort((a, b) => b.getTime() - a.getTime())
      const last = dates[0] ?? null
      const weeksSince = last ? weeksBetween(last, now) : null
      const answeredOfSix = new Set(dates.map(d => weeksBetween(d, now))).size

      const started = c.coaching_started_at ? new Date(c.coaching_started_at as string) : null
      const weeksCoached = started ? weeksBetween(started, now) : 0

      const read = readByClient.get(c.id as string)
      const sent = !!read?.client_reading_email_sent_at
      const openedLastRead = sent ? !!read?.client_opened_at : null

      let attendance: Attendance
      let because: string

      if (weeksCoached < 3) {
        attendance = 'too_new'
        because = 'Too new to say. Three weeks of answers before this means anything.'
      } else if (weeksSince === null) {
        attendance = 'quiet'
        because = 'She has never sent a check-in.'
      } else if (weeksSince >= 3) {
        attendance = 'quiet'
        because = `No check-in for ${weeksSince} weeks.`
      } else if (weeksSince === 2 || answeredOfSix <= 2) {
        attendance = 'slipping'
        because = weeksSince === 2
          ? `Last check-in was two weeks ago. ${answeredOfSix} of the last six.`
          : `Only ${answeredOfSix} of the last six weeks answered.`
      } else if (sent && openedLastRead === false) {
        // Turning up but not reading what she gets is its own kind of leaving.
        attendance = 'slipping'
        because = 'Answering her check-ins, but has not opened her last read.'
      } else {
        attendance = 'steady'
        because = `${answeredOfSix} of the last six weeks answered.`
      }

      return {
        id: c.id as string,
        name: (c.name as string) ?? 'Unnamed',
        weeksSinceCheckin: weeksSince,
        answeredOfSix,
        openedLastRead,
        attendance,
        because,
        readiness: (read?.body_state_classification as string) ?? null,
        pattern: (read?.pattern_classification as string) ?? null,
      }
    })

    const count = (key: 'readiness' | 'pattern') => {
      const m = new Map<string, number>()
      for (const s of standings) {
        const v = s[key]
        if (!v) continue
        m.set(v, (m.get(v) ?? 0) + 1)
      }
      return [...m.entries()].map(([label, c]) => ({ label, count: c })).sort((a, b) => b.count - a.count)
    }

    // Quiet first: a client three weeks gone needs the call today.
    const order: Record<Attendance, number> = { quiet: 0, slipping: 1, steady: 2, too_new: 3 }

    return {
      clients: standings.sort((a, b) => order[a.attendance] - order[b.attendance] || a.name.localeCompare(b.name)),
      slipping: standings.filter(s => s.attendance === 'quiet' || s.attendance === 'slipping'),
      byReadiness: count('readiness'),
      byPattern: count('pattern'),
      totalActive: standings.length,
      thinEvidence: standings.every(s => s.attendance === 'too_new'),
    }
  } catch {
    return empty
  }
}
