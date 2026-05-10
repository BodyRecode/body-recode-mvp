/**
 * Recovery history loaders for the coach-facing surface.
 *
 * Reads the audit log + state table to surface what the router has been
 * doing for a given client. In observe-only mode (Phase 2 default) this is
 * the only window into router behaviour: the state table will be empty;
 * recovery_adjustments will contain shadow router_evaluation rows.
 */

import type { createAdminClient } from '@/lib/supabase/admin'
import type { RecoveryPlaybookId } from '@/lib/recovery-doctrine'
import type { RsibRow } from '@/lib/recovery-router'

type Admin = ReturnType<typeof createAdminClient>

export interface RouterEvaluationRow {
  id: string
  documented_at: string
  trigger_type: string | null
  signals_acknowledged: Record<string, unknown>
  constraints_recognised: Record<string, unknown>
  uncertainties_held: string | null
  authorisation_decision: string | null
  observe_only: boolean
}

export interface ActiveRecoveryStateRow {
  id: string
  playbook_id: RecoveryPlaybookId
  tier: number
  status: string
  entered_at: string
  min_duration_days: number
  max_duration_days: number
  entry_trigger: string
  entry_rationale: string | null
  exit_criteria: Record<string, unknown>
}

export interface RecoverySnapshot {
  /** Most recent N audit rows (newest first). Empty in observe-only with no router runs yet. */
  recentEvaluations: readonly RouterEvaluationRow[]
  /** Most recent N RSIB submissions (newest first). */
  recentRsib: readonly RsibRow[]
  /** Currently active recovery state, if any. Always null in observe-only mode. */
  activeState: ActiveRecoveryStateRow | null
  /** Total count of router evaluations ever recorded for this client. */
  totalEvaluations: number
  /** Quick read of the latest evaluation's recommendation (for at-a-glance pill). */
  latestRecommendation:
    | {
        playbookId: RecoveryPlaybookId | null
        action: string | null
        observed_only: boolean
        documented_at: string
      }
    | null
}

/**
 * Single read for the per-client coach surface. One round-trip across three
 * tables. Returns a coherent snapshot or empty defaults if nothing exists yet.
 */
export async function loadRecoverySnapshot(
  admin: Admin,
  clientId: string,
  options: { recentLimit?: number } = {},
): Promise<RecoverySnapshot> {
  const limit = options.recentLimit ?? 8

  const [evalRes, rsibRes, stateRes, countRes] = await Promise.all([
    admin
      .from('recovery_adjustments')
      .select('id, documented_at, trigger_type, signals_acknowledged, constraints_recognised, uncertainties_held, authorisation_decision, observe_only')
      .eq('client_id', clientId)
      .eq('event_type', 'router_evaluation')
      .order('documented_at', { ascending: false })
      .limit(limit),
    admin
      .from('recovery_signal_block')
      .select('week_number, recovery_status, session_repeatability, sleep_consistency, submitted_at')
      .eq('client_id', clientId)
      .order('week_number', { ascending: false })
      .limit(limit),
    admin
      .from('recovery_states')
      .select('id, playbook_id, tier, status, entered_at, min_duration_days, max_duration_days, entry_trigger, entry_rationale, exit_criteria')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .maybeSingle(),
    admin
      .from('recovery_adjustments')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('event_type', 'router_evaluation'),
  ])

  const recentEvaluations: RouterEvaluationRow[] = (evalRes.data ?? []).map(r => ({
    id: r.id,
    documented_at: r.documented_at,
    trigger_type: r.trigger_type,
    signals_acknowledged: (r.signals_acknowledged ?? {}) as Record<string, unknown>,
    constraints_recognised: (r.constraints_recognised ?? {}) as Record<string, unknown>,
    uncertainties_held: r.uncertainties_held,
    authorisation_decision: r.authorisation_decision,
    observe_only: r.observe_only,
  }))

  const recentRsib: RsibRow[] = (rsibRes.data ?? []).map(r => ({
    week_number: r.week_number,
    recovery_status: r.recovery_status as RsibRow['recovery_status'],
    session_repeatability: r.session_repeatability as RsibRow['session_repeatability'],
    sleep_consistency: r.sleep_consistency as RsibRow['sleep_consistency'],
    submitted_at: r.submitted_at,
  }))

  const activeState: ActiveRecoveryStateRow | null = stateRes.data
    ? {
        id: stateRes.data.id,
        playbook_id: stateRes.data.playbook_id as RecoveryPlaybookId,
        tier: stateRes.data.tier,
        status: stateRes.data.status,
        entered_at: stateRes.data.entered_at,
        min_duration_days: stateRes.data.min_duration_days,
        max_duration_days: stateRes.data.max_duration_days,
        entry_trigger: stateRes.data.entry_trigger,
        entry_rationale: stateRes.data.entry_rationale,
        exit_criteria: (stateRes.data.exit_criteria ?? {}) as Record<string, unknown>,
      }
    : null

  const latest = recentEvaluations[0]
  const latestRecommendation = latest
    ? {
        playbookId: ((latest.constraints_recognised as Record<string, unknown>)?.recommended_playbook ?? null) as RecoveryPlaybookId | null,
        action: ((latest.constraints_recognised as Record<string, unknown>)?.action ?? null) as string | null,
        observed_only: latest.observe_only,
        documented_at: latest.documented_at,
      }
    : null

  return {
    recentEvaluations,
    recentRsib,
    activeState,
    totalEvaluations: countRes.count ?? 0,
    latestRecommendation,
  }
}
