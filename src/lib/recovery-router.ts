/**
 * Recovery Playbook Router — implements 13D_14 deterministic routing logic.
 *
 * Source of truth:
 *   ~/Dropbox/01_BODY_RECODE/.../13D_14_Recovery_Playbook_Selection_and_Routing_v1.0_FULL.docx
 *   ~/Dropbox/01_BODY_RECODE/.../13D_15_Recovery_and_Regulation_System_Integration_Principles_v1.0_VERBATIM.docx
 *
 * Routing decision is pure (no side effects). State activation is a separate
 * concern handled by recovery-state-machine.ts.
 *
 * Doctrine principles encoded:
 *   - Trigger ≠ Authorisation (12E_02): the router DETECTS, it does not ACTIVATE.
 *   - Single dominant playbook (13D_15): only one playbook can govern at a time.
 *   - Lock-in durations (13D_14): if a state is already active, no switch within
 *     its minimum duration unless escalation tier rule fires.
 *   - Conservative default (13D_14 step 5): unclear → use conservative acute handling.
 *   - Observe-only mode (Phase 0): the router runs the same logic but the caller
 *     decides whether to actually activate a state or just log the would-have-been.
 */

import {
  getPlaybook,
  PLAYBOOK_PRIORITY_ORDER,
  type RecoveryPlaybookId,
  type PlaybookDoctrine,
} from '@/lib/recovery-doctrine'
import type { Signal } from '@/lib/readiness-monitor'

/* ===========================================================
 * Inputs
 * =========================================================== */

/**
 * Latest two RSIB rows for a client, ordered most-recent first. The router
 * needs at least the latest week to evaluate; two weeks enables chronic detection.
 */
export interface RsibRow {
  week_number: number
  recovery_status: 1 | 2 | 3 | 4 | 5
  session_repeatability: 'easier' | 'same' | 'harder'
  sleep_consistency: 'consistent' | 'inconsistent' | 'severely_inconsistent'
  submitted_at: string
}

/**
 * CFWS Exposure Readiness signals — already produced by the existing CFWS pipeline.
 */
export interface CfwsReadinessSnapshot {
  capacity: Signal
  schedule: Signal
  regulation: Signal
  behaviour: Signal
  /** ISO timestamp of the CFWS row this snapshot came from. */
  generated_at: string
}

/**
 * Currently active state, if any. The router uses this to enforce lock-in durations.
 */
export interface ActiveStateSnapshot {
  playbook_id: RecoveryPlaybookId
  entered_at: string
  min_duration_days: number
  max_duration_days: number
  tier: number
}

/**
 * Free-form context flags from coach or other systems. Used for context-specific
 * playbooks (post-diet, post-competition, confirmed burnout).
 */
export type ContextFlag =
  | 'post_diet_completion'
  | 'post_competition_completion'
  | 'physique_peak_completion'
  | 'confirmed_burnout'
  | 'post_ns_overload_extended'

export interface RouterInputs {
  /** Latest RSIB rows, most recent first. Empty array if client has no RSIB history yet. */
  rsibHistory: readonly RsibRow[]
  /** Latest CFWS Exposure Readiness snapshot. null if none yet. */
  cfwsReadiness: CfwsReadinessSnapshot | null
  /** Currently active recovery state, if one exists. */
  activeState: ActiveStateSnapshot | null
  /** Coach- or system-applied context flags. */
  contextFlags: readonly ContextFlag[]
  /** Reference time (defaults to now) — useful for testing and replay. */
  evaluatedAt?: Date
}

/* ===========================================================
 * Outputs
 * =========================================================== */

/**
 * The routing decision. ALWAYS include enough rationale that the audit log
 * (12E_04) can reconstruct why this decision was made.
 */
export interface RouterDecision {
  /**
   * What action the router recommends. The state machine decides whether to
   * apply it (live) or just log it (observe-only).
   */
  action:
    | 'no_state'              // No playbook applies; clear or hold no state
    | 'enter_state'           // Activate a new state
    | 'hold_state'            // Active state still valid; no change
    | 'escalate_state'        // Active state should escalate per 13D_15
    | 'exit_state'            // Active state's exit criteria appear met
    | 'awaiting_signals'      // Insufficient inputs (e.g. no RSIB yet)
  recommendedPlaybookId: RecoveryPlaybookId | null
  /** 13D_14 routing step that fired (1=regulation, 2=chronic, 3=acute, 4=context, 5=default). */
  routingStep: 1 | 2 | 3 | 4 | 5 | null
  /** Which trigger pattern matched. Stored in audit log. */
  triggerType: string | null
  /** Free-form rationale capturing what was known and what was uncertain. */
  rationale: string
  /** Snapshot of the inputs that drove the decision (for audit log). */
  signalsAcknowledged: {
    rsib_recovery_score?: number
    rsib_recovery_score_two_week_pattern?: 'low_two_weeks' | 'declining' | 'stable' | 'improving' | null
    rsib_session_repeatability?: 'easier' | 'same' | 'harder'
    rsib_session_repeatability_two_week_pattern?: 'harder_two_weeks' | 'mixed' | 'stable' | null
    rsib_sleep_consistency?: 'consistent' | 'inconsistent' | 'severely_inconsistent'
    cfws_capacity?: Signal
    cfws_schedule?: Signal
    cfws_regulation?: Signal
    cfws_behaviour?: Signal
    context_flags?: readonly ContextFlag[]
    active_playbook?: RecoveryPlaybookId | null
    days_in_active_state?: number | null
  }
  /** Indicates lock-in prevented a switch (audit-relevant). */
  lockedInBy?: {
    playbook_id: RecoveryPlaybookId
    days_remaining: number
  }
}

/* ===========================================================
 * Internal helpers
 * =========================================================== */

function daysBetween(from: string | Date, to: Date): number {
  const fromDate = typeof from === 'string' ? new Date(from) : from
  const ms = to.getTime() - fromDate.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function summariseRsibPattern(history: readonly RsibRow[]): {
  recoveryTwoWeekPattern: 'low_two_weeks' | 'declining' | 'stable' | 'improving' | null
  repeatabilityTwoWeekPattern: 'harder_two_weeks' | 'mixed' | 'stable' | null
} {
  if (history.length < 2) {
    return { recoveryTwoWeekPattern: null, repeatabilityTwoWeekPattern: null }
  }
  const [latest, prior] = history

  // Recovery score pattern
  let recovery: 'low_two_weeks' | 'declining' | 'stable' | 'improving' | null = null
  if (latest.recovery_status <= 2 && prior.recovery_status <= 2) recovery = 'low_two_weeks'
  else if (latest.recovery_status < prior.recovery_status) recovery = 'declining'
  else if (latest.recovery_status > prior.recovery_status) recovery = 'improving'
  else recovery = 'stable'

  // Repeatability pattern
  let repeatability: 'harder_two_weeks' | 'mixed' | 'stable' | null = null
  if (latest.session_repeatability === 'harder' && prior.session_repeatability === 'harder') {
    repeatability = 'harder_two_weeks'
  } else if (
    (latest.session_repeatability === 'harder' && prior.session_repeatability !== 'harder') ||
    (latest.session_repeatability !== 'harder' && prior.session_repeatability === 'harder')
  ) {
    repeatability = 'mixed'
  } else {
    repeatability = 'stable'
  }

  return { recoveryTwoWeekPattern: recovery, repeatabilityTwoWeekPattern: repeatability }
}

function cfwsRedOrAmber(signal: Signal, level: 'Amber' | 'Red'): boolean {
  if (!signal) return false
  if (level === 'Red') return signal === 'Red'
  return signal === 'Red' || signal === 'Amber'
}

/* ===========================================================
 * Step evaluators — one per 13D_14 routing step
 * =========================================================== */

interface StepResult {
  matched: boolean
  playbookId: RecoveryPlaybookId | null
  trigger: string
  rationale: string
}

/**
 * Step 1 — Regulation check (13D_14).
 * If sleep disruption >3 nights OR emotional volatility OR behavioural inconsistency
 * OR training avoidance/compulsion → route to Regulation-Dominant Playbook.
 *
 * We split severe vs moderate sleep here:
 *   Severe (severely_inconsistent OR CFWS regulation=Red) → ns_overload (T1)
 *   Moderate (inconsistent or CFWS regulation/capacity=Amber) → sleep_disruption (T3)
 */
function step1RegulationCheck(inputs: RouterInputs): StepResult {
  const latestRsib = inputs.rsibHistory[0]
  const cfws = inputs.cfwsReadiness

  // NS Overload (T1) — severe sleep + regulation/behaviour Red
  const severelySleep = latestRsib?.sleep_consistency === 'severely_inconsistent'
  const regulationRed = cfws ? cfws.regulation === 'Red' : false
  const behaviourRed = cfws ? cfws.behaviour === 'Red' : false

  if (severelySleep && (regulationRed || behaviourRed)) {
    return {
      matched: true,
      playbookId: 'ns_overload',
      trigger: 'severe_sleep_inconsistency_with_regulation_or_behaviour_red',
      rationale: `RSIB sleep_consistency=severely_inconsistent + CFWS regulation=${cfws?.regulation ?? 'Unknown'} / behaviour=${cfws?.behaviour ?? 'Unknown'} indicates nervous system overload.`,
    }
  }
  if (regulationRed && behaviourRed) {
    return {
      matched: true,
      playbookId: 'ns_overload',
      trigger: 'cfws_regulation_red_and_behaviour_red',
      rationale: `CFWS regulation=Red + behaviour=Red indicates nervous system overload regardless of RSIB sleep value.`,
    }
  }

  // Sleep Disruption (T3) — moderate sleep instability
  const sleepInconsistent = latestRsib?.sleep_consistency === 'inconsistent'
  const regulationAmber = cfws ? cfws.regulation === 'Amber' : false
  const capacityAmber = cfws ? cfws.capacity === 'Amber' : false

  if (severelySleep && !regulationRed && !behaviourRed) {
    // Severe sleep alone routes to sleep_disruption first per 13D_14 step 1 graduated logic
    return {
      matched: true,
      playbookId: 'sleep_disruption',
      trigger: 'rsib_sleep_severely_inconsistent_no_full_overload',
      rationale: 'RSIB sleep_consistency=severely_inconsistent without full regulation collapse routes to sleep disruption playbook for early stabilisation.',
    }
  }
  if (sleepInconsistent && (regulationAmber || capacityAmber)) {
    return {
      matched: true,
      playbookId: 'sleep_disruption',
      trigger: 'rsib_sleep_inconsistent_plus_cfws_amber',
      rationale: `RSIB sleep_consistency=inconsistent + CFWS regulation=${cfws?.regulation ?? 'Unknown'} / capacity=${cfws?.capacity ?? 'Unknown'} = Amber.`,
    }
  }

  return { matched: false, playbookId: null, trigger: '', rationale: '' }
}

/**
 * Step 2 — Chronic check (13D_14).
 * If recovery score ≤2 for ≥2 weeks OR repeatability declining ≥2 weeks → chronic_recovery_debt.
 */
function step2ChronicCheck(inputs: RouterInputs): StepResult {
  const { recoveryTwoWeekPattern, repeatabilityTwoWeekPattern } = summariseRsibPattern(inputs.rsibHistory)

  if (recoveryTwoWeekPattern === 'low_two_weeks') {
    return {
      matched: true,
      playbookId: 'chronic_recovery_debt',
      trigger: 'rsib_recovery_score_le_2_two_weeks',
      rationale: 'RSIB recovery_status ≤2 for two consecutive weeks indicates chronic recovery debt accumulation.',
    }
  }

  if (repeatabilityTwoWeekPattern === 'harder_two_weeks') {
    return {
      matched: true,
      playbookId: 'chronic_recovery_debt',
      trigger: 'rsib_session_repeatability_harder_two_weeks',
      rationale: 'RSIB session_repeatability=harder for two consecutive weeks indicates accumulating fatigue.',
    }
  }

  // CFWS capacity Red is a strong chronic signal even without two RSIB weeks
  // (Note: low_two_weeks already returned above; only 'declining' remains here.)
  const cfwsCapacityRed = inputs.cfwsReadiness?.capacity === 'Red'
  if (cfwsCapacityRed && recoveryTwoWeekPattern === 'declining') {
    return {
      matched: true,
      playbookId: 'chronic_recovery_debt',
      trigger: 'cfws_capacity_red_with_declining_recovery',
      rationale: 'CFWS capacity=Red combined with declining RSIB recovery indicates chronic capacity erosion.',
    }
  }

  return { matched: false, playbookId: null, trigger: '', rationale: '' }
}

/**
 * Step 3 — Acute check (13D_14).
 * Onset ≤7 days AND linked to load increase AND no instability → acute_fatigue.
 *
 * In the absence of explicit load-increase data, we use:
 *   - Latest RSIB recovery_status ≤2 OR session_repeatability=harder
 *   - CFWS capacity=Amber/Red
 * AND step 1 + step 2 did not match (i.e. no chronic / regulation pattern).
 */
function step3AcuteCheck(inputs: RouterInputs): StepResult {
  const latest = inputs.rsibHistory[0]
  if (!latest) return { matched: false, playbookId: null, trigger: '', rationale: '' }

  const recoveryLow = latest.recovery_status <= 2
  const sessionsHarder = latest.session_repeatability === 'harder'
  const cfwsCapacityFlagged = inputs.cfwsReadiness ? cfwsRedOrAmber(inputs.cfwsReadiness.capacity, 'Amber') : false

  // Overreaching vs acute: RSIB still in 'easier' or 'same' but capacity Amber → overreaching
  // RSIB harder + capacity Amber but only one week → acute fatigue
  if (sessionsHarder && cfwsCapacityFlagged) {
    return {
      matched: true,
      playbookId: 'acute_fatigue',
      trigger: 'rsib_harder_one_week_plus_cfws_capacity_flagged',
      rationale: 'Single-week RSIB session_repeatability=harder + CFWS capacity Amber/Red indicates acute fatigue without chronic accumulation.',
    }
  }

  if (recoveryLow && cfwsCapacityFlagged) {
    return {
      matched: true,
      playbookId: 'acute_fatigue',
      trigger: 'rsib_recovery_le_2_one_week_plus_cfws_capacity_flagged',
      rationale: 'Single-week RSIB recovery_status ≤2 + CFWS capacity Amber/Red indicates acute fatigue.',
    }
  }

  // Lighter pattern: capacity Amber alone with stable RSIB → overreaching (productive)
  if (cfwsCapacityFlagged && !recoveryLow && !sessionsHarder) {
    return {
      matched: true,
      playbookId: 'overreaching_vs_under_recovery',
      trigger: 'cfws_capacity_amber_with_stable_rsib',
      rationale: 'CFWS capacity Amber with stable RSIB indicates productive overreaching; minor temper applied.',
    }
  }

  return { matched: false, playbookId: null, trigger: '', rationale: '' }
}

/**
 * Step 4 — Context check (13D_14).
 * Linked to diet / competition / lifestyle disruption → context-specific playbook.
 */
function step4ContextCheck(inputs: RouterInputs): StepResult {
  const flags = inputs.contextFlags

  if (flags.includes('confirmed_burnout') || flags.includes('post_ns_overload_extended')) {
    return {
      matched: true,
      playbookId: 'burnout_return',
      trigger: 'context_flag_burnout',
      rationale: 'Coach-applied burnout context flag routes to burnout_return phased recovery.',
    }
  }
  if (flags.includes('post_competition_completion') || flags.includes('physique_peak_completion')) {
    return {
      matched: true,
      playbookId: 'post_competition',
      trigger: 'context_flag_post_competition',
      rationale: 'Post-competition / physique peak context flag routes to post_competition stabilisation.',
    }
  }
  if (flags.includes('post_diet_completion')) {
    return {
      matched: true,
      playbookId: 'post_diet',
      trigger: 'context_flag_post_diet',
      rationale: 'Post-diet context flag routes to post_diet stabilisation.',
    }
  }

  // Lifestyle stress: CFWS Schedule Amber/Red is the structural signal here
  const cfws = inputs.cfwsReadiness
  if (cfws && cfwsRedOrAmber(cfws.schedule, 'Amber')) {
    const capacityFlagged = cfwsRedOrAmber(cfws.capacity, 'Amber')
    const regulationFlagged = cfwsRedOrAmber(cfws.regulation, 'Amber')
    if (capacityFlagged || regulationFlagged) {
      return {
        matched: true,
        playbookId: 'lifestyle_stress_dominant',
        trigger: 'cfws_schedule_flagged_with_capacity_or_regulation',
        rationale: `CFWS schedule=${cfws.schedule} (lifestyle pressure) + capacity=${cfws.capacity} / regulation=${cfws.regulation} indicates lifestyle stress is the dominant limiter.`,
      }
    }
  }

  return { matched: false, playbookId: null, trigger: '', rationale: '' }
}

/**
 * Step 5 — Conservative default (13D_14).
 * If no clear signal pattern matches but SOMETHING is off (any single Amber, any
 * single low RSIB), default to acute conservative handling. If everything is clean,
 * return no_state.
 */
function step5Default(inputs: RouterInputs): StepResult {
  const latest = inputs.rsibHistory[0]
  const cfws = inputs.cfwsReadiness

  const anyRsibConcern = latest && (
    latest.recovery_status <= 3 ||
    latest.session_repeatability === 'harder' ||
    latest.sleep_consistency !== 'consistent'
  )
  const anyCfwsConcern = cfws && (
    cfwsRedOrAmber(cfws.capacity, 'Amber') ||
    cfwsRedOrAmber(cfws.schedule, 'Amber') ||
    cfwsRedOrAmber(cfws.regulation, 'Amber') ||
    cfwsRedOrAmber(cfws.behaviour, 'Amber')
  )

  if (anyRsibConcern && anyCfwsConcern) {
    return {
      matched: true,
      playbookId: 'acute_fatigue',
      trigger: 'conservative_default_unclear_signal',
      rationale: 'No specific pattern matched but RSIB and CFWS both show concern. Per 13D_14 step 5, default to conservative acute handling.',
    }
  }

  return {
    matched: false,
    playbookId: null,
    trigger: 'no_signal_pattern',
    rationale: 'No signal pattern indicates a recovery state; client appears within normal exposure tolerance.',
  }
}

/* ===========================================================
 * Lock-in evaluator
 * =========================================================== */

/**
 * 13D_14 lock-in rule: if a state is active, do not switch within its minimum
 * duration unless the candidate is at a HIGHER tier (lower tier number per 13D_15).
 */
function evaluateLockIn(
  active: ActiveStateSnapshot,
  candidate: RecoveryPlaybookId,
  evaluatedAt: Date,
): { locked: boolean; daysRemaining: number; canEscalate: boolean } {
  const daysActive = daysBetween(active.entered_at, evaluatedAt)
  const daysRemaining = Math.max(0, active.min_duration_days - daysActive)
  const candidatePlaybook = getPlaybook(candidate)
  const candidateTier = candidatePlaybook.tier

  // Higher priority = lower tier number. Escalation is always permitted.
  const canEscalate = candidateTier < active.tier

  if (daysActive >= active.min_duration_days) {
    return { locked: false, daysRemaining: 0, canEscalate }
  }

  return { locked: !canEscalate, daysRemaining, canEscalate }
}

/* ===========================================================
 * Main entry point
 * =========================================================== */

/**
 * Run the full routing decision. Pure function — no side effects.
 *
 * The state machine layer (recovery-state-machine.ts) decides whether to apply
 * the recommendation as a real state transition or to log it as observe-only.
 */
export function evaluateRecoveryRoute(inputs: RouterInputs): RouterDecision {
  const evaluatedAt = inputs.evaluatedAt ?? new Date()
  const latest = inputs.rsibHistory[0]
  const { recoveryTwoWeekPattern, repeatabilityTwoWeekPattern } = summariseRsibPattern(inputs.rsibHistory)

  const baseSignals: RouterDecision['signalsAcknowledged'] = {
    rsib_recovery_score: latest?.recovery_status,
    rsib_recovery_score_two_week_pattern: recoveryTwoWeekPattern,
    rsib_session_repeatability: latest?.session_repeatability,
    rsib_session_repeatability_two_week_pattern: repeatabilityTwoWeekPattern,
    rsib_sleep_consistency: latest?.sleep_consistency,
    cfws_capacity: inputs.cfwsReadiness?.capacity,
    cfws_schedule: inputs.cfwsReadiness?.schedule,
    cfws_regulation: inputs.cfwsReadiness?.regulation,
    cfws_behaviour: inputs.cfwsReadiness?.behaviour,
    context_flags: inputs.contextFlags,
    active_playbook: inputs.activeState?.playbook_id ?? null,
    days_in_active_state: inputs.activeState
      ? daysBetween(inputs.activeState.entered_at, evaluatedAt)
      : null,
  }

  // No inputs at all → awaiting signals
  if (!latest && !inputs.cfwsReadiness && inputs.contextFlags.length === 0) {
    return {
      action: 'awaiting_signals',
      recommendedPlaybookId: null,
      routingStep: null,
      triggerType: null,
      rationale: 'No RSIB, CFWS readiness, or context flags available yet. Router cannot evaluate.',
      signalsAcknowledged: baseSignals,
    }
  }

  // Run the 5-step decision tree in priority order
  const step1 = step1RegulationCheck(inputs)
  const step2 = step1.matched ? null : step2ChronicCheck(inputs)
  const step3 = step1.matched || step2?.matched ? null : step3AcuteCheck(inputs)
  const step4 = step1.matched || step2?.matched || step3?.matched ? null : step4ContextCheck(inputs)
  const step5 = step1.matched || step2?.matched || step3?.matched || step4?.matched
    ? null
    : step5Default(inputs)

  let matched: StepResult | null = null
  let routingStep: 1 | 2 | 3 | 4 | 5 = 5
  if (step1.matched) { matched = step1; routingStep = 1 }
  else if (step2?.matched) { matched = step2; routingStep = 2 }
  else if (step3?.matched) { matched = step3; routingStep = 3 }
  else if (step4?.matched) { matched = step4; routingStep = 4 }
  else if (step5?.matched) { matched = step5; routingStep = 5 }

  // No state recommended
  if (!matched || !matched.playbookId) {
    if (inputs.activeState) {
      // Active state present + no candidate = consider exit (state machine evaluates exit criteria)
      return {
        action: 'exit_state',
        recommendedPlaybookId: inputs.activeState.playbook_id,
        routingStep: null,
        triggerType: 'no_signals_warrant_continued_state',
        rationale: 'No current signal pattern indicates an active recovery state. State machine should evaluate exit criteria.',
        signalsAcknowledged: baseSignals,
      }
    }
    return {
      action: 'no_state',
      recommendedPlaybookId: null,
      routingStep: 5,
      triggerType: step5?.trigger ?? 'no_signal_pattern',
      rationale: step5?.rationale ?? 'No signal pattern indicates a recovery state.',
      signalsAcknowledged: baseSignals,
    }
  }

  const candidate = matched.playbookId

  // Active state exists — apply lock-in or escalation logic
  if (inputs.activeState) {
    if (inputs.activeState.playbook_id === candidate) {
      return {
        action: 'hold_state',
        recommendedPlaybookId: candidate,
        routingStep,
        triggerType: matched.trigger,
        rationale: `${matched.rationale} Same playbook already active — no change.`,
        signalsAcknowledged: baseSignals,
      }
    }

    const lockIn = evaluateLockIn(inputs.activeState, candidate, evaluatedAt)
    if (lockIn.canEscalate) {
      return {
        action: 'escalate_state',
        recommendedPlaybookId: candidate,
        routingStep,
        triggerType: matched.trigger,
        rationale: `${matched.rationale} Escalating from ${inputs.activeState.playbook_id} (tier ${inputs.activeState.tier}) → ${candidate} (tier ${getPlaybook(candidate).tier}) per 13D_15 hierarchy.`,
        signalsAcknowledged: baseSignals,
      }
    }
    if (lockIn.locked) {
      return {
        action: 'hold_state',
        recommendedPlaybookId: inputs.activeState.playbook_id,
        routingStep,
        triggerType: 'lock_in_active',
        rationale: `Candidate playbook ${candidate} matched but ${inputs.activeState.playbook_id} is locked in for ${lockIn.daysRemaining} more days (per 13D_14). No switch permitted.`,
        signalsAcknowledged: baseSignals,
        lockedInBy: {
          playbook_id: inputs.activeState.playbook_id,
          days_remaining: lockIn.daysRemaining,
        },
      }
    }
    // Lock-in expired and not an escalation: lateral switch permitted
    return {
      action: 'enter_state',
      recommendedPlaybookId: candidate,
      routingStep,
      triggerType: matched.trigger,
      rationale: `${matched.rationale} Prior state lock-in expired; reclassifying.`,
      signalsAcknowledged: baseSignals,
    }
  }

  // No active state — enter the matched playbook
  return {
    action: 'enter_state',
    recommendedPlaybookId: candidate,
    routingStep,
    triggerType: matched.trigger,
    rationale: matched.rationale,
    signalsAcknowledged: baseSignals,
  }
}

/* ===========================================================
 * Exit criteria evaluation
 * =========================================================== */

/**
 * Evaluate whether an active state's exit criteria are mechanically met.
 * Used by the state machine when the router returns 'exit_state'.
 *
 * Per 12D_03 doctrine: relief is not validation. We require sustained markers,
 * not a single good day.
 */
export function evaluateExitCriteria(
  playbook: PlaybookDoctrine,
  inputs: {
    rsibHistory: readonly RsibRow[]
    cfwsReadiness: CfwsReadinessSnapshot | null
    daysInState: number
  },
): { met: boolean; missing: readonly string[] } {
  const missing: string[] = []
  const { stableRecoveryDaysMin, sleepStableDaysMin, behaviouralStabilityDaysMin } = playbook.exitCriteria

  // Days in state must meet minimum lock-in regardless of marker stability
  if (inputs.daysInState < playbook.minDurationDays) {
    missing.push(`Lock-in not yet met (${inputs.daysInState} of ${playbook.minDurationDays} days)`)
  }

  // RSIB-based exit: latest N weeks should show recovery_status ≥3, sessions same/easier
  if (stableRecoveryDaysMin && inputs.rsibHistory.length === 0) {
    missing.push(`No RSIB data to confirm ${stableRecoveryDaysMin} days of stable recovery markers`)
  } else if (stableRecoveryDaysMin) {
    const latest = inputs.rsibHistory[0]
    if (latest.recovery_status < 3) missing.push(`Latest RSIB recovery_status ${latest.recovery_status} < 3 minimum`)
    if (latest.session_repeatability === 'harder') missing.push('Latest RSIB session_repeatability=harder')
  }

  // Sleep-based exit
  if (sleepStableDaysMin) {
    const latest = inputs.rsibHistory[0]
    if (!latest || latest.sleep_consistency !== 'consistent') {
      missing.push(`Latest RSIB sleep_consistency=${latest?.sleep_consistency ?? 'unknown'} (need 'consistent' for ${sleepStableDaysMin} days)`)
    }
  }

  // Behaviour-based exit
  if (behaviouralStabilityDaysMin) {
    const cfws = inputs.cfwsReadiness
    if (!cfws || cfws.behaviour === 'Red') {
      missing.push(`CFWS behaviour=${cfws?.behaviour ?? 'Unknown'} (need ≥Amber stability for ${behaviouralStabilityDaysMin} days)`)
    }
  }

  return { met: missing.length === 0, missing }
}

/* ===========================================================
 * Re-export priority order for tests / coach surface
 * =========================================================== */

export { PLAYBOOK_PRIORITY_ORDER }
