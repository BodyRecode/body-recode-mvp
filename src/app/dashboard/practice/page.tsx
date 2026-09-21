import Link from 'next/link'
import { requireCoachScope, coachFilter } from '@/lib/coach-scope'
import { createAdminClient } from '@/lib/supabase/admin'
import { practiceView, type ClientStanding } from '@/lib/practice-view'
import { PageHeader } from '@/components/dashboard/ui'

export const metadata = { title: 'Your practice' }

/**
 * A coach's own practice: who is slipping away, and what the book is made of.
 *
 * 21 September 2026. The first screen in the product built for the COACH
 * rather than for a client, and the first with charts on it, because this is
 * the page where a picture beats a sentence: a split across fourteen clients
 * is a shape, and reading it as a list is work.
 *
 * The reads themselves stay quiet and stay written. A page of considered
 * writing about somebody's body does not want a donut on it.
 */

const READINESS_COLOUR: Record<string, string> = {
  Remediation: '#C8823A',
  Optimisation: '#3A8FC8',
  'Post-Optimisation': '#3AA76D',
}

const PATTERN_COLOUR = ['#5B8DEF', '#38B2AC', '#D97757', '#9F7AEA', '#8A909B']

function Bar({ rows, colours }: { rows: { label: string; count: number }[]; colours: (l: string, i: number) => string }) {
  const total = rows.reduce((n, r) => n + r.count, 0)
  if (total === 0) return <p className="text-[12.5px] text-[#98A0AD]">Nothing read yet.</p>
  return (
    <>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-[#1F242E]">
        {rows.map((r, i) => (
          <div key={r.label} style={{ width: `${(r.count / total) * 100}%`, background: colours(r.label, i) }} />
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-2 text-[12.5px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colours(r.label, i) }} />
            <span className="text-[#C7CCD4] flex-1 truncate">{r.label}</span>
            <span className="text-white font-semibold tabular-nums">{r.count}</span>
            <span className="text-[#6B7280] tabular-nums w-9 text-right">{Math.round((r.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </>
  )
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#242A35] bg-[#12161D] p-5">
      <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[#6B7280] mb-3">{label}</p>
      {children}
    </div>
  )
}

function Standing({ c }: { c: ClientStanding }) {
  const tone =
    c.attendance === 'quiet' ? { dot: '#D96A6A', word: 'Gone quiet', cls: 'text-[#E88C8C]' }
    : c.attendance === 'slipping' ? { dot: '#D9A34A', word: 'Slipping', cls: 'text-[#E3B871]' }
    : c.attendance === 'too_new' ? { dot: '#6B7280', word: 'Too new', cls: 'text-[#8A909B]' }
    : { dot: '#4FA97A', word: 'Steady', cls: 'text-[#79C79C]' }

  return (
    <Link
      href={`/dashboard/clients/${c.id}`}
      className="flex items-center gap-3 px-4 py-3 border-b border-[#1C212A] last:border-b-0 hover:bg-[#161B23] transition-colors"
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tone.dot }} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] text-white truncate">{c.name}</p>
        <p className="text-[12px] text-[#8A909B] truncate">{c.because}</p>
      </div>
      <span className={`text-[11.5px] font-medium shrink-0 ${tone.cls}`}>{tone.word}</span>
    </Link>
  )
}

export default async function PracticePage() {
  const scope = await requireCoachScope()
  const admin = createAdminClient()
  const view = await practiceView(admin, coachFilter(scope))

  const steady = view.clients.filter(c => c.attendance === 'steady').length
  const needsYou = view.slipping.length

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Your practice"
        title="Your practice"
        subtitle="Who is slipping away, and what your book is actually made of. Both come out of the reads, so neither needs you to record anything."
      />

      <div className="rounded-3xl bg-[#0C1015] p-5 sm:p-6 mt-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <Panel label="Active clients">
            <p className="text-[34px] leading-none font-semibold text-white tabular-nums">{view.totalActive}</p>
          </Panel>
          <Panel label="Steady">
            <p className="text-[34px] leading-none font-semibold text-[#79C79C] tabular-nums">{steady}</p>
            <p className="text-[12px] text-[#6B7280] mt-2">answering most weeks</p>
          </Panel>
          <Panel label="Need you">
            <p className={`text-[34px] leading-none font-semibold tabular-nums ${needsYou > 0 ? 'text-[#E3B871]' : 'text-white'}`}>{needsYou}</p>
            <p className="text-[12px] text-[#6B7280] mt-2">slipping or gone quiet</p>
          </Panel>
          <Panel label="Read but not opened">
            <p className="text-[34px] leading-none font-semibold text-white tabular-nums">
              {view.clients.filter(c => c.openedLastRead === false).length}
            </p>
            <p className="text-[12px] text-[#6B7280] mt-2">sent, never read</p>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-3 mb-3">
          <Panel label="Readiness across your book">
            <Bar rows={view.byReadiness} colours={(l) => READINESS_COLOUR[l] ?? '#8A909B'} />
          </Panel>
          <Panel label="What is driving it">
            <Bar rows={view.byPattern} colours={(_l, i) => PATTERN_COLOUR[i % PATTERN_COLOUR.length]} />
          </Panel>
        </div>

        <div className="rounded-2xl border border-[#242A35] bg-[#12161D] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1C212A]">
            <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[#6B7280]">Everyone, quietest first</p>
          </div>
          {view.clients.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-[#8A909B]">No active clients yet.</p>
          ) : (
            view.clients.map(c => <Standing key={c.id} c={c} />)
          )}
        </div>

        <p className="text-[12px] text-[#6B7280] mt-4 leading-relaxed">
          Attendance is what a client has actually done: whether they answered, and whether they opened
          their read. It is never a judgement about their body, and a client is left alone for their first
          three weeks because there is nothing yet to read into.
        </p>
      </div>
    </div>
  )
}
