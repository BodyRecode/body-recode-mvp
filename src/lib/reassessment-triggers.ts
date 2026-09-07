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
 * Close open triggers whose cause has since been dealt with.
 *
 * Until 2026-09-07 `syncReassessmentTriggers` only ever INSERTED. Nothing
 * anywhere retired a trigger when the condition behind it stopped being true,
 * so closure was entirely manual and the queue only ever grew.
 *
 * Razia on 2026-09-07 is the case that surfaced it: her CFFS was regenerated
 * from a 15-week-old read to a same-day one, and the `twelve_week_cap` trigger
 * saying "the active CFFS is 12 weeks old" stayed open. Across four active
 * clients the queue had reached 34, most of it triggers whose cause was long
 * gone. A queue that never empties stops being read.
 *
 * What retires, and why it is safe:
 *   twelve_week_cap  anchored to a specific CFFS. A newer un-archived CFFS
 *                    exists means the read it asked for has happened.
 *   block_end        anchored to program:<id>:week:<n>. That program no longer
 *                    being the active one means the block moved on.
 *   interpretive     anchored to a specific CFWS. That CFWS being archived, or
 *                    a newer week having produced the SAME reason, means this
 *                    row is duplicate work rather than a second signal.
 *
 * Deliberately conservative. It never touches 'actioned' or 'dismissed', never
 * closes a trigger whose anchor is still current, and never closes an
 * interpretive trigger just for being old: only when something newer has
 * superseded it. When in doubt the trigger stays open, because a stale prompt
 * is a smaller failure than a missed one.
 */
async function retireSupersededTriggers(
  admin: SupabaseClient,
  clientId: string,
  ctx: {
    activeCffsId: string | null
    activeProgramId: string | null
    cfwsRows: { id: string; week_number: number | null; is_archived: boolean | null }[]
  }
): Promise<{ retired: number }> {
  const { data: open, error } = await admin
    .from('reassessment_triggers')
    .select('id, reason, anchor, fired_at')
    .eq('client_id', clientId)
    .eq('status', 'open')

  if (error) {
    console.error('[reassessment-triggers] retire lookup failed', error)
    return { retired: 0 }
  }
  if (!open?.length) return { retired: 0 }

  const cfwsById = new Map(ctx.cfwsRows.map(r => [r.id, r]))
  const liveWeeks = ctx.cfwsRows.filter(r => !r.is_archived).map(r => r.week_number ?? -1)
  const newestLiveWeek = liveWeeks.length ? Math.max(...liveWeeks) : null

  const toClose: { id: string; note: string }[] = []

  for (const t of open) {
    const anchor = String(t.anchor ?? '')

    if (t.reason === 'twelve_week_cap') {
      const anchoredCffsId = anchor.startsWith('cffs:') ? anchor.slice(5) : null
      if (anchoredCffsId && ctx.activeCffsId && anchoredCffsId !== ctx.activeCffsId) {
        toClose.push({ id: t.id, note: 'Retired automatically: a newer CFFS has been generated, so the read this trigger asked for has happened.' })
      }
      continue
    }

    if (t.reason === 'block_end') {
      const m = anchor.match(/^program:([^:]+):week:(\d+|x)$/)
      const anchoredProgram = m?.[1] ?? null
      const anchoredWeek = m && m[2] !== 'x' ? Number(m[2]) : null

      if (anchoredProgram && ctx.activeProgramId && anchoredProgram !== ctx.activeProgramId) {
        toClose.push({ id: t.id, note: 'Retired automatically: the client has moved on to a new block, so this block-end prompt no longer applies.' })
        continue
      }

      // The anchor carries the block week, so a block left sitting past its end
      // mints a fresh trigger EVERY week it stays there. Amanda had three for
      // one block on 2026-09-07. Keep only the latest: one row saying the block
      // has ended, whose age tells the coach how overdue it is.
      if (anchoredProgram && anchoredWeek != null) {
        const laterSameBlock = open.some(o => {
          if (o.reason !== 'block_end' || o.id === t.id) return false
          const om = String(o.anchor ?? '').match(/^program:([^:]+):week:(\d+)$/)
          return !!om && om[1] === anchoredProgram && Number(om[2]) > anchoredWeek
        })
        if (laterSameBlock) {
          toClose.push({ id: t.id, note: 'Retired automatically: superseded by a later block-end prompt for the same block. One open row per block, not one per week it sits unresolved.' })
        }
      }
      continue
    }

    // Interpretive, CFWS-anchored.
    if (!anchor.startsWith('cfws:')) continue
    const anchoredId = anchor.slice(5)
    const anchoredRow = cfwsById.get(anchoredId)

    if (anchoredRow?.is_archived) {
      toClose.push({ id: t.id, note: 'Retired automatically: the CFWS this was anchored to has been archived and replaced. Any signal still present will have re-fired against the replacement.' })
      continue
    }

    // Same reason raised again off a later week: the older row is duplicate work.
    const anchoredWeek = anchoredRow?.week_number ?? null
    if (anchoredWeek != null && newestLiveWeek != null && anchoredWeek < newestLiveWeek) {
      const newerSameReason = open.some(o => {
        if (o.reason !== t.reason || o.id === t.id) return false
        const oa = String(o.anchor ?? '')
        if (!oa.startsWith('cfws:')) return false
        const ow = cfwsById.get(oa.slice(5))?.week_number ?? null
        return ow != null && ow > anchoredWeek
      })
      if (newerSameReason) {
        toClose.push({ id: t.id, note: `Retired automatically: the same signal fired again for a later week, so this earlier instance is duplicate work rather than a second signal.` })
      }
    }
  }

  if (!toClose.length) return { retired: 0 }

  const nowIso = new Date().toISOString()
  let retired = 0
  for (const c of toClose) {
    const { error: uErr } = await admin
      .from('reassessment_triggers')
      .update({ status: 'dismissed', resolved_at: nowIso, resolution_note: c.note })
      .eq('id', c.id)
      .eq('status', 'open')
    if (uErr) console.error('[reassessment-triggers] retire failed', c.id, uErr.message)
    else retired++
  }
  return { retired }
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
): Promise<{ created: number; reasons: ReassessmentReason[]; retired: number }> {
  const { data: client } = await admin
    .from('clients')
    .select('id, coaching_started_at, ended_at, frozen_at')
    .eq('id', clientId)
    .maybeSingle()

  // Never raise work for a client who has left or is on hold. Nothing is
  // retired for them either: their open triggers are a record of where they
  // were when they stopped, and clearing that silently would lose it.
  if (!client?.coaching_started_at || client.ended_at || client.frozen_at) {
    return { created: 0, reasons: [], retired: 0 }
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

  // Retire BEFORE the early return below. A client with nothing currently
  // firing is exactly the client most likely to be carrying triggers whose
  // cause is already dealt with, and returning early would skip the clean-up
  // forever.
  const { retired } = await retireSupersededTriggers(admin, clientId, {
    activeCffsId: activeCffs?.id ?? null,
    activeProgramId: activeProgram?.id ?? null,
    cfwsRows: (cfwsRows ?? []).map(r => ({ id: r.id, week_number: r.week_number, is_archived: r.is_archived })),
  })
  if (retired > 0) {
    console.log(`[reassessment-triggers] client=${String(clientId).slice(0, 8)} retired=${retired}`)
  }

  if (!report.reassessmentReasons.length) return { created: 0, reasons: [], retired }

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

  if (!rows.length) return { created: 0, reasons: [], retired }

  // ignoreDuplicates so a repeat call is a no-op rather than resetting status
  // on a trigger a coach has already dealt with.
  const { data: inserted, error } = await admin
    .from('reassessment_triggers')
    .upsert(rows, { onConflict: 'client_id,reason,anchor', ignoreDuplicates: true })
    .select('reason')

  if (error) {
    console.error('[reassessment-triggers] upsert failed', error)
    return { created: 0, reasons: [], retired }
  }

  return {
    created: inserted?.length ?? 0,
    reasons: (inserted ?? []).map(r => r.reason as ReassessmentReason),
    retired,
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
