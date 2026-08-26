import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/ui'
import { SUGGESTED_PROTOCOLS_BY_RRS_STATE } from '@/lib/rrs-protocol-suggestions'
import { protocolBySlug } from '@/lib/recovery-protocols-seed'
import { getPlaybook } from '@/lib/recovery-doctrine'
import type { RecoveryPlaybookId } from '@/lib/recovery-doctrine'

/**
 * Coach Acceptance Dashboard for the RRS -> Recovery Protocols suggestion
 * mapping. Aggregates recovery_protocol_suggestions_log to show how often
 * each state's suggestions actually get assigned vs dismissed, which
 * protocols pull well, and whether SBST removal alerts are being actioned.
 *
 * Purpose: measurement flywheel. Doctrine informs the mapping (in
 * src/lib/rrs-protocol-suggestions.ts); real coach action refines it. Once
 * we see "protocol X consistently ignored for state Y," we know to remove
 * or reorder it. Without this dashboard, the mapping is untested doctrine.
 *
 * Coach-only. Under /dashboard/system-health.
 */

type LogRow = {
  id: string
  client_id: string
  rrs_playbook_id: string
  suggested_protocol_slugs: string[]
  sbst_action: string | null
  coach_email: string | null
  shown_at: string
  action_taken: 'assigned' | 'dismissed' | 'sbst_removed' | null
  assigned_protocol_slug: string | null
  actioned_at: string | null
}

export default async function RrsSuggestionsDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const admin = createAdminClient()

  const { data: logRows } = await admin
    .from('recovery_protocol_suggestions_log')
    .select('id, client_id, rrs_playbook_id, suggested_protocol_slugs, sbst_action, coach_email, shown_at, action_taken, assigned_protocol_slug, actioned_at')
    .order('shown_at', { ascending: false })
    .limit(1000)

  const rows: LogRow[] = (logRows ?? []) as LogRow[]

  // Client names for the recent-activity table
  const clientIds = Array.from(new Set(rows.map(r => r.client_id)))
  const { data: clientNamesRaw } = clientIds.length > 0
    ? await admin.from('clients').select('id, name').in('id', clientIds)
    : { data: [] as { id: string; name: string }[] }
  const clientNameById = new Map((clientNamesRaw ?? []).map(c => [c.id, c.name]))

  // ---------- Aggregations ----------

  // 1) Per-state: shown, assigned, dismissed, sbst_removed, acceptance rate
  const stateStats: Record<string, { shown: number; assigned: number; dismissed: number; sbst_removed: number }> = {}
  for (const r of rows) {
    if (!stateStats[r.rrs_playbook_id]) {
      stateStats[r.rrs_playbook_id] = { shown: 0, assigned: 0, dismissed: 0, sbst_removed: 0 }
    }
    stateStats[r.rrs_playbook_id].shown++
    if (r.action_taken === 'assigned') stateStats[r.rrs_playbook_id].assigned++
    if (r.action_taken === 'dismissed') stateStats[r.rrs_playbook_id].dismissed++
    if (r.action_taken === 'sbst_removed') stateStats[r.rrs_playbook_id].sbst_removed++
  }

  // 2) Per-protocol pull rate (only assign actions attributed to specific slugs)
  const protocolStats: Record<string, { suggested_in_states: Set<string>; assigned_count: number; suggested_count: number }> = {}
  for (const r of rows) {
    for (const slug of r.suggested_protocol_slugs) {
      if (!protocolStats[slug]) {
        protocolStats[slug] = { suggested_in_states: new Set(), assigned_count: 0, suggested_count: 0 }
      }
      protocolStats[slug].suggested_in_states.add(r.rrs_playbook_id)
      protocolStats[slug].suggested_count++
    }
    if (r.action_taken === 'assigned' && r.assigned_protocol_slug) {
      if (!protocolStats[r.assigned_protocol_slug]) {
        protocolStats[r.assigned_protocol_slug] = { suggested_in_states: new Set(), assigned_count: 0, suggested_count: 0 }
      }
      protocolStats[r.assigned_protocol_slug].assigned_count++
    }
  }

  // 3) SBST removal follow-through (ns_overload only surfaces this alert)
  const sbstRemovalStats = {
    alerts_shown: rows.filter(r => r.sbst_action === 'remove').length,
    removals_confirmed: rows.filter(r => r.action_taken === 'sbst_removed').length,
  }

  // 4) 30-day trend (daily buckets of assigned / shown)
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  const dailyBuckets: Record<string, { shown: number; assigned: number }> = {}
  for (let d = thirtyDaysAgo; d <= now; d += 24 * 60 * 60 * 1000) {
    const day = new Date(d).toISOString().slice(0, 10)
    dailyBuckets[day] = { shown: 0, assigned: 0 }
  }
  for (const r of rows) {
    const day = r.shown_at.slice(0, 10)
    if (dailyBuckets[day]) {
      dailyBuckets[day].shown++
      if (r.action_taken === 'assigned') dailyBuckets[day].assigned++
    }
  }
  const trendDays = Object.keys(dailyBuckets).sort()

  // Sort states by acceptance rate descending; unpopulated states go last
  const allStateIds = Object.keys(SUGGESTED_PROTOCOLS_BY_RRS_STATE) as RecoveryPlaybookId[]
  const sortedStates = [...allStateIds].sort((a, b) => {
    const sa = stateStats[a]
    const sb = stateStats[b]
    const rateA = sa && sa.shown > 0 ? sa.assigned / sa.shown : -1
    const rateB = sb && sb.shown > 0 ? sb.assigned / sb.shown : -1
    return rateB - rateA
  })

  // Sort protocols by acceptance rate descending (need >0 suggested_count)
  const sortedProtocols = Object.entries(protocolStats)
    .filter(([, s]) => s.suggested_count > 0)
    .sort(([, a], [, b]) => {
      const rateA = a.assigned_count / a.suggested_count
      const rateB = b.assigned_count / b.suggested_count
      return rateB - rateA
    })

  const recent = rows.slice(0, 20)

  const totalShown = rows.length
  const totalAssigned = rows.filter(r => r.action_taken === 'assigned').length
  const totalDismissed = rows.filter(r => r.action_taken === 'dismissed').length
  const overallAcceptance = totalShown > 0 ? (totalAssigned / totalShown) * 100 : 0

  return (
    <div className="max-w-[1100px]">
      <Link
        href="/dashboard/system-health"
        className="inline-flex items-center gap-1 text-[12px] text-[#98A0AD] hover:text-[#43474F] transition-colors mb-4"
      >
        <ChevronLeft size={13} /> System Health
      </Link>

      <PageHeader
        eyebrow="Diagnostics"
        title="RRS to Recovery Suggestions"
        subtitle="Coach acceptance rate for the RRS state to Recovery Protocol mapping. Use these numbers to refine src/lib/rrs-protocol-suggestions.ts empirically."
      />

      {/* Empty state */}
      {totalShown === 0 && (
        <div className="rounded-xl border border-dashed border-[#E8EAEE] bg-[#FBFCFD] px-6 py-10 text-center">
          <p className="text-sm text-[#666D7A] leading-relaxed">
            No suggestion events logged yet. The dashboard will populate as soon as a client is in an active RRS state and a coach opens their <Link href="/dashboard/clients" className="text-blue-500 underline">Recovery Protocols page</Link>.
          </p>
        </div>
      )}

      {totalShown > 0 && (
        <>
          {/* Headline stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard label="Suggestions shown" value={totalShown.toString()} />
            <StatCard label="Assigned" value={totalAssigned.toString()} accent="green" />
            <StatCard label="Dismissed" value={totalDismissed.toString()} accent="amber" />
            <StatCard label="Overall acceptance" value={`${overallAcceptance.toFixed(0)}%`} accent="blue" />
          </div>

          {/* SBST removal follow-through */}
          {sbstRemovalStats.alerts_shown > 0 && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-[10px] font-medium text-red-800 mb-2">SBST removal follow-through (ns_overload)</p>
              <p className="text-sm text-red-900">
                <span className="font-bold">{sbstRemovalStats.removals_confirmed}</span> of <span className="font-bold">{sbstRemovalStats.alerts_shown}</span> removal alerts actioned
                <span className="ml-2 text-[13px] opacity-80">
                  ({sbstRemovalStats.alerts_shown > 0 ? Math.round((sbstRemovalStats.removals_confirmed / sbstRemovalStats.alerts_shown) * 100) : 0}%)
                </span>
              </p>
              <p className="text-[12px] text-red-800 mt-1 leading-relaxed">
                Per 13D_16 sec 15, SBST assignments must be removed when a client enters ns_overload. This measures follow-through on that doctrine rule.
              </p>
            </div>
          )}

          {/* 30-day trend sparkline */}
          <div className="mb-8 rounded-xl border border-[#E8EAEE] bg-white px-5 py-4">
            <p className="text-[10px] font-medium text-[#666D7A] mb-3">30-day acceptance trend (assigned per day)</p>
            <TrendSparkline days={trendDays} data={dailyBuckets} />
          </div>

          {/* Per-state acceptance */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[#141821] mb-3">Per-state acceptance</h2>
            <div className="rounded-xl border border-[#E8EAEE] bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FBFCFD] border-b border-[#E8EAEE]">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-[11px] text-[#666D7A]">State</th>
                    <th className="text-right px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Shown</th>
                    <th className="text-right px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Assigned</th>
                    <th className="text-right px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Dismissed</th>
                    <th className="text-right px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Acceptance</th>
                    <th className="text-right px-4 py-2 font-semibold text-[11px] text-[#666D7A] w-[110px]">SBST action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F6F9]">
                  {sortedStates.map(state => {
                    const s = stateStats[state] ?? { shown: 0, assigned: 0, dismissed: 0, sbst_removed: 0 }
                    const rate = s.shown > 0 ? (s.assigned / s.shown) * 100 : null
                    const playbook = getPlaybook(state)
                    const sbstAction = SUGGESTED_PROTOCOLS_BY_RRS_STATE[state].sbst_action
                    return (
                      <tr key={state} className={s.shown === 0 ? 'opacity-50' : ''}>
                        <td className="px-4 py-2">
                          <div className="text-[13px] text-[#141821]">{playbook.name}</div>
                          <div className="text-[10px] text-[#666D7A] font-mono">{state}</div>
                        </td>
                        <td className="text-right px-4 py-2 text-[13px]">{s.shown}</td>
                        <td className="text-right px-4 py-2 text-[13px]">{s.assigned}</td>
                        <td className="text-right px-4 py-2 text-[13px]">{s.dismissed}</td>
                        <td className="text-right px-4 py-2 text-[13px] font-semibold">
                          {rate === null ? <span className="text-[#98A0AD]">-</span> : `${rate.toFixed(0)}%`}
                        </td>
                        <td className="text-right px-4 py-2 text-[10px]">
                          {sbstAction ? <span className={sbstAction === 'remove' ? 'text-red-700 font-bold' : 'text-amber-700'}>{sbstAction}</span> : <span className="text-[#98A0AD]">-</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-protocol pull rate */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[#141821] mb-3">Per-protocol pull rate</h2>
            <p className="text-[11px] text-[#666D7A] mb-3 leading-relaxed">
              How often each suggested protocol gets one-click assigned vs skipped. Low-pull protocols are candidates to remove or move lower in priority in the state to protocol mapping.
            </p>
            <div className="rounded-xl border border-[#E8EAEE] bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FBFCFD] border-b border-[#E8EAEE]">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Protocol</th>
                    <th className="text-right px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Suggested</th>
                    <th className="text-right px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Assigned</th>
                    <th className="text-right px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Pull rate</th>
                    <th className="text-left px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Suggested in states</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F6F9]">
                  {sortedProtocols.map(([slug, s]) => {
                    const rate = (s.assigned_count / s.suggested_count) * 100
                    const protocol = protocolBySlug(slug)
                    return (
                      <tr key={slug}>
                        <td className="px-4 py-2">
                          <div className="text-[13px] text-[#141821]">{protocol?.name ?? slug}</div>
                          <div className="text-[10px] text-[#666D7A] font-mono">{slug}</div>
                        </td>
                        <td className="text-right px-4 py-2 text-[13px]">{s.suggested_count}</td>
                        <td className="text-right px-4 py-2 text-[13px]">{s.assigned_count}</td>
                        <td className="text-right px-4 py-2 text-[13px] font-semibold">
                          <span className={rate === 0 ? 'text-red-700' : rate < 30 ? 'text-amber-700' : rate < 60 ? 'text-[#141821]' : 'text-green-700'}>
                            {rate.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-[11px] text-[#666D7A]">
                          {Array.from(s.suggested_in_states).join(', ')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent activity */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[#141821] mb-3">Recent suggestion events (last 20)</h2>
            <div className="rounded-xl border border-[#E8EAEE] bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FBFCFD] border-b border-[#E8EAEE]">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-[11px] text-[#666D7A]">When</th>
                    <th className="text-left px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Client</th>
                    <th className="text-left px-4 py-2 font-semibold text-[11px] text-[#666D7A]">State</th>
                    <th className="text-left px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Action</th>
                    <th className="text-left px-4 py-2 font-semibold text-[11px] text-[#666D7A]">Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F6F9]">
                  {recent.map(r => {
                    const assignedProtocol = r.assigned_protocol_slug ? protocolBySlug(r.assigned_protocol_slug) : null
                    const clientName = clientNameById.get(r.client_id) ?? r.client_id.slice(0, 8)
                    return (
                      <tr key={r.id}>
                        <td className="px-4 py-2 text-[11px] text-[#666D7A] font-mono">
                          {new Date(r.shown_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2 text-[12px]">
                          <Link href={`/dashboard/clients/${r.client_id}/recovery`} className="text-blue-500 hover:underline">{clientName}</Link>
                        </td>
                        <td className="px-4 py-2 text-[11px] font-mono text-[#141821]">{r.rrs_playbook_id}</td>
                        <td className="px-4 py-2 text-[11px]">
                          {r.action_taken === 'assigned' && <span className="text-green-700 font-semibold">assigned</span>}
                          {r.action_taken === 'dismissed' && <span className="text-amber-700 font-semibold">dismissed</span>}
                          {r.action_taken === 'sbst_removed' && <span className="text-red-700 font-semibold">sbst removed</span>}
                          {!r.action_taken && <span className="text-[#98A0AD]">no action</span>}
                        </td>
                        <td className="px-4 py-2 text-[11px] text-[#666D7A]">
                          {assignedProtocol?.name ?? (r.assigned_protocol_slug ?? '-')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'amber' | 'blue' }) {
  const colour =
    accent === 'green' ? 'text-green-700' :
    accent === 'amber' ? 'text-amber-700' :
    accent === 'blue' ? 'text-[#1B6DFC]' :
    'text-[#141821]'
  return (
    <div className="rounded-xl border border-[#E8EAEE] bg-white px-4 py-3">
      <p className="text-[10px] font-medium text-[#666D7A] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colour}`}>{value}</p>
    </div>
  )
}

function TrendSparkline({ days, data }: { days: string[]; data: Record<string, { shown: number; assigned: number }> }) {
  const max = Math.max(...days.map(d => Math.max(data[d].shown, data[d].assigned)), 1)
  const width = 100
  const height = 40
  const stepX = width / Math.max(days.length - 1, 1)

  const shownPoints = days.map((d, i) => `${(i * stepX).toFixed(2)},${(height - (data[d].shown / max) * height).toFixed(2)}`).join(' ')
  const assignedPoints = days.map((d, i) => `${(i * stepX).toFixed(2)},${(height - (data[d].assigned / max) * height).toFixed(2)}`).join(' ')

  const totalShownWindow = days.reduce((sum, d) => sum + data[d].shown, 0)
  const totalAssignedWindow = days.reduce((sum, d) => sum + data[d].assigned, 0)
  const windowRate = totalShownWindow > 0 ? (totalAssignedWindow / totalShownWindow) * 100 : 0

  // 7d vs prior-7d comparison for the trend arrow
  const last7 = days.slice(-7)
  const prior7 = days.slice(-14, -7)
  const last7Shown = last7.reduce((s, d) => s + data[d].shown, 0)
  const last7Assigned = last7.reduce((s, d) => s + data[d].assigned, 0)
  const prior7Shown = prior7.reduce((s, d) => s + data[d].shown, 0)
  const prior7Assigned = prior7.reduce((s, d) => s + data[d].assigned, 0)
  const last7Rate = last7Shown > 0 ? (last7Assigned / last7Shown) * 100 : null
  const prior7Rate = prior7Shown > 0 ? (prior7Assigned / prior7Shown) * 100 : null
  const trendDelta = last7Rate !== null && prior7Rate !== null ? last7Rate - prior7Rate : null

  return (
    <div className="flex items-center gap-6">
      <div className="flex-1">
        <svg viewBox={`0 0 ${width} ${height + 4}`} className="w-full h-16" preserveAspectRatio="none">
          <polyline points={shownPoints} fill="none" stroke="#E8EAEE" strokeWidth="0.5" />
          <polyline points={assignedPoints} fill="none" stroke="#1B6DFC" strokeWidth="0.6" />
        </svg>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-[#666D7A]">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-0.5 bg-[#E8EAEE]" /> shown</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-0.5 bg-[#1B6DFC]" /> assigned</span>
          <span className="ml-auto font-mono">{days[0]} to {days[days.length - 1]}</span>
        </div>
      </div>
      <div className="w-32 text-right">
        <p className="text-[10px] font-medium text-[#666D7A]">30d acceptance</p>
        <p className="text-2xl font-bold text-[#1B6DFC]">{windowRate.toFixed(0)}%</p>
        {trendDelta !== null && (
          <div className="text-[11px] mt-1 inline-flex items-center gap-1 font-mono">
            {trendDelta > 1 && <><TrendingUp size={11} className="text-green-700" /><span className="text-green-700">+{trendDelta.toFixed(0)}pt</span></>}
            {trendDelta < -1 && <><TrendingDown size={11} className="text-red-700" /><span className="text-red-700">{trendDelta.toFixed(0)}pt</span></>}
            {trendDelta >= -1 && trendDelta <= 1 && <><Minus size={11} className="text-[#666D7A]" /><span className="text-[#666D7A]">flat</span></>}
            <span className="text-[#98A0AD] ml-1">vs prior 7d</span>
          </div>
        )}
      </div>
    </div>
  )
}
