import Link from 'next/link'
import { requireCoachScope, coachFilter } from '@/lib/coach-scope'
import { createAdminClient } from '@/lib/supabase/admin'
import { practiceView, type ClientStanding } from '@/lib/practice-view'
import { PageHeader } from '@/components/dashboard/ui'
import { BRAND, READINESS_COLOUR as READINESS_TOKENS } from '@/lib/brand-tokens'

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

// Was a second, unconnected copy of this map with a third set of values,
// written before the palette file existed. Two maps of the same three states is
// how a coach sees one colour on one screen and a different one on the next,
// for the same client. There is now one map. See lib/brand-tokens.
const READINESS_COLOUR: Record<string, string> = Object.fromEntries(
  Object.entries(READINESS_TOKENS).map(([level, c]) => [level, c.light]),
)

// Patterns are a different axis from readiness and must never borrow the
// readiness colours, or a coach reads a pattern chart as a verdict. Neutral
// steps rather than hues: this chart shows composition, which is not a state.
const PATTERN_COLOUR = ['#0F1115', '#4A4F57', '#6E747D', '#9CA2AB', '#DCDCD7']

function Bar({ rows, colours }: { rows: { label: string; count: number }[]; colours: (l: string, i: number) => string }) {
  const total = rows.reduce((n, r) => n + r.count, 0)
  if (total === 0) return <p className="text-[12.5px] text-[#9CA2AB]">Nothing read yet.</p>
  return (
    <>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-[#1F242C]">
        {rows.map((r, i) => (
          <div key={r.label} style={{ width: `${(r.count / total) * 100}%`, background: colours(r.label, i) }} />
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-2 text-[12.5px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colours(r.label, i) }} />
            <span className="text-[#C2C6CC] flex-1 truncate">{r.label}</span>
            <span className="text-white font-semibold tabular-nums">{r.count}</span>
            <span className="text-[#676D76] tabular-nums w-9 text-right">{Math.round((r.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </>
  )
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#2A2F39] bg-[#14171D] p-5">
      <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[#676D76] mb-3">{label}</p>
      {children}
    </div>
  )
}

function Standing({ c }: { c: ClientStanding }) {
  const tone =
    c.attendance === 'quiet' ? { dot: '#D4817E', word: 'Gone quiet', cls: 'text-[#D4817E]' }
    : c.attendance === 'slipping' ? { dot: '#E0A254', word: 'Slipping', cls: 'text-[#E0A254]' }
    : c.attendance === 'too_new' ? { dot: '#676D76', word: 'Too new', cls: 'text-[#8A9099]' }
    : { dot: '#6FA98B', word: 'Steady', cls: 'text-[#6FA98B]' }

  return (
    <Link
      href={`/dashboard/clients/${c.id}`}
      className="flex items-center gap-3 px-4 py-3 border-b border-[#1F242C] last:border-b-0 hover:bg-[#1A1E26] transition-colors"
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tone.dot }} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] text-white truncate">{c.name}</p>
        <p className="text-[12px] text-[#8A9099] truncate">{c.because}</p>
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

      <div className="rounded-3xl bg-[#0B0D10] p-5 sm:p-6 mt-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <Panel label="Active clients">
            <p className="text-[34px] leading-none font-semibold text-white tabular-nums">{view.totalActive}</p>
          </Panel>
          <Panel label="Steady">
            <p className="text-[34px] leading-none font-semibold text-[#6FA98B] tabular-nums">{steady}</p>
            <p className="text-[12px] text-[#676D76] mt-2">answering most weeks</p>
          </Panel>
          <Panel label="Need you">
            <p className={`text-[34px] leading-none font-semibold tabular-nums ${needsYou > 0 ? 'text-[#E0A254]' : 'text-white'}`}>{needsYou}</p>
            <p className="text-[12px] text-[#676D76] mt-2">slipping or gone quiet</p>
          </Panel>
          <Panel label="Read but not opened">
            <p className="text-[34px] leading-none font-semibold text-white tabular-nums">
              {view.clients.filter(c => c.openedLastRead === false).length}
            </p>
            <p className="text-[12px] text-[#676D76] mt-2">sent, never read</p>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-3 mb-3">
          <Panel label="Readiness across your book">
            <Bar rows={view.byReadiness} colours={(l) => READINESS_COLOUR[l] ?? BRAND.noReading} />
          </Panel>
          <Panel label="What is driving it">
            <Bar rows={view.byPattern} colours={(_l, i) => PATTERN_COLOUR[i % PATTERN_COLOUR.length]} />
          </Panel>
        </div>

        <div className="rounded-2xl border border-[#2A2F39] bg-[#14171D] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1F242C]">
            <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[#676D76]">Everyone, quietest first</p>
          </div>
          {view.clients.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-[#8A9099]">No active clients yet.</p>
          ) : (
            view.clients.map(c => <Standing key={c.id} c={c} />)
          )}
        </div>

        <p className="text-[12px] text-[#676D76] mt-4 leading-relaxed">
          Attendance is what a client has actually done: whether they answered, and whether they opened
          their read. It is never a judgement about their body, and a client is left alone for their first
          three weeks because there is nothing yet to read into.
        </p>
      </div>
    </div>
  )
}
