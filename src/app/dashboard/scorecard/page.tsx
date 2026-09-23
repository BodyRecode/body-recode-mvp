import { createAdminClient } from '@/lib/supabase/admin'
import {
  computeScorecard,
  formatValue,
  type FlowResult,
  type SnapshotResult,
  type Status,
  type WeekRange,
} from '@/lib/scorecard'
import {
  Card,
  PageHeader,
  SectionLabel,
  StatCard,
  Pill,
  MONO_FONT,
} from '@/components/dashboard/ui'
import { TrendingUp, Users, Wallet, ClipboardCheck } from 'lucide-react'
import { brand } from "@/config/tenant";

// The scorecard must reflect reality the moment it is opened, not a build-time
// snapshot. Always render fresh.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const STATUS_ACCENT: Record<Status, 'teal' | 'amber' | 'red'> = {
  green: 'teal',
  yellow: 'amber',
  red: 'red',
}
const STATUS_LABEL: Record<Status, string> = {
  green: 'On Track',
  yellow: 'Watch',
  red: 'Off Track',
}
const STATUS_DOT: Record<Status, string> = {
  green: '#FAFAF8',
  yellow: '#B7791F',
  red: '#D4817E',
}

export default async function ScorecardPage() {
  const admin = createAdminClient()
  const data = await computeScorecard(admin)

  const updated = data.generatedAt.toLocaleString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="CEO Dashboard · Company Scorecard"
        title="The numbers that run the business."
        subtitle={
          <>
            Every metric mirrors a stage in your Value Engines — how {brand().name}
                            acquires customers and how it serves them. Auto-pulled from the live
                            system. Review targets each quarter.
                          </>
        }
      />

      <ReviewAgenda />

      {/* Hero cards — the four numbers a CEO glances at first */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard label="MRR" value={formatValue(data.heroes.mrr, 'currency')} sub="Recurring, monthly" accent="teal" icon={Wallet} />
        <StatCard label="Cash This Week" value={formatValue(data.heroes.cashThisWeek, 'currency')} sub="One-time + digital, to date" accent="teal" icon={TrendingUp} />
        <StatCard label="Active Clients" value={data.heroes.activeClients} sub="Coaching, started" accent="teal" icon={Users} />
        <StatCard label="Check-In Rate" value={formatValue(data.heroes.checkinRate, 'percent')} sub="This week, active clients" accent="teal" icon={ClipboardCheck} />
      </div>

      {/* Growth Engine — week-over-week trend table */}
      <div className="mb-10">
        <SectionLabel meta="Week over week · status vs target on last completed week">
          Growth Engine
        </SectionLabel>
        <Card padding="none">
          <TrendTable weeks={data.weeks} rows={data.flow} />
        </Card>
      </div>

      {/* Fulfilment + Cash — snapshots */}
      <div className="mb-10">
        <SectionLabel accent="blue" meta="Right now">
          Fulfilment &amp; Cash
        </SectionLabel>
        <div className="grid md:grid-cols-2 gap-3">
          {data.snapshots.map(s => <SnapshotRow key={s.key} m={s} />)}
        </div>
      </div>

      <p className="text-[11px] text-[#676D76] mb-2">
        Updated {updated} · Targets in src/lib/scorecard.ts (TARGETS) — set each quarter
      </p>
    </div>
  )
}

/* ── Weekly review agenda (the in-app manual) ───────────────────────────── */
function ReviewAgenda() {
  return (
    <details className="group mb-8 rounded-xl border border-[#2A2F39] bg-[#F3F7FF] open:bg-[#F3F7FF]">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 select-none">
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-[3px] rounded-full shrink-0" style={{ background: '#FAFAF8' }} />
          <span className="text-[12.5px] font-medium" style={{ color: '#FAFAF8' }}>
            Run the weekly review · 15 min, every Monday
          </span>
        </span>
        <span className="text-[12.5px] text-[#FAFAF8] shrink-0">open ↓</span>
      </summary>
      <div className="px-5 pb-5 pt-1">
        <ol className="space-y-2.5">
          {[
            'Read the Status column below. It scores the week that just CLOSED — ignore the grey "This wk" column (the week is not finished, so it is not scored).',
            'For every red or amber row, write the ONE move that turns it toward green this week. A plan, not a problem.',
            'Drop those moves into Today’s Focus so they stay in front of you all week.',
            'Leave the greens alone — don’t optimise what’s working. One red week is noise; act on a 3-week downward trend. Pivot the plan monthly, never on a single week.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#FAFAF8] text-[#0B0D10] text-[11px] font-medium flex items-center justify-center mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
              <span className="text-[13.5px] text-[#C2C6CC] leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-[#8A9099] mt-4 pt-3 border-t border-[#D9E4FB]">
          The Monday 7am <strong>Weekly Pulse</strong> email carries this week already read (what changed, what flipped red). Targets are reviewed quarterly in <code>src/lib/scorecard.ts</code>.
        </p>
      </div>
    </details>
  )
}

/* ── Growth Engine trend table ──────────────────────────────────────────── */
function TrendTable({ weeks, rows }: { weeks: WeekRange[]; rows: FlowResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-[#2A2F39]">
            <th className="text-left font-semibold text-[#FAFAF8] px-5 py-3 whitespace-nowrap">Metric</th>
            {weeks.map((w, i) => (
              <th
                key={i}
                className={`text-right font-medium px-3 py-3 whitespace-nowrap ${w.isCurrent ? 'text-[#FAFAF8]' : 'text-[#8A9099]'}`}
                style={{ fontFamily: MONO_FONT, fontSize: 11, letterSpacing: '0.04em' }}
              >
                {w.label}
              </th>
            ))}
            <th className="text-right font-semibold text-[#8A9099] px-3 py-3 whitespace-nowrap" style={{ fontFamily: MONO_FONT, fontSize: 11, letterSpacing: '0.04em' }}>
              Target
            </th>
            <th className="text-right font-semibold text-[#FAFAF8] px-5 py-3 whitespace-nowrap">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(m => {
            const lastIdx = weeks.length - 2
            return (
              <tr key={m.key} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFBFD] transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium text-[#FAFAF8]">{m.label}</div>
                  <div className="text-[11px] text-[#676D76]">{m.hint}</div>
                </td>
                {m.values.map((v, i) => {
                  const isLast = i === lastIdx
                  const isCurrent = weeks[i].isCurrent
                  const cellStatus = isLast ? m.status : null
                  return (
                    <td
                      key={i}
                      className="text-right px-3 py-3 tabular-nums"
                      style={{
                        fontFamily: MONO_FONT,
                        color: isCurrent ? '#676D76' : cellStatus ? STATUS_DOT[cellStatus] : '#C2C6CC',
                        fontWeight: isLast ? 700 : 400,
                      }}
                    >
                      {m.unit === 'currency' ? formatValue(v, 'currency') : v}
                    </td>
                  )
                })}
                <td className="text-right px-3 py-3 tabular-nums text-[#8A9099]" style={{ fontFamily: MONO_FONT }}>
                  {formatValue(m.target, m.unit)}
                </td>
                <td className="text-right px-5 py-3">
                  <Pill accent={STATUS_ACCENT[m.status]}>{STATUS_LABEL[m.status]}</Pill>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── Snapshot metric card ───────────────────────────────────────────────── */
function SnapshotRow({ m }: { m: SnapshotResult }) {
  return (
    <Card padding="md" accent={STATUS_ACCENT[m.status]}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_DOT[m.status] }} />
            <span className="font-semibold text-[#FAFAF8] text-[13.5px] truncate">{m.label}</span>
          </div>
          <div className="text-[11px] text-[#676D76] mt-1 ml-4">{m.hint}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[20px] font-extrabold text-[#FAFAF8] tabular-nums leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatValue(m.actual, m.unit)}
          </div>
          <div className="text-[11px] text-[#676D76] mt-1" style={{ fontFamily: MONO_FONT }}>
            target {formatValue(m.target, m.unit)}
          </div>
        </div>
      </div>
    </Card>
  )
}
