/**
 * RPE Creep Monitor — Workout Logging Phase C signal.
 *
 * Detects per-exercise RPE drift between what was PRESCRIBED on the program
 * and what was actually LOGGED in the current week of the active block. The
 * most direct "too much" signal in the system — independent of CFWS
 * subjective readiness, which lags physical reality by 1-2 weeks.
 *
 * Thresholds (intentionally conservative — false positives erode trust):
 *
 *   - Per-exercise creep: avg(logged RPE) >= prescribed_rpe + 1.0, with at
 *     least 2 logged sets in the current week (one set is noise).
 *   - Per-exercise SEVERE creep: avg(logged RPE) >= prescribed_rpe + 2.0
 *     OR any single set logged at RPE >= 9.5 (effectively a 10).
 *   - Per-client current-week aggregation:
 *       * 0 creeping exercises          → severity: none
 *       * 1-2 creeping exercises        → severity: advisory (drift)
 *       * 3+ OR any severe              → severity: high   (regression-equivalent)
 *   - Reassessment recommendation fires when severity is high.
 *
 * Folded into the existing readiness-monitor as two new entry kinds:
 *   - DriftCondition { kind: 'rpe_creep_current_week' }
 *   - ReassessmentReason 'rpe_creep_current_week'
 *
 * Data sources: session_completions × session_exercise_completions ×
 * exercise_set_logs. No new tables, no new columns.
 */

import type { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

export interface RpeCreepFinding {
  exerciseName: string
  prescribedRpe: number
  avgLoggedRpe: number
  maxLoggedRpe: number
  setCount: number
  /** avgLoggedRpe - prescribedRpe, rounded to 1dp */
  delta: number
  /** delta >= 2 OR maxLoggedRpe >= 9.5 */
  severe: boolean
}

export interface RpeCreepReport {
  weekNumberInBlock: number | null
  findings: RpeCreepFinding[]
  creepingCount: number
  severeCount: number
  severity: 'none' | 'advisory' | 'high'
  recommendReassessment: boolean
}

const CREEP_DELTA_THRESHOLD = 1.0
const SEVERE_DELTA_THRESHOLD = 2.0
const SEVERE_MAX_RPE_THRESHOLD = 9.5
const MIN_SETS_FOR_SIGNAL = 2

export async function evaluateRpeCreep(
  admin: Admin,
  clientId: string,
  programId: string | null,
  weekNumberInBlock: number | null
): Promise<RpeCreepReport> {
  // No active program or no week context → nothing to evaluate
  if (!programId || !weekNumberInBlock || weekNumberInBlock < 1) {
    return emptyReport(weekNumberInBlock)
  }

  // Pull this week's session completions for the active program
  const { data: completions } = await admin
    .from('session_completions')
    .select('id')
    .eq('client_id', clientId)
    .eq('program_id', programId)
    .eq('week_number_in_block', weekNumberInBlock)

  const completionIds = (completions ?? []).map(c => c.id)
  if (completionIds.length === 0) return emptyReport(weekNumberInBlock)

  // Pull every exercise completion for those sessions
  const { data: exerciseCompletions } = await admin
    .from('session_exercise_completions')
    .select('id, prescribed_exercise_name, prescribed_rpe, substituted, substituted_exercise_name')
    .in('session_completion_id', completionIds)

  if (!exerciseCompletions || exerciseCompletions.length === 0) {
    return emptyReport(weekNumberInBlock)
  }

  // Pull every logged set for those exercise completions
  const exerciseCompletionIds = exerciseCompletions.map(e => e.id)
  const { data: setLogs } = await admin
    .from('exercise_set_logs')
    .select('session_exercise_completion_id, rpe')
    .in('session_exercise_completion_id', exerciseCompletionIds)

  // Group logged RPE per exercise completion (ignore null RPE — only timed
  // exercises like carries should be null per the doctrine).
  const rpesByExercise = new Map<string, number[]>()
  for (const log of setLogs ?? []) {
    if (log.rpe == null) continue
    const ec = log.session_exercise_completion_id
    const list = rpesByExercise.get(ec) ?? []
    list.push(Number(log.rpe))
    rpesByExercise.set(ec, list)
  }

  // Build findings per exercise that has enough signal
  const findings: RpeCreepFinding[] = []
  for (const ec of exerciseCompletions) {
    const rpes = rpesByExercise.get(ec.id) ?? []
    if (rpes.length < MIN_SETS_FOR_SIGNAL) continue
    if (ec.prescribed_rpe == null) continue

    const prescribed = Number(ec.prescribed_rpe)
    const avg = rpes.reduce((a, b) => a + b, 0) / rpes.length
    const max = Math.max(...rpes)
    const delta = avg - prescribed
    const severe = delta >= SEVERE_DELTA_THRESHOLD || max >= SEVERE_MAX_RPE_THRESHOLD

    // Only record exercises that actually exhibit creep
    if (delta < CREEP_DELTA_THRESHOLD && !severe) continue

    findings.push({
      exerciseName: ec.substituted && ec.substituted_exercise_name
        ? `${ec.substituted_exercise_name} (sub for ${ec.prescribed_exercise_name})`
        : ec.prescribed_exercise_name,
      prescribedRpe: prescribed,
      avgLoggedRpe: Math.round(avg * 10) / 10,
      maxLoggedRpe: max,
      setCount: rpes.length,
      delta: Math.round(delta * 10) / 10,
      severe,
    })
  }

  const creepingCount = findings.length
  const severeCount = findings.filter(f => f.severe).length

  let severity: RpeCreepReport['severity'] = 'none'
  if (creepingCount === 0) severity = 'none'
  else if (severeCount > 0 || creepingCount >= 3) severity = 'high'
  else severity = 'advisory'

  const recommendReassessment = severity === 'high'

  // Sort findings most-severe first for surfacing
  findings.sort((a, b) => {
    if (a.severe !== b.severe) return a.severe ? -1 : 1
    return b.delta - a.delta
  })

  return {
    weekNumberInBlock,
    findings,
    creepingCount,
    severeCount,
    severity,
    recommendReassessment,
  }
}

function emptyReport(weekNumberInBlock: number | null): RpeCreepReport {
  return {
    weekNumberInBlock,
    findings: [],
    creepingCount: 0,
    severeCount: 0,
    severity: 'none',
    recommendReassessment: false,
  }
}
