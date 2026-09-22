import Link from 'next/link'
import type { CoachToday, ClientToday, Band } from '@/lib/coach-today'
import { BRAND } from '@/lib/brand-tokens'
import { PageHeader, SectionHead } from '@/components/dashboard/ui'

/**
 * A coach's Today. Dark, because a tool is dark and a document is light: this
 * is a workspace a coach sits in all day, while everything a client READS
 * stays on paper. Locked with Kade, 22 September 2026.
 *
 * WHAT CARRIES THE PAGE, given there is no brand colour to lean on: scale, hard
 * contrast, and space. The three panels are the only place a chart earns its
 * keep, and the last of them is the one that makes this feel like a system
 * rather than a list, because it shows a coach their whole book in one line.
 *
 * COLOUR APPEARS FOUR TIMES AND EVERY ONE MEANS SOMETHING. The old page used
 * the Attention colour fifty-eight times, on urgency, which is not a meaning:
 * it is a queue position. Spending the colour that means A SAFETY GATE HAS
 * FIRED on THIS CHECK-IN IS A BIT OLD is how a coach learns to ignore it.
 * Urgency is now carried by the band heading, in words.
 */

const READINESS_ON_DARK: Record<string, string> = {
  Remediation: BRAND.remediationOnDark,
  Optimisation: BRAND.optimisationOnDark,
  'Post-Optimisation': BRAND.postOptimisationOnDark,
}

const BANDS: Array<{ key: Band; title: string }> = [
  { key: 'need', title: 'Need you' },
  { key: 'look', title: 'Worth a look' },
  { key: 'fine', title: 'Nothing needed' },
]

function Dot({ c }: { c: ClientToday }) {
  const colour = c.gateOpen
    ? BRAND.attentionOnDark
    : (c.readiness ? READINESS_ON_DARK[c.readiness] : BRAND.darkLine)
  return (
    <span
      aria-hidden
      className="inline-block rounded-full shrink-0 mt-[8px]"
      style={{
        width: 10, height: 10, background: colour,
        // The ring is the rule from the brand guidelines: when a colour is the
        // only thing separating two states, it is not enough. Under red-green
        // colour blindness Attention and Remediation are both olive.
        boxShadow: c.gateOpen ? `0 0 0 4px rgba(212,129,126,0.18), 0 0 16px rgba(212,129,126,0.5)` : undefined,
      }}
    />
  )
}

function Row({ c, quiet }: { c: ClientToday; quiet: boolean }) {
  const colour = c.gateOpen
    ? BRAND.attentionOnDark
    : (c.readiness ? READINESS_ON_DARK[c.readiness] : BRAND.darkInkSoft)
  const label = c.gateOpen ? 'Attention' : (c.readiness ?? 'No reading yet')

  return (
    <div
      className="grid gap-4 items-start py-4 border-b"
      style={{ gridTemplateColumns: '24px 1fr max-content', borderColor: BRAND.darkLineSoft, opacity: quiet ? 0.66 : 1 }}
    >
      <Dot c={c} />
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={c.href}
            className={`${quiet ? 'text-[16px] font-semibold' : 'text-[20px] font-bold'} tracking-[-0.028em] leading-tight hover:underline`}
            style={{ color: BRAND.darkInk }}
          >
            {c.clientName}
          </Link>
          <span
            className="text-[10px] font-extrabold uppercase rounded-full px-2 py-[2.5px]"
            style={{ color: colour, background: `${colour}1F`, letterSpacing: '0.1em' }}
          >
            {label}
          </span>
        </div>
        <p className="text-[13.5px] leading-[1.55] mt-1.5 max-w-[620px]" style={{ color: BRAND.darkInkMuted }}>
          {c.why}
        </p>
      </div>
      <div className="text-right shrink-0">
        {c.action && (
          <Link
            href={c.href}
            className="inline-block text-[12.5px] font-bold rounded-lg px-3.5 py-[7px] transition-colors"
            style={{ background: BRAND.darkInk, color: BRAND.base }}
          >
            {c.action}
          </Link>
        )}
        {c.waitLabel && (
          <div className="text-[11px] mt-2 tabular-nums" style={{ color: BRAND.darkInkFaint }}>{c.waitLabel}</div>
        )}
      </div>
    </div>
  )
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: BRAND.darkBase, border: `1px solid ${BRAND.darkLineSoft}` }}
    >
      <span
        aria-hidden className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(250,250,248,0.12),transparent)' }}
      />
      <div className="text-[9.5px] font-bold uppercase" style={{ letterSpacing: '0.16em', color: BRAND.darkInkFaint }}>{label}</div>
      {children}
    </div>
  )
}

export default function CoachTodayView({ today, firstName }: { today: CoachToday; firstName: string }) {
  const { clients, counts, book, readsThisWeek, held } = today
  const total = clients.length
  const peak = Math.max(1, ...readsThisWeek)
  const bookColours: Record<string, string> = {
    Remediation: BRAND.remediationOnDark,
    Optimisation: BRAND.optimisationOnDark,
    'Post-Optimisation': BRAND.postOptimisationOnDark,
    'Not read yet': BRAND.darkLine,
  }
  const booked = book.filter(b => b.count > 0)
  const bookTotal = booked.reduce((n, b) => n + b.count, 0) || 1

  return (
    <div className="-mx-6 -mt-6 min-h-screen" style={{ background: BRAND.darkWell, color: BRAND.darkInk }}>
      <div className="px-8">
        <PageHeader
          eyebrow={new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          title="Today"
          subtitle={total === 0
            ? `Nothing here yet, ${firstName}. Add your first client and this fills itself in.`
            : `${total} client${total === 1 ? '' : 's'}. ${counts.need === 0 ? 'None of them need you right now.' : `${counts.need} want${counts.need === 1 ? 's' : ''} something from you, and the reason is on the line.`}`}
          metric={total > 0 ? { value: counts.need, label: 'need you' } : undefined}
        />
      </div>

      {total > 0 && (
        <div className="px-8 grid gap-3" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr)) 1.45fr' }}>
          <Panel label="Read this week">
            <div className="text-[34px] font-extrabold tracking-[-0.045em] mt-2.5 leading-none tabular-nums">
              {readsThisWeek.reduce((a, b) => a + b, 0)}
            </div>
            <div className="flex items-end gap-1 h-9 mt-3" aria-hidden>
              {readsThisWeek.map((n, i) => (
                <span key={i} className="flex-1 rounded-sm block" style={{
                  height: `${Math.max(6, (n / peak) * 100)}%`,
                  background: i === readsThisWeek.length - 1 ? BRAND.darkInk : BRAND.darkLine,
                }} />
              ))}
            </div>
          </Panel>

          <Panel label="Held">
            <div className="text-[34px] font-extrabold tracking-[-0.045em] mt-2.5 leading-none tabular-nums"
              style={{ color: held > 0 ? BRAND.attentionOnDark : BRAND.darkInk }}>
              {held}
            </div>
            <p className="text-[11.5px] mt-2" style={{ color: BRAND.darkInkSoft }}>
              {held === 0 ? 'Nothing waiting on a doctor.' : `waiting on a doctor, not on you`}
            </p>
          </Panel>

          <Panel label="Where the book sits">
            <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px] mt-3.5">
              {booked.map(b => (
                <span key={b.label} style={{
                  width: `${(b.count / bookTotal) * 100}%`,
                  background: bookColours[b.label] ?? BRAND.darkLine,
                  boxShadow: b.label === 'Not read yet' ? undefined : `0 0 14px ${bookColours[b.label]}66`,
                }} />
              ))}
            </div>
            <div className="flex gap-4 flex-wrap mt-3">
              {booked.map(b => (
                <span key={b.label} className="flex items-center gap-1.5 text-[10.5px]" style={{ color: BRAND.darkInkSoft }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: bookColours[b.label] ?? BRAND.darkLine }} />
                  {b.count} {b.label}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <div className="px-8 pb-12">
        {BANDS.map(band => {
          const inBand = clients.filter(c => c.band === band.key)
          if (inBand.length === 0) return null
          return (
            <div key={band.key}>
              <SectionHead title={band.title} count={inBand.length} />
              {inBand.map(c => <Row key={c.clientId} c={c} quiet={band.key === 'fine'} />)}
            </div>
          )
        })}

        {total === 0 && (
          <p className="text-[13.5px] mt-6" style={{ color: BRAND.darkInkSoft }}>
            Once a client finishes their assessment, their read and everything that follows it appears here.
          </p>
        )}
      </div>
    </div>
  )
}
