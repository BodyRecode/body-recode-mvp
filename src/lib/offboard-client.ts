import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * End a coaching engagement in one operation.
 *
 * Written 2026-08-01, after offboarding Vicki S took six separate hand-written
 * SQL statements and a wrong first attempt. `clients.active = false` looks like
 * the switch and is close to a lie: it does not gate the portal, and eleven of
 * the twelve scheduled jobs that email clients ignore it entirely. A coach who
 * sets it believes contact has stopped and it has not.
 *
 * Everything here is REVOCATION, never deletion. The client's records are
 * retained (see RETENTION_YEARS): the CFFS, intake, baseline, photos, blood
 * panels, plans and the whole message thread stay exactly where they are. What
 * ends is access and contact.
 *
 * WHAT THIS DOES NOT DO: touch their plans. An earlier version deactivated the
 * program, nutrition plan and arc to stop the automated emails, because every
 * client-facing cron keyed off `programs.is_active`. That worked and was still
 * wrong: `is_active` does three jobs at once (marks the current plan for the
 * COACH, feeds the PORTAL, drives the CRON), so switching it off to silence the
 * email also emptied the client's file in the dashboard. Retaining records for
 * five years is pointless if the coach cannot open them.
 *
 * The gate moved to the client. Every client-facing cron now filters on
 * `clients.ended_at is null`, so contact stops without anything being archived,
 * and a former client's profile still shows their whole history exactly as it
 * was on the day it ended.
 *
 * The five things that have to happen:
 *
 *  1. ended_at — the portal guard AND every cron read this. It is the gate.
 *  2. Rotate the token — kills bookmarked URLs, and covers portal pages that
 *     still trust a link.
 *  3. Ban the auth login.
 *  4. Suppress the email address.
 *  5. Record why, when, and by whom, plus the retention date.
 */

/**
 * How long client records are kept after the engagement ends.
 *
 * Kade's instruction: five years. Worth confirming against your obligations
 * rather than taking this number from code. Body Recode holds HEALTH
 * information (diagnoses, medications, blood panels, body photos), which is
 * treated more strictly than ordinary personal information under the Privacy
 * Act, and several Australian jurisdictions use SEVEN years from last service
 * for adult health records. This is a business decision, not a legal opinion:
 * if seven is the right number, change it here and re-derive retain_until.
 */
export const RETENTION_YEARS = 5

export type EndReason =
  | 'client_ended'
  | 'coach_ended'
  | 'non_payment'
  | 'completed'
  | 'medical'
  | 'moved_on'
  | 'unhappy_with_service'
  | 'no_contact'
  | 'other'

export const END_REASONS: { value: EndReason; label: string; hint: string }[] = [
  { value: 'client_ended', label: 'Client ended it', hint: 'They chose to stop. Record what they said in the notes.' },
  { value: 'coach_ended', label: 'I ended it', hint: 'Not a fit, or outside scope.' },
  { value: 'completed', label: 'Completed', hint: 'Reached what they came for and finished well.' },
  { value: 'non_payment', label: 'Non-payment', hint: 'Payment lapsed and was not recovered.' },
  { value: 'medical', label: 'Medical', hint: 'Injury, illness or a clinical reason to stop.' },
  { value: 'moved_on', label: 'Moved on', hint: 'Relocation, life change, no longer practical.' },
  { value: 'unhappy_with_service', label: 'Unhappy with the service', hint: 'Record it honestly. This is the reason worth learning from.' },
  { value: 'no_contact', label: 'Went quiet', hint: 'Stopped responding and did not return.' },
  { value: 'other', label: 'Other', hint: 'Explain in the notes.' },
]

export interface OffboardInput {
  clientId: string
  reason: EndReason
  /** What actually happened, in the coach's words. Worth more than the reason code. */
  notes?: string | null
  /** Coach auth user id, for the record. */
  offboardedBy?: string | null
  /** Their email, so it can be suppressed. Resolved from the client when absent. */
  email?: string | null
  /**
   * Whether to suppress the email address. Defaults to true.
   *
   * Set false for someone who never actually started — signed up, never
   * submitted an intake, never began. Ending the engagement is right (they are
   * not a client and should stop appearing as one), but suppression is
   * system-wide and permanent, and it would also remove them from lead
   * reactivation. A person who never started is closer to a dormant lead than
   * a former client, and the two should not be silenced the same way.
   *
   * `ended_at` is still the gate either way: no client-facing cron will contact
   * them, and the portal guard still refuses them. This only governs whether
   * the address is blacklisted for marketing too.
   */
  suppressEmail?: boolean
}

export interface OffboardResult {
  ok: boolean
  steps: { step: string; done: boolean; detail?: string }[]
  retainUntil: string | null
  error?: string
}

export async function offboardClient(
  admin: SupabaseClient,
  input: OffboardInput,
): Promise<OffboardResult> {
  const { clientId, reason, notes, offboardedBy } = input
  const steps: OffboardResult['steps'] = []
  const now = new Date()
  const retainUntil = new Date(now)
  retainUntil.setFullYear(retainUntil.getFullYear() + RETENTION_YEARS)
  const retainUntilIso = retainUntil.toISOString().slice(0, 10)

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, ended_at')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return { ok: false, steps, retainUntil: null, error: 'Client not found' }
  if (client.ended_at) {
    return { ok: false, steps, retainUntil: null, error: `Already offboarded on ${String(client.ended_at).slice(0, 10)}.` }
  }
  const email = (input.email ?? client.email ?? '').trim()

  // ended_at is the gate: the portal guard and every client-facing cron read
  // it. The rotated token covers anything still holding an old link.
  const { error: clientErr } = await admin
    .from('clients')
    .update({
      active: false,
      ended_at: now.toISOString(),
      end_reason: reason,
      end_notes: notes?.trim() || null,
      offboarded_by: offboardedBy ?? null,
      retain_until: retainUntilIso,
      onboarding_token: crypto.randomUUID(),
    })
    .eq('id', clientId)
  steps.push({ step: 'Access revoked and engagement recorded', done: !clientErr, detail: clientErr?.message })
  if (clientErr) return { ok: false, steps, retainUntil: retainUntilIso, error: clientErr.message }

  // Their plans are deliberately left ACTIVE. Contact is stopped by ended_at
  // above, which every client-facing cron now filters on, so there is no reason
  // to archive the file. The coach keeps a complete profile for the retention
  // period, and reinstating a client is a matter of clearing ended_at rather
  // than reconstructing what they were on.
  steps.push({ step: 'Plans left intact and visible in their profile', done: true })

  // Email suppression, belt and braces on top of the ended_at gate. Skipped for
  // someone who never started, who should stop being counted as a client
  // without also being blacklisted as a lead.
  const suppressEmail = input.suppressEmail !== false
  if (!suppressEmail) {
    steps.push({
      step: 'Email address suppressed',
      done: false,
      detail: 'deliberately skipped — engagement ended, address left reachable for lead contact',
    })
  } else if (email) {
    const { error: supErr } = await admin
      .from('email_suppressions')
      .insert({ email, reason: 'offboarded', source: `offboard: ${reason} on ${now.toISOString().slice(0, 10)}` })
    // A duplicate is a success, not a failure.
    const dup = supErr?.message?.includes('duplicate') || supErr?.code === '23505'
    steps.push({ step: 'Email address suppressed', done: !supErr || !!dup, detail: dup ? 'already suppressed' : supErr?.message })
  } else {
    steps.push({ step: 'Email address suppressed', done: false, detail: 'no email on file' })
  }

  return { ok: true, steps, retainUntil: retainUntilIso }
}

/** Records past their retention date, for the periodic review. */
export async function recordsDueForDeletion(admin: SupabaseClient, asOf: Date = new Date()) {
  const { data } = await admin
    .from('clients')
    .select('id, name, email, ended_at, end_reason, retain_until')
    .not('retain_until', 'is', null)
    .lte('retain_until', asOf.toISOString().slice(0, 10))
    .order('retain_until', { ascending: true })
  return data ?? []
}
