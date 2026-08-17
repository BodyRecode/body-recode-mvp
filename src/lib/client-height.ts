/**
 * Height resolution: which of the two heights a reader should use.
 *
 * Height lives in two places, on purpose:
 *
 *   baselines.height_cm  - height as measured at a capture. One row per
 *                          capture, so real height loss over years stays
 *                          visible instead of being overwritten.
 *   clients.height_cm    - the standing system record. Always present once
 *                          known, coach-editable, and crucially it exists for
 *                          clients who have never submitted a baseline. Half
 *                          the active book was in that position on 2026-08-17,
 *                          which is why every energy estimate was NULL.
 *
 * Every consumer (nutrition suggestion, nutrition generation, CFFS) goes
 * through resolveHeightCm() rather than reading either column directly, so one
 * rule governs all of them and the number carries its provenance with it.
 *
 * THE RULE: most recently recorded wins. On a tie, or when neither carries a
 * date, the baseline wins - a measurement taken with a tape beats a figure
 * typed from memory.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type HeightSource = 'baseline' | 'client_record'

export type ResolvedHeight = {
  /** Height in cm, or null when neither source holds one. */
  heightCm: number | null
  source: HeightSource | null
  recordedAt: string | null
  /** Human-readable provenance for prompts and the coach UI. */
  label: string | null
}

/**
 * Postgres numerics arrive from supabase-js as strings ("102.30"). Coerce, and
 * reject anything that is not a plausible adult height rather than letting a
 * unit error (5.9 feet, 175000 mm) reach a BMR equation.
 */
export function toHeightCm(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  if (n < MIN_HEIGHT_CM || n > MAX_HEIGHT_CM) return null
  return n
}

export const MIN_HEIGHT_CM = 120
export const MAX_HEIGHT_CM = 230

function timeOf(value: string | null | undefined): number | null {
  if (!value) return null
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? t : null
}

function formatDate(value: string | null): string {
  if (!value) return 'date unknown'
  return value.slice(0, 10)
}

export function resolveHeightCm(input: {
  clientHeightCm?: unknown
  clientHeightRecordedAt?: string | null
  clientHeightSource?: string | null
  baselineHeightCm?: unknown
  baselineCapturedAt?: string | null
}): ResolvedHeight {
  const fromBaseline = toHeightCm(input.baselineHeightCm)
  const fromClient = toHeightCm(input.clientHeightCm)

  const baseline: ResolvedHeight | null = fromBaseline === null ? null : {
    heightCm: fromBaseline,
    source: 'baseline',
    recordedAt: input.baselineCapturedAt ?? null,
    label: `measured at baseline (${formatDate(input.baselineCapturedAt ?? null)})`,
  }

  const client: ResolvedHeight | null = fromClient === null ? null : {
    heightCm: fromClient,
    source: 'client_record',
    recordedAt: input.clientHeightRecordedAt ?? null,
    label: `client record, ${input.clientHeightSource === 'client' ? 'self-reported' : 'entered by coach'} (${formatDate(input.clientHeightRecordedAt ?? null)})`,
  }

  if (!baseline && !client) {
    return { heightCm: null, source: null, recordedAt: null, label: null }
  }
  if (!client) return baseline as ResolvedHeight
  if (!baseline) return client

  const tBaseline = timeOf(baseline.recordedAt)
  const tClient = timeOf(client.recordedAt)

  // A dated record beats an undated one; otherwise later wins, baseline on a tie.
  if (tClient !== null && tBaseline === null) return client
  if (tBaseline !== null && tClient === null) return baseline
  if (tClient !== null && tBaseline !== null && tClient > tBaseline) return client
  return baseline
}

/**
 * The line every prompt should emit for height. Keeps the "do not guess"
 * instruction identical across the nutrition and CFFS generators, which had
 * drifted into two slightly different wordings.
 */
export function heightPromptLine(resolved: ResolvedHeight): string {
  if (resolved.heightCm === null) {
    return 'Height: NOT RECORDED - an energy estimate is not possible without it. Say so rather than guessing.'
  }
  return `Height: ${resolved.heightCm}cm (${resolved.label})`
}

/**
 * Convenience for callers that don't already hold the client and baseline rows.
 * Routes that fetch both (nutrition, CFFS) should call resolveHeightCm directly
 * with what they already have rather than paying for two more round trips.
 */
export async function fetchResolvedHeight(
  admin: SupabaseClient,
  clientId: string,
): Promise<ResolvedHeight> {
  const [{ data: client }, { data: baseline }] = await Promise.all([
    admin.from('clients').select('height_cm, height_recorded_at, height_source').eq('id', clientId).maybeSingle(),
    admin
      .from('baselines')
      .select('height_cm, captured_at')
      .eq('client_id', clientId)
      .order('captured_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ])

  return resolveHeightCm({
    clientHeightCm: client?.height_cm,
    clientHeightRecordedAt: (client?.height_recorded_at as string | null) ?? null,
    clientHeightSource: (client?.height_source as string | null) ?? null,
    baselineHeightCm: baseline?.height_cm,
    baselineCapturedAt: (baseline?.captured_at as string | null) ?? null,
  })
}
