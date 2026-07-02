import { PageHeader } from '@/components/dashboard/ui'
import Link from 'next/link'

export const metadata = { title: 'CMO · Boardroom' }

export default function CmoPage() {
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Boardroom · CMO"
        title="Marcus (draft persona)"
        subtitle="Marketing officer view — funnel CVR, CPL, ad spend, content engagement, brand health. Weekly ritual: Wed 10am review."
      />

      <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-[13px] text-amber-900 leading-relaxed">
        <strong>Phase 1 stub.</strong> URL + role framing. Real data + Marcus AI advisor in Phase 2 (Wk 5-6 post-launch after CFO ships).
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <MetricStub label="Cost per lead" hint="Meta ad spend / leads captured" source="Meta Ads API + leads table" />
        <MetricStub label="Scorecard → Challenge CVR" hint="Scorecard completes / Challenge enrolments" source="calendar_posts + scorecard_reports + challenge_enrollments" />
        <MetricStub label="Wave 1 fill rate" hint="Current wave cap consumption" source="challenge_enrollments count + CHALLENGE_CURRENT_WAVE env" />
        <MetricStub label="IG engagement rate" hint="Likes + comments / reach over last 7d" source="IG Graph API" />
      </div>

      <div className="mb-8 bg-white border border-stone-200 rounded-2xl p-5">
        <h3 className="text-[13px] font-bold text-stone-900 uppercase tracking-widest mb-3">This week&apos;s ritual (Wed 10am review)</h3>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-4">
          Phase 2 will surface a task queue: <em>&ldquo;Ad-variant hook02 CVR dropped 40% wk-over-wk — kill or iterate?&rdquo;</em> Ask Marcus panel: &ldquo;why did Wk 3 CVR drop?&rdquo; runs analysis against actual funnel data.
        </p>
        <p className="text-[13px] text-stone-500 leading-relaxed">
          Persona voice draft: sharp, challenging, brand-obsessed. Marcus will push back on lazy ideas and demand receipts.
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
