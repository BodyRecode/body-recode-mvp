import { PageHeader } from '@/components/dashboard/ui'
import Link from 'next/link'

export const metadata = { title: 'CCO · Boardroom' }

export default function CcoPage() {
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Boardroom · CCO"
        title="Priya (draft persona)"
        subtitle="Chief Client Officer — retention, churn signals, feedback triage, NPS, at-risk clients. Weekly ritual: Tue 11am review."
      />

      <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-[13px] text-amber-900 leading-relaxed">
        <strong>Phase 1 stub.</strong> URL + role framing. Real data + Priya AI advisor in Phase 2 (Wk 7+ post-launch after CFO+CMO ship).
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <MetricStub label="Active clients" hint="Currently coaching" source="clients where status = active" />
        <MetricStub label="At-risk (last 14d)" hint="Engagement drop &gt; 40% wk-over-wk" source="weekly_checkins + readiness signals" />
        <MetricStub label="Feedback pending consent" hint="Testimonials awaiting client permission" source="feedback_responses status" />
        <MetricStub label="Trailing 90d churn" hint="Cancellations / active at start of period" source="client_subscriptions cancelled_at" />
      </div>

      <div className="mb-8 bg-white border border-stone-200 rounded-2xl p-5">
        <h3 className="text-[13px] font-bold text-stone-900 uppercase tracking-widest mb-3">This week&apos;s ritual (Tue 11am review)</h3>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-4">
          Phase 2 will surface a task queue: <em>&ldquo;Sarah&apos;s engagement dropped 40% — outreach today?&rdquo;</em> Ask Priya: &ldquo;which clients need intervention this week?&rdquo; runs across readiness monitoring signals.
        </p>
        <p className="text-[13px] text-stone-500 leading-relaxed">
          Persona voice draft: empathetic, retention-native, brings every conversation back to the client experience.
        </p>
      </div>

      <Link href="/dashboard/boardroom" className="text-[12px] text-blue-600 hover:text-blue-700 underline">
        ← Back to Boardroom
      </Link>
    </div>
  )
}

function MetricStub({ label, hint, source }: { label: string; hint: string; source: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">{label}</div>
      <div className="text-[24px] font-bold text-stone-300 mb-2 font-mono">—</div>
      <div className="text-[12px] text-stone-500 leading-relaxed mb-1">{hint}</div>
      <div className="text-[11px] font-mono text-stone-400">Source: {source}</div>
    </div>
  )
}
