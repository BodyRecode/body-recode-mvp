import Link from 'next/link'
import type { CoachToday, TodayItem } from '@/lib/coach-today'
import { PageHeader } from '@/components/dashboard/ui'

/**
 * A coach's Today.
 *
 * Every line is something they do, written as the action rather than the
 * state: "Generate their read", not "read outstanding". A queue that describes
 * conditions asks the reader to translate before they can act.
 *
 * Ordered by who is waiting on the coach rather than by what is oldest. A
 * client who finished a long intake and has heard nothing sits at the top,
 * because they are the one currently deciding whether this was worth it.
 *
 * LANGUAGE STAYS UNIVERSAL. Kade, 21 Sep: the pilot coaches and he both train
 * men, so a coach must not read one gender on every line of their dashboard.
 */

const TONE: Record<TodayItem['urgency'], { dot: string; label: string; cls: string }> = {
  now: { dot: '#D96A6A', label: 'Now', cls: 'text-[#E88C8C]' },
  soon: { dot: '#D9A34A', label: 'Soon', cls: 'text-[#E3B871]' },
  watch: { dot: '#6B7280', label: 'Watch', cls: 'text-[#8A909B]' },
}

function Row({ item }: { item: TodayItem }) {
  const tone = TONE[item.urgency]
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1C212A] last:border-b-0 hover:bg-[#161B23] transition-colors"
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tone.dot }} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-white">
          {item.action} <span className="text-[#8A909B]">· {item.clientName}</span>
        </p>
        <p className="text-[12.5px] text-[#8A909B] mt-0.5">{item.detail}</p>
      </div>
      <span className={`text-[11.5px] font-medium shrink-0 ${tone.cls}`}>{tone.label}</span>
    </Link>
  )
}

function Stat({ label, value, colour }: { label: string; value: number; colour?: string }) {
  return (
    <div className="rounded-2xl border border-[#242A35] bg-[#12161D] p-5">
      <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[#6B7280] mb-2">{label}</p>
      <p className="text-[34px] leading-none font-semibold tabular-nums" style={{ color: colour ?? '#FFFFFF' }}>
        {value}
      </p>
    </div>
  )
}

export default function CoachTodayView({ today, firstName }: { today: CoachToday; firstName: string }) {
  const nothing = today.items.length === 0

  return (
    <div className="max-w-[900px]">
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
        title={`Today${firstName ? `, ${firstName}` : ''}`}
        subtitle={
          nothing
            ? 'Nothing is waiting on you. That is the whole list, not a shortened one.'
            : 'Everything waiting on you, with whoever has been waiting longest at the top.'
        }
      />

      <div className="rounded-3xl bg-[#0C1015] p-5 sm:p-6 mt-2">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Stat label="Now" value={today.counts.now} colour={today.counts.now > 0 ? '#E88C8C' : undefined} />
          <Stat label="Soon" value={today.counts.soon} colour={today.counts.soon > 0 ? '#E3B871' : undefined} />
          <Stat label="Clients" value={today.activeClients} />
        </div>

        <div className="rounded-2xl border border-[#242A35] bg-[#12161D] overflow-hidden">
          {nothing ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[15px] text-white mb-1.5">Nothing needs you.</p>
              <p className="text-[13px] text-[#8A909B] max-w-sm mx-auto leading-relaxed">
                Every read is written and sent, and every check-in has an answer.
                {today.activeClients === 0 && ' Add your first client to get started.'}
              </p>
              {today.activeClients === 0 && (
                <Link
                  href="/dashboard/clients/new"
                  className="inline-block mt-5 px-4 py-2 rounded-lg bg-[#1B6DFC] text-white text-[13px] font-medium"
                >
                  Add a client
                </Link>
              )}
            </div>
          ) : (
            today.items.map((item, i) => <Row key={`${item.clientId}-${item.action}-${i}`} item={item} />)
          )}
        </div>

        <p className="text-[12px] text-[#6B7280] mt-4 leading-relaxed">
          This list is built from where each client actually is, not from anything you have to tick off.
          It empties by itself as you work.
        </p>
      </div>
    </div>
  )
}
