/**
 * A week's notice before the Progress Check. Kade's call, 14 Sep 2026 (Progress
 * Read spec 7: "a 220-question form arriving unannounced is a worse experience
 * than one she was told about a week earlier").
 *
 * Runs on the SAME clock as the check itself, so the two cannot disagree: due
 * at 12 weeks from her last read, or earlier when a dated block reaches its
 * final week. The heads-up goes once, in the seven days before that, and only
 * while no Progress Check has been raised since her last read. If the check
 * becomes due with less than a day's notice (a block brought it forward), no
 * heads-up is sent: a notice arriving with the check is noise.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { REREAD_INTERVAL_DAYS } from '@/lib/progress-check-readiness'
import { lastReadAtMs } from '@/lib/progress-check-dispatch'
import { blockFinalWeekStartMs } from '@/lib/block-window'
import { logClientCommunication } from '@/lib/client-communications'
import { fromCoach, COACH_BCC, darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailBody, emailCta, emailUrlFallback } from '@/lib/email-shell'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'

const DAY = 86_400_000
export const HEADS_UP_DAYS = 7

export type HeadsUpDecision = { send: boolean; why: string; dueAtMs: number | null }

/** Pure: whether to send today. Every input is a fact already on her record. */
export function decideHeadsUp(input: {
  nowMs: number
  lastReadAtMs: number | null
  blockFinalWeekStartsAtMs: number | null
  checkRaisedSinceLastRead: boolean
  headsUpSentSinceLastRead: boolean
}): HeadsUpDecision {
  if (input.lastReadAtMs == null) return { send: false, why: 'no read yet', dueAtMs: null }
  const byTime = input.lastReadAtMs + REREAD_INTERVAL_DAYS * DAY
  const dueAtMs = input.blockFinalWeekStartsAtMs != null && input.blockFinalWeekStartsAtMs > input.lastReadAtMs
    ? Math.min(byTime, input.blockFinalWeekStartsAtMs)
    : byTime
  if (input.checkRaisedSinceLastRead) return { send: false, why: 'check already raised', dueAtMs }
  if (input.headsUpSentSinceLastRead) return { send: false, why: 'heads-up already sent', dueAtMs }
  const msToDue = dueAtMs - input.nowMs
  if (msToDue <= DAY) return { send: false, why: 'due within a day or overdue', dueAtMs }
  if (msToDue > HEADS_UP_DAYS * DAY) return { send: false, why: 'not within a week', dueAtMs }
  return { send: true, why: 'due within a week', dueAtMs }
}

export function buildProgressCheckHeadsUpEmail({ firstName, portalUrl }: { firstName: string; portalUrl: string }) {
  const subject = `${firstName}, your Progress Check is coming up next week`
  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Progress Check')}
${emailHeading(`A heads-up for next week, ${firstName}.`)}
${emailBody("It's nearly time to look at everything again. Your Progress Check opens next week, straight after your weekly check-in.")}
${emailBody('You will recognise the questions: they are the ones from your intake, asked again so they can be compared. You answer each one fresh, and then see what you said last time beside it. It takes about 15 to 20 minutes and saves as you go.')}
${emailBody('The last step is your measurements and three photos, so it helps to have your scales and a tape measure handy, and somewhere to take a front, side and back photo. Same conditions as last time if you can: morning, before eating.')}
${emailBody('Nothing to do yet. It will be waiting in your portal when it opens.')}
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`, { previewText: subject })
  return { subject, html }
}

export async function sendProgressCheckHeadsUpIfDue(admin: SupabaseClient, clientId: string, nowMs = Date.now()): Promise<{ sent: boolean; client: string; why: string }> {
  const { data: client } = await admin.from('clients').select('id, name, email, ended_at, frozen_at, onboarding_token').eq('id', clientId).maybeSingle()
  const name = client?.name ?? 'Unknown'
  if (!client) return { sent: false, client: name, why: 'client not found' }
  if (client.ended_at || client.frozen_at) return { sent: false, client: name, why: 'not active' }

  const last = await lastReadAtMs(admin, clientId)
  const sinceIso = last != null ? new Date(last).toISOString() : new Date(0).toISOString()
  const [{ data: program }, { count: checks }, { count: headsUps }] = await Promise.all([
    admin.from('programs').select('id, week_duration, generated_at, activated_at').eq('client_id', clientId).eq('is_active', true).maybeSingle(),
    admin.from('progress_checks').select('id', { count: 'exact', head: true }).eq('client_id', clientId).gt('created_at', sinceIso),
    admin.from('client_communications').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('kind', 'progress_check_heads_up').gt('created_at', sinceIso),
  ])

  const decision = decideHeadsUp({
    nowMs,
    lastReadAtMs: last,
    blockFinalWeekStartsAtMs: blockFinalWeekStartMs(program),
    checkRaisedSinceLastRead: (checks ?? 0) > 0,
    headsUpSentSinceLastRead: (headsUps ?? 0) > 0,
  })
  if (!decision.send) return { sent: false, client: name, why: decision.why }
  if (!client.email || !client.onboarding_token) return { sent: false, client: name, why: 'no email or portal on file' }
  if (!process.env.RESEND_API_KEY) return { sent: false, client: name, why: 'email not configured' }

  const { subject, html } = buildProgressCheckHeadsUpEmail({ firstName: (client.name ?? '').split(' ')[0] || 'there', portalUrl: `${appUrl()}/portal/${client.onboarding_token}` })
  await new Resend(process.env.RESEND_API_KEY).emails.send({ from: fromCoach(), to: client.email, bcc: COACH_BCC, subject, html })
  await logClientCommunication(admin, { clientId, kind: 'progress_check_heads_up', subject, toAddress: client.email, meta: { due_at: new Date(decision.dueAtMs!).toISOString() } })
  return { sent: true, client: name, why: decision.why }
}
