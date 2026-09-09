/**
 * Send a client her block-end Progress Check, if she is due one.
 *
 * One implementation, two callers:
 *  - the moment she submits a weekly check-in (the real trigger)
 *  - a weekly cron, as a backstop for anything the event missed
 *
 * The event is what matters. The gate is "her read is 12 weeks old, or her
 * block has reached its final week, AND her check-in is in", so the instant the
 * last condition becomes true is the instant it should go - not the following
 * morning, and certainly not the following Monday. Waiting adds nothing except
 * the chance she has moved on.
 *
 * REVISED 9 Sep 2026. The gate used to be block-end alone, and this function
 * returned early when a client had no dated block - so a coach who does not
 * write fixed-length blocks got a Progress Check NEVER, silently. A block is
 * Performance Coaching vocabulary; the standard is 12 weeks from her last read,
 * and a block only brings it forward. See REREAD_INTERVAL_DAYS.
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
/**
 * When her CURRENT read was produced, in ms.
 *
 * The later of the newest live CFFS and the newest COMPLETED Progress Check,
 * because either one means somebody looked at her again. Null when she has no
 * read at all, which blocks the re-read: there is nothing to re-read yet.
 *
 * This is the clock the 12-week standard runs on. It is deliberately not
 * coaching start (drifts out of step the moment anyone pauses) and not block
 * start (does not exist for most coaches).
 */
export async function lastReadAtMs(
  admin: SupabaseClient,
  clientId: string,
): Promise<number | null> {
  const [{ data: cffsRow }, { data: pcRow }] = await Promise.all([
    admin
      .from('cffs')
      .select('generated_at')
      .eq('client_id', clientId)
      .eq('is_archived', false)
      .order('generated_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('progress_checks')
      .select('submitted_at')
      .eq('client_id', clientId)
      .eq('status', 'complete')
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ])
  const times = [
    (cffsRow as { generated_at?: string | null } | null)?.generated_at,
    (pcRow as { submitted_at?: string | null } | null)?.submitted_at,
  ]
    .filter((t): t is string => !!t)
    .map(t => new Date(t).getTime())
    .filter(n => Number.isFinite(n))
  return times.length ? Math.max(...times) : null
}

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

  // No longer bails when there is no dated block. Until 2026-09-09 it returned
  // here, so a coach who does not write fixed-length blocks got a Progress Check
  // NEVER - silently, with nothing in any log to say so. The 12-week standard is
  // what paces those clients now. A block, where one exists, only brings it
  // forward. See REREAD_INTERVAL_DAYS in progress-check-readiness.ts.
  const blockFinalWeekStartsAtMs = blockFinalWeekStartMs(program)

  // Idempotency. With a dated block the row against program_id is the record,
  // and a new block means a new program_id so the next milestone fires fresh.
  // WITHOUT a block there is no such key, so fall back to recency: one raised
  // in the last 60 days is either still open or was just answered, and either
  // way a second one is noise. 60 sits comfortably inside the 84-day interval.
  if (program && blockFinalWeekStartsAtMs != null) {
    const { count: existing } = await admin
      .from('progress_checks')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', program.id)
    if (existing && existing > 0) return { sent: false, client: name, why: 'already sent for this block' }
  } else {
    const sinceIso = new Date(Date.now() - 60 * 86_400_000).toISOString()
    const { count: recent } = await admin
      .from('progress_checks')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .gte('created_at', sinceIso)
    if (recent && recent > 0) return { sent: false, client: name, why: 'one raised in the last 60 days' }
  }

  // Called from the check-in handler, the check-in that just landed IS the
  // qualifying one, so this is true by construction. The cron re-derives it.
  const checkedInThisWindow =
    trigger === 'checkin_submitted' ? true : await hasCheckedInThisWindow(admin, clientId)

  const readiness = evaluateProgressCheckReadiness({
    coachingStartedAt: client.coaching_started_at ?? null,
    lastReadAtMs: await lastReadAtMs(admin, clientId),
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
    .insert({ client_id: clientId, program_id: program?.id ?? null })
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
    meta: { url: checkUrl, trigger, programId: program?.id ?? null },
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
