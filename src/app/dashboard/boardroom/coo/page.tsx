import { PageHeader } from '@/components/dashboard/ui'
import Link from 'next/link'
import { getCooSnapshot } from '@/lib/coo-metrics'

export const metadata = { title: 'COO · Boardroom' }
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CooPage() {
  const snap = await getCooSnapshot()

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Boardroom · COO"
        title="Operations officer view"
        subtitle="Capacity, service delivery, reading queues, onboarding pipeline. Weekly ritual: Thu 3pm review. Named persona (James) + AI advisor ships Wk 8+ post-launch."
      />

      <div className="mb-6 flex items-center gap-3">
        <span className="text-[9px] font-bold uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Live data</span>
        <span className="text-[11px] text-stone-500 font-mono">
          Snapshot at {new Date(snap.computedAt).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })} AEST
        </span>
      </div>

      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Coaching capacity</h3>
      <div className="mb-8 bg-white border border-stone-200 rounded-2xl p-5">
        <div className="flex items-baseline justify-between mb-3 gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
              Active clients
            </div>
            <div className="text-[28px] font-bold text-stone-900 mt-1 font-mono">
              {snap.activeClients ?? '—'} / {snap.capacityCap}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Fill</div>
            <div
              className={`text-[28px] font-bold mt-1 font-mono ${
                snap.capacityPct !== null && snap.capacityPct >= 90
                  ? 'text-red-700'
                  : snap.capacityPct !== null && snap.capacityPct >= 70
                    ? 'text-amber-700'
                    : 'text-green-700'
              }`}
            >
              {snap.capacityPct !== null ? `${Math.round(snap.capacityPct)}%` : '—'}
            </div>
          </div>
        </div>
        {snap.capacityPct !== null && (
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                snap.capacityPct >= 100
                  ? 'bg-red-500'
                  : snap.capacityPct >= 70
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(snap.capacityPct, 100)}%` }}
            />
          </div>
        )}
      </div>

      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Reading pipeline (pending coach approval)</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <QueueTile label="Foundational" value={snap.foundationalReadingsPending} />
        <QueueTile label="Program" value={snap.programReadingsPending} />
        <QueueTile label="Nutrition" value={snap.nutritionReadingsPending} />
        <QueueTile label="Medications" value={snap.medicationsReadingsPending} />
        <QueueTile label="Trajectory" value={snap.trajectoryReadingsPending} />
      </div>
      <div className="mb-8 bg-white border border-stone-200 rounded-xl p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Total pending</div>
          <div
            className={`text-[24px] font-bold font-mono ${
              (snap.totalPendingApproval ?? 0) > 15
                ? 'text-red-700'
                : (snap.totalPendingApproval ?? 0) > 5
                  ? 'text-amber-700'
                  : 'text-green-700'
            }`}
          >
            {snap.totalPendingApproval ?? '—'}
          </div>
        </div>
      </div>

      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Service delivery quality</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Metric
          label="Median TTFR (30d cohort)"
          value={
            snap.medianHoursToFirstReading !== null
              ? snap.medianHoursToFirstReading > 24
                ? `${(snap.medianHoursToFirstReading / 24).toFixed(1)}d`
                : `${snap.medianHoursToFirstReading.toFixed(1)}h`
              : '—'
          }
          hint="Time from CFFS generation → Foundational Reading published"
          tone={
            snap.medianHoursToFirstReading === null
              ? 'stone'
              : snap.medianHoursToFirstReading > 72
                ? 'red'
                : snap.medianHoursToFirstReading > 24
                  ? 'amber'
                  : 'green'
          }
          large
        />
        <Metric
          label="Testimonials awaiting publish"
          value={fmtNum(snap.feedbackAwaitingApproval)}
          hint="Permission granted, not yet posted"
          tone={
            snap.feedbackAwaitingApproval === null
              ? 'stone'
              : snap.feedbackAwaitingApproval > 5
                ? 'amber'
                : 'green'
          }
        />
        <Metric
          label="Testimonials published (lifetime)"
          value={fmtNum(snap.testimonialsPublishedLifetime)}
          hint="All-time testimonial pipeline output"
        />
      </div>

      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Onboarding pipeline</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Metric
          label="Clients in onboarding (30d)"
          value={fmtNum(snap.clientsInOnboarding)}
          hint="Started coaching in last 30 days"
        />
        <Metric
          label="Awaiting Health Declaration"
          value={fmtNum(snap.clientsAwaitingHealthDeclaration)}
          hint="Active clients with no HD submitted"
          tone={
            snap.clientsAwaitingHealthDeclaration === null
              ? 'stone'
              : snap.clientsAwaitingHealthDeclaration > 3
                ? 'amber'
                : 'green'
          }
        />
      </div>

      <div className="mb-8 flex items-center gap-3 text-[13px] flex-wrap">
        <Link href="/dashboard/coaching" className="text-blue-600 hover:text-blue-700 underline font-semibold">
          → Coaching queue
        </Link>
        <span className="text-stone-400">·</span>
        <Link href="/dashboard/system-health" className="text-blue-600 hover:text-blue-700 underline font-semibold">
          → System health
        </Link>
        <span className="text-stone-400">·</span>
        <Link href="/dashboard/feedback" className="text-blue-600 hover:text-blue-700 underline font-semibold">
          → Feedback triage
        </Link>
      </div>

      <div className="mb-8 p-4 rounded-xl border border-blue-200 bg-blue-50 text-[13px] text-blue-900 leading-relaxed">
        <strong>Phase 2 (Wk 8+ post-launch):</strong> Ask James panel — grounded advisory: &quot;review my ops SOPs and suggest gaps.&quot; Task queue: &quot;Coaching intake queue at 12/15 — hold new leads?&quot; Named persona voice: systems thinker, ops-obsessive.
      </div>

      <Link href="/dashboard/boardroom" className="text-[12px] text-blue-600 hover:text-blue-700 underline">
        ← Back to Boardroom
      </Link>
    </div>
  )
}

function QueueTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
      <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1">{label}</div>
      <div
        className={`text-[22px] font-bold font-mono ${
          value === null
            ? 'text-stone-400'
            : value > 5
              ? 'text-amber-700'
              : value > 0
                ? 'text-blue-700'
                : 'text-green-700'
        }`}
      >
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

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString()
}
