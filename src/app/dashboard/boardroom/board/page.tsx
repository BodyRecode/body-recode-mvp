import { PageHeader } from '@/components/dashboard/ui'
import Link from 'next/link'
import { Suspense } from 'react'
import { getCfoSnapshot } from '@/lib/cfo-metrics'
import { getCmoSnapshot } from '@/lib/cmo-metrics'
import { getCcoSnapshot } from '@/lib/cco-metrics'
import { getCooSnapshot } from '@/lib/coo-metrics'
import { coach } from '@/config/tenant'
import { BarChart3, TrendingUp, Users, Settings } from 'lucide-react'
import { BriefingCards } from '../briefing-cards'

export const metadata = { title: 'Board of Advisors · Boardroom' }
export const dynamic = 'force-dynamic'
export const revalidate = 0

function BoardSkeleton() {
  return (
    <div className="mb-8 space-y-3">
      {['Steward', 'Operator', 'Coach'].map((v) => (
        <div key={v} className="p-4 rounded-xl border border-stone-200 bg-stone-50 text-[13px] text-stone-500 leading-relaxed">
          <strong className="text-stone-900">{v}</strong> is thinking…
        </div>
      ))}
    </div>
  )
}

export default async function BoardPage() {
  const c = coach()
  // Fetch all 4 c-suite snapshots in parallel — Board synthesizes across all
  const [cfo, cmo, cco, coo] = await Promise.all([
    getCfoSnapshot(),
    getCmoSnapshot(),
    getCcoSnapshot(),
    getCooSnapshot(),
  ])

  // Build the Board's context: all 4 snapshots + founder + goals + today's date
  const boardContext = {
    founder: {
      firstName: c.firstName,
      fullName: c.fullName,
    },
    today: new Date().toISOString().slice(0, 10),
    daysToLaunch: daysUntil('2026-07-13'),
    cSuite: {
      cfo,
      cmo,
      cco,
      coo,
    },
    statedGoals: [
      'Launch Funnel B on Mon 13 Jul 2026 with Meta ads activation 7:05am AEST',
      'Prove Option D stage gate strategy (Stressed Exec first at $25/day, Phase 2 if CPL hits target)',
      'Onboard Melisa as SOT pilot zero post-launch (Shape A separate deploy or Shape B shared)',
      'Build the Collective (partners on the licensed BR platform)',
    ],
    stateOfPreLaunchBlockers: [
      'Meta phone verification pending (SMS gateway failing)',
      'Business Verification pending (upload ABN docs)',
      'ABR contact email update in progress (call ABR)',
      'Financial services flag on ad set (probably clears with Business Verification)',
    ],
  }

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Boardroom · Board of Advisors"
        title="Steward · Operator · Coach"
        subtitle="Three voices sitting above you. Steward for long-term capital efficiency, Operator for execution accountability, Coach for founder wellbeing and values alignment. They see everything the C-suite sees."
      />

      <div className="mb-6 flex items-center gap-3">
        <span className="text-[9px] font-bold uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Live briefing</span>
        <span className="text-[11px] text-stone-500 font-mono">
          Synthesised from all 4 C-suite snapshots + your context
        </span>
      </div>

      <Suspense fallback={<BoardSkeleton />}>
        <BriefingCards
          role="board"
          contextJson={JSON.stringify(boardContext)}
          label={`This week's board briefing`}
        />
      </Suspense>

      <div className="mb-8 bg-white border border-stone-200 rounded-2xl p-5">
        <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Board inputs</h3>
        <p className="text-[13px] text-stone-700 leading-relaxed mb-4">
          The Board sees everything the C-suite sees + your stated goals + current pre-launch blockers. It synthesises across silos. Individual C-suite views are for depth; the Board is for altitude.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
          <BoardInput icon={BarChart3} label="CFO snapshot (Sarah)" href="/dashboard/boardroom/cfo" />
          <BoardInput icon={TrendingUp} label="CMO snapshot (Marcus)" href="/dashboard/boardroom/cmo" />
          <BoardInput icon={Users} label="CCO snapshot (Priya)" href="/dashboard/boardroom/cco" />
          <BoardInput icon={Settings} label="COO snapshot (James)" href="/dashboard/boardroom/coo" />
        </div>
      </div>

      <div className="mb-8 p-4 rounded-xl border border-blue-200 bg-blue-50 text-[13px] text-blue-900 leading-relaxed">
        <strong>Renaming:</strong> Board persona names are placeholders (David · Naomi · Rachel). Rename via
        <Link href="/dashboard/settings/tenant" className="mx-1 underline font-semibold">
          /dashboard/settings/tenant
        </Link>
        once tenant-config supports persona overrides (coming next pass).
      </div>

      <Link href="/dashboard/boardroom" className="text-[12px] text-blue-600 hover:text-blue-700 underline">
        ← Back to Boardroom
      </Link>
    </div>
  )
}

function BoardInput({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors"
    >
      <span className="w-8 h-8 rounded-lg bg-[#1B6DFC]/10 flex items-center justify-center text-[#1B6DFC] shrink-0"><Icon size={16} strokeWidth={2.5} /></span>
      <span className="text-stone-700 font-semibold">{label}</span>
    </Link>
  )
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime()
  const now = new Date().getTime()
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)))
}
