/**
 * Implements Signal Monitoring and Reassessment Triggers v1.0 doctrine.
 *
 * Source of truth:
 *   ~/Dropbox/01_BODY_RECODE/.../Performance_Coaching_Framework_Master_Folder_v1/
 *   Signal_Monitoring_and_Reassessment_Triggers_v1.0.md
 *
 * The numeric thresholds and trigger sets in this file map 1:1 to that
 * doctrine. Update both in lockstep.
 */

import { getWeekNumber } from '@/lib/weekly-checkin-questions'

export type Signal = 'Green' | 'Amber' | 'Red' | 'Unknown' | null
export type ReadinessKey = 'capacity' | 'schedule' | 'regulation' | 'behaviour'

const SIGNAL_LEVELS: Record<string, number> = { Green: 0, Amber: 1, Red: 2 }

/* ===========================================================
 * Inputs
 * =========================================================== */

export interface CfwsRow {
  id?: string
  week_number?: number | null
  generated_at?: string | null
  exposure_readiness_capacity: Signal
  exposure_readiness_schedule: Signal
  exposure_readiness_regulation: Signal
  exposure_readiness_behaviour: Signal
  reassessment_language_triggered?: boolean | null
  is_archived?: boolean | null
}

export interface CffsRow {
  id?: string
  generated_at?: string | null
  reassessment_flagged?: boolean | null
  body_state_classification?: string | null
  is_archived?: boolean | null
}

export interface ActiveProgram {
  id?: string
  block_name?: string | null
  progression_phase?: string | null
  week_duration?: number | null
  generated_at?: string | null
}

export interface ClientContext {
  coaching_started_at?: string | null
}

/* ===========================================================
 * Outputs
 * =========================================================== */

export type Severity = 'advisory' | 'high'

export interface DriftCondition {
  key: ReadinessKey
  signal: Signal
  priorSignal: Signal
  kind: 'single_notch_drop' | 'multi_notch_drop' | 'sustained_instability' | 'red_in_latest'
  severity: Severity
  message: string
}

export type ReassessmentReason =
  | 'cfws_language_triggered'
  | 'multi_notch_drop'
  | 'two_or_more_amber_red'
  | 'sustained_instability'
  | 'block_end'
  | 'twelve_week_cap'

export type ReassessmentDepth = 'lightweight' | 'delta' | 'full'

export interface ReassessmentRecommendation {
  reason: ReassessmentReason
  recommendedDepth: ReassessmentDepth
  message: string
}

export interface BlockStatus {
  blockName: string | null
  blockStartWeek: number | null
  weekDuration: number | null
  currentWeek: number | null
  isAtBlockEnd: boolean
  weeksRemaining: number | null
}

export interface ReadinessReport {
  /** Per-condition drift findings derived from §1 + §2 */
  drift: DriftCondition[]
  /** Highest severity in `drift`, or null if none */
  topSeverity: Severity | null
  /** Reassessment triggers fired per §3 */
  reassessmentReasons: ReassessmentRecommendation[]
  /** Whether a CFFS reassessment is recommended at all */
  reassessmentRecommended: boolean
  /** Block-end status per §4 */
  block: BlockStatus | null
  /** Convenience flag for dashboard list rendering */
  status: 'clean' | 'advisory' | 'reassessment' | 'regression'
}

/* ===========================================================
 * Pure helpers
 * =========================================================== */

const KEYS: ReadinessKey[] = ['capacity', 'schedule', 'regulation', 'behaviour']

function getSignal(cfws: CfwsRow, key: ReadinessKey): Signal {
  switch (key) {
    case 'capacity':   return cfws.exposure_readiness_capacity
    case 'schedule':   return cfws.exposure_readiness_schedule
    case 'regulation': return cfws.exposure_readiness_regulation
    case 'behaviour':  return cfws.exposure_readiness_behaviour
  }
}

function levelOf(signal: Signal): number | null {
  if (signal == null || signal === 'Unknown') return null
  return SIGNAL_LEVELS[signal] ?? null
}

function notchDelta(current: Signal, prior: Signal): number | null {
  const c = levelOf(current)
  const p = levelOf(prior)
  if (c == null || p == null) return null
  return c - p
}

function readableKey(key: ReadinessKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/* ===========================================================
 * §1 + §2  Drift detection
 * =========================================================== */

function detectDrift(latest: CfwsRow, prior: CfwsRow | null): DriftCondition[] {
  const conditions: DriftCondition[] = []

  for (const key of KEYS) {
    const signal = getSignal(latest, key)
    const priorSignal = prior ? getSignal(prior, key) : null

    // Active regression: any Red in latest CFWS (§2)
    if (signal === 'Red') {
      conditions.push({
        key, signal, priorSignal,
        kind: 'red_in_latest',
        severity: 'high',
        message: `${readableKey(key)} is Red in the latest CFWS. Active regression state, coach review required.`,
      })
    }

    // Sustained instability: same signal at Amber or Red across two consecutive CFWS (§1)
    // Schedule sustained instability is still surfaced but not a regression trigger (§2)
    if (prior && (signal === 'Amber' || signal === 'Red') && signal === priorSignal) {
      const isRegressionKey = key === 'regulation' || key === 'capacity' || key === 'behaviour'
      conditions.push({
        key, signal, priorSignal,
        kind: 'sustained_instability',
        severity: isRegressionKey ? 'high' : 'advisory',
        message: `${readableKey(key)} has been ${signal} for two consecutive CFWS.${isRegressionKey ? ' Regression trigger.' : ''}`,
      })
    }

    // Drift comparisons need prior signal
    if (!prior) continue
    const delta = notchDelta(signal, priorSignal)
    if (delta == null || delta <= 0) continue

    if (delta >= 2) {
      conditions.push({
        key, signal, priorSignal,
        kind: 'multi_notch_drop',
        severity: 'high',
        message: `${readableKey(key)} dropped two notches: ${priorSignal} to ${signal}. Regression trigger per §19.`,
      })
    } else {
      conditions.push({
        key, signal, priorSignal,
        kind: 'single_notch_drop',
        severity: 'advisory',
        message: `${readableKey(key)} dropped one notch: ${priorSignal} to ${signal}. Advisory.`,
      })
    }
  }

  return conditions
}

/* ===========================================================
 * §3  Reassessment trigger evaluation
 * =========================================================== */

function evaluateReassessment(
  latest: CfwsRow,
  drift: DriftCondition[],
  block: BlockStatus | null,
  activeCffs: CffsRow | null,
  daysSinceCffs: number | null
): ReassessmentRecommendation[] {
  const reasons: ReassessmentRecommendation[] = []

  // CFWS engine itself flagged it
  if (latest.reassessment_language_triggered) {
    reasons.push({
      reason: 'cfws_language_triggered',
      recommendedDepth: 'lightweight',
      message: 'The CFWS engine flagged reassessment language for this week.',
    })
  }

  // Multi-notch drop on any signal
  if (drift.some(d => d.kind === 'multi_notch_drop')) {
    reasons.push({
      reason: 'multi_notch_drop',
      recommendedDepth: 'delta',
      message: 'A readiness signal dropped two notches in one week.',
    })
  }

  // Two or more Amber/Red simultaneously in latest CFWS
  const amberOrRedCount = KEYS.filter(k => {
    const s = getSignal(latest, k)
    return s === 'Amber' || s === 'Red'
  }).length
  if (amberOrRedCount >= 2) {
    reasons.push({
      reason: 'two_or_more_amber_red',
      recommendedDepth: 'delta',
      message: `${amberOrRedCount} readiness signals are at Amber or Red in the latest CFWS.`,
    })
  }

  // Sustained instability
  if (drift.some(d => d.kind === 'sustained_instability' && d.severity === 'high')) {
    reasons.push({
      reason: 'sustained_instability',
      recommendedDepth: 'lightweight',
      message: 'Sustained instability across two consecutive CFWS.',
    })
  }

  // Block end
  if (block?.isAtBlockEnd) {
    reasons.push({
      reason: 'block_end',
      recommendedDepth: 'lightweight',
      message: `Block "${block.blockName}" is at the end of its planned ${block.weekDuration}-week duration.`,
    })
  }

  // 12-week cap (84 days) since active CFFS
  if (activeCffs && daysSinceCffs != null && daysSinceCffs >= 84) {
    reasons.push({
      reason: 'twelve_week_cap',
      recommendedDepth: 'full',
      message: `The active CFFS is ${Math.floor(daysSinceCffs / 7)} weeks old. Annual upper bound reached.`,
    })
  }

  return reasons
}

/* ===========================================================
 * §4  Block end calculation
 * =========================================================== */

function weekNumberAt(coachingStartedAt: string, when: Date): number {
  const start = new Date(coachingStartedAt)
  const diffMs = when.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  return Math.floor(diffDays / 7) + 1
}

function calculateBlockStatus(
  client: ClientContext,
  program: ActiveProgram | null
): BlockStatus | null {
  if (!program || !program.generated_at) return null
  if (!client.coaching_started_at) return null
  const weekDuration = program.week_duration ?? null

  const currentWeek = getWeekNumber(client.coaching_started_at)
  const blockStartWeek = weekNumberAt(client.coaching_started_at, new Date(program.generated_at))

  if (weekDuration == null || blockStartWeek == null || currentWeek == null) {
    return {
      blockName: program.block_name ?? null,
      blockStartWeek: blockStartWeek ?? null,
      weekDuration,
      currentWeek: currentWeek ?? null,
      isAtBlockEnd: false,
      weeksRemaining: null,
    }
  }

  const blockEndWeek = blockStartWeek + weekDuration - 1
  const isAtBlockEnd = currentWeek >= blockEndWeek

  return {
    blockName: program.block_name ?? null,
    blockStartWeek,
    weekDuration,
    currentWeek,
    isAtBlockEnd,
    weeksRemaining: Math.max(0, blockEndWeek - currentWeek),
  }
}

/* ===========================================================
 * Public entry point
 * =========================================================== */

export function evaluateReadiness(input: {
  /** All CFWS for the client, ordered most recent first */
  cfwsRows: CfwsRow[]
  /** Active CFFS for the client */
  activeCffs: CffsRow | null
  /** Active program block, if any */
  activeProgram: ActiveProgram | null
  /** Client context (for week math) */
  client: ClientContext
}): ReadinessReport {
  const cfwsRows = (input.cfwsRows ?? []).filter(r => !r.is_archived)
  const latest = cfwsRows[0] ?? null
  const prior = cfwsRows[1] ?? null

  // No CFWS yet means nothing to monitor
  if (!latest) {
    const block = calculateBlockStatus(input.client, input.activeProgram)
    const reasons: ReassessmentRecommendation[] = []
    if (block?.isAtBlockEnd) {
      reasons.push({
        reason: 'block_end',
        recommendedDepth: 'lightweight',
        message: `Block "${block.blockName}" is at the end of its planned ${block.weekDuration}-week duration.`,
      })
    }
    return {
      drift: [],
      topSeverity: null,
      reassessmentReasons: reasons,
      reassessmentRecommended: reasons.length > 0,
      block,
      status: reasons.length > 0 ? 'reassessment' : 'clean',
    }
  }

  const drift = detectDrift(latest, prior)
  const block = calculateBlockStatus(input.client, input.activeProgram)

  let daysSinceCffs: number | null = null
  if (input.activeCffs?.generated_at) {
    daysSinceCffs = (Date.now() - new Date(input.activeCffs.generated_at).getTime()) / 86_400_000
  }

  const reassessmentReasons = evaluateReassessment(
    latest,
    drift,
    block,
    input.activeCffs ?? null,
    daysSinceCffs
  )

  const topSeverity: Severity | null = drift.some(d => d.severity === 'high')
    ? 'high'
    : drift.length > 0
    ? 'advisory'
    : null

  // Status priority per §8: Active regression > Reassessment recommended > Drift advisory
  let status: ReadinessReport['status'] = 'clean'
  if (topSeverity === 'high') status = 'regression'
  else if (reassessmentReasons.length > 0) status = 'reassessment'
  else if (topSeverity === 'advisory') status = 'advisory'

  return {
    drift,
    topSeverity,
    reassessmentReasons,
    reassessmentRecommended: reassessmentReasons.length > 0,
    block,
    status,
  }
}
