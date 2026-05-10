/**
 * Recovery ingestion — runs AFTER a weekly check-in has been saved AND the
 * CFWS for that week has been generated. Three sequential steps:
 *
 *   1. Write a recovery_signal_block row from the just-submitted form's RSIB
 *      answers (or update the existing one for that week if a re-submit).
 *   2. Load the latest CFWS readiness snapshot for the client.
 *   3. Invoke the recovery router (in current env mode) with both the RSIB
 *      history and the CFWS snapshot. The state machine writes audit rows
 *      to recovery_adjustments regardless of mode.
 *
 * In Phase 2 the env defaults to RRS_OBSERVE_ONLY=true, so step 3 only writes
 * shadow audit rows. No states activate, no programs are constrained.
 *
 * All steps are wrapped in try/catch so they never fail the parent route.
 */

import type { createAdminClient } from '@/lib/supabase/admin'
import { extractRsibFromResponses, type RsibFormType } from '@/lib/recovery-rsib-extract'
import { evaluateAndApplyRecoveryState } from '@/lib/recovery-state-machine'
import type { RouterInputs, RsibRow, CfwsReadinessSnapshot, ActiveStateSnapshot } from '@/lib/recovery-router'
import type { Signal } from '@/lib/readiness-monitor'
import type { RecoveryPlaybookId } from '@/lib/recovery-doctrine'
import { getPlaybook } from '@/lib/recovery-doctrine'

type Admin = ReturnType<typeof createAdminClient>

/**
 * Step 1 — write the recovery_signal_block row for this week's submission.
 * Uses upsert (client_id + week_number unique) so re-submission of the same
 * week's check-in updates the existing row rather than failing.
 */
export async function writeRecoverySignalBlock(
  admin: Admin,
  args: {
    clientId: string
    weekNumber: number
    formType: RsibFormType
    responses: Record<string, unknown>
    weeklyCheckinId: string | null
  },
): Promise<{ written: boolean; reason?: string }> {
  try {
    const rsib = extractRsibFromResponses(args.formType, args.responses)
    if (!rsib) {
      return { written: false, reason: 'RSIB answers missing or unparseable in responses jsonb' }
    }

    const { error } = await admin
      .from('recovery_signal_block')
      .upsert(
        {
          client_id: args.clientId,
          week_number: args.weekNumber,
          recovery_status: rsib.recovery_status,
          session_repeatability: rsib.session_repeatability,
          sleep_consistency: rsib.sleep_consistency,
          weekly_checkin_id: args.weeklyCheckinId,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'client_id,week_number' },
      )

    if (error) {
      console.error('[recovery-ingest] writeRecoverySignalBlock failed:', error)
      return { written: false, reason: error.message }
    }
    return { written: true }
  } catch (err) {
    console.error('[recovery-ingest] writeRecoverySignalBlock threw:', err)
    return { written: false, reason: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Step 2 — load the latest CFWS row's exposure readiness signals into a
 * router-friendly snapshot. Returns null if no CFWS exists yet.
 */
async function loadLatestCfwsReadiness(admin: Admin, clientId: string): Promise<CfwsReadinessSnapshot | null> {
  const { data, error } = await admin
    .from('cfws')
    .select('exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, generated_at')
    .eq('client_id', clientId)
    .eq('is_archived', false)
    .order('week_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  return {
    capacity: (data.exposure_readiness_capacity ?? null) as Signal,
    schedule: (data.exposure_readiness_schedule ?? null) as Signal,
    regulation: (data.exposure_readiness_regulation ?? null) as Signal,
    behaviour: (data.exposure_readiness_behaviour ?? null) as Signal,
    generated_at: data.generated_at ?? new Date().toISOString(),
  }
}

/**
 * Load the latest 4 RSIB rows for a client, most recent first. The router only
 * needs 2 to detect chronic patterns, but loading 4 lets exit-criteria
 * evaluation see a few weeks of stability if needed.
 */
async function loadRsibHistory(admin: Admin, clientId: string): Promise<readonly RsibRow[]> {
  const { data } = await admin
    .from('recovery_signal_block')
    .select('week_number, recovery_status, session_repeatability, sleep_consistency, submitted_at')
    .eq('client_id', clientId)
    .order('week_number', { ascending: false })
    .limit(4)

  if (!data) return []
  return data.map(r => ({
    week_number: r.week_number,
    recovery_status: r.recovery_status as RsibRow['recovery_status'],
    session_repeatability: r.session_repeatability as RsibRow['session_repeatability'],
    sleep_consistency: r.sleep_consistency as RsibRow['sleep_consistency'],
    submitted_at: r.submitted_at,
  }))
}

/**
 * Load the currently active recovery state for a client, if any. None will
 * exist while we're in observe-only mode (the state machine is disabled from
 * inserting rows), but this is here for Phase 3 completeness.
 */
async function loadActiveState(admin: Admin, clientId: string): Promise<ActiveStateSnapshot | null> {
  const { data } = await admin
    .from('recovery_states')
    .select('playbook_id, entered_at, min_duration_days, max_duration_days, tier')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle()

  if (!data) return null
  // Validate playbook id is a known one (defensive against DB drift)
  const playbookId = data.playbook_id as RecoveryPlaybookId
  try {
    getPlaybook(playbookId)
  } catch {
    return null
  }

  return {
    playbook_id: playbookId,
    entered_at: data.entered_at,
    min_duration_days: data.min_duration_days,
    max_duration_days: data.max_duration_days,
    tier: data.tier,
  }
}

/**
 * Step 3 — invoke the router and apply (or shadow-log) its decision.
 * Returns the router decision summary for callers that want to surface it.
 */
export async function evaluateRouterAfterCheckin(
  admin: Admin,
  clientId: string,
): Promise<{
  evaluated: boolean
  mode?: string
  action?: string
  recommendedPlaybookId?: string | null
  reason?: string
}> {
  try {
    const [rsibHistory, cfwsReadiness, activeState] = await Promise.all([
      loadRsibHistory(admin, clientId),
      loadLatestCfwsReadiness(admin, clientId),
      loadActiveState(admin, clientId),
    ])

    const inputs: RouterInputs = {
      rsibHistory,
      cfwsReadiness,
      activeState,
      contextFlags: [],
    }

    const result = await evaluateAndApplyRecoveryState({ clientId, inputs })

    return {
      evaluated: true,
      mode: result.mode,
      action: result.decision.action,
      recommendedPlaybookId: result.decision.recommendedPlaybookId,
    }
  } catch (err) {
    console.error('[recovery-ingest] evaluateRouterAfterCheckin threw:', err)
    return { evaluated: false, reason: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Convenience: do steps 1+3 in sequence after a weekly check-in submission.
 * Step 2 (CFWS load) is internal to evaluateRouterAfterCheckin.
 */
export async function ingestRsibAndEvaluateRouter(
  admin: Admin,
  args: {
    clientId: string
    weekNumber: number
    formType: RsibFormType
    responses: Record<string, unknown>
    weeklyCheckinId: string | null
  },
): Promise<void> {
  const writeResult = await writeRecoverySignalBlock(admin, args)
  if (!writeResult.written) {
    console.warn('[recovery-ingest] RSIB not written:', writeResult.reason, '— router not evaluated')
    return
  }
  await evaluateRouterAfterCheckin(admin, args.clientId)
}
