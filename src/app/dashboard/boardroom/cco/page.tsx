import { PageHeader } from '@/components/dashboard/ui'
import Link from 'next/link'
import { Suspense } from 'react'
import { getCcoSnapshot } from '@/lib/cco-metrics'
import { BriefingCards } from '../briefing-cards'

export const metadata = { title: 'CCO · Boardroom' }
export const dynamic = 'force-dynamic'
export const revalidate = 0

function BriefingSkeleton({ persona }: { persona: string }) {
  return (
    <div className="mb-8 p-4 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] text-[13px] text-[#666D7A] leading-relaxed">
      <strong className="text-[#141821]">{persona}</strong> is drafting the briefing…
    </div>
  )
}

export default async function CcoPage() {
  const snap = await getCcoSnapshot()

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Boardroom · CCO"
        title="Chief Client Officer view"
        subtitle="Retention, at-risk signals, feedback triage. Weekly ritual: Tue 11am review."
      />

      <Suspense fallback={<BriefingSkeleton persona="Priya" />}>
        <BriefingCards role="cco" contextJson={JSON.stringify({ snapshot: snap })} />
      </Suspense>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-[9px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Live data</span>
        <span className="text-[11px] text-[#666D7A] font-mono">
          Snapshot at {new Date(snap.computedAt).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })} AEST
        </span>
      </div>

      <h3 className="text-[11px] font-medium text-[#666D7A] mb-3">Client base</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Metric label="Active clients" value={fmtNum(snap.activeClients)} large />
        <Metric label="Added last 30d" value={fmtNum(snap.clientsAdded30d)} hint="New client records" />
        <Metric label="Lifetime clients" value={fmtNum(snap.clientsLifetime)} hint="Since day zero" />
      </div>

      <h3 className="text-[11px] font-medium text-[#666D7A] mb-3">Churn signals</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Metric
          label="Churn rate 30d"
          value={snap.churnRate30d !== null ? `${snap.churnRate30d.toFixed(1)}%` : '—'}
          hint={
            snap.churn30d !== null
              ? `${snap.churn30d} cancellations last 30d`
              : ''
          }
          tone={
            snap.churnRate30d === null
              ? 'stone'
              : snap.churnRate30d > 15
                ? 'red'
                : snap.churnRate30d > 5
                  ? 'amber'
                  : 'green'
          }
          large
        />
        <Metric
          label="Churned 90d"
          value={fmtNum(snap.churn90d)}
          hint="Rolling quarter"
        />
        <Metric
          label="At-risk (no check-in 14d)"
          value={fmtNum(snap.activeClientsWithoutCheckin14d)}
          hint="Active clients with no submitted check-in in 14 days"
          tone={
            snap.activeClientsWithoutCheckin14d === null
              ? 'stone'
              : snap.activeClientsWithoutCheckin14d > 3
                ? 'red'
                : snap.activeClientsWithoutCheckin14d > 0
                  ? 'amber'
                  : 'green'
          }
        />
      </div>

      <h3 className="text-[11px] font-medium text-[#666D7A] mb-3">Engagement</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Metric
          label="Checked in last 7d"
          value={fmtNum(snap.activeClientsWithCheckin7d)}
          hint={
            snap.activeClients !== null && snap.activeClientsWithCheckin7d !== null
              ? `of ${snap.activeClients} active`
              : ''
          }
        />
        <Metric
          label="Check-in response rate 30d"
          value={snap.checkinResponseRate30d !== null ? `${Math.round(snap.checkinResponseRate30d)}%` : '—'}
          hint="Actual / expected weekly cadence"
          tone={
            snap.checkinResponseRate30d === null
              ? 'stone'
              : snap.checkinResponseRate30d >= 70
                ? 'green'
                : snap.checkinResponseRate30d >= 40
                  ? 'amber'
                  : 'red'
          }
        />
        <Metric
          label="Ratio at-risk"
          value={
            snap.activeClients !== null &&
            snap.activeClientsWithoutCheckin14d !== null &&
            snap.activeClients > 0
              ? `${Math.round((snap.activeClientsWithoutCheckin14d / snap.activeClients) * 100)}%`
              : '—'
          }
          hint="At-risk / active clients"
        />
      </div>

      <h3 className="text-[11px] font-medium text-[#666D7A] mb-3">Feedback triage</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Metric
          label="Unseen feedback"
          value={fmtNum(snap.feedbackUnseen)}
          hint="Awaiting coach review"
          tone={
            snap.feedbackUnseen === null
              ? 'stone'
              : snap.feedbackUnseen > 10
                ? 'red'
                : snap.feedbackUnseen > 3
                  ? 'amber'
                  : 'green'
          }
        />
        <Metric
          label="Churn-risk flagged"
          value={fmtNum(snap.feedbackChurnRisk)}
          hint="Feedback flagged by coach as risk"
          tone={
            snap.feedbackChurnRisk === null
              ? 'stone'
              : snap.feedbackChurnRisk > 0
                ? 'red'
                : 'green'
          }
        />
        <Metric
          label="Awaiting consent"
          value={fmtNum(snap.feedbackAwaitingConsent)}
          hint="Testimonials in permission flow"
        />
      </div>

      <h3 className="text-[11px] font-medium text-[#666D7A] mb-3">Sentiment (last 30d)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Metric
          label="Avg accuracy score"
          value={
            snap.feedbackAvgAccuracy30d !== null
              ? `${snap.feedbackAvgAccuracy30d.toFixed(1)}/10`
              : '—'
          }
          hint="How accurate clients found the reading"
          tone={
            snap.feedbackAvgAccuracy30d === null
              ? 'stone'
              : snap.feedbackAvgAccuracy30d >= 8
                ? 'green'
                : snap.feedbackAvgAccuracy30d >= 6
                  ? 'amber'
                  : 'red'
          }
        />
        <Metric
          label="Avg NPS score"
          value={
            snap.feedbackAvgNps30d !== null
              ? `${snap.feedbackAvgNps30d.toFixed(1)}/10`
              : '—'
          }
          hint="Recommend likelihood"
          tone={
            snap.feedbackAvgNps30d === null
              ? 'stone'
              : snap.feedbackAvgNps30d >= 8
                ? 'green'
                : snap.feedbackAvgNps30d >= 6
                  ? 'amber'
                  : 'red'
          }
        />
      </div>

      <div className="mb-8 flex items-center gap-3 text-[13px]">
        <Link href="/dashboard/feedback" className="text-blue-600 hover:text-blue-700 underline font-semibold">
          → Open Feedback Triage
        </Link>
        <span className="text-[#98A0AD]">·</span>
        <Link href="/dashboard/coaching" className="text-blue-600 hover:text-blue-700 underline font-semibold">
          → Coaching queue
        </Link>
      </div>

      <Link href="/dashboard/boardroom" className="text-[12px] text-blue-600 hover:text-blue-700 underline">
        ← Back to Boardroom
      </Link>
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
  tone = 'default',
  large,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'stone' | 'green' | 'amber' | 'red'
  large?: boolean
}) {
  const valueColor = {
    default: 'text-[#141821]',
    stone: 'text-[#98A0AD]',
    green: 'text-green-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
  }[tone]
  const size = large ? 'text-[28px]' : 'text-[22px]'
  return (
    <div className="bg-white border border-[#E8EAEE] rounded-xl p-5">
      <div className="text-[11px] font-medium text-[#666D7A] mb-2">{label}</div>
      <div className={`${size} font-bold ${valueColor} mb-1 font-mono`}>{value}</div>
      {hint && <div className="text-[11px] text-[#666D7A] leading-relaxed">{hint}</div>}
    </div>
  )
}

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString()
}
