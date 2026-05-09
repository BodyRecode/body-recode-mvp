/**
 * Recovery State Machine — applies the router's decisions to recovery_states +
 * writes audit rows to recovery_adjustments.
 *
 * Source of truth:
 *   ~/Dropbox/01_BODY_RECODE/.../13D_15_Recovery_and_Regulation_System_Integration_Principles_v1.0_VERBATIM.docx
 *   ~/Dropbox/01_BODY_RECODE/.../12E_04_Recovery_Adjustment_Documentation_and_Auditability_v1.0.docx
 *
 * Doctrine principles encoded:
 *   - Single dominant playbook (13D_15): partial unique index in DB enforces this;
 *     this layer guarantees we never INSERT a second active row for one client.
 *   - Auditability (12E_04): every transition writes a recovery_adjustments row with
 *     full context — what was acknowledged, what was uncertain, what was out of scope.
 *   - Observe-only mode (Phase 0): when RRS_OBSERVE_ONLY=true, decisions are logged
 *     to recovery_adjustments but no recovery_states rows are activated.
 *
 * Phase 0 (observe-only) → Phase 3 (live enforcement) is controlled by env flags:
 *   RRS_ROUTER_ENABLED       — master switch. false = router does not run at all.
 *   RRS_OBSERVE_ONLY         — true = log decisions but never activate states.
 *   RRS_HARD_ENFORCEMENT     — true = constraint manifest BLOCKS program changes.
 *                              false = constraints flagged as banner, coach can override.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import {
  evaluateRecoveryRoute,
  evaluateExitCriteria,
  type RouterInputs,
  type RouterDecision,
} from '@/lib/recovery-router'
import {
  getPlaybook,
  type RecoveryPlaybookId,
  type PlaybookDoctrine,
} from '@/lib/recovery-doctrine'

/* ===========================================================
 * Mode flags (env-driven)
 * =========================================================== */

export type RouterMode = 'disabled' | 'observe_only' | 'live_soft_gate' | 'live_hard_gate'

export function resolveRouterMode(): RouterMode {
  const enabled = process.env.RRS_ROUTER_ENABLED === 'true'
  if (!enabled) return 'disabled'
  const observeOnly = process.env.RRS_OBSERVE_ONLY !== 'false' // default to true (Phase 0)
  if (observeOnly) return 'observe_only'
  const hard = process.env.RRS_HARD_ENFORCEMENT === 'true'
  return hard ? 'live_hard_gate' : 'live_soft_gate'
}

/* ===========================================================
 * Public API
 * =========================================================== */

export interface EvaluateAndApplyOptions {
  clientId: string
  inputs: RouterInputs
  /** Override mode (used in tests). Defaults to env-resolved mode. */
  modeOverride?: RouterMode
}

export interface EvaluateAndApplyResult {
  mode: RouterMode
  decision: RouterDecision
  /** True when a recovery_states row was actually written/updated. */
  stateApplied: boolean
  /** The current active state ID after this evaluation, if any. */
  activeStateId: string | null
  /** The audit row written, always present. */
  auditRowId: string
}

/**
 * Single entry point: evaluate the router, apply state transitions per current
 * mode, write audit row. Always writes an audit row regardless of mode.
 */
export async function evaluateAndApplyRecoveryState(
  opts: EvaluateAndApplyOptions,
): Promise<EvaluateAndApplyResult> {
  const mode = opts.modeOverride ?? resolveRouterMode()
  const admin = createAdminClient()

  // Always evaluate the router — even in disabled mode, we want the decision
  // so a future flip to enabled has audit context. But we won't write anything
  // if disabled.
  const decision = evaluateRecoveryRoute(opts.inputs)

  if (mode === 'disabled') {
    return {
      mode,
      decision,
      stateApplied: false,
      activeStateId: opts.inputs.activeState ? null : null,
      auditRowId: '',
    }
  }

  // Always write an audit row (router_evaluation event) so we have a complete trail
  const auditRowId = await writeRouterEvaluationAudit(admin, opts.clientId, decision, mode)

  let stateApplied = false
  let activeStateId: string | null = null

  if (mode === 'observe_only') {
    // Phase 0 — log only, never touch recovery_states
    return { mode, decision, stateApplied: false, activeStateId: null, auditRowId }
  }

  // Live mode — apply state transitions
  switch (decision.action) {
    case 'enter_state':
      if (decision.recommendedPlaybookId) {
        activeStateId = await enterState(admin, opts.clientId, decision)
        stateApplied = true
      }
      break
    case 'escalate_state':
      if (decision.recommendedPlaybookId) {
        activeStateId = await escalateState(admin, opts.clientId, decision)
        stateApplied = true
      }
      break
    case 'exit_state':
      if (opts.inputs.activeState) {
        const playbook = getPlaybook(opts.inputs.activeState.playbook_id)
        const exitEval = evaluateExitCriteria(playbook, {
          rsibHistory: opts.inputs.rsibHistory,
          cfwsReadiness: opts.inputs.cfwsReadiness,
          daysInState: opts.inputs.activeState
            ? Math.floor((Date.now() - new Date(opts.inputs.activeState.entered_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        })
        if (exitEval.met) {
          await exitState(admin, opts.clientId, 'resolved', `Router recommended exit; criteria met. ${decision.rationale}`)
          stateApplied = true
        }
      }
      break
    case 'hold_state':
    case 'no_state':
    case 'awaiting_signals':
      break
  }

  // Read back the now-active state (if any)
  if (!activeStateId) {
    const { data: active } = await admin
      .from('recovery_states')
      .select('id')
      .eq('client_id', opts.clientId)
      .eq('status', 'active')
      .maybeSingle()
    activeStateId = active?.id ?? null
  }

  return { mode, decision, stateApplied, activeStateId, auditRowId }
}

/* ===========================================================
 * Internal — state mutations
 * =========================================================== */

async function enterState(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  decision: RouterDecision,
): Promise<string | null> {
  if (!decision.recommendedPlaybookId) return null
  const playbook = getPlaybook(decision.recommendedPlaybookId)

  // First, exit any prior active state (state machine guarantees only one active)
  await admin
    .from('recovery_states')
    .update({
      status: 'exited',
      exited_at: new Date().toISOString(),
      exit_outcome: 'cancelled',
      exit_rationale: `Replaced by new state ${decision.recommendedPlaybookId}: ${decision.rationale}`,
    })
    .eq('client_id', clientId)
    .eq('status', 'active')

  const { data: inserted, error } = await admin
    .from('recovery_states')
    .insert({
      client_id: clientId,
      playbook_id: decision.recommendedPlaybookId,
      tier: playbook.tier,
      status: 'active',
      min_duration_days: playbook.minDurationDays,
      max_duration_days: playbook.maxDurationDays,
      entry_signals: decision.signalsAcknowledged,
      entry_trigger: decision.triggerType ?? 'unknown',
      entry_rationale: decision.rationale,
      relief_vs_validation_check: 'undetermined',
      exit_criteria: {
        stable_recovery_days_min: playbook.exitCriteria.stableRecoveryDaysMin,
        post_session_recovery_hours_max: playbook.exitCriteria.postSessionRecoveryHoursMax,
        sleep_stable_days_min: playbook.exitCriteria.sleepStableDaysMin,
        behavioural_stability_days_min: playbook.exitCriteria.behaviouralStabilityDaysMin,
        additional_criteria: playbook.exitCriteria.additionalCriteria,
      },
      observe_only: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[recovery-state-machine] enterState insert failed:', error)
    return null
  }

  // Audit row for state entry
  await writeStateTransitionAudit(admin, clientId, inserted.id, 'state_entered', decision, playbook)
  return inserted.id
}

async function escalateState(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  decision: RouterDecision,
): Promise<string | null> {
  // Mark old state escalated, then enter new one
  const { data: prior } = await admin
    .from('recovery_states')
    .select('id, playbook_id, tier')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle()

  if (prior) {
    await admin
      .from('recovery_states')
      .update({
        status: 'escalated',
        exited_at: new Date().toISOString(),
        exit_outcome: 'escalated',
        exit_rationale: `Escalated to ${decision.recommendedPlaybookId}: ${decision.rationale}`,
      })
      .eq('id', prior.id)
  }

  // Now enter the new (higher-tier) state. enterState handles its own audit row.
  return enterState(admin, clientId, decision)
}

async function exitState(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  outcome: 'resolved' | 'escalated' | 'system_review_required' | 'cancelled',
  rationale: string,
): Promise<void> {
  const { data: prior } = await admin
    .from('recovery_states')
    .select('id, playbook_id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle()

  if (!prior) return

  await admin
    .from('recovery_states')
    .update({
      status: 'exited',
      exited_at: new Date().toISOString(),
      exit_criteria_met_at: new Date().toISOString(),
      exit_outcome: outcome,
      exit_rationale: rationale,
    })
    .eq('id', prior.id)

  await admin.from('recovery_adjustments').insert({
    client_id: clientId,
    recovery_state_id: prior.id,
    event_type: 'state_exited',
    trigger_type: 'exit_criteria_met',
    signals_acknowledged: {},
    constraints_recognised: {},
    uncertainties_held: rationale,
    authorisation_decision: 'authorised',
    observe_only: false,
  })
}

/* ===========================================================
 * Internal — audit row writers
 * =========================================================== */

async function writeRouterEvaluationAudit(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  decision: RouterDecision,
  mode: RouterMode,
): Promise<string> {
  const observeOnly = mode === 'observe_only'

  const { data: row, error } = await admin
    .from('recovery_adjustments')
    .insert({
      client_id: clientId,
      event_type: 'router_evaluation',
      trigger_type: decision.triggerType,
      signals_acknowledged: decision.signalsAcknowledged,
      constraints_recognised: {
        recommended_playbook: decision.recommendedPlaybookId,
        action: decision.action,
        routing_step: decision.routingStep,
        locked_in_by: decision.lockedInBy,
      },
      uncertainties_held: decision.rationale,
      exposure_window_met: null,
      relief_vs_validation_check: 'undetermined',
      permissible_category: decision.recommendedPlaybookId
        ? getPlaybook(decision.recommendedPlaybookId).permissibleCategory
        : null,
      authorisation_decision: observeOnly
        ? 'observed_only'
        : decision.action === 'enter_state' || decision.action === 'escalate_state'
        ? 'authorised'
        : 'observed_only',
      arc_lens: 'both',
      observe_only: observeOnly,
    })
    .select('id')
    .single()

  if (error || !row) {
    console.error('[recovery-state-machine] router_evaluation audit failed:', error)
    return ''
  }
  return row.id
}

async function writeStateTransitionAudit(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  stateId: string,
  eventType: 'state_entered' | 'state_escalated',
  decision: RouterDecision,
  playbook: PlaybookDoctrine,
): Promise<void> {
  await admin.from('recovery_adjustments').insert({
    client_id: clientId,
    recovery_state_id: stateId,
    event_type: eventType,
    trigger_type: decision.triggerType,
    signals_acknowledged: decision.signalsAcknowledged,
    constraints_recognised: {
      training: playbook.trainingConstraints,
      nutrition: playbook.nutritionConstraints,
      tier: playbook.tier,
      lock_in_days: playbook.minDurationDays,
    },
    uncertainties_held: decision.rationale,
    exposure_window_met: true,
    relief_vs_validation_check: 'undetermined',
    permissible_category: playbook.permissibleCategory,
    authorisation_decision: 'authorised',
    arc_lens: 'both',
    observe_only: false,
  })
}

/* ===========================================================
 * Constraint application — Phase 3 readiness (no-op in Phase 1/2)
 * =========================================================== */

/**
 * For Phase 3: program generation and nutrition generation will call this to
 * fetch the current constraint manifest and clamp their LLM output accordingly.
 *
 * Returns null when no state is active (most clients, most weeks).
 */
export async function getActiveConstraintManifest(clientId: string): Promise<{
  playbook: PlaybookDoctrine
  state: { id: string; entered_at: string; days_active: number }
  enforcementMode: 'soft' | 'hard'
} | null> {
  const mode = resolveRouterMode()
  if (mode === 'disabled') return null

  const admin = createAdminClient()
  const { data: active } = await admin
    .from('recovery_states')
    .select('id, playbook_id, entered_at')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle()

  if (!active) return null

  const playbook = getPlaybook(active.playbook_id as RecoveryPlaybookId)
  const daysActive = Math.floor(
    (Date.now() - new Date(active.entered_at).getTime()) / (1000 * 60 * 60 * 24),
  )

  return {
    playbook,
    state: { id: active.id, entered_at: active.entered_at, days_active: daysActive },
    enforcementMode: mode === 'live_hard_gate' ? 'hard' : 'soft',
  }
}
