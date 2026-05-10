/**
 * RSIB extraction — turn the raw weekly check-in responses jsonb into the
 * canonical RSIB enum values that the router and recovery_signal_block table use.
 *
 * 13D_13 calls for three signals captured weekly:
 *   - Recovery status (1-5)
 *   - Session repeatability (easier / same / harder)
 *   - Sleep consistency (consistent / inconsistent / severely_inconsistent)
 *
 * Both Form A and Form B already capture these under the IDs:
 *   a_recovery / a_sessions / a_sleep
 *   b_recovery / b_sessions / b_sleep
 *
 * The form options map cleanly to the DB enum values via a tight allowlist.
 * Anything outside the allowlist returns null (so the router treats the row
 * as missing, not as a corrupt signal).
 */

import type { RsibRow } from '@/lib/recovery-router'

export type RsibFormType = 'A' | 'B'

export interface RawRsibAnswers {
  recovery: string | null | undefined
  sessions: string | null | undefined
  sleep: string | null | undefined
}

/**
 * Read the raw RSIB answer strings from a weekly_checkins responses jsonb,
 * keyed by form type. Returns nulls for missing keys (does not throw).
 */
export function readRawRsibAnswers(
  formType: RsibFormType,
  responses: Record<string, unknown> | null | undefined,
): RawRsibAnswers {
  if (!responses || typeof responses !== 'object') {
    return { recovery: null, sessions: null, sleep: null }
  }
  const prefix = formType === 'A' ? 'a' : 'b'
  return {
    recovery: typeof responses[`${prefix}_recovery`] === 'string' ? (responses[`${prefix}_recovery`] as string) : null,
    sessions: typeof responses[`${prefix}_sessions`] === 'string' ? (responses[`${prefix}_sessions`] as string) : null,
    sleep: typeof responses[`${prefix}_sleep`] === 'string' ? (responses[`${prefix}_sleep`] as string) : null,
  }
}

/**
 * Normalise the recovery status answer ("3 — Recovering but fragile") into a
 * 1-5 integer. Returns null if unparseable.
 *
 * The form options always begin with the digit, so we read the first character.
 */
export function normaliseRecoveryStatus(raw: string | null | undefined): RsibRow['recovery_status'] | null {
  if (!raw) return null
  const firstChar = raw.trim().charAt(0)
  const n = Number(firstChar)
  if (!Number.isFinite(n) || n < 1 || n > 5) return null
  return n as RsibRow['recovery_status']
}

/**
 * Normalise session repeatability answer into the enum value.
 *
 * Form options:
 *   "Easier"          → "easier"
 *   "About the same"  → "same"
 *   "Harder"          → "harder"
 */
export function normaliseSessionRepeatability(raw: string | null | undefined): RsibRow['session_repeatability'] | null {
  if (!raw) return null
  const trimmed = raw.trim().toLowerCase()
  if (trimmed === 'easier') return 'easier'
  if (trimmed === 'about the same') return 'same'
  if (trimmed === 'harder') return 'harder'
  return null
}

/**
 * Normalise sleep consistency answer into the enum value.
 *
 * Form options:
 *   "Consistent (within ~1 hour most nights)" → "consistent"
 *   "Inconsistent"                            → "inconsistent"
 *   "Severely inconsistent"                   → "severely_inconsistent"
 */
export function normaliseSleepConsistency(raw: string | null | undefined): RsibRow['sleep_consistency'] | null {
  if (!raw) return null
  const trimmed = raw.trim().toLowerCase()
  if (trimmed.startsWith('consistent')) return 'consistent'
  if (trimmed === 'severely inconsistent') return 'severely_inconsistent'
  if (trimmed === 'inconsistent') return 'inconsistent'
  return null
}

/**
 * Full normalisation pipeline. Returns a partial RsibRow ready to insert into
 * recovery_signal_block, or null if any of the three required signals couldn't
 * be normalised. Per 13D_13 the responses are mandatory — partial RSIB rows
 * are not stored (audit log captures the failure separately if needed).
 */
export function extractRsibFromResponses(
  formType: RsibFormType,
  responses: Record<string, unknown> | null | undefined,
): {
  recovery_status: RsibRow['recovery_status']
  session_repeatability: RsibRow['session_repeatability']
  sleep_consistency: RsibRow['sleep_consistency']
} | null {
  const raw = readRawRsibAnswers(formType, responses)
  const recovery_status = normaliseRecoveryStatus(raw.recovery)
  const session_repeatability = normaliseSessionRepeatability(raw.sessions)
  const sleep_consistency = normaliseSleepConsistency(raw.sleep)

  if (recovery_status === null || session_repeatability === null || sleep_consistency === null) {
    return null
  }

  return { recovery_status, session_repeatability, sleep_consistency }
}
