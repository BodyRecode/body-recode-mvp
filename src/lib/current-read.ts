/**
 * HER CURRENT READ: what every generator and coach tool should be working from.
 *
 * Kade's call, 14 Sep 2026: a published Progress Read becomes her current read.
 * Before this, everything downstream (the weekly synthesis anchor, program and
 * nutrition generation, the suggesters, the co-pilot, medication and blood panel
 * reads) read the live Foundational Read forever, so a Progress Read changed
 * nothing a coach generated next, and the read "re-derived every twelve weeks"
 * was re-derived for nobody.
 *
 * The shape is deliberately the Foundational Read's row, so a call site swaps
 * one query and nothing else changes: the live CFFS row, with the re-derived
 * findings of the newest PUBLISHED Progress Read laid over it when that read is
 * newer. The row keeps the CFFS `id` (programs and other tables hold it as a
 * foreign key) and gains `current_read_source`, `current_read_id` and
 * `current_read_at` so anything that cares can say which read it used.
 *
 * Only published Progress Reads count: a draft the coach has not approved never
 * steers a program. Unpublishing one reverts every consumer to the previous read
 * on the next generation, with nothing to undo.
 *
 * NOT for the Foundational Read document itself (its client reading, publishing,
 * preview, report) or onboarding status: those mean the first read specifically
 * and keep querying `cffs` directly.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/** The read fields a Progress Read re-derives. Everything else on the row is the Foundational Read's own. */
export const REDERIVED_READ_FIELDS = [
  'body_state_classification',
  'resolution_state',
  'client_context_summary',
  'primary_patterns_and_signals',
  'capacity_constraints_and_guardrails',
  'risk_flags_and_watch_items',
  'tensions_and_tradeoffs',
  'explicit_non_directives',
  'closing_interpretive_notes',
  'visual_signal_summary',
  'exposure_readiness_capacity',
  'exposure_readiness_schedule',
  'exposure_readiness_regulation',
  'exposure_readiness_behaviour',
  'rationale_summary',
  'pattern_classification',
  'pattern_confidence',
  'pattern_rationale',
  'pattern_competing_read',
  'pattern_watch_for',
] as const

// Loosely typed on purpose: every call site previously received an untyped
// Supabase row, and each narrows the fields it uses exactly as before.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CurrentRead = Record<string, any> & {
  current_read_source: 'foundational' | 'progress'
  current_read_id: string
  current_read_at: string | null
}

export async function loadCurrentRead(admin: SupabaseClient, clientId: string): Promise<CurrentRead | null> {
  const [{ data: cffs }, { data: pr }] = await Promise.all([
    admin.from('cffs').select('*').eq('client_id', clientId).eq('is_archived', false)
      .order('generated_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('progress_reads').select(PROGRESS_READ_OVERLAY_COLUMNS)
      .eq('client_id', clientId).eq('status', 'published').eq('is_archived', false)
      .order('published_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (!cffs) return null

  return overlayPublishedProgressRead(cffs as Record<string, unknown>, pr)
}

export const PROGRESS_READ_OVERLAY_COLUMNS = 'id, client_id, published_at, generated_at, content, body_state_classification, state_direction, pattern_classification, pattern_confidence, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour'

/**
 * The overlay on its own, for surfaces that already hold the CFFS row (a roster
 * that loads every client at once). `pr` must be the newest PUBLISHED Progress
 * Read for the same client, or null.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function overlayPublishedProgressRead(base: Record<string, unknown>, pr: Record<string, any> | null): CurrentRead {
  const prIsNewer = !!pr && new Date(pr.generated_at).getTime() > new Date(String(base.generated_at)).getTime()
  if (!pr || !prIsNewer) {
    return { ...base, current_read_source: 'foundational', current_read_id: String(base.id), current_read_at: (base.generated_at as string) ?? null }
  }

  const content = (pr.content ?? {}) as Record<string, unknown>
  const overlay: Record<string, unknown> = {}
  for (const f of REDERIVED_READ_FIELDS) if (content[f] !== undefined) overlay[f] = content[f]
  // The stored columns are the enforced values (the state clamp runs before they
  // are written), so they win over the raw content where both exist.
  for (const f of ['body_state_classification', 'pattern_classification', 'pattern_confidence', 'exposure_readiness_capacity', 'exposure_readiness_schedule', 'exposure_readiness_regulation', 'exposure_readiness_behaviour'] as const) {
    if (pr[f] != null) overlay[f] = pr[f]
  }
  return { ...base, ...overlay, current_read_source: 'progress', current_read_id: pr.id, current_read_at: pr.published_at }
}

// The drop-ins return the same loose shape the untyped Supabase query they
// replace returned, so no call site has to change beyond the one line.
/* eslint-disable @typescript-eslint/no-explicit-any */
type LooseResult<T> = { data: T; error: { message: string } | null }

/** Drop-in for `admin.from('cffs')...maybeSingle()`: resolves to `{ data: row }`. */
export async function currentReadRow(admin: SupabaseClient, clientId: string): Promise<LooseResult<any>> {
  return { data: await loadCurrentRead(admin, clientId), error: null }
}

/** Drop-in for `admin.from('cffs')...limit(1)`: resolves to `{ data: [row] }`. */
export async function currentReadRows(admin: SupabaseClient, clientId: string): Promise<LooseResult<any[]>> {
  const row = await loadCurrentRead(admin, clientId)
  return { data: row ? [row] : [], error: null }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
