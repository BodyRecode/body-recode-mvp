/**
 * What needs a coach today.
 *
 * 21 September 2026. The Today page is the first thing anybody sees after
 * signing in, and for a coach it was Kade's business: Instagram posts, stories,
 * lead follow-ups, leads still deciding, live metrics and the build board. Not
 * one section was about their clients. A pilot coach's front door, every
 * morning, showed them nothing they could act on.
 *
 * THE SHAPE OF A COACH'S WEEK, which is what this has to serve. Add a client,
 * they complete an intake. Generate the read, review it, publish it, send it.
 * Every week a check-in arrives and gets a response. At twelve weeks, a
 * progress check and a re-read.
 *
 * So the queue is the read pipeline plus the weekly loop plus who has gone
 * quiet. Nothing else.
 *
 * ORDERED BY WHO IS WAITING ON THE COACH, not by what is oldest. A client who
 * finished a long intake and has heard nothing is first on the list, because
 * they are the one currently forming a view of whether this was worth it.
 *
 * LANGUAGE STAYS UNIVERSAL. Kade, 21 Sep: the pilot coaches and he both train
 * men. Ninety-three per cent of the audience being women is a fact about who
 * arrives, not a licence to write as though the rest do not exist, and a coach
 * reading "her" on every line is being told the product is not for half their
 * book.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type TodayItem = {
  clientId: string
  clientName: string
  /** What the coach does, written as the action rather than the state. */
  action: string
  /** Why it is here, in one line. */
  detail: string
  href: string
  urgency: 'now' | 'soon' | 'watch'
  /** Days this has been waiting, when that is knowable. */
  waitingDays?: number
}

export type CoachToday = {
  items: TodayItem[]
  counts: { now: number; soon: number; watch: number }
  activeClients: number
}

const DAY = 24 * 60 * 60 * 1000
const daysSince = (iso: string | null | undefined): number | null =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY) : null

export async function coachToday(admin: SupabaseClient, coachId: string | null): Promise<CoachToday> {
  const empty: CoachToday = { items: [], counts: { now: 0, soon: 0, watch: 0 }, activeClients: 0 }

  try {
    let q = admin
      .from('clients')
      .select('id, name, coaching_started_at, onboarding_token')
      .is('ended_at', null)
      .is('frozen_at', null)
    if (coachId) q = q.eq('coach_id', coachId)

    const { data: clients } = await q
    const rows = clients ?? []
    if (rows.length === 0) return empty

    const ids = rows.map(r => r.id as string)
    const nameOf = new Map(rows.map(r => [r.id as string, (r.name as string) ?? 'Unnamed']))

    const [intakes, reads, checkins, feedback, invitations] = await Promise.all([
      admin.from('intakes').select('client_id, submitted_at').in('client_id', ids),
      admin.from('cffs')
        .select('client_id, generated_at, client_reading_generated_at, client_reading_published_at, client_reading_email_sent_at, client_opened_at')
        .in('client_id', ids).eq('is_archived', false),
      admin.from('weekly_checkins').select('id, client_id, week_number, form_type, submitted_at, coach_skipped_at')
        .in('client_id', ids).order('submitted_at', { ascending: false }),
      admin.from('weekly_checkin_feedback').select('weekly_checkin_id').in('client_id', ids),
      admin.from('intake_invitations').select('client_id, status, created_at').in('client_id', ids),
    ])

    const intakeBy = new Map<string, string | null>()
    for (const i of intakes.data ?? []) {
      if (i.submitted_at) intakeBy.set(i.client_id as string, i.submitted_at as string)
    }
    const readBy = new Map<string, Record<string, unknown>>()
    for (const r of reads.data ?? []) readBy.set(r.client_id as string, r)

    const answered = new Set((feedback.data ?? []).map(f => f.weekly_checkin_id as string))

    const items: TodayItem[] = []

    for (const c of rows) {
      const id = c.id as string
      const name = nameOf.get(id) ?? 'Unnamed'
      const base = `/dashboard/clients/${id}`
      const intakeAt = intakeBy.get(id) ?? null
      const read = readBy.get(id)

      // 1. The intake is in and nothing has happened.
      if (intakeAt && !read?.generated_at) {
        const d = daysSince(intakeAt) ?? 0
        items.push({
          clientId: id, clientName: name,
          action: 'Generate their read',
          detail: d === 0 ? 'Their intake came in today.' : `Their intake has been in for ${d} day${d === 1 ? '' : 's'}.`,
          href: base, urgency: d >= 2 ? 'now' : 'soon', waitingDays: d,
        })
        continue
      }

      // 2. The read exists and the client has not been told.
      if (read?.client_reading_generated_at && !read?.client_reading_published_at) {
        const d = daysSince(read.client_reading_generated_at as string) ?? 0
        items.push({
          clientId: id, clientName: name,
          action: 'Review and publish their read',
          detail: `Written ${d === 0 ? 'today' : `${d} day${d === 1 ? '' : 's'} ago`}, still unpublished.`,
          href: base, urgency: d >= 2 ? 'now' : 'soon', waitingDays: d,
        })
        continue
      }
      if (read?.client_reading_published_at && !read?.client_reading_email_sent_at) {
        items.push({
          clientId: id, clientName: name,
          action: 'Send them the read',
          detail: 'Published to their portal, but they have not been told it is there.',
          href: base, urgency: 'now',
        })
        continue
      }
    }

    // 3. Check-ins waiting on a response.
    const seen = new Set<string>()
    for (const ci of checkins.data ?? []) {
      const id = ci.client_id as string
      if (!ci.submitted_at || ci.coach_skipped_at) continue
      if (answered.has(ci.id as string)) continue
      const key = `${id}-${ci.week_number}-${ci.form_type}`
      if (seen.has(key)) continue
      seen.add(key)
      const d = daysSince(ci.submitted_at as string) ?? 0
      if (d > 21) continue // Too old to chase; the weekly loop has moved on.
      items.push({
        clientId: id, clientName: nameOf.get(id) ?? 'Unnamed',
        action: `Answer the week ${ci.week_number} check-in`,
        detail: d === 0 ? 'Came in today.' : `Waiting ${d} day${d === 1 ? '' : 's'}.`,
        href: `/dashboard/clients/${id}/checkins/${ci.week_number}/${ci.form_type}`,
        urgency: d >= 3 ? 'now' : 'soon', waitingDays: d,
      })
    }

    // 4. An intake invitation sent and never returned.
    for (const inv of invitations.data ?? []) {
      const id = inv.client_id as string
      if (intakeBy.has(id)) continue
      if (inv.status !== 'pending') continue
      const d = daysSince(inv.created_at as string) ?? 0
      if (d < 7) continue
      items.push({
        clientId: id, clientName: nameOf.get(id) ?? 'Unnamed',
        action: 'Chase their intake',
        detail: `Invited ${d} days ago, not started.`,
        href: `/dashboard/clients/${id}`, urgency: d >= 14 ? 'now' : 'watch', waitingDays: d,
      })
    }

    // 5. Sent, and never opened. Quiet, but it is the product going
    //    unread, so it belongs on the list rather than in a report.
    for (const [id, read] of readBy) {
      if (!read.client_reading_email_sent_at || read.client_opened_at) continue
      const d = daysSince(read.client_reading_email_sent_at as string) ?? 0
      if (d < 3) continue
      items.push({
        clientId: id, clientName: nameOf.get(id) ?? 'Unnamed',
        action: 'Read not opened yet',
        detail: `Sent ${d} days ago, never opened.`,
        href: `/dashboard/clients/${id}`, urgency: 'watch', waitingDays: d,
      })
    }

    const rank = { now: 0, soon: 1, watch: 2 }
    items.sort((a, b) => rank[a.urgency] - rank[b.urgency] || (b.waitingDays ?? 0) - (a.waitingDays ?? 0))

    return {
      items,
      counts: {
        now: items.filter(i => i.urgency === 'now').length,
        soon: items.filter(i => i.urgency === 'soon').length,
        watch: items.filter(i => i.urgency === 'watch').length,
      },
      activeClients: rows.filter(r => r.coaching_started_at).length,
    }
  } catch {
    return empty
  }
}
