import { PageHeader } from '@/components/dashboard/ui'
import Link from 'next/link'
import { Suspense } from 'react'
import { getCfoSnapshot } from '@/lib/cfo-metrics'
import { products } from '@/config/tenant'
import { BriefingCards } from '../briefing-cards'

export const metadata = { title: 'CFO · Boardroom' }
export const dynamic = 'force-dynamic'
export const revalidate = 0

function BriefingSkeleton({ persona }: { persona: string }) {
  return (
    <div className="mb-8 p-4 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] text-[13px] text-[#666D7A] leading-relaxed">
      <strong className="text-[#141821]">{persona}</strong> is drafting the briefing…
    </div>
  )
}

export default async function CfoPage() {
  const snap = await getCfoSnapshot()
  const p = products()

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Boardroom · CFO"
        title="Financial officer view"
        subtitle="MRR, revenue, refunds, churn, and unit economics. Weekly ritual: Fri 4pm close."
      />

      <Suspense fallback={<BriefingSkeleton persona="Sarah" />}>
        <BriefingCards role="cfo" contextJson={JSON.stringify({ snapshot: snap, products: p })} />
      </Suspense>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-[9px] font-medium bg-[#D8EFE1] text-[#177245] px-1.5 py-0.5 rounded">Live data</span>
        <span className="text-[11px] text-[#666D7A] font-mono">
          Snapshot at {new Date(snap.computedAt).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })} AEST
        </span>
      </div>

      <h3 className="text-[11px] font-medium text-[#666D7A] mb-3">Recurring revenue</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Metric
          label="MRR"
          value={formatCurrency(snap.mrr)}
          hint={`${snap.activeSubscriptions ?? 0} active subscription${snap.activeSubscriptions === 1 ? '' : 's'} normalized to monthly`}
          tone={snap.mrr && snap.mrr > 0 ? 'green' : 'stone'}
          large
        />
        <Metric
          label="Weekly recurring"
          value={formatCurrency(snap.weeklyRecurring)}
          hint={`Sum of active week-billed subs`}
        />
        <Metric
          label="Monthly recurring (direct)"
          value={formatCurrency(snap.monthlyRecurring)}
          hint="Subs billed monthly (not normalized)"
        />
      </div>

      <h3 className="text-[11px] font-medium text-[#666D7A] mb-3">Revenue windows</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Metric
          label="Revenue last 30d"
          value={formatCurrency(snap.revenue30d)}
          hint={`${snap.paymentCount30d ?? 0} payments captured`}
          large
        />
        <Metric
          label="Lifetime revenue"
          value={formatCurrency(snap.revenueLifetime)}
          hint="All be_payments captured"
        />
        <Metric
          label="Avg revenue / client"
          value={formatCurrency(snap.averageRevenuePerClient)}
          hint={`Lifetime revenue / ${snap.activeClients ?? '?'} active clients`}
        />
      </div>

      <h3 className="text-[11px] font-medium text-[#666D7A] mb-3">Risk signals</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Metric
          label="Refund rate 30d"
          value={snap.refundRate30d !== null ? `${snap.refundRate30d.toFixed(1)}%` : '—'}
          hint={snap.refundedAmount30d !== null ? `${formatCurrency(snap.refundedAmount30d)} refunded of ${formatCurrency(snap.revenue30d)}` : ''}
          tone={snap.refundRate30d !== null && snap.refundRate30d > 5 ? 'red' : 'green'}
        />
        <Metric
          label="Churned this month"
          value={snap.churnedThisMonth !== null ? String(snap.churnedThisMonth) : '—'}
          hint="Subscriptions canceled since start of month"
          tone={snap.churnedThisMonth !== null && snap.churnedThisMonth > 0 ? 'amber' : 'green'}
        />
        <Metric
          label="Cash runway"
          value="—"
          hint="Manual bank balance / monthly burn — needs be_bank_balance table (Phase 2 build)"
          tone="stone"
        />
      </div>

      <div className="mb-8 br-card p-5">
        <h3 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em] mb-3">Product config context</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[13px] font-mono text-[#141821]">
          <div>Report price: <span className="text-[#141821] font-bold">${p.reportPrice}</span></div>
          <div>Blueprint price: <span className="text-[#141821] font-bold">${p.blueprintPrice}</span></div>
          <div>Membership: <span className="text-[#141821] font-bold">${p.membershipPrice}/wk</span></div>
          <div>Foundational Read: <span className="text-[#141821] font-bold">${p.coachingPackage2xPrice}</span></div>
        </div>
        <p className="text-[12px] text-[#666D7A] mt-3 leading-relaxed">
          These are the current tenant pricing values. Change via <Link href="/dashboard/settings/tenant" className="text-[#1560E0] hover:text-[#1056D6] underline">/dashboard/settings/tenant → Product wrapping</Link>.
        </p>
      </div>

      <Link href="/dashboard/boardroom" className="text-[12px] text-[#1560E0] hover:text-[#1056D6] underline">
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
    green: 'text-[#177245]',
    amber: 'text-[#A96A12]',
    red: 'text-[#C82626]',
  }[tone]
  const size = large ? 'text-[28px]' : 'text-[22px]'
  return (
    <div className="br-card p-5">
      <div className="text-[11px] font-medium text-[#666D7A] mb-2">{label}</div>
      <div className={`${size} font-bold ${valueColor} mb-1 font-mono`}>{value}</div>
      {hint && <div className="text-[11px] text-[#666D7A] leading-relaxed">{hint}</div>}
    </div>
  )
}

function formatCurrency(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  if (v === 0) return '$0'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(v)
}
