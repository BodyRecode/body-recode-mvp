import { PageHeader } from '@/components/dashboard/ui'
import Link from 'next/link'

export const metadata = { title: 'CFO · Boardroom' }

export default function CfoPage() {
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Boardroom · CFO"
        title="Sarah (draft persona)"
        subtitle="Financial officer view — MRR, cash runway, refund rate, LTV, unit economics, renewals. Weekly ritual: Fri 4pm close."
      />

      <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-[13px] text-amber-900 leading-relaxed">
        <strong>Phase 1 stub.</strong> This page defines the URL structure + role framing. Real data + Sarah AI advisor land in Phase 2 (Wk 3-4 post-launch per <code className="bg-amber-100 px-1 py-0.5 rounded text-[12px]">2026-07-01_BOARDROOM_ROLE_DASHBOARDS_SPEC.md</code>).
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <MetricStub label="MRR" hint="Sum of active subscriptions" source="be_payments + client_subscriptions" />
        <MetricStub label="Cash runway" hint="Manual bank balance input + monthly burn" source="be_bank_balance table (new)" />
        <MetricStub label="Refund rate (30d)" hint="Refunds / total charges last 30 days" source="Stripe webhook events" />
        <MetricStub label="LTV : CAC (90d cohort)" hint="Average lifetime revenue vs acquisition cost" source="Enrollments × subscription duration ÷ ad spend" />
      </div>

      <div className="mb-8 bg-white border border-stone-200 rounded-2xl p-5">
        <h3 className="text-[13px] font-bold text-stone-900 uppercase tracking-widest mb-3">This week&apos;s ritual (Fri 4pm close)</h3>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-4">
          Phase 2 will surface a task queue here: <em>&ldquo;3 subscriptions renew this week — expected revenue $147, all green.&rdquo;</em> Ask Sarah panel opens on the right for grounded advisory (&ldquo;should I raise prices?&rdquo; analysed against your churn/LTV/CAC).
        </p>
        <p className="text-[13px] text-stone-500 leading-relaxed">
          Persona voice draft: warm, patient, cash-first. Sarah opens meetings with &ldquo;what&apos;s the runway impact?&rdquo; and closes with &ldquo;show me the numbers behind the intuition.&rdquo;
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
