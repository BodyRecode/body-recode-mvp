/**
 * The safety gates, applied to client-facing readings.
 *
 * Added 19 September 2026, extending the enforcement that already covers the
 * nutrition plan and the daily routine. The readings are the surface where the
 * wording actually reaches the client in prose, so a rule broken here is a
 * client being told to do something unsafe in a sentence they will believe.
 *
 * Shaped to drop into the existing retry loop in each reading route, beside
 * the banned-word audit: same loop, same retry, one more reason to fail.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { findGateViolations, type GateViolation } from './safety-gate-enforcement'
import type { TrainingContext } from './electrolyte-safety-gates'

export interface GateContext {
  medications: string | null
  trainingContext: TrainingContext | null
}

/**
 * What the gates need to know about this client: their medicines, and the
 * training and competition answers from their most recent intake.
 *
 * Never throws. A reading must not fail to generate because this lookup had a
 * bad day, so a failure returns an empty context, which switches every gate
 * off rather than on. That is the one place in this work where the safe
 * default is "no check": the alternative is refusing every reading for a
 * client whose row could not be read.
 */
export async function loadGateContext(
  admin: SupabaseClient,
  clientId: string,
): Promise<GateContext> {
  try {
    const [{ data: client }, { data: intake }] = await Promise.all([
      admin.from('clients').select('medications').eq('id', clientId).maybeSingle(),
      admin
        .from('intakes')
        .select('training_context')
        .eq('client_id', clientId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    return {
      medications: (client?.medications as string | null) ?? null,
      trainingContext: (intake?.training_context as TrainingContext | null) ?? null,
    }
  } catch (err) {
    console.error('[reading-safety-check] could not load gate context:', err)
    return { medications: null, trainingContext: null }
  }
}

/**
 * Check every section of a reading at once. Returns the violations found
 * across all of them, deduplicated by code, so the retry instruction names
 * each rule once rather than once per section.
 */
export function findReadingGateViolations(
  fields: Record<string, unknown>,
  ctx: GateContext,
): GateViolation[] {
  const text = Object.values(fields)
    .filter((v): v is string => typeof v === 'string')
    .join('\n')
  const found = findGateViolations({
    text,
    medications: ctx.medications,
    trainingContext: ctx.trainingContext,
  })
  const seen = new Set<string>()
  return found.filter(v => (seen.has(v.code) ? false : (seen.add(v.code), true)))
}

/** The retry instruction appended to the model's next attempt. */
export function readingGateRetryMessage(violations: GateViolation[]): string {
  if (violations.length === 0) return ''
  return (
    'The previous version broke a hard safety rule for this specific client. Rewrite the whole reading, fixing every point:\n' +
    violations.map(v => `- ${v.message}`).join('\n')
  )
}
