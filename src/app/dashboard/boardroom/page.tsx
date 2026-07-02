import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui'
import { coach } from '@/config/tenant'

export const metadata = { title: 'Boardroom' }

const ROLES = [
  {
    role: 'Board',
    href: '/dashboard/boardroom/board',
    persona: 'Steward · Operator · Coach',
    voice: 'Three voices above the CEO. Long-term capital, execution accountability, founder wellbeing. Synthesise across all C-suite.',
    ritual: 'Weekly board review',
    live: true,
    board: true,
  },
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
    persona: 'Sarah',
    voice: 'MRR, cash runway, refund rate, LTV, unit economics, renewals',
    ritual: 'Fri 4pm close',
    live: true,
  },
  {
    role: 'CMO',
    href: '/dashboard/boardroom/cmo',
    persona: 'Marcus',
    voice: 'Funnel CVR, CPL, ad spend, content engagement, brand health',
    ritual: 'Wed 10am review',
    live: true,
  },
  {
    role: 'CCO',
    href: '/dashboard/boardroom/cco',
    persona: 'Priya',
    voice: 'Retention, churn signals, feedback triage, NPS, at-risk clients',
    ritual: 'Tue 11am review',
    live: true,
  },
  {
    role: 'COO',
    href: '/dashboard/boardroom/coo',
    persona: 'James',
    voice: 'Client capacity, service delivery quality, system health',
    ritual: 'Thu 3pm review',
    live: true,
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

      <div className="mb-6 p-4 rounded-xl border border-green-200 bg-green-50 text-[13px] text-green-900 leading-relaxed">
        <strong>Phase 2 + 3 shipped.</strong> All 5 role dashboards live with real data + proactive AI briefings. Each dashboard fetches its snapshot server-side and generates a briefing via Claude tool-use. Persona voices distinct per role.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLES.map((r) => (
          <Link
            key={r.role}
            href={r.href}
            className={`block bg-white border rounded-2xl p-5 hover:border-blue-300 transition-colors ${
              (r as { board?: boolean }).board ? 'border-blue-300 ring-1 ring-blue-100' : 'border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[24px] font-bold tracking-tight text-stone-900">{r.role}</div>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Live</span>
            </div>
            <div className="text-[12px] font-mono text-stone-500 mb-3">{r.persona === 'You' ? `You (${c.firstName})` : r.persona}</div>
            <p className="text-[13px] text-stone-700 leading-relaxed mb-3">{r.voice}</p>
            <div className="text-[11px] text-stone-500 font-semibold uppercase tracking-widest">{r.ritual}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-5 rounded-xl border border-stone-200 bg-stone-50">
        <h3 className="text-[13px] font-bold text-stone-900 uppercase tracking-widest mb-3">How the briefings work</h3>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-3">
          Each role page fetches its live snapshot from Supabase, then Claude generates 2-4 proactive briefing items grounded in the specific data. Board of Advisors gets ALL 4 C-suite snapshots + founder context and synthesises across silos.
        </p>
        <p className="text-[13px] text-stone-700 leading-relaxed">
          Briefings cache 15 min per role to keep API costs low. Persona voices distinct: Sarah warm/patient (CFO), Marcus sharp/challenging (CMO), Priya empathetic (CCO), James systems-thinker (COO). Board voices: Steward long-term, Operator execution, Coach founder-focused.
        </p>
      </div>
    </div>
  )
}
