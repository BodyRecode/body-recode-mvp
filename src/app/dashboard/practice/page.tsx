import Link from 'next/link'
import { requireCoachScope, coachFilter } from '@/lib/coach-scope'
import { createAdminClient } from '@/lib/supabase/admin'
import { practiceView, type ClientStanding } from '@/lib/practice-view'
import { PageHeader, PageBody } from '@/components/dashboard/ui'
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

/**
 * A client's standing.
 *
 * 22 September 2026, and this fixes a fault worse than a styling one.
 *
 * THE DOT MEANT SOMETHING DIFFERENT HERE THAN ON EVERY OTHER PAGE. It used the
 * readiness colours exactly, for attendance: amber for Slipping, coral for
 * Gone quiet, green for Steady. So a coach learns on Today that an amber dot
 * means Remediation, somebody being asked for less, then comes here two clicks
 * later and an amber dot means they have stopped answering. Coral is worse: on
 * Today it means a safety gate has fired.
 *
 * Attendance is a DIFFERENT AXIS from readiness, in the same way Attention is.
 * Borrowing the colours does not just look inconsistent, it teaches a coach the
 * wrong thing and then contradicts it.
 *
 * So the dot is readiness, here and everywhere. And attendance, which is what
 * this page is FOR, gets something better than a colour: the last six weeks
 * drawn as six marks, filled where they answered. That is the evidence itself
 * rather than a verdict about it, it needs no colour at all, and it survives
 * any colour vision and a greyscale print.
 */
function WeekStrip({ answered }: { answered: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`${answered} of the last six weeks answered`}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className="block rounded-[1px]"
          style={{
            width: 5, height: 12,
            background: i < answered ? BRAND.darkInkMuted : BRAND.darkLine,
          }}
        />
      ))}
    </span>
  )
}

function Standing({ c }: { c: ClientStanding }) {
  const word =
    c.attendance === 'quiet' ? 'Gone quiet'
    : c.attendance === 'slipping' ? 'Slipping'
    : c.attendance === 'too_new' ? 'Too new'
    : 'Steady'

  const readiness = c.readiness ? READINESS_TOKENS[c.readiness]?.dark : null

  return (
    <Link
      href={`/dashboard/clients/${c.id}`}
      className="grid gap-4 items-start py-4 border-b border-[#1F242C] last:border-b-0 hover:bg-[#12151B] transition-colors px-2"
      style={{ gridTemplateColumns: '24px 1fr max-content' }}
    >
      <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-[7px]" style={{ background: readiness ?? BRAND.darkLine }} />
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[20px] font-bold tracking-[-0.028em] leading-tight text-[#FAFAF8]">{c.name}</span>
          {c.readiness && (
            <span
              className="text-[10px] font-extrabold uppercase rounded-full px-2 py-[2.5px]"
              style={{ color: readiness ?? BRAND.darkInkSoft, background: `${readiness ?? BRAND.darkInkSoft}1F`, letterSpacing: '0.1em' }}
            >
              {c.readiness}
            </span>
          )}
        </div>
        <p className="text-[13.5px] leading-[1.55] mt-1.5 text-[#C2C6CC] max-w-[620px]">{c.because}</p>
      </div>
      <div className="text-right shrink-0">
        <WeekStrip answered={c.answeredOfSix} />
        <div className="text-[11px] mt-2 text-[#8A9099]">{word}</div>
      </div>
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
    <PageBody>
      <PageHeader
        eyebrow="Your book"
        title="Your practice"
        subtitle="Who is slipping away, and what your book is actually made of. Both come out of the reads, so neither needs you to record anything."
        metric={needsYou > 0 ? { value: needsYou, label: 'need you' } : undefined}
      />

      <div className="mt-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <Panel label="Active clients">
            <p className="text-[34px] leading-none font-extrabold tracking-[-0.045em] text-white tabular-nums">{view.totalActive}</p>
          </Panel>
          <Panel label="Steady">
            <p className="text-[34px] leading-none font-extrabold tracking-[-0.045em] text-[#FAFAF8] tabular-nums">{steady}</p>
            <p className="text-[12.5px] text-[#676D76] mt-2">answering most weeks</p>
          </Panel>
          <Panel label="Need you">
            <p className="text-[34px] leading-none font-extrabold tracking-[-0.045em] text-[#FAFAF8] tabular-nums">{needsYou}</p>
            <p className="text-[12.5px] text-[#676D76] mt-2">slipping or gone quiet</p>
          </Panel>
          <Panel label="Read but not opened">
            <p className="text-[34px] leading-none font-extrabold tracking-[-0.045em] text-white tabular-nums">
              {view.clients.filter(c => c.openedLastRead === false).length}
            </p>
            <p className="text-[12.5px] text-[#676D76] mt-2">sent, never read</p>
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
            <p className="px-4 py-6 text-[13.5px] text-[#8A9099]">No active clients yet.</p>
          ) : (
            view.clients.map(c => <Standing key={c.id} c={c} />)
          )}
        </div>

        <p className="text-[12.5px] text-[#676D76] mt-4 leading-relaxed">
          Attendance is what a client has actually done: whether they answered, and whether they opened
          their read. It is never a judgement about their body, and a client is left alone for their first
          three weeks because there is nothing yet to read into.
        </p>
      </div>
    </PageBody>
  )
}
