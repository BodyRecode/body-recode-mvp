/**
 * Which clients the prescribing jobs are allowed to touch.
 *
 * 21 September 2026. Six scheduled jobs exist to service the coaching half of
 * the product: a training block ending, a nudge to log a session, a session
 * reminder, the recovery state sweep, the countdown to a coaching start, and
 * the subscription link.
 *
 * None of them belongs to a coach who only licenses the read. Left alone, a
 * pilot coach's client would have been emailed about a training block she has
 * not been given, nudged to log sessions nobody prescribed, and sent a
 * subscription link from a coach who does her billing elsewhere.
 *
 * Worse than useless: it is the system telling her about a product she is not
 * on, in her coach's name, which the coach then has to explain.
 *
 * ONE LIST, used by all six, so a job added later can ask the same question
 * instead of inventing its own answer.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The clients whose coach licenses prescription, or null when every coach in
 * the system does, which is the case while Kade is the only one.
 *
 * Null means "no filter needed" and is a deliberate performance choice: with
 * one coach there is nothing to exclude, and returning every id would make
 * each job carry a pointless list.
 *
 * Never throws. On failure it returns null, which keeps the jobs running
 * exactly as they did before this existed. That is the right direction for
 * this particular check: the cost of a missed exclusion is an email a coach
 * has to explain, and the cost of a thrown error is every reminder in the
 * system stopping at once.
 */
export async function prescriptionClientIds(admin: SupabaseClient): Promise<string[] | null> {
  try {
    const { data: configs } = await admin.from('tenant_config').select('coach_id, product_tier')
    const rows = configs ?? []

    // Coaches who may NOT be sent prescribing work.
    const readOnly = rows.filter(r => r.product_tier === 'interpret').map(r => r.coach_id as string)
    if (readOnly.length === 0) return null

    const { data: excluded } = await admin.from('clients').select('id').in('coach_id', readOnly)
    const excludedIds = new Set((excluded ?? []).map(r => r.id as string))
    if (excludedIds.size === 0) return null

    const { data: all } = await admin.from('clients').select('id')
    return (all ?? []).map(r => r.id as string).filter(id => !excludedIds.has(id))
  } catch {
    return null
  }
}

/** Apply the list to a set of rows keyed by client. */
export function onlyPrescriptionClients<T extends { client_id?: string | null }>(
  rows: T[],
  allowed: string[] | null,
): T[] {
  if (allowed === null) return rows
  const set = new Set(allowed)
  return rows.filter(r => !r.client_id || set.has(r.client_id))
}
