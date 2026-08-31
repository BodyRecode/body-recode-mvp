/**
 * Send a client her block-end Progress Check, if she is due one.
 *
 * One implementation, two callers:
 *  - the moment she submits a weekly check-in (the real trigger)
 *  - a weekly cron, as a backstop for anything the event missed
 *
 * The event is what matters. The gate is "her block has finished AND her
 * check-in is in", so the instant that second condition becomes true is the
 * instant it should go - not the following morning, and certainly not the
 * following Monday. Waiting adds nothing except the chance she has moved on.
 */

import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { evaluateProgressCheckReadiness } from '@/lib/progress-check-readiness'
import { blockFinalWeekStartMs } from '@/lib/block-window'
import { buildProgressCheckInviteEmail } from '@/lib/progress-check-invite-email'
import { logClientCommunication } from '@/lib/client-communications'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'

export type DispatchResult =
  | { sent: true; client: string }
  | { sent: false; client: string; why: string }

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function dispatchProgressCheckIfDue(
  admin: SupabaseClient<any, any, any>,
  clientId: string,
  trigger: 'checkin_submitted' | 'cron_backstop',
): Promise<DispatchResult> {
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, ended_at, frozen_at, coaching_started_at, onboarding_token')
    .eq('id', clientId)
    .maybeSingle()

  const name = client?.name ?? 'Unknown'
  if (!client) return { sent: false, client: name, why: 'client not found' }
  if (client.ended_at || client.frozen_at) return { sent: false, client: name, why: 'not active' }

  const { data: program } = await admin
    .from('programs')
    .select('id, block_name, week_duration, generated_at, activated_at')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle()

  const blockFinalWeekStartsAtMs = blockFinalWeekStartMs(program)
  if (!program || blockFinalWeekStartsAtMs == null) {
    return { sent: false, client: name, why: 'no dated active block' }
  }

  // Already raised for this block? The row is the idempotency record, and a
  // new block means a new program_id, so the next milestone fires fresh.
  const { count: existing } = await admin
    .from('progress_checks')
    .select('id', { count: 'exact', head: true })
    .eq('program_id', program.id)
  if (existing && existing > 0) return { sent: false, client: name, why: 'already sent for this block' }

  // Called from the check-in handler, the check-in that just landed IS the
  // qualifying one, so this is true by construction. The cron re-derives it.
  const checkedInThisWindow =
    trigger === 'checkin_submitted' ? true : await hasCheckedInThisWindow(admin, clientId)

  const readiness = evaluateProgressCheckReadiness({
    coachingStartedAt: client.coaching_started_at ?? null,
    blockFinalWeekStartsAtMs,
    checkedInThisWindow,
  })
  if (!readiness.ready) {
    return { sent: false, client: name, why: readiness.blocker ?? 'not ready' }
  }

  if (!client.email) return { sent: false, client: name, why: 'no email on file' }
  if (!process.env.RESEND_API_KEY) return { sent: false, client: name, why: 'email not configured' }

  const { data: row, error: insErr } = await admin
    .from('progress_checks')
    .insert({ client_id: clientId, program_id: program.id })
    .select('token')
    .single()
  if (insErr || !row) {
    console.error('[progress-check dispatch] insert failed', insErr)
    return { sent: false, client: name, why: 'could not create invitation' }
  }

  const checkUrl = `${appUrl()}/progress-check/${row.token}`
  const portalUrl = `${appUrl()}/portal/${client.onboarding_token}`
  const firstName = (client.name ?? '').split(' ')[0] || 'there'
  const { subject, html } = buildProgressCheckInviteEmail({ firstName, portalUrl })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: sendErr } = await resend.emails.send({
    from: fromCoach(),
    to: client.email,
    bcc: COACH_BCC,
    subject,
    html,
  })
  if (sendErr) {
    // The invitation exists and the portal card is live, so this is recoverable
    // rather than lost. Say so rather than swallowing it.
    console.error('[progress-check dispatch] send failed', sendErr)
    return { sent: false, client: name, why: `created but email failed: ${sendErr.message}` }
  }

  await logClientCommunication(admin, {
    clientId,
    kind: 'progress_check_invite',
    subject,
    toAddress: client.email,
    sentBy: null,
    meta: { url: checkUrl, trigger, programId: program.id },
  })

  return { sent: true, client: name }
}

async function hasCheckedInThisWindow(
  admin: SupabaseClient<any, any, any>,
  clientId: string,
): Promise<boolean> {
  const { lastCheckinWindowOpenMs } = await import('@/lib/weekly-checkin-questions')
  const { count } = await admin
    .from('weekly_checkins')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('submitted_at', new Date(lastCheckinWindowOpenMs()).toISOString())
  return (count ?? 0) > 0
}
