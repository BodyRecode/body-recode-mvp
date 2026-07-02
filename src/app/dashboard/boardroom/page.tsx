import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui'
import { coach } from '@/config/tenant'

export const metadata = { title: 'Boardroom' }

const ROLES = [
  {
    role: 'CEO',
    href: '/dashboard/scorecard',
    persona: 'You',
    voice: 'Strategic direction, north-star metric, weekly scorecard vs targets',
    ritual: 'Mon 9am review',
    live: true,
  },
  {
    role: 'CFO',
    href: '/dashboard/boardroom/cfo',
    persona: 'Sarah (draft)',
    voice: 'MRR, cash runway, refund rate, LTV, unit economics, renewals',
    ritual: 'Fri 4pm close',
    live: false,
  },
  {
    role: 'CMO',
    href: '/dashboard/boardroom/cmo',
    persona: 'Marcus (draft)',
    voice: 'Funnel CVR, CPL, ad spend, content engagement, brand health',
    ritual: 'Wed 10am review',
    live: false,
  },
  {
    role: 'CCO',
    href: '/dashboard/boardroom/cco',
    persona: 'Priya (draft)',
    voice: 'Retention, churn signals, feedback triage, NPS, at-risk clients',
    ritual: 'Tue 11am review',
    live: false,
  },
  {
    role: 'COO',
    href: '/dashboard/boardroom/coo',
    persona: 'James (draft)',
    voice: 'Client capacity, service delivery quality, system health',
    ritual: 'Thu 3pm review',
    live: false,
  },
] as const

export default function BoardroomLanding() {
  const c = coach()
  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Boardroom"
        title="Your executive team"
        subtitle="Five role-specific dashboards. Each is a 10-minute weekly ritual with a decision queue. Grounded in your data. Named advisors ship in Phase 2."
      />

      <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50 text-[13px] text-blue-900 leading-relaxed">
        <strong>Scaffold shipped 2026-07-02.</strong> CEO Dashboard is live at [/dashboard/scorecard](/dashboard/scorecard). CFO/CMO/CCO/COO are stubs — they define the URL structure for Phase 2 implementation (Wk 3-4 post-launch per <a href="https://docs.google.com/document/d/spec" className="underline">Boardroom spec doc</a>). Read-only for now.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLES.map((r) => (
          <Link
            key={r.role}
            href={r.href}
            className={`block bg-white border rounded-2xl p-5 hover:border-blue-300 transition-colors ${r.live ? 'border-stone-200' : 'border-stone-200 opacity-90'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[24px] font-bold tracking-tight text-stone-900">{r.role}</div>
              {r.live ? (
                <span className="text-[9px] font-bold uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Live</span>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Stub</span>
              )}
            </div>
            <div className="text-[12px] font-mono text-stone-500 mb-3">{r.persona === 'You' ? `You (${c.firstName})` : r.persona}</div>
            <p className="text-[13px] text-stone-700 leading-relaxed mb-3">{r.voice}</p>
            <div className="text-[11px] text-stone-500 font-semibold uppercase tracking-widest">{r.ritual}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-5 rounded-xl border border-stone-200 bg-stone-50">
        <h3 className="text-[13px] font-bold text-stone-900 uppercase tracking-widest mb-3">Phase 2 · Named personas + AI advisor layer</h3>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-3">
          Each role gains a named professional persona (Sarah/Marcus/Priya/James) with grounded data + an Ask panel powered by Claude. Full spec at <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">06_SAAS_PLATFORM_BUILD/02_FEATURE_SPECS/2026-07-01_BOARDROOM_ROLE_DASHBOARDS_SPEC.md</code>.
        </p>
        <p className="text-[13px] text-stone-700 leading-relaxed">
          Sequence: <strong>Wk 3-4 post-launch</strong> ships CFO first (highest founder pain — revenue clarity), then CMO, CCO, COO. Each role stands alone; ship one, prove the pattern, iterate.
        </p>
      </div>
    </div>
  )
}
