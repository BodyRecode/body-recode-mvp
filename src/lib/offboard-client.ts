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
 * The six things that actually have to happen, in order of what breaks if you
 * forget them:
 *
 *  1. ended_at — the portal guard reads this, so it is what genuinely closes
 *     the door. Everything else is defence in depth.
 *  2. Deactivate the program, nutrition plan and arc — every client-facing cron
 *     keys off `programs.is_active`, so this is what stops the emails. Leaving
 *     it is how a client who has just quit gets a check-in reminder on Friday.
 *  3. Rotate the token — kills bookmarked URLs, and covers the portal pages
 *     that still trust a link.
 *  4. Ban the auth login.
 *  5. Suppress the email address.
 *  6. Record why, when, and by whom, plus the retention date.
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

  // 1 + 3 + 6. ended_at is the gate; the rotated token covers anything holding
  // an old link; the rest is the record.
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

  // 2. The emails. Every client-facing cron keys off an active program.
  const { error: progErr } = await admin.from('programs').update({ is_active: false }).eq('client_id', clientId).eq('is_active', true)
  steps.push({ step: 'Training program deactivated (stops check-in and log-nudge emails)', done: !progErr, detail: progErr?.message })

  const { error: nutErr } = await admin.from('nutrition_plans').update({ is_active: false }).eq('client_id', clientId).eq('is_active', true)
  steps.push({ step: 'Nutrition plan deactivated', done: !nutErr, detail: nutErr?.message })

  const { error: arcErr } = await admin.from('training_plans').update({ status: 'draft' }).eq('client_id', clientId).eq('status', 'active')
  steps.push({ step: 'Macro arc archived', done: !arcErr, detail: arcErr?.message })

  // 5. Email suppression, belt and braces on top of deactivating the plans.
  if (email) {
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
