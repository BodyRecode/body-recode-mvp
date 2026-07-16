'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Search, ChevronRight } from 'lucide-react'
import { PageHeader, Card, MONO_FONT, accentColour } from '@/components/dashboard/ui'
import PagesIndex from './pages-index'

const PATTERN_COLOURS: Record<string, string> = {
  'stress-stored': '#DC2626',
  'metabolic-drift': '#B7791F',
  'hormonal-shift': '#8b5cf6',
  'system-overload': '#1B6DFC',
  'pending': '#999999',
}

const PATTERN_LABELS: Record<string, string> = {
  'stress-stored': 'Stress-Stored',
  'metabolic-drift': 'Insulin-Drift',
  'hormonal-shift': 'Estrogen-Shift',
  'system-overload': 'Androgen-Decline',
  'pending': 'Pending',
}

type ChallengeRow = {
  id: string; token: string; name: string; email: string; phone: string
  currentDay: number; enrolledAt: string; quizResult: string | null
  quizCompleted: boolean; hasBlueprintPurchase: boolean
  scorecardDone: boolean; parqDone: boolean; healthDone: boolean
  scorecardScore: number | null; scorecardBodyState: string | null; scorecardProfile: string | null
}

// Compact onboarding-status indicator for the Challenge table: shows, per
// signup, whether they have completed the in-portal Scorecard, PAR-Q, and
// Health Declaration yet.
function OnboardTicks({ scorecard, parq, health }: { scorecard: boolean; parq: boolean; health: boolean }) {
  const item = (label: string, done: boolean) => (
    <span
      title={done ? `${label}: done` : `${label}: not yet`}
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${done ? 'text-[#15803D] bg-[#DCFCE7]' : 'text-[#999999] bg-[#F0F0F0]'}`}
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

// Scorecard result cell for the Challenge table: when the Day 0 scorecard is
// done, shows the score + body state (the actual result, not just a tick);
// otherwise a muted "Pending". Colour keyed to body state.
function ScorecardResult({ done, score, bodyState }: { done: boolean; score: number | null; bodyState: string | null }) {
  if (!done) {
    return <span className="text-[#999999] text-[12px]" style={{ fontFamily: MONO_FONT }}>Pending</span>
  }
  const state = (bodyState ?? '').replace(/ State$/, '') || 'Done'
  const colour = state === 'Depleted' ? '#DC2626' : state === 'Transitioning' ? '#1B6DFC' : state === 'Ready' ? '#15803D' : '#666666'
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border"
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
  const colour = avg >= 4 ? '#1B6DFC' : avg >= 3 ? '#B7791F' : '#DC2626'
  return (
    <span
      className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border"
      style={{ fontFamily: MONO_FONT, color: colour, background: colour + '14', borderColor: colour + '33' }}
    >
      {avg}/5
    </span>
  )
}

function PatternBadge({ pattern }: { pattern: string }) {
  const colour = PATTERN_COLOURS[pattern] ?? '#999999'
  const label = PATTERN_LABELS[pattern] ?? pattern
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em', color: colour, background: colour + '14', borderColor: colour + '33' }}
    >
      {label}
    </span>
  )
}

function StatusBadge({ label, colour }: { label: string; colour: string }) {
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em', color: colour, background: colour + '14', borderColor: colour + '33' }}
    >
      {label}
    </span>
  )
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[#E5E5E5] bg-[#FFFFFF]">
            {headers.map(h => (
              <th
                key={h}
                className="text-left px-3 py-3 text-[10px] font-bold text-[#999999] uppercase whitespace-nowrap"
                style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
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
      className={`border-b border-[#E5E5E5] last:border-b-0 transition-colors hover:bg-[#E5E5E5]/40 ${clickable ? 'cursor-pointer' : ''}`}
      style={highlight ? { background: 'rgba(239,68,68,0.04)' } : undefined}
    >
      {children}
    </tr>
  )
}

function TD({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3 text-[#6B6B6B] align-middle">{children}</td>
}

function TDName({ name, email, drillHref }: { name: string; email: string; drillHref?: string }) {
  const inner = (
    <>
      <div className="text-[13px] font-semibold text-[#1A1A1A]">{name}</div>
      <div className="text-[11px] text-[#999999]">{email}</div>
    </>
  )
  return (
    <td className="px-3 py-3 align-middle">
      {drillHref ? (
        <Link href={drillHref} className="block hover:text-[#1B6DFC] transition-colors">
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
  challengeEnrollments: ChallengeRow[]
  blueprintEnrollments: BlueprintRow[]
  membershipEnrollments: MembershipRow[]
  pagesTokens: PagesTokens
}) {
  const [tab, setTab] = useState<'challenge' | 'blueprint' | 'membership' | 'pages'>('challenge')
  const [search, setSearch] = useState('')

  const q = search.toLowerCase()

  const filteredChallenge = challengeEnrollments.filter(e =>
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
    { label: 'Challenge', count: challengeEnrollments.length, sub: `${challengeEnrollments.filter(e => e.scorecardDone).length} did scorecard`, accent: '#1B6DFC' },
    { label: 'Blueprint', count: blueprintEnrollments.length, sub: `${blueprintEnrollments.filter(e => e.hasMembership).length} ascended to membership`, accent: '#8b5cf6' },
    { label: 'Membership', count: membershipEnrollments.length, sub: `${membershipEnrollments.filter(e => !e.cancelledAt).length} active`, accent: '#B7791F' },
  ]

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Funnel"
        title="Funnel Dashboard"
        subtitle="Every participant across all three stages - Challenge, Blueprint, Membership."
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {summary.map(s => (
          <div key={s.label} className="relative bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-5 overflow-hidden">
            <div
              className="absolute top-5 left-5 w-7 h-[3px] rounded-full"
              style={{ background: s.accent }}
            />
            <p
              className="text-[10px] text-[#6B6B6B] uppercase mt-4 mb-3"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
            >
              {s.label}
            </p>
            <p
              className="text-[34px] font-extrabold text-[#1A1A1A] tracking-tight leading-none mb-2.5"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {s.count}
            </p>
            <p className="text-[11px] text-[#999999] truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Attention flags */}
      {(blueprintAtRisk > 0 || membershipNoCheckin > 0) && (
        <div
          className="mb-5 bg-[#FFFFFF] border rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap"
          style={{ borderColor: amber.ring }}
        >
          <div className="inline-flex items-center gap-2 shrink-0">
            <AlertTriangle size={14} style={{ color: amber.text }} />
            <span
              className="text-[10px] font-bold uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em', color: amber.text }}
            >
              Needs attention
            </span>
          </div>
          {blueprintAtRisk > 0 && (
            <div className="text-[13px] text-[#6B6B6B]">
              <span className="font-semibold text-[#1A1A1A]">{blueprintAtRisk}</span> Blueprint buyer{blueprintAtRisk > 1 ? 's' : ''} at Week 6 - not yet in membership
            </div>
          )}
          {membershipNoCheckin > 0 && (
            <div className="text-[13px] text-[#6B6B6B]">
              <span className="font-semibold text-[#1A1A1A]">{membershipNoCheckin}</span> active member{membershipNoCheckin > 1 ? 's' : ''} with no check-in submitted
            </div>
          )}
        </div>
      )}

      {/* Search + tabs */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="inline-flex items-center bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-0.5">
          {([
            { id: 'challenge', label: `Challenge (${challengeEnrollments.length})` },
            { id: 'blueprint', label: `Blueprint (${blueprintEnrollments.length})` },
            { id: 'membership', label: `Membership (${membershipEnrollments.length})` },
            { id: 'pages', label: 'Pages' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                tab === t.id ? 'bg-[#1B6DFC] text-[#FFFFFF]' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999] pointer-events-none" />
          <input
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg pl-8 pr-3 py-2 text-[#1A1A1A] placeholder:text-[#999999] outline-none focus:border-[#1B6DFC] w-[220px] transition-colors"
          />
        </div>
      </div>

      {/* Tables */}
      <Card padding="none" className={`overflow-hidden ${tab === 'pages' ? 'hidden' : ''}`}>

        {tab === 'challenge' && (
          <Table headers={['Name', 'Day', 'Setup', 'Scorecard', 'Pattern', 'Quiz', 'Blueprint', 'Enrolled']}>
            {filteredChallenge.length === 0 && (
              <TR><TD><span className="text-[#999999]">No enrollments yet.</span></TD></TR>
            )}
            {filteredChallenge.map(e => {
              const atRisk = e.currentDay >= 14 && !e.hasBlueprintPurchase
              return (
                <TR key={e.id} highlight={atRisk} href={`/dashboard/funnel/${e.token}`}>
                  <TDName name={e.name} email={e.email} drillHref={`/dashboard/funnel/${e.token}`} />
                  <TD>
                    <span className="font-bold text-[#1A1A1A]" style={{ fontFamily: MONO_FONT, fontVariantNumeric: 'tabular-nums' }}>Day {Math.min(e.currentDay, 14)}</span>
                    <span className="text-[11px] text-[#999999]" style={{ fontFamily: MONO_FONT }}> / 14</span>
                  </TD>
                  <TD>
                    <OnboardTicks scorecard={e.scorecardDone} parq={e.parqDone} health={e.healthDone} />
                  </TD>
                  <TD>
                    <ScorecardResult done={e.scorecardDone} score={e.scorecardScore} bodyState={e.scorecardBodyState} />
                  </TD>
                  <TD>
                    {e.quizResult ? <PatternBadge pattern={e.quizResult} /> : <span className="text-[#999999] text-[12px]">No quiz</span>}
                  </TD>
                  <TD>
                    {e.quizCompleted
                      ? <StatusBadge label="Completed" colour="#1B6DFC" />
                      : <StatusBadge label="Pending" colour="#999999" />}
                  </TD>
                  <TD>
                    {e.hasBlueprintPurchase
                      ? <StatusBadge label="Purchased" colour="#8b5cf6" />
                      : e.currentDay >= 14
                        ? <StatusBadge label="Not yet" colour="#DC2626" />
                        : <StatusBadge label="In progress" colour="#999999" />}
                  </TD>
                  <TD>
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ fontFamily: MONO_FONT }}>{formatDate(e.enrolledAt)}</span>
                      <ChevronRight size={14} className="text-[#999999]" />
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
              <TR><TD><span className="text-[#999999]">No Blueprint buyers yet.</span></TD></TR>
            )}
            {filteredBlueprint.map(e => {
              const atRisk = e.currentWeek === 6 && !e.hasMembership
              const noCheckin = !e.lastCheckin && e.currentWeek > 1
              return (
                <TR key={e.id} highlight={atRisk || noCheckin}>
                  <TDName name={e.name} email={e.email} />
                  <TD><PatternBadge pattern={e.pattern} /></TD>
                  <TD>
                    <span className="font-bold text-[#1A1A1A]" style={{ fontFamily: MONO_FONT, fontVariantNumeric: 'tabular-nums' }}>Week {e.currentWeek}</span>
                    <span className="text-[11px] text-[#999999]" style={{ fontFamily: MONO_FONT }}> / 6</span>
                  </TD>
                  <TD>
                    {e.lastCheckin
                      ? <span className="text-[12px] text-[#6B6B6B]">Week {e.lastCheckin.week} · {formatDate(e.lastCheckin.date)}</span>
                      : <span className="text-[12px] text-[#DC2626]">None submitted</span>}
                  </TD>
                  <TD>{e.lastCheckin ? <AvgBadge avg={e.lastCheckin.avg} /> : <span className="text-[#999999] text-[12px]">-</span>}</TD>
                  <TD>
                    {e.hasMembership
                      ? <StatusBadge label="Active" colour="#1B6DFC" />
                      : e.currentWeek === 6
                        ? <StatusBadge label="Not joined" colour="#DC2626" />
                        : <StatusBadge label="Not yet" colour="#999999" />}
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
              <TR><TD><span className="text-[#999999]">No members yet.</span></TD></TR>
            )}
            {filteredMembership.map(e => {
              const noCheckin = !e.cancelledAt && !e.lastCheckin
              return (
                <TR key={e.id} highlight={noCheckin}>
                  <TDName name={e.name} email={e.email} />
                  <TD><PatternBadge pattern={e.pattern} /></TD>
                  <TD>
                    <span className="font-bold text-[#1A1A1A]" style={{ fontFamily: MONO_FONT }}>Block {e.currentBlock}</span>
                    <span className="text-[#999999]"> · </span>
                    <span className="font-bold text-[#1A1A1A]" style={{ fontFamily: MONO_FONT, fontVariantNumeric: 'tabular-nums' }}>Week {e.currentWeek}</span>
                  </TD>
                  <TD>
                    {e.lastCheckin
                      ? <span className="text-[12px] text-[#6B6B6B]">Week {e.lastCheckin.week} · {formatDate(e.lastCheckin.date)}</span>
                      : <span className="text-[12px] text-[#DC2626]">None submitted</span>}
                  </TD>
                  <TD>{e.lastCheckin ? <AvgBadge avg={e.lastCheckin.avg} /> : <span className="text-[#999999] text-[12px]">-</span>}</TD>
                  <TD>
                    {e.cancelledAt
                      ? <StatusBadge label="Cancelled" colour="#DC2626" />
                      : <StatusBadge label="Active" colour="#1B6DFC" />}
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
