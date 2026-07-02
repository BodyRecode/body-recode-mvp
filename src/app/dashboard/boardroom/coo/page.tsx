import { PageHeader } from '@/components/dashboard/ui'
import Link from 'next/link'

export const metadata = { title: 'COO · Boardroom' }

export default function CooPage() {
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Boardroom · COO"
        title="James (draft persona)"
        subtitle="Operations officer — client capacity, service delivery quality, system health, ops SLAs. Weekly ritual: Thu 3pm review."
      />

      <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-[13px] text-amber-900 leading-relaxed">
        <strong>Phase 1 stub.</strong> URL + role framing. Real data + James AI advisor in Phase 2 (Wk 8+ post-launch after CFO+CMO+CCO ship).
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <MetricStub label="Coaching capacity" hint="Active clients / cap of 15" source="clients count vs cap" />
        <MetricStub label="Time-to-first-reading" hint="Avg hours from enrollment to first Foundational Reading published" source="clients.foundational_reading_published_at - created_at" />
        <MetricStub label="System health score" hint="Composite from /dashboard/system-health" source="/api/system-health endpoints" />
        <MetricStub label="Coach-approved queue depth" hint="Readings awaiting Kade approval" source="foundational/program/nutrition/trajectory readings status" />
      </div>

      <div className="mb-8 bg-white border border-stone-200 rounded-2xl p-5">
        <h3 className="text-[13px] font-bold text-stone-900 uppercase tracking-widest mb-3">This week&apos;s ritual (Thu 3pm review)</h3>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-4">
          Phase 2 will surface a task queue: <em>&ldquo;Coaching intake queue at 12/15 — hold new leads?&rdquo;</em> Ask James: &ldquo;review my ops SOPs and suggest gaps&rdquo; reads platform config + flags missing pieces.
        </p>
        <p className="text-[13px] text-stone-500 leading-relaxed">
          Persona voice draft: systems thinker, ops-obsessive, loves a good process. James asks &ldquo;can we automate this?&rdquo; and &ldquo;what breaks at 3x?&rdquo;
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
