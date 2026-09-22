/**
 * Check Ins - the review queue.
 *
 * Every check-in that came in inside the selected window, newest first with
 * anything still waiting on you pulled to the top. The right-hand slot on a
 * row is the ACTION when the check-in needs you ("Review now") and the STATE
 * once it does not ("Sent"), so the list is both the report and the way in.
 *
 * The ring divides answered check-ins by check-ins SUBMITTED in the window -
 * never by client count. A percentage whose denominator is "everyone" reads
 * as a coaching failure when it is really a reporting error (the 3-of-29
 * mistake, 2026-08). The two counts are printed under the ring for exactly
 * that reason: the number can always be checked against what it divided.
 */

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoachScope, coachClientIds } from '@/lib/coach-scope'
import { ChevronRight, Check, Inbox, Clock } from 'lucide-react'
import { PageHeader, Card, RangeTabs, EmptyState, PersonRow, PageBody } from '@/components/dashboard/ui'
import { BRAND } from '@/lib/brand-tokens'

type Range = 'week' | 'today' | 'yesterday'

const RANGES: { key: Range; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
]

/** Start (inclusive) and end (exclusive) of the window, in local time. */
function windowFor(range: Range): { from: Date; to: Date } {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  if (range === 'today') {
    const to = new Date(start)
    to.setDate(to.getDate() + 1)
    return { from: start, to }
  }
  if (range === 'yesterday') {
    const from = new Date(start)
    from.setDate(from.getDate() - 1)
    return { from, to: start }
  }
  const from = new Date(start)
  from.setDate(from.getDate() - 6)
  const to = new Date(start)
  to.setDate(to.getDate() + 1)
  return { from, to }
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.round(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

type Status = 'pending' | 'drafted' | 'sent' | 'skipped'

export default async function CheckInsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const range: Range = RANGES.some(r => r.key === params.range)
    ? (params.range as Range)
    : 'week'
  const { from, to } = windowFor(range)

  const admin = createAdminClient()

  // Only this coach's clients. See coachClientIds: an empty list means this
  // coach has nobody yet and must see nothing, which is not the same as no
  // filter at all.
  const scope = await requireCoachScope()
  const mine = await coachClientIds(scope)

  const checkinQuery = admin
    .from('weekly_checkins')
    .select('id, client_id, week_number, form_type, submitted_at, coach_skipped_at, clients(name)')
    .gte('submitted_at', from.toISOString())
    .lt('submitted_at', to.toISOString())
    .order('submitted_at', { ascending: false })

  const { data: checkins } = mine === null ? await checkinQuery : await checkinQuery.in('client_id', mine)

  const rows = checkins || []
  const ids = rows.map(r => r.id)

  const { data: feedback } = ids.length
    ? await admin
        .from('weekly_checkin_feedback')
        .select('weekly_checkin_id, email_sent_at')
        .in('weekly_checkin_id', ids)
    : { data: [] as { weekly_checkin_id: string; email_sent_at: string | null }[] }

  const feedbackByCheckin = new Map(
    (feedback || []).map(f => [f.weekly_checkin_id, f])
  )

  function statusOf(row: (typeof rows)[number]): Status {
    if (row.coach_skipped_at) return 'skipped'
    const f = feedbackByCheckin.get(row.id)
    if (!f) return 'pending'
    return f.email_sent_at ? 'sent' : 'drafted'
  }

  const withStatus = rows.map(row => ({ row, status: statusOf(row) }))

  // Anything still waiting on you sits at the top; the rest stay newest-first.
  const ORDER: Record<Status, number> = { pending: 0, drafted: 1, sent: 2, skipped: 3 }
  withStatus.sort((a, b) => ORDER[a.status] - ORDER[b.status])

  const counts = withStatus.reduce(
    (acc, { status }) => ({ ...acc, [status]: acc[status] + 1 }),
    { pending: 0, drafted: 0, sent: 0, skipped: 0 } as Record<Status, number>
  )
  // Skipped check-ins are a decision, not an omission, so they count as
  // answered. The denominator is every check-in in the window.
  const answered = counts.sent + counts.skipped
  const total = withStatus.length
  const pct = total === 0 ? 0 : (answered / total) * 100

  const rangeLabel =
    range === 'today' ? 'today' : range === 'yesterday' ? 'yesterday' : 'in the last 7 days'

  return (
    <PageBody>
      <PageHeader
        eyebrow="Clients"
        title="Check Ins"
        subtitle={
          total === 0
            ? `No check-ins came in ${rangeLabel}.`
            : `${total} ${total === 1 ? 'check-in' : 'check-ins'} ${rangeLabel}. What they report, read against where they started.`
        }
        metric={counts.pending + counts.drafted > 0
          ? { value: counts.pending + counts.drafted, label: 'to read' }
          : undefined}
      />

      <RangeTabs
        active={range}
        options={RANGES.map(r => ({
          key: r.key,
          label: r.label,
          href: r.key === 'week' ? '/dashboard/checkins' : `/dashboard/checkins?range=${r.key}`,
        }))}
      />

      {total === 0 ? (
        <div>
          <EmptyState
            icon={Inbox}
            title={`Nothing came in ${rangeLabel}`}
            hint="Check-ins land here the moment a client submits one."
          />
        </div>
      ) : (
        <div>
          <div>
            {withStatus.map(({ row, status }) => {
              const clientName = Array.isArray(row.clients)
                ? row.clients[0]?.name
                : (row.clients as { name?: string } | null)?.name
              const name = clientName || 'Unknown client'
              const href = `/dashboard/clients/${row.client_id}/checkins/${row.week_number}/${String(row.form_type).toLowerCase()}`
              // BOTH FORMS ARE THE WEEKLY CHECK-IN. A was labelled "Daily
              // check-in" and nothing here is daily.
              //
              // A AND B ALTERNATE BY WEEK, globally: odd system weeks ask A,
              // even weeks ask B, so every client gets one then the other.
              // They are two sets of questions, not two kinds of check-in.
              //
              //   A  Overall Context, Salience and Patterns, Capacity and
              //      Resources, Expression Without Fixing, Acknowledgement
              //   B  Week Friction and Mismatch, Repeating Pressures, Tensions
              //      and Trade-Offs, Capacity Awareness, Meaning Without
              //      Action, Closing Reflection
              //
              // Both then carry Recovery, Nutrition, Training and Cycle, so a
              // client has ONE thing to fill in each week.
              //
              // So neither gets a name of its own here. Calling B "the friction
              // one" is reading its first section title and guessing, which is
              // exactly how "Daily" got there. If a coach ever needs to know
              // which set they are reading, that is a naming decision for Kade,
              // not something to infer from a heading.
              const formLabel = 'Weekly check-in'

              return (
                <PersonRow
                  key={row.id}
                  href={href}
                  name={name}
                  detail={`${formLabel} · week ${row.week_number}`}
                  dot={<span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: status === 'pending' ? BRAND.remediationOnDark : BRAND.darkLine }} />}
                  trailing={
                    <div className="text-right">
                      <StatusSlot status={status} />
                      <div className="text-[10px] mt-2 tabular-nums" style={{ color: BRAND.darkInkFaint }}>
                        {row.submitted_at ? relativeTime(row.submitted_at) : ''}
                      </div>
                    </div>
                  }
                  quiet={status !== 'pending'}
                />
              )
            })}
          </div>
        </div>
      )}
    </PageBody>
  )
}

/**
 * One slot, two jobs. When the check-in needs you it is the action and reads
 * as a button; once it does not, it is the state and reads as a label.
 */
function StatusSlot({ status }: { status: Status }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-[12.5px] font-bold px-3.5 py-[7px] rounded-lg shrink-0"
        style={{ background: BRAND.darkInk, color: BRAND.darkWell }}>
        Read it
        <ChevronRight size={12} />
      </span>
    )
  }
  if (status === 'drafted') {
    return (
      <span className="inline-flex items-center gap-1 text-[12.5px] font-medium px-2.5 py-[3px] rounded-full border border-[#DCDCD7] text-[#0F1115] bg-[rgba(27,109,252,0.08)] shadow-[0_1px_2px_rgba(16,24,40,0.05)] shrink-0">
        Draft ready
        <ChevronRight size={12} />
      </span>
    )
  }
  if (status === 'skipped') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] px-2.5 py-[3px] rounded-full border border-[#E4E4E0] text-[#6E747D] bg-[#FAFAF8] shrink-0">
        <Clock size={11} />
        Skipped
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] px-2.5 py-[3px] rounded-full border border-[#E4E4E0] text-[#6E747D] bg-[#FAFAF8] shrink-0">
      <Check size={11} />
      Sent
    </span>
  )
}
