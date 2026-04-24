'use client'

import { useState } from 'react'

const PATTERN_COLOURS: Record<string, string> = {
  'stress-stored': '#ef4444',
  'metabolic-drift': '#f59e0b',
  'hormonal-shift': '#8b5cf6',
  'system-overload': '#14b8a6',
  'pending': '#57534e',
}

const PATTERN_LABELS: Record<string, string> = {
  'stress-stored': 'Stress-Stored',
  'metabolic-drift': 'Metabolic-Drift',
  'hormonal-shift': 'Hormonal-Shift',
  'system-overload': 'System-Overload',
  'pending': 'Pending',
}

type ChallengeRow = {
  id: string; token: string; name: string; email: string; phone: string
  currentDay: number; enrolledAt: string; quizResult: string | null
  quizCompleted: boolean; hasBlueprintPurchase: boolean
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

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })
}

function AvgBadge({ avg }: { avg: number }) {
  const colour = avg >= 4 ? '#14b8a6' : avg >= 3 ? '#f59e0b' : '#ef4444'
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: colour, background: colour + '20', padding: '2px 8px', borderRadius: 99 }}>
      {avg}/5
    </span>
  )
}

function PatternBadge({ pattern }: { pattern: string }) {
  const colour = PATTERN_COLOURS[pattern] ?? '#57534e'
  const label = PATTERN_LABELS[pattern] ?? pattern
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: colour, background: colour + '18', padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function StatusBadge({ label, colour }: { label: string; colour: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: colour, background: colour + '18', padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #292524' }}>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
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

function TR({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <tr style={{ borderBottom: '1px solid #1c1917', background: highlight ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
      {children}
    </tr>
  )
}

function TD({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '10px 12px', color: '#a8a29e', verticalAlign: 'middle' }}>{children}</td>
}

function TDName({ name, email }: { name: string; email: string }) {
  return (
    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
      <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{name}</div>
      <div style={{ fontSize: 11, color: '#57534e' }}>{email}</div>
    </td>
  )
}

export default function FunnelClient({
  challengeEnrollments,
  blueprintEnrollments,
  membershipEnrollments,
}: {
  challengeEnrollments: ChallengeRow[]
  blueprintEnrollments: BlueprintRow[]
  membershipEnrollments: MembershipRow[]
}) {
  const [tab, setTab] = useState<'challenge' | 'blueprint' | 'membership'>('challenge')
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

  // Attention flags
  const blueprintAtRisk = blueprintEnrollments.filter(e => e.currentWeek === 6 && !e.hasMembership).length
  const membershipNoCheckin = membershipEnrollments.filter(e => !e.cancelledAt && !e.lastCheckin).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Funnel Dashboard</h1>
        <p style={{ fontSize: 13, color: '#57534e' }}>Every participant across all three stages.</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Challenge', count: challengeEnrollments.length, sub: `${challengeEnrollments.filter(e => e.quizCompleted).length} completed quiz`, colour: '#14b8a6' },
          { label: 'Blueprint', count: blueprintEnrollments.length, sub: `${blueprintEnrollments.filter(e => e.hasMembership).length} ascended to membership`, colour: '#8b5cf6' },
          { label: 'Membership', count: membershipEnrollments.length, sub: `${membershipEnrollments.filter(e => !e.cancelledAt).length} active`, colour: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.colour, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#57534e' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Attention flags */}
      {(blueprintAtRisk > 0 || membershipNoCheckin > 0) && (
        <div style={{ background: '#1c1210', border: '1px solid #78350f', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', alignSelf: 'center' }}>Needs attention</div>
          {blueprintAtRisk > 0 && (
            <div style={{ fontSize: 13, color: '#d97706' }}>
              <strong style={{ color: '#fbbf24' }}>{blueprintAtRisk}</strong> Blueprint buyer{blueprintAtRisk > 1 ? 's' : ''} at Week 6 - not yet in membership
            </div>
          )}
          {membershipNoCheckin > 0 && (
            <div style={{ fontSize: 13, color: '#d97706' }}>
              <strong style={{ color: '#fbbf24' }}>{membershipNoCheckin}</strong> active member{membershipNoCheckin > 1 ? 's' : ''} with no check-in submitted
            </div>
          )}
        </div>
      )}

      {/* Search + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#111110', borderRadius: 8, padding: 3, gap: 2 }}>
          {([
            { id: 'challenge', label: `Challenge (${challengeEnrollments.length})` },
            { id: 'blueprint', label: `Blueprint (${blueprintEnrollments.length})` },
            { id: 'membership', label: `Membership (${membershipEnrollments.length})` },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '7px 14px', fontSize: 12, fontWeight: 600,
                color: tab === t.id ? '#0c0a09' : '#57534e',
                background: tab === t.id ? '#14b8a6' : 'transparent',
                border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', fontSize: 13, background: '#111110',
            border: '1px solid #292524', borderRadius: 8, color: '#fff', outline: 'none', width: 220,
          }}
        />
      </div>

      {/* Tables */}
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, overflow: 'hidden' }}>

        {/* CHALLENGE */}
        {tab === 'challenge' && (
          <Table headers={['Name', 'Day', 'Pattern', 'Quiz', 'Blueprint', 'Enrolled']}>
            {filteredChallenge.length === 0 && (
              <TR><TD><span style={{ color: '#57534e' }}>No enrollments yet.</span></TD></TR>
            )}
            {filteredChallenge.map(e => {
              const atRisk = e.currentDay >= 14 && !e.hasBlueprintPurchase
              return (
                <TR key={e.id} highlight={atRisk}>
                  <TDName name={e.name} email={e.email} />
                  <TD>
                    <span style={{ fontWeight: 700, color: '#fff' }}>Day {Math.min(e.currentDay, 14)}</span>
                    <span style={{ fontSize: 11, color: '#57534e' }}> / 14</span>
                  </TD>
                  <TD>
                    {e.quizResult ? <PatternBadge pattern={e.quizResult} /> : <span style={{ color: '#57534e', fontSize: 12 }}>No quiz</span>}
                  </TD>
                  <TD>
                    {e.quizCompleted
                      ? <StatusBadge label="Completed" colour="#14b8a6" />
                      : <StatusBadge label="Pending" colour="#57534e" />}
                  </TD>
                  <TD>
                    {e.hasBlueprintPurchase
                      ? <StatusBadge label="Purchased" colour="#8b5cf6" />
                      : e.currentDay >= 14
                        ? <StatusBadge label="Not yet" colour="#ef4444" />
                        : <StatusBadge label="In progress" colour="#57534e" />}
                  </TD>
                  <TD>{formatDate(e.enrolledAt)}</TD>
                </TR>
              )
            })}
          </Table>
        )}

        {/* BLUEPRINT */}
        {tab === 'blueprint' && (
          <Table headers={['Name', 'Pattern', 'Week', 'Last Check-In', 'Avg Score', 'Membership', 'Purchased']}>
            {filteredBlueprint.length === 0 && (
              <TR><TD><span style={{ color: '#57534e' }}>No Blueprint buyers yet.</span></TD></TR>
            )}
            {filteredBlueprint.map(e => {
              const atRisk = e.currentWeek === 6 && !e.hasMembership
              const noCheckin = !e.lastCheckin && e.currentWeek > 1
              return (
                <TR key={e.id} highlight={atRisk || noCheckin}>
                  <TDName name={e.name} email={e.email} />
                  <TD><PatternBadge pattern={e.pattern} /></TD>
                  <TD>
                    <span style={{ fontWeight: 700, color: '#fff' }}>Week {e.currentWeek}</span>
                    <span style={{ fontSize: 11, color: '#57534e' }}> / 6</span>
                  </TD>
                  <TD>
                    {e.lastCheckin
                      ? <span style={{ fontSize: 12, color: '#a8a29e' }}>Week {e.lastCheckin.week} &middot; {formatDate(e.lastCheckin.date)}</span>
                      : <span style={{ fontSize: 12, color: '#ef4444' }}>None submitted</span>}
                  </TD>
                  <TD>{e.lastCheckin ? <AvgBadge avg={e.lastCheckin.avg} /> : <span style={{ color: '#57534e', fontSize: 12 }}>-</span>}</TD>
                  <TD>
                    {e.hasMembership
                      ? <StatusBadge label="Active" colour="#14b8a6" />
                      : e.currentWeek === 6
                        ? <StatusBadge label="Not joined" colour="#ef4444" />
                        : <StatusBadge label="Not yet" colour="#57534e" />}
                  </TD>
                  <TD>{formatDate(e.purchaseDate)}</TD>
                </TR>
              )
            })}
          </Table>
        )}

        {/* MEMBERSHIP */}
        {tab === 'membership' && (
          <Table headers={['Name', 'Pattern', 'Block / Week', 'Last Check-In', 'Avg Score', 'Status', 'Joined']}>
            {filteredMembership.length === 0 && (
              <TR><TD><span style={{ color: '#57534e' }}>No members yet.</span></TD></TR>
            )}
            {filteredMembership.map(e => {
              const noCheckin = !e.cancelledAt && !e.lastCheckin
              return (
                <TR key={e.id} highlight={noCheckin}>
                  <TDName name={e.name} email={e.email} />
                  <TD><PatternBadge pattern={e.pattern} /></TD>
                  <TD>
                    <span style={{ fontWeight: 700, color: '#fff' }}>Block {e.currentBlock}</span>
                    <span style={{ color: '#57534e' }}> &middot; </span>
                    <span style={{ fontWeight: 700, color: '#fff' }}>Week {e.currentWeek}</span>
                  </TD>
                  <TD>
                    {e.lastCheckin
                      ? <span style={{ fontSize: 12, color: '#a8a29e' }}>Week {e.lastCheckin.week} &middot; {formatDate(e.lastCheckin.date)}</span>
                      : <span style={{ fontSize: 12, color: '#ef4444' }}>None submitted</span>}
                  </TD>
                  <TD>{e.lastCheckin ? <AvgBadge avg={e.lastCheckin.avg} /> : <span style={{ color: '#57534e', fontSize: 12 }}>-</span>}</TD>
                  <TD>
                    {e.cancelledAt
                      ? <StatusBadge label="Cancelled" colour="#ef4444" />
                      : <StatusBadge label="Active" colour="#14b8a6" />}
                  </TD>
                  <TD>{formatDate(e.joinedAt)}</TD>
                </TR>
              )
            })}
          </Table>
        )}

      </div>
    </div>
  )
}
