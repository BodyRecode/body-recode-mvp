/**
 * Recovery Router shadow panel — Phase 2 visibility into the recovery
 * router's behaviour for a single client.
 *
 * In observe-only mode (Phase 2 default) this is the entire window into
 * what the router is doing. recovery_states will be empty; recovery_adjustments
 * will contain the shadow router_evaluation rows.
 *
 * After Phase 3 enforcement turns on, this panel also surfaces the active
 * state (entered_at, days remaining on lock-in, exit criteria progress).
 */

import Link from 'next/link'
import { MONO_FONT } from '@/components/dashboard/ui'
import type { RecoverySnapshot } from '@/lib/recovery-history'
import { getPlaybook, type RecoveryPlaybookId } from '@/lib/recovery-doctrine'
import type { RouterMode } from '@/lib/recovery-state-machine'

function modeLabel(mode: RouterMode): { label: string; colour: string; bg: string } {
  switch (mode) {
    case 'disabled':
      return { label: 'Router disabled', colour: '#6B6B6B', bg: 'rgba(168,162,158,0.06)' }
    case 'observe_only':
      return { label: 'Observe-only (Phase 2 — shadow log)', colour: '#f59e0b', bg: 'rgba(245,158,11,0.10)' }
    case 'live_soft_gate':
      return { label: 'Live — soft gate', colour: '#60a5fa', bg: 'rgba(96,165,250,0.10)' }
    case 'live_hard_gate':
      return { label: 'Live — hard gate', colour: '#1B6DFC', bg: 'rgba(20,184,166,0.12)' }
  }
}

function tierColour(tier: number): string {
  if (tier === 1) return '#ef4444'
  if (tier === 2) return '#f59e0b'
  if (tier <= 4) return '#60a5fa'
  return '#6B6B6B'
}

function actionLabel(action: string | null | undefined): string {
  switch (action) {
    case 'no_state':
      return 'No state — clean week'
    case 'enter_state':
      return 'Would enter state'
    case 'hold_state':
      return 'Would hold state'
    case 'escalate_state':
      return 'Would escalate state'
    case 'exit_state':
      return 'Would exit state'
    case 'awaiting_signals':
      return 'Awaiting signals'
    default:
      return action ?? 'unknown'
  }
}

function rsibPill(value: string | undefined, kind: 'recovery' | 'sessions' | 'sleep'): { label: string; colour: string } {
  if (kind === 'recovery') {
    const n = Number(value)
    if (!Number.isFinite(n)) return { label: '—', colour: '#6B6B6B' }
    if (n <= 2) return { label: `Recovery ${n}`, colour: '#ef4444' }
    if (n === 3) return { label: `Recovery 3`, colour: '#f59e0b' }
    return { label: `Recovery ${n}`, colour: '#1B6DFC' }
  }
  if (kind === 'sessions') {
    if (value === 'harder') return { label: 'Sessions harder', colour: '#ef4444' }
    if (value === 'easier') return { label: 'Sessions easier', colour: '#1B6DFC' }
    return { label: 'Sessions same', colour: '#60a5fa' }
  }
  // sleep
  if (value === 'severely_inconsistent') return { label: 'Sleep severely inconsistent', colour: '#ef4444' }
  if (value === 'inconsistent') return { label: 'Sleep inconsistent', colour: '#f59e0b' }
  return { label: 'Sleep consistent', colour: '#1B6DFC' }
}

export function RecoveryRouterPanel({
  snapshot,
  mode,
}: {
  snapshot: RecoverySnapshot
  mode: RouterMode
}) {
  const modeStyle = modeLabel(mode)
  const latest = snapshot.latestRecommendation
  const latestPlaybook = latest?.playbookId ? getPlaybook(latest.playbookId as RecoveryPlaybookId) : null

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="inline-flex items-center text-[10px] uppercase px-2 py-0.5 rounded-full border whitespace-nowrap"
            style={{
              fontFamily: MONO_FONT,
              letterSpacing: '0.08em',
              background: modeStyle.bg,
              color: modeStyle.colour,
              borderColor: modeStyle.colour + '33',
            }}
          >
            {modeStyle.label}
          </span>
          <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-widest" style={{ fontFamily: MONO_FONT }}>
            Recovery Router
          </span>
        </div>
        <Link
          href="/dashboard/recovery-regulation"
          className="text-[11px] text-[#1B6DFC] hover:underline"
          style={{ fontFamily: MONO_FONT }}
        >
          doctrine →
        </Link>
      </div>

      {/* Latest decision summary */}
      <div className="px-5 py-4 border-b border-[#E5E5E5]">
        {latest ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#999999]" style={{ fontFamily: MONO_FONT }}>
                Latest decision
              </span>
              <span className="text-[10px] text-[#999999]" style={{ fontFamily: MONO_FONT }}>
                {new Date(latest.documented_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] text-[#1A1A1A]">{actionLabel(latest.action)}</span>
              {latestPlaybook && (
                <span
                  className="inline-flex items-center text-[10px] uppercase px-2 py-0.5 rounded-full border whitespace-nowrap"
                  style={{
                    fontFamily: MONO_FONT,
                    letterSpacing: '0.08em',
                    color: tierColour(latestPlaybook.tier),
                    borderColor: tierColour(latestPlaybook.tier) + '55',
                    background: tierColour(latestPlaybook.tier) + '15',
                  }}
                >
                  {latestPlaybook.source} · T{latestPlaybook.tier} · {latestPlaybook.name}
                </span>
              )}
              {latest.observed_only && (
                <span className="text-[10px] text-[#6B6B6B]" style={{ fontFamily: MONO_FONT }}>
                  shadow only
                </span>
              )}
            </div>
            {snapshot.recentEvaluations[0]?.uncertainties_held && (
              <p className="text-[12px] text-[#6B6B6B] mt-2 leading-relaxed">
                {snapshot.recentEvaluations[0].uncertainties_held}
              </p>
            )}
          </>
        ) : (
          <div className="text-[12px] text-[#6B6B6B]">
            {snapshot.recentRsib.length === 0
              ? 'No RSIB rows yet for this client. Router runs after the next weekly check-in submission.'
              : 'No router evaluations recorded yet. Run the router by submitting a weekly check-in (or use the backfill API to evaluate historical weeks).'}
          </div>
        )}
      </div>

      {/* Active state (Phase 3+ — shows in observe-only mode if data accidentally present) */}
      {snapshot.activeState && (
        <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#0e0e0c]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-widest text-[#ef4444]" style={{ fontFamily: MONO_FONT }}>
              Active state
            </span>
          </div>
          <p className="text-[13px] text-[#1A1A1A]">
            {getPlaybook(snapshot.activeState.playbook_id).name} (T{snapshot.activeState.tier})
          </p>
          <p className="text-[11px] text-[#6B6B6B] mt-1" style={{ fontFamily: MONO_FONT }}>
            entered {new Date(snapshot.activeState.entered_at).toLocaleString('en-AU', { dateStyle: 'medium' })} · lock-in {snapshot.activeState.min_duration_days}d · max {snapshot.activeState.max_duration_days}d
          </p>
          <p className="text-[12px] text-[#d6d3d1] mt-2">{snapshot.activeState.entry_rationale}</p>
        </div>
      )}

      {/* Recent RSIB history */}
      {snapshot.recentRsib.length > 0 && (
        <div className="px-5 py-4 border-b border-[#E5E5E5]">
          <div className="text-[10px] uppercase tracking-widest text-[#999999] mb-3" style={{ fontFamily: MONO_FONT }}>
            RSIB history (last {snapshot.recentRsib.length})
          </div>
          <div className="space-y-1.5">
            {snapshot.recentRsib.map(r => {
              const recoveryPill = rsibPill(String(r.recovery_status), 'recovery')
              const sessionsPill = rsibPill(r.session_repeatability, 'sessions')
              const sleepPill = rsibPill(r.sleep_consistency, 'sleep')
              return (
                <div key={r.week_number} className="flex items-center gap-2 flex-wrap text-[11px]" style={{ fontFamily: MONO_FONT }}>
                  <span className="text-[#6B6B6B] w-14 shrink-0">Wk {r.week_number}</span>
                  <span style={{ color: recoveryPill.colour }}>{recoveryPill.label}</span>
                  <span className="text-[#999999]">·</span>
                  <span style={{ color: sessionsPill.colour }}>{sessionsPill.label}</span>
                  <span className="text-[#999999]">·</span>
                  <span style={{ color: sleepPill.colour }}>{sleepPill.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent router evaluations */}
      {snapshot.recentEvaluations.length > 0 && (
        <div className="px-5 py-4">
          <div className="text-[10px] uppercase tracking-widest text-[#999999] mb-3" style={{ fontFamily: MONO_FONT }}>
            Recent router runs ({snapshot.totalEvaluations} total)
          </div>
          <div className="space-y-2">
            {snapshot.recentEvaluations.map(e => {
              const pid = (e.constraints_recognised as Record<string, unknown>)?.recommended_playbook as string | null
              const action = (e.constraints_recognised as Record<string, unknown>)?.action as string | null
              return (
                <div key={e.id} className="text-[11px]" style={{ fontFamily: MONO_FONT }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#999999]">
                      {new Date(e.documented_at).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <span className="text-[#d6d3d1]">{actionLabel(action)}</span>
                    {pid && pid !== 'null' && <span className="text-[#6B6B6B]">→ {pid}</span>}
                    {e.observe_only && <span className="text-[#6B6B6B]">(shadow)</span>}
                  </div>
                  {e.trigger_type && (
                    <div className="text-[10px] text-[#999999] pl-1 truncate max-w-full">
                      trigger: {e.trigger_type}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
