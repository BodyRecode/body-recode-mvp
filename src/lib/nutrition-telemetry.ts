/**
 * Nutrition validator event telemetry.
 *
 * One row per call to validateNutritionPlan from the generate-nutrition route.
 * Used by the dashboard panel under /dashboard/system-health/nutrition-engine
 * to surface rule fire rates over time and detect doctrine regressions.
 *
 * Fire-and-forget: every error (table missing, column mismatch, network,
 * payload too large) is caught internally and logged once with console.warn.
 * Plan generation MUST NEVER block on telemetry — that's the whole reason
 * this lives in its own module instead of inline in the route.
 *
 * Run sql/2026-05-26_nutrition_validator_events.sql before this starts
 * emitting useful data. Until then, every call no-ops and logs.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type ValidatorEventTier = 'haiku' | 'sonnet'

export type ValidatorEventFinalOutcome =
  | 'passed_first_haiku'
  | 'passed_haiku_retry'
  | 'sonnet_escalation_succeeded'
  | 'sonnet_escalation_failed'
  | 'returned_422_to_coach'

export interface ValidatorEventRow {
  client_id: string | null
  doctrine_version: string
  attempt_tier: ValidatorEventTier
  attempt_index: number | null
  ok: boolean
  issue_codes: string[]
  entry_state: string | null
  protein_anchor_g: number | null
  meal_frequency: number | null
  carb_demand_level: string | null
  has_stimulant: boolean
  has_glp1: boolean
  has_serotonergic: boolean
  transitional_override_active: boolean
  request_id: string
  final_outcome?: ValidatorEventFinalOutcome | null
}

// Module-level guard so we log the "table missing" warning only once per
// process. Without this, every plan generation spams the same warning.
let warnedTableMissing = false

/**
 * Insert a single validator event row. Always resolves; never throws.
 *
 * Intended call site: void emitValidatorEvent(admin, row) — explicit void
 * so callers don't accidentally await. If you DO await, you'll get
 * undefined; the function silently swallows all errors.
 */
export async function emitValidatorEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  row: ValidatorEventRow
): Promise<void> {
  try {
    const { error } = await admin.from('nutrition_validator_events').insert(row)
    if (error) {
      const isMissingTable = /relation .* does not exist|does not exist/i.test(error.message)
      if (isMissingTable) {
        if (!warnedTableMissing) {
          warnedTableMissing = true
          console.warn('[nutrition-telemetry] table nutrition_validator_events does not exist — run sql/2026-05-26_nutrition_validator_events.sql to enable telemetry. Suppressing further warnings for this process.')
        }
        return
      }
      // Other DB errors: log but don't throw. Telemetry failure must not
      // block plan generation.
      console.warn('[nutrition-telemetry] insert failed:', error.message)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[nutrition-telemetry] unexpected:', msg)
  }
}
