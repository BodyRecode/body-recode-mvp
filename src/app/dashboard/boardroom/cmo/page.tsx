import { PageHeader } from '@/components/dashboard/ui'
import Link from 'next/link'
import { Suspense } from 'react'
import { getCmoSnapshot } from '@/lib/cmo-metrics'
import { BriefingCards } from '../briefing-cards'

export const metadata = { title: 'CMO · Boardroom' }
export const dynamic = 'force-dynamic'
export const revalidate = 0

function BriefingSkeleton({ persona }: { persona: string }) {
  return (
    <div className="mb-8 p-4 rounded-xl border border-stone-200 bg-stone-50 text-[13px] text-stone-500 leading-relaxed">
      <strong className="text-stone-900">{persona}</strong> is drafting the briefing…
    </div>
  )
}

export default async function CmoPage() {
  const snap = await getCmoSnapshot()

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Boardroom · CMO"
        title="Marketing officer view"
        subtitle="Funnel CVR, CPL, wave fill, content pulse. Weekly ritual: Wed 10am review."
      />

      <Suspense fallback={<BriefingSkeleton persona="Marcus" />}>
        <BriefingCards role="cmo" contextJson={JSON.stringify({ snapshot: snap })} />
      </Suspense>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-[9px] font-bold uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Live data</span>
        <span className="text-[11px] text-stone-500 font-mono">
          Snapshot at {new Date(snap.computedAt).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })} AEST
        </span>
      </div>

      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Funnel volumes (trailing 30d)</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <FunnelStep label="Scorecards" value={snap.scorecardsCompleted30d} />
        <FunnelStep label="Leads" value={snap.leadsCaptured30d} />
        <FunnelStep label="Challenge" value={snap.challengeEnrollments30d} />
        <FunnelStep label="Blueprint" value={snap.blueprintPurchases30d} />
        <FunnelStep label="Membership" value={snap.membershipStarts30d} />
      </div>

      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Conversion rates</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Metric
          label="Scorecard → Challenge"
          value={formatPct(snap.scorecardToChallengeCvr)}
          hint={
            snap.scorecardsCompleted30d !== null && snap.challengeEnrollments30d !== null
              ? `${snap.challengeEnrollments30d}/${snap.scorecardsCompleted30d} last 30d`
              : ''
          }
          tone={cvrTone(snap.scorecardToChallengeCvr, 20)}
          large
        />
        <Metric
          label="Challenge → Blueprint"
          value={formatPct(snap.challengeToBlueprintCvr)}
          hint={
            snap.challengeEnrollments30d !== null && snap.blueprintPurchases30d !== null
              ? `${snap.blueprintPurchases30d}/${snap.challengeEnrollments30d} last 30d`
              : ''
          }
          tone={cvrTone(snap.challengeToBlueprintCvr, 10)}
        />
        <Metric
          label="Blueprint → Membership"
          value={formatPct(snap.blueprintToMembershipCvr)}
          hint={
            snap.blueprintPurchases30d !== null && snap.membershipStarts30d !== null
              ? `${snap.membershipStarts30d}/${snap.blueprintPurchases30d} last 30d`
              : ''
          }
          tone={cvrTone(snap.blueprintToMembershipCvr, 15)}
        />
      </div>

      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Wave 1 status</h3>
      <div className="mb-8 bg-white border border-stone-200 rounded-2xl p-5">
        <div className="flex items-baseline justify-between mb-3 gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
              Current wave
            </div>
            <div className="text-[24px] font-bold text-stone-900 mt-1">
              Wave {snap.waveNumber ?? '?'} · {snap.waveLabel ?? 'unknown'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Fill</div>
            <div className="text-[24px] font-bold text-stone-900 mt-1 font-mono">
              {snap.waveFilled ?? '?'} / {snap.waveCap ?? '?'}
            </div>
          </div>
        </div>
        {snap.waveFillPct !== null && (
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                snap.waveFillPct >= 100
                  ? 'bg-red-500'
                  : snap.waveFillPct >= 80
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(snap.waveFillPct, 100)}%` }}
            />
          </div>
        )}
      </div>

      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Ad performance (last 30d)</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Metric
          label="Ad spend 30d"
          value={formatCurrency(snap.adSpend30d)}
          hint={`${snap.activeAdCampaigns ?? 0} campaign${snap.activeAdCampaigns === 1 ? '' : 's'}`}
          large
        />
        <Metric
          label="Leads from ads"
          value={snap.adLeads30d !== null ? String(snap.adLeads30d) : '—'}
          hint="Attributed via be_ad_campaigns"
        />
        <Metric
          label="Cost per lead"
          value={formatCurrency(snap.costPerLead30d)}
          hint="Spend / leads"
          tone={
            snap.costPerLead30d !== null && snap.costPerLead30d > 50
              ? 'amber'
              : snap.costPerLead30d !== null && snap.costPerLead30d > 100
                ? 'red'
                : 'default'
          }
        />
        <Metric
          label="Organic vs paid"
          value={
            snap.leadsCaptured30d !== null && snap.adLeads30d !== null && snap.leadsCaptured30d > 0
              ? `${Math.round((1 - snap.adLeads30d / snap.leadsCaptured30d) * 100)}% organic`
              : '—'
          }
          hint="Organic = leads not attributed to ad campaigns"
        />
      </div>

      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Content pulse</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Metric
          label="Posts last 7d"
          value={snap.contentPosts7d !== null ? String(snap.contentPosts7d) : '—'}
          hint="From Content Calendar"
        />
        <Metric
          label="Posts last 30d"
          value={snap.contentPosts30d !== null ? String(snap.contentPosts30d) : '—'}
          hint="Full month cadence"
        />
      </div>

      <Link href="/dashboard/boardroom" className="text-[12px] text-blue-600 hover:text-blue-700 underline">
        ← Back to Boardroom
      </Link>
    </div>
  )
}

function FunnelStep({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
      <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-[22px] font-bold text-stone-900 font-mono">
        {value !== null ? value.toLocaleString() : '—'}
      </div>
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
    default: 'text-stone-900',
    stone: 'text-stone-400',
    green: 'text-green-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
  }[tone]
  const size = large ? 'text-[28px]' : 'text-[22px]'
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">{label}</div>
      <div className={`${size} font-bold ${valueColor} mb-1 font-mono`}>{value}</div>
      {hint && <div className="text-[11px] text-stone-500 leading-relaxed">{hint}</div>}
    </div>
  )
}

function cvrTone(v: number | null, greenThreshold: number): 'green' | 'amber' | 'red' | 'stone' {
  if (v === null) return 'stone'
  if (v >= greenThreshold) return 'green'
  if (v >= greenThreshold / 2) return 'amber'
  return 'red'
}

function formatPct(v: number | null): string {
  if (v === null) return '—'
  return `${v.toFixed(1)}%`
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
