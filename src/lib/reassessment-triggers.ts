/**
 * Reassessment trigger persistence.
 *
 * `evaluateReadiness()` computes the Signal Monitoring v1.0 thresholds. It has
 * always been correct and has always been ignorable: the result was rendered on a
 * dashboard and nothing else happened, so escalation depended on a coach looking.
 *
 * This module turns each fired reason into a durable record with a lifecycle, so
 * "nobody saw it" stops being a possible outcome.
 *
 * The deterministic/interpretive split is the governing idea:
 *   deterministic  block_end, twelve_week_cap. Date arithmetic, no judgement.
 *   interpretive   signal-derived. A coach decides whether the signal is real.
 *
 * Only interpretive triggers need a human. Deterministic ones are safe to act on
 * automatically, which is the next phase of this work.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  evaluateReadiness,
  type ReassessmentReason,
  type ReassessmentDepth,
} from '@/lib/readiness-monitor'

export type TriggerClass = 'deterministic' | 'interpretive'
export type TriggerStatus = 'open' | 'actioned' | 'dismissed'

const DETERMINISTIC: ReassessmentReason[] = ['block_end', 'twelve_week_cap']

export function classifyReason(reason: ReassessmentReason): TriggerClass {
  return DETERMINISTIC.includes(reason) ? 'deterministic' : 'interpretive'
}

export interface ReassessmentTriggerRow {
  id: string
  client_id: string
  reason: ReassessmentReason
  trigger_class: TriggerClass
  recommended_depth: ReassessmentDepth
  message: string
  anchor: string
  status: TriggerStatus
  fired_at: string
  resolved_at: string | null
  resolution_note: string | null
  progress_check_id: string | null
  notified_at: string | null
}

/** Days after which an unresolved interpretive trigger is treated as overdue. */
export const OVERDUE_AFTER_DAYS = 7

export function isOverdue(row: Pick<ReassessmentTriggerRow, 'status' | 'fired_at'>, now = new Date()): boolean {
  if (row.status !== 'open') return false
  const ageMs = now.getTime() - new Date(row.fired_at).getTime()
  return ageMs > OVERDUE_AFTER_DAYS * 24 * 60 * 60 * 1000
}

/**
 * Dedupe anchor for a reason.
 *
 * evaluateReadiness runs on every dashboard render, so without a stable anchor
 * per underlying cause a page view would create rows. Signal-derived reasons
 * anchor to the CFWS that produced them; a new CFWS legitimately re-fires them.
 */
function anchorFor(
  reason: ReassessmentReason,
  ids: { cfwsId: string | null; programId: string | null; cffsId: string | null; blockWeek: number | null }
): string | null {
  switch (reason) {
    case 'block_end':
      // Anchored to the block, so a block that ends and is re-read does not re-fire
      // every day it sits at its end week.
      return ids.programId ? `program:${ids.programId}:week:${ids.blockWeek ?? 'x'}` : null
    case 'twelve_week_cap':
      return ids.cffsId ? `cffs:${ids.cffsId}` : null
    default:
      return ids.cfwsId ? `cfws:${ids.cfwsId}` : null
  }
}

/**
 * Recompute readiness for one client and persist any newly fired reasons.
 *
 * Idempotent: the unique constraint on (client_id, reason, anchor) means calling
 * this repeatedly for the same underlying cause is a no-op. Safe to call from a
 * request path and from a cron.
 */
export async function syncReassessmentTriggers(
  admin: SupabaseClient,
  clientId: string
): Promise<{ created: number; reasons: ReassessmentReason[] }> {
  const { data: client } = await admin
    .from('clients')
    .select('id, coaching_started_at, ended_at, frozen_at')
    .eq('id', clientId)
    .maybeSingle()

  // Never raise work for a client who has left or is on hold.
  if (!client?.coaching_started_at || client.ended_at || client.frozen_at) {
    return { created: 0, reasons: [] }
  }

  const [{ data: cfwsRows }, { data: cffsRows }, { data: programs }] = await Promise.all([
    admin
      .from('cfws')
      .select('id, week_number, generated_at, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, reassessment_language_triggered, is_archived')
      .eq('client_id', clientId)
      .order('week_number', { ascending: false }),
    admin
      .from('cffs')
      .select('id, generated_at, reassessment_flagged, body_state_classification, is_archived')
      .eq('client_id', clientId)
      .order('generated_at', { ascending: false })
      .limit(1),
    // Active block is `is_active`, not status='active'. `status` carries the
    // draft/published lifecycle, which is a different axis.
    admin
      .from('programs')
      .select('id, block_name, progression_phase, week_duration, generated_at')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('generated_at', { ascending: false })
      .limit(1),
  ])

  const activeCffs = cffsRows?.[0] ?? null
  const activeProgram = programs?.[0] ?? null

  const report = evaluateReadiness({
    cfwsRows: cfwsRows ?? [],
    activeCffs,
    activeProgram,
    client: { coaching_started_at: client.coaching_started_at },
    rpeCreep: null,
  })

  if (!report.reassessmentReasons.length) return { created: 0, reasons: [] }

  const ids = {
    cfwsId: (cfwsRows ?? []).find(r => !r.is_archived)?.id ?? null,
    programId: activeProgram?.id ?? null,
    cffsId: activeCffs?.id ?? null,
    blockWeek: report.block?.currentWeek ?? null,
  }

  const rows = report.reassessmentReasons
    .map(r => {
      const anchor = anchorFor(r.reason, ids)
      if (!anchor) return null
      return {
        client_id: clientId,
        reason: r.reason,
        trigger_class: classifyReason(r.reason),
        recommended_depth: r.recommendedDepth,
        message: r.message,
        anchor,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (!rows.length) return { created: 0, reasons: [] }

  // ignoreDuplicates so a repeat call is a no-op rather than resetting status
  // on a trigger a coach has already dealt with.
  const { data: inserted, error } = await admin
    .from('reassessment_triggers')
    .upsert(rows, { onConflict: 'client_id,reason,anchor', ignoreDuplicates: true })
    .select('reason')

  if (error) {
    console.error('[reassessment-triggers] upsert failed', error)
    return { created: 0, reasons: [] }
  }

  return {
    created: inserted?.length ?? 0,
    reasons: (inserted ?? []).map(r => r.reason as ReassessmentReason),
  }
}

/** Open triggers for one client, newest first. */
export async function getOpenTriggers(
  admin: SupabaseClient,
  clientId: string
): Promise<ReassessmentTriggerRow[]> {
  const { data } = await admin
    .from('reassessment_triggers')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'open')
    .order('fired_at', { ascending: false })
  return (data ?? []) as ReassessmentTriggerRow[]
}

/** Human-readable label for a reason. Used in the panel and the digest. */
export const REASON_LABEL: Record<ReassessmentReason, string> = {
  cfws_language_triggered: 'Weekly synthesis flagged reassessment',
  multi_notch_drop: 'Green to Red in one week',
  two_or_more_amber_red: 'Two or more signals amber or red',
  sustained_instability: 'Same signal unstable two weeks running',
  block_end: 'Block has reached its end',
  twelve_week_cap: 'Twelve weeks since the last full read',
  rpe_creep_current_week: 'RPE creeping against prescribed load',
}
