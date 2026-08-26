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
import { ChevronRight, Check, Inbox, Clock } from 'lucide-react'
import { PageHeader, Card, Avatar, Ring, RangeTabs, EmptyState } from '@/components/dashboard/ui'

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

  const { data: checkins } = await admin
    .from('weekly_checkins')
    .select('id, client_id, week_number, form_type, submitted_at, coach_skipped_at, clients(name)')
    .gte('submitted_at', from.toISOString())
    .lt('submitted_at', to.toISOString())
    .order('submitted_at', { ascending: false })

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
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Clients"
        title="Check Ins"
        subtitle={
          total === 0
            ? `No check-ins came in ${rangeLabel}.`
            : `${total} ${total === 1 ? 'check-in' : 'check-ins'} ${rangeLabel}, ${counts.pending + counts.drafted} still waiting on you.`
        }
      />

      <RangeTabs
        active={range}
        options={RANGES.map(r => ({
          key: r.key,
          label: r.label,
          href: r.key === 'week' ? '/dashboard/checkins' : `/dashboard/checkins?range=${r.key}`,
        }))}
      />

      {total > 0 && (
        <Card className="mb-5" padding="md">
          <Ring
            value={pct}
            accent="teal"
            legend={[
              { label: 'waiting', count: counts.pending + counts.drafted, accent: counts.pending + counts.drafted > 0 ? 'amber' : 'neutral' },
              { label: 'answered', count: answered, accent: 'teal' },
            ]}
          />
        </Card>
      )}

      {total === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Inbox}
            title={`Nothing came in ${rangeLabel}`}
            hint="Check-ins land here the moment a client submits one."
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[#EFF1F4]">
            {withStatus.map(({ row, status }) => {
              const clientName = Array.isArray(row.clients)
                ? row.clients[0]?.name
                : (row.clients as { name?: string } | null)?.name
              const name = clientName || 'Unknown client'
              const href = `/dashboard/clients/${row.client_id}/checkins/${row.week_number}/${String(row.form_type).toLowerCase()}`
              const formLabel = String(row.form_type).toUpperCase() === 'B' ? 'Weekly check-in' : 'Daily check-in'

              return (
                <Link
                  key={row.id}
                  href={href}
                  className="block px-4 py-3.5 hover:bg-[#F7F9FC] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={name} size={31} />
                    <p className="text-[13.5px] font-medium text-[#141821] tracking-[-0.012em] truncate group-hover:text-[#1B6DFC] transition-colors min-w-0 flex-1">
                      {name}
                    </p>
                    <span className="text-[11.5px] text-[#98A0AD] shrink-0">
                      {row.submitted_at ? relativeTime(row.submitted_at) : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 pl-[43px]">
                    <span className="text-[12.5px] text-[#666D7A] min-w-0 flex-1 truncate">
                      {formLabel} · Week {row.week_number}
                    </span>
                    <StatusSlot status={status} />
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

/**
 * One slot, two jobs. When the check-in needs you it is the action and reads
 * as a button; once it does not, it is the state and reads as a label.
 */
function StatusSlot({ status }: { status: Status }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-[3px] rounded-full border border-[#F1DEB8] text-[#A96A12] bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] shadow-[0_1px_2px_rgba(16,24,40,0.05)] group-hover:border-[#D9B976] transition-colors shrink-0">
        Review now
        <ChevronRight size={12} />
      </span>
    )
  }
  if (status === 'drafted') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-[3px] rounded-full border border-[#B5CFFC] text-[#1B6DFC] bg-[rgba(27,109,252,0.08)] shadow-[0_1px_2px_rgba(16,24,40,0.05)] shrink-0">
        Draft ready
        <ChevronRight size={12} />
      </span>
    )
  }
  if (status === 'skipped') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-[3px] rounded-full border border-[#E8EAEE] text-[#666D7A] bg-[#FAFBFC] shrink-0">
        <Clock size={11} />
        Skipped
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-[3px] rounded-full border border-[#E8EAEE] text-[#666D7A] bg-[#FAFBFC] shrink-0">
      <Check size={11} />
      Sent
    </span>
  )
}
