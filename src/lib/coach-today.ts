/**
 * What needs a coach today.
 *
 * 21 September 2026. The Today page is the first thing anybody sees after
 * signing in, and for a coach it was Kade's business: Instagram posts, lead
 * follow-ups, live metrics and the build board. Not one section was about their
 * clients.
 *
 * 22 September 2026, REBUILT, after Kade asked the only question that matters
 * about a page: what is this meant to achieve, is it doing it, how do we
 * improve it. It was not doing it, and the fault was its SHAPE rather than its
 * styling.
 *
 * WHAT WAS WRONG. It was a task queue on a product whose entire value is
 * interpretation. Seven clients produced twelve rows, because one client with
 * three unanswered check-ins was three rows. It sorted OLDEST FIRST, which puts
 * the least useful work at the top: a week-7 check-in waiting nineteen days is
 * nearly worthless to answer, because two more have arrived since. Every line
 * said what the coach OWED rather than what was happening to the person, so
 * eleven rows of "waiting 19 days" told a coach they were failing before they
 * had done anything. And readiness, the single most valuable thing the system
 * knows about anybody, did not appear on the page at all.
 *
 * WHAT IT IS NOW. A triage list. ONE ROW PER CLIENT, carrying their readiness,
 * banded by what it would cost to ignore them, and saying WHAT IS HAPPENING
 * rather than what is owed. A coach reads it and learns something about their
 * practice, which is the thing they are paying for.
 *
 * THE THREE BANDS, and the third is not padding:
 *   need   something is waiting that has a cost, or a gate has fired
 *   look   worth a glance, nothing is burning
 *   fine   nothing needed, and SAYING SO IS WORTH AS MUCH as the rest. A coach
 *          who knows five of seven are fine has been given their morning back.
 *
 * LANGUAGE STAYS UNIVERSAL. Ninety-three per cent of the audience being women
 * is a fact about who arrives, not a licence to write as though the rest do not
 * exist.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type Readiness = 'Remediation' | 'Optimisation' | 'Post-Optimisation'
export type Band = 'need' | 'look' | 'fine'

export type ClientToday = {
  clientId: string
  clientName: string
  href: string
  /** Null when nothing has been read yet, which is a state rather than a gap. */
  readiness: Readiness | null
  /** A safety gate has fired. NOT a fourth readiness level: a different axis. */
  gateOpen: boolean
  band: Band
  /** What the coach does. Null in the `fine` band, where the answer is nothing. */
  action: string | null
  /** What is happening, in one line. Never what they owe. */
  why: string
  /** For the quiet right-hand column. Already worded. */
  waitLabel: string | null
  /** Sorting only. */
  weight: number
}

export type CoachToday = {
  clients: ClientToday[]
  counts: { need: number; look: number; fine: number }
  activeClients: number
  /** Reads answered or generated in the last seven days, by day, oldest first. */
  readsThisWeek: number[]
  /** How many are held behind a safety gate. */
  held: number
  /** The whole book in one line. Absence is a bar too. */
  book: { label: string; count: number }[]
}

const DAY = 24 * 60 * 60 * 1000
const daysSince = (iso: string | null | undefined): number | null =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY) : null
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

export async function coachToday(admin: SupabaseClient, coachId: string | null): Promise<CoachToday> {
  const empty: CoachToday = {
    clients: [], counts: { need: 0, look: 0, fine: 0 }, activeClients: 0,
    readsThisWeek: [0, 0, 0, 0, 0, 0, 0], held: 0, book: [],
  }

  try {
    let q = admin
      .from('clients')
      .select('id, name, coaching_started_at')
      .is('ended_at', null)
      .is('frozen_at', null)
    if (coachId) q = q.eq('coach_id', coachId)

    const { data: clients } = await q
    const rows = clients ?? []
    if (rows.length === 0) return empty

    const ids = rows.map(r => r.id as string)

    const [intakes, reads, checkins, feedback, invitations] = await Promise.all([
      admin.from('intakes').select('client_id, submitted_at').in('client_id', ids),
      admin.from('cffs')
        .select('client_id, generated_at, body_state_classification, reassessment_flagged, client_context_summary, cr_where_you_are, client_reading_generated_at, client_reading_published_at, client_reading_email_sent_at, client_opened_at')
        .in('client_id', ids).eq('is_archived', false),
      admin.from('weekly_checkins').select('id, client_id, week_number, form_type, submitted_at, coach_skipped_at')
        .in('client_id', ids).order('submitted_at', { ascending: false }),
      admin.from('weekly_checkin_feedback').select('weekly_checkin_id').in('client_id', ids),
      admin.from('intake_invitations').select('client_id, status, created_at').in('client_id', ids),
    ])

    const intakeBy = new Map<string, string>()
    for (const i of intakes.data ?? []) {
      if (i.submitted_at) intakeBy.set(i.client_id as string, i.submitted_at as string)
    }

    // Latest read per client. Rows arrive unordered, so keep the newest.
    const readBy = new Map<string, Record<string, unknown>>()
    for (const r of reads.data ?? []) {
      const id = r.client_id as string
      const prev = readBy.get(id)
      const t = (x: Record<string, unknown> | undefined) => x ? Date.parse(String(x.generated_at ?? 0)) || 0 : -1
      if (!prev || (Date.parse(String(r.generated_at ?? 0)) || 0) >= t(prev)) readBy.set(id, r)
    }

    const answered = new Set((feedback.data ?? []).map(f => f.weekly_checkin_id as string))

    // Unanswered check-ins per client, newest first. A coach cares about the
    // most recent one; the older ones are context, not separate jobs.
    const waiting = new Map<string, { week: number; days: number }[]>()
    const seen = new Set<string>()
    for (const ci of checkins.data ?? []) {
      const id = ci.client_id as string
      if (!ci.submitted_at || ci.coach_skipped_at) continue
      if (answered.has(ci.id as string)) continue
      const key = `${id}-${ci.week_number}-${ci.form_type}`
      if (seen.has(key)) continue
      seen.add(key)
      const list = waiting.get(id) ?? []
      list.push({ week: Number(ci.week_number ?? 0), days: daysSince(ci.submitted_at as string) ?? 0 })
      waiting.set(id, list)
    }
    for (const list of waiting.values()) list.sort((a, b) => a.days - b.days)

    const pendingInvite = new Map<string, number>()
    for (const inv of invitations.data ?? []) {
      const id = inv.client_id as string
      if (inv.status !== 'pending' || intakeBy.has(id)) continue
      pendingInvite.set(id, daysSince(inv.created_at as string) ?? 0)
    }

    const out: ClientToday[] = []
    const readsThisWeek = [0, 0, 0, 0, 0, 0, 0]
    let held = 0

    for (const c of rows) {
      const id = c.id as string
      const name = (c.name as string) ?? 'Unnamed'
      const href = `/dashboard/clients/${id}`
      const read = readBy.get(id)
      const intakeAt = intakeBy.get(id) ?? null
      const readiness = (read?.body_state_classification as Readiness) ?? null
      const gateOpen = Boolean(read?.reassessment_flagged)
      const wait = waiting.get(id) ?? []

      // The seven-day strip, so the panel is counted rather than claimed.
      const genDays = daysSince(read?.generated_at as string)
      if (genDays !== null && genDays < 7) readsThisWeek[6 - genDays] += 1

      let band: Band = 'fine'
      let action: string | null = null
      let why = ''
      let waitLabel: string | null = null
      let weight = 0

      // The engine has stopped and is waiting on somebody qualified. Nothing
      // else about this client matters until that clears.
      if (gateOpen) {
        held += 1
        band = 'need'; weight = 100
        action = 'Open their file'
        why = 'A question in their intake has not been answered by anybody qualified to answer it, so the read is held rather than guessed past. Nothing moves until that clears.'
        const d = daysSince(read?.generated_at as string)
        waitLabel = d === null ? null : `held ${plural(d, 'day')}`
      }
      // Finished a long assessment and heard nothing. They are currently
      // deciding whether this was worth it, which is why they outrank a
      // stale check-in.
      else if (intakeAt && !read?.generated_at) {
        const d = daysSince(intakeAt) ?? 0
        band = 'need'; weight = 90 + Math.min(d, 9)
        action = 'Generate their read'
        why = d === 0
          ? 'Their assessment came in today and has not been read yet.'
          : `Finished a long assessment ${plural(d, 'day')} ago and has heard nothing since.`
        waitLabel = `${plural(d, 'day')}`
      }
      else if (read?.client_reading_generated_at && !read?.client_reading_published_at) {
        const d = daysSince(read.client_reading_generated_at as string) ?? 0
        band = 'need'; weight = 85
        action = 'Review and publish'
        why = `Their read is written and still unpublished, ${d === 0 ? 'from today' : `${plural(d, 'day')} old`}.`
        waitLabel = `${plural(d, 'day')}`
      }
      else if (read?.client_reading_published_at && !read?.client_reading_email_sent_at) {
        band = 'need'; weight = 84
        action = 'Send it to them'
        why = 'Their read is published to the portal, but they have not been told it is there.'
      }
      else if (pendingInvite.has(id) && (pendingInvite.get(id) ?? 0) >= 7) {
        const d = pendingInvite.get(id) ?? 0
        band = 'look'; weight = 50
        action = 'Chase their assessment'
        why = `Invited ${plural(d, 'day')} ago and has not started.`
        waitLabel = `${plural(d, 'day')}`
      }
      // Check-ins. A person being asked for LESS who is not being read is a
      // different problem from a steady one with a check-in outstanding, so
      // readiness decides the band rather than the age of the oldest item.
      else if (wait.length > 0) {
        const newest = wait[0]
        const urgent = readiness === 'Remediation' || newest.days >= 10
        band = urgent ? 'need' : 'look'
        weight = (urgent ? 60 : 40) + Math.min(newest.days, 9)
        action = `Read week ${newest.week}`
        why = wait.length === 1
          ? `Week ${newest.week} came in ${newest.days === 0 ? 'today' : `${plural(newest.days, 'day')} ago`} and has not been read.`
          : `${plural(wait.length, 'check-in')} waiting, most recent is week ${newest.week}.`
        if (readiness === 'Remediation') why += ' They are being asked for less at the moment, so what they report matters more than usual.'
        else if (readiness === 'Optimisation') why += ' Capacity is holding, so none of them is urgent.'
        waitLabel = `${plural(newest.days, 'day')}`
      }
      // Sent and never opened. The product going unread is quiet, and it is
      // still the product going unread.
      else if (read?.client_reading_email_sent_at && !read?.client_opened_at) {
        const d = daysSince(read.client_reading_email_sent_at as string) ?? 0
        if (d >= 3) {
          band = 'look'; weight = 45
          action = 'Open their file'
          why = `Their read was sent ${plural(d, 'day')} ago and has not been opened.`
          waitLabel = `${plural(d, 'day')}`
        }
      }

      if (band === 'fine' && !why) {
        why = readiness
          ? `Read and up to date. Reading as ${readiness}.`
          : 'Up to date.'
        const d = daysSince(read?.generated_at as string)
        waitLabel = d === null ? null : `read ${plural(d, 'day')} ago`
      }

      out.push({ clientId: id, clientName: name, href, readiness, gateOpen, band, action, why, waitLabel, weight })
    }

    out.sort((a, b) => b.weight - a.weight || a.clientName.localeCompare(b.clientName))

    const bookOrder: Array<{ label: string; match: (c: ClientToday) => boolean }> = [
      { label: 'Remediation', match: c => c.readiness === 'Remediation' },
      { label: 'Optimisation', match: c => c.readiness === 'Optimisation' },
      { label: 'Post-Optimisation', match: c => c.readiness === 'Post-Optimisation' },
      { label: 'Not read yet', match: c => c.readiness === null },
    ]

    return {
      clients: out,
      counts: {
        need: out.filter(c => c.band === 'need').length,
        look: out.filter(c => c.band === 'look').length,
        fine: out.filter(c => c.band === 'fine').length,
      },
      activeClients: rows.filter(r => r.coaching_started_at).length,
      readsThisWeek,
      held,
      book: bookOrder.map(b => ({ label: b.label, count: out.filter(b.match).length })),
    }
  } catch {
    return empty
  }
}
