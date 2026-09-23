'use client'

import { useState } from 'react'
import { DECODE_DAYS } from '@/lib/decode-days'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Search, ChevronRight } from 'lucide-react'
import { PageHeader, Card, MONO_FONT, accentColour } from '@/components/dashboard/ui'
import PagesIndex from './pages-index'

const PATTERN_COLOURS: Record<string, string> = {
  'stress-stored': '#D4817E',
  'metabolic-drift': '#B7791F',
  'hormonal-shift': '#8b5cf6',
  'system-overload': '#FAFAF8',
  'pending': '#676D76',
}

const PATTERN_LABELS: Record<string, string> = {
  'stress-stored': 'Stress-Stored',
  'metabolic-drift': 'Insulin-Drift',
  'hormonal-shift': 'Estrogen-Shift',
  'system-overload': 'Androgen-Decline',
  'pending': 'Pending',
}

type DecodeRow = {
  /** 'decode' = the live Stage 1. 'challenge' = a legacy 14-day enrollment. */
  product: 'decode' | 'challenge'
  id: string; token: string; name: string; email: string; phone: string
  currentDay: number; enrolledAt: string; quizResult: string | null
  quizCompleted: boolean; hasBlueprintPurchase: boolean
  scorecardDone: boolean; parqDone: boolean; healthDone: boolean
  scorecardScore: number | null; scorecardBodyState: string | null; scorecardProfile: string | null
}

// Compact onboarding-status indicator for the Body Decode table: shows, per
// signup, whether they have completed the in-portal Scorecard, PAR-Q, and
// Health Declaration yet.
function OnboardTicks({ scorecard, parq, health }: { scorecard: boolean; parq: boolean; health: boolean }) {
  const item = (label: string, done: boolean) => (
    <span
      title={done ? `${label}: done` : `${label}: not yet`}
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${done ? 'text-[#15803D] bg-[#DCFCE7]' : 'text-[#676D76] bg-[#1F242C]'}`}
      style={{ fontFamily: MONO_FONT }}
    >
      {done ? '✓' : '·'} {label}
    </span>
  )
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {item('Scorecard', scorecard)}
      {item('PAR-Q', parq)}
      {item('Health', health)}
    </div>
  )
}

// Scorecard result cell for the Body Decode table: when the Day 0 scorecard is
// done, shows the score + body state (the actual result, not just a tick);
// otherwise a muted "Pending". Colour keyed to body state.
function ScorecardResult({ done, score, bodyState }: { done: boolean; score: number | null; bodyState: string | null }) {
  if (!done) {
    return <span className="text-[#676D76] text-[12.5px]" style={{ fontFamily: MONO_FONT }}>Pending</span>
  }
  const state = (bodyState ?? '').replace(/ State$/, '') || 'Done'
  const colour = state === 'Depleted' ? '#D4817E' : state === 'Transitioning' ? '#FAFAF8' : state === 'Ready' ? '#15803D' : '#666666'
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border"
      style={{ fontFamily: MONO_FONT, color: colour, background: colour + '14', borderColor: colour + '33' }}
      title={`Scorecard: ${state}${score != null ? ` (${score}/15)` : ''}`}
    >
      {score != null && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{score}/15</span>}
      {state}
    </span>
  )
}

type BlueprintRow = {
  id: string; token: string; name: string; email: string; pattern: string
  currentWeek: number; purchaseDate: string
  lastCheckin: { week: number; avg: number; date: string } | null
  hasMembership: boolean
}

type MembershipRow = {
  id: string; token: string; name: string; email: string; pattern: string
  currentBlock: string; currentWeek: number; joinedAt: string
  cancelledAt: string | null
  lastCheckin: { week: number; avg: number; date: string } | null
  blueprintToken: string | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })
}

function AvgBadge({ avg }: { avg: number }) {
  const colour = avg >= 4 ? '#FAFAF8' : avg >= 3 ? '#B7791F' : '#D4817E'
  return (
    <span
      className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border"
      style={{ fontFamily: MONO_FONT, color: colour, background: colour + '14', borderColor: colour + '33' }}
    >
      {avg}/5
    </span>
  )
}

function PatternBadge({ pattern }: { pattern: string }) {
  const colour = PATTERN_COLOURS[pattern] ?? '#676D76'
  const label = PATTERN_LABELS[pattern] ?? pattern
  return (
    <span
      className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ color: colour, background: colour + '14', borderColor: colour + '33' }}
    >
      {label}
    </span>
  )
}

function StatusBadge({ label, colour }: { label: string; colour: string }) {
  return (
    <span
      className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ color: colour, background: colour + '14', borderColor: colour + '33' }}
    >
      {label}
    </span>
  )
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-[#2A2F39] bg-[#14171D]">
            {headers.map(h => (
              <th
                key={h}
                className="text-left px-3 py-3 text-[10px] font-medium text-[#676D76] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function TR({ children, highlight, href }: { children: React.ReactNode; highlight?: boolean; href?: string }) {
  const router = useRouter()
  const clickable = !!href
  return (
    <tr
      onClick={clickable ? () => router.push(href!) : undefined}
      className={`border-b border-[#2A2F39] last:border-b-0 transition-colors hover:bg-[#1F242C]/40 ${clickable ? 'cursor-pointer' : ''}`}
      style={highlight ? { background: 'rgba(239,68,68,0.04)' } : undefined}
    >
      {children}
    </tr>
  )
}

function TD({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3 text-[#8A9099] align-middle">{children}</td>
}

function TDName({ name, email, drillHref }: { name: string; email: string; drillHref?: string }) {
  const inner = (
    <>
      <div className="text-[13.5px] font-semibold text-[#FAFAF8]">{name}</div>
      <div className="text-[11px] text-[#676D76]">{email}</div>
    </>
  )
  return (
    <td className="px-3 py-3 align-middle">
      {drillHref ? (
        <Link href={drillHref} className="block hover:text-[#FAFAF8] transition-colors">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </td>
  )
}

type PagesTokens = {
  challenge?: string
  blueprint?: string
  membership?: string
  portalOnboarding?: string
  portalCheckin?: string
  portalBaseline?: string
  intakeFoundational?: string
  intakeSupplementary?: string
  scorecardReport?: string
}

export default function FunnelClient({
  challengeEnrollments,
  blueprintEnrollments,
  membershipEnrollments,
  pagesTokens,
}: {
  challengeEnrollments: DecodeRow[]
  blueprintEnrollments: BlueprintRow[]
  membershipEnrollments: MembershipRow[]
  pagesTokens: PagesTokens
}) {
  const [tab, setTab] = useState<'decode' | 'blueprint' | 'membership' | 'pages'>('decode')
  const [search, setSearch] = useState('')

  const q = search.toLowerCase()

  const filteredDecode = challengeEnrollments.filter(e =>
    e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
  )
  const filteredBlueprint = blueprintEnrollments.filter(e =>
    e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
  )
  const filteredMembership = membershipEnrollments.filter(e =>
    e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
  )

  const blueprintAtRisk = blueprintEnrollments.filter(e => e.currentWeek === 6 && !e.hasMembership).length
  const membershipNoCheckin = membershipEnrollments.filter(e => !e.cancelledAt && !e.lastCheckin).length
  const amber = accentColour('amber')

  const summary = [
    {
      label: 'The Body Decode',
      count: challengeEnrollments.filter(e => e.product === 'decode').length,
      // The legacy count is stated rather than folded in: 30 people ran the
      // retired 14-day arc and counting them as Body Decode signups would
      // overstate the new offer thirtyfold on its first month.
      sub: (() => {
        const legacy = challengeEnrollments.filter(e => e.product !== 'decode').length
        const done = challengeEnrollments.filter(e => e.product === 'decode' && e.scorecardDone).length
        return legacy > 0 ? `${done} did scorecard · ${legacy} legacy Challenge` : `${done} did scorecard`
      })(),
      accent: '#FAFAF8',
    },
    { label: 'Blueprint', count: blueprintEnrollments.length, sub: `${blueprintEnrollments.filter(e => e.hasMembership).length} ascended to membership`, accent: '#8b5cf6' },
    { label: 'Membership', count: membershipEnrollments.length, sub: `${membershipEnrollments.filter(e => !e.cancelledAt).length} active`, accent: '#B7791F' },
  ]

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Funnel"
        title="Funnel Dashboard"
        subtitle="Every participant across all three stages - The Body Decode, Blueprint, Membership."
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {summary.map(s => (
          <div key={s.label} className="relative br-card p-5 overflow-hidden">
            <div
              className="absolute top-5 left-5 w-7 h-[3px] rounded-full"
              style={{ background: s.accent }}
            />
            <p
              className="text-[10px] text-[#8A9099] mt-4 mb-3"
            >
              {s.label}
            </p>
            <p
              className="text-[34px] font-extrabold text-[#FAFAF8] tracking-tight leading-none mb-2.5"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {s.count}
            </p>
            <p className="text-[11px] text-[#676D76] truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Attention flags */}
      {(blueprintAtRisk > 0 || membershipNoCheckin > 0) && (
        <div
          className="mb-5 bg-[#14171D] border rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap"
          style={{ borderColor: amber.ring }}
        >
          <div className="inline-flex items-center gap-2 shrink-0">
            <AlertTriangle size={14} style={{ color: amber.text }} />
            <span
              className="text-[11px] font-medium"
              style={{ color: amber.text }}
            >
              Needs attention
            </span>
          </div>
          {blueprintAtRisk > 0 && (
            <div className="text-[13.5px] text-[#8A9099]">
              <span className="font-semibold text-[#FAFAF8]">{blueprintAtRisk}</span> Blueprint buyer{blueprintAtRisk > 1 ? 's' : ''} at Week 6 - not yet in membership
            </div>
          )}
          {membershipNoCheckin > 0 && (
            <div className="text-[13.5px] text-[#8A9099]">
              <span className="font-semibold text-[#FAFAF8]">{membershipNoCheckin}</span> active member{membershipNoCheckin > 1 ? 's' : ''} with no check-in submitted
            </div>
          )}
        </div>
      )}

      {/* Search + tabs */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="inline-flex items-center bg-[#14171D] border border-[#2A2F39] rounded-lg p-0.5">
          {([
            { id: 'decode', label: `Body Decode (${challengeEnrollments.length})` },
            { id: 'blueprint', label: `Blueprint (${blueprintEnrollments.length})` },
            { id: 'membership', label: `Membership (${membershipEnrollments.length})` },
            { id: 'pages', label: 'Pages' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                tab === t.id ? 'bg-[#FAFAF8] text-[#14171D]' : 'text-[#8A9099] hover:text-[#FAFAF8]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#676D76] pointer-events-none" />
          <input
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-[13.5px] bg-[#14171D] border border-[#2A2F39] rounded-lg pl-8 pr-3 py-2 text-[#FAFAF8] placeholder:text-[#676D76] outline-none focus:border-[#FAFAF8] w-[220px] transition-colors"
          />
        </div>
      </div>

      {/* Tables */}
      <Card padding="none" className={`overflow-hidden ${tab === 'pages' ? 'hidden' : ''}`}>

        {tab === 'decode' && (
          <Table headers={['Name', 'Day', 'Setup', 'Scorecard', 'Pattern', 'Quiz', 'Blueprint', 'Enrolled']}>
            {filteredDecode.length === 0 && (
              <TR><TD><span className="text-[#676D76]">No enrollments yet.</span></TD></TR>
            )}
            {filteredDecode.map(e => {
              const lastDay = e.product === 'decode' ? DECODE_DAYS.length : 14
              const atRisk = e.currentDay >= lastDay && !e.hasBlueprintPurchase
              return (
                <TR key={e.id} highlight={atRisk} href={`/dashboard/funnel/${e.token}`}>
                  <TDName name={e.name} email={e.email} drillHref={`/dashboard/funnel/${e.token}`} />
                  <TD>
                    <span className="font-bold text-[#FAFAF8]" style={{ fontFamily: MONO_FONT, fontVariantNumeric: 'tabular-nums' }}>Day {Math.min(e.currentDay, lastDay)}</span>
                    <span className="text-[11px] text-[#676D76]" style={{ fontFamily: MONO_FONT }}> / {lastDay}</span>
                    {e.product !== 'decode' && (
                      <span className="ml-2 text-[10px] text-[#676D76]" title="Enrolled on the retired 14-day Challenge">legacy</span>
                    )}
                  </TD>
                  <TD>
                    <OnboardTicks scorecard={e.scorecardDone} parq={e.parqDone} health={e.healthDone} />
                  </TD>
                  <TD>
                    <ScorecardResult done={e.scorecardDone} score={e.scorecardScore} bodyState={e.scorecardBodyState} />
                  </TD>
                  <TD>
                    {e.quizResult ? <PatternBadge pattern={e.quizResult} /> : <span className="text-[#676D76] text-[12.5px]">No quiz</span>}
                  </TD>
                  <TD>
                    {e.quizCompleted
                      ? <StatusBadge label="Completed" colour="#FAFAF8" />
                      : <StatusBadge label="Pending" colour="#676D76" />}
                  </TD>
                  <TD>
                    {e.hasBlueprintPurchase
                      ? <StatusBadge label="Purchased" colour="#8b5cf6" />
                      : e.currentDay >= lastDay
                        ? <StatusBadge label="Not yet" colour="#D4817E" />
                        : <StatusBadge label="Reading" colour="#676D76" />}
                  </TD>
                  <TD>
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ fontFamily: MONO_FONT }}>{formatDate(e.enrolledAt)}</span>
                      <ChevronRight size={14} className="text-[#676D76]" />
                    </div>
                  </TD>
                </TR>
              )
            })}
          </Table>
        )}

        {tab === 'blueprint' && (
          <Table headers={['Name', 'Pattern', 'Week', 'Last Check-In', 'Avg Score', 'Membership', 'Purchased']}>
            {filteredBlueprint.length === 0 && (
              <TR><TD><span className="text-[#676D76]">No Blueprint buyers yet.</span></TD></TR>
            )}
            {filteredBlueprint.map(e => {
              const atRisk = e.currentWeek === 6 && !e.hasMembership
              const noCheckin = !e.lastCheckin && e.currentWeek > 1
              return (
                <TR key={e.id} highlight={atRisk || noCheckin}>
                  <TDName name={e.name} email={e.email} />
                  <TD><PatternBadge pattern={e.pattern} /></TD>
                  <TD>
                    <span className="font-bold text-[#FAFAF8]" style={{ fontFamily: MONO_FONT, fontVariantNumeric: 'tabular-nums' }}>Week {e.currentWeek}</span>
                    <span className="text-[11px] text-[#676D76]" style={{ fontFamily: MONO_FONT }}> / 6</span>
                  </TD>
                  <TD>
                    {e.lastCheckin
                      ? <span className="text-[12.5px] text-[#8A9099]">Week {e.lastCheckin.week} · {formatDate(e.lastCheckin.date)}</span>
                      : <span className="text-[12.5px] text-[#D4817E]">None submitted</span>}
                  </TD>
                  <TD>{e.lastCheckin ? <AvgBadge avg={e.lastCheckin.avg} /> : <span className="text-[#676D76] text-[12.5px]">-</span>}</TD>
                  <TD>
                    {e.hasMembership
                      ? <StatusBadge label="Active" colour="#FAFAF8" />
                      : e.currentWeek === 6
                        ? <StatusBadge label="Not joined" colour="#D4817E" />
                        : <StatusBadge label="Not yet" colour="#676D76" />}
                  </TD>
                  <TD><span style={{ fontFamily: MONO_FONT }}>{formatDate(e.purchaseDate)}</span></TD>
                </TR>
              )
            })}
          </Table>
        )}

        {tab === 'membership' && (
          <Table headers={['Name', 'Pattern', 'Block / Week', 'Last Check-In', 'Avg Score', 'Status', 'Joined']}>
            {filteredMembership.length === 0 && (
              <TR><TD><span className="text-[#676D76]">No members yet.</span></TD></TR>
            )}
            {filteredMembership.map(e => {
              const noCheckin = !e.cancelledAt && !e.lastCheckin
              return (
                <TR key={e.id} highlight={noCheckin}>
                  <TDName name={e.name} email={e.email} />
                  <TD><PatternBadge pattern={e.pattern} /></TD>
                  <TD>
                    <span className="font-bold text-[#FAFAF8]" style={{ fontFamily: MONO_FONT }}>Block {e.currentBlock}</span>
                    <span className="text-[#676D76]"> · </span>
                    <span className="font-bold text-[#FAFAF8]" style={{ fontFamily: MONO_FONT, fontVariantNumeric: 'tabular-nums' }}>Week {e.currentWeek}</span>
                  </TD>
                  <TD>
                    {e.lastCheckin
                      ? <span className="text-[12.5px] text-[#8A9099]">Week {e.lastCheckin.week} · {formatDate(e.lastCheckin.date)}</span>
                      : <span className="text-[12.5px] text-[#D4817E]">None submitted</span>}
                  </TD>
                  <TD>{e.lastCheckin ? <AvgBadge avg={e.lastCheckin.avg} /> : <span className="text-[#676D76] text-[12.5px]">-</span>}</TD>
                  <TD>
                    {e.cancelledAt
                      ? <StatusBadge label="Cancelled" colour="#D4817E" />
                      : <StatusBadge label="Active" colour="#FAFAF8" />}
                  </TD>
                  <TD><span style={{ fontFamily: MONO_FONT }}>{formatDate(e.joinedAt)}</span></TD>
                </TR>
              )
            })}
          </Table>
        )}

      </Card>

      {/* Pages tab - URL catalog across the funnel */}
      {tab === 'pages' && <PagesIndex tokens={pagesTokens} />}
    </div>
  )
}
