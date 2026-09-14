/**
 * Publishing and notifying a Progress Read, and what she sees. Kept out of the
 * routes and pages so the rules are testable without a login.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { lintClientReading, blockingFindings, type LintFinding } from '@/lib/reading-lint'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'
import { buildProgressReadEmail } from '@/lib/progress-read-email'
import { logClientCommunication } from '@/lib/client-communications'

export const PUBLIC_STATE: Record<string, string> = { Remediation: 'Depleted', Optimisation: 'Transitioning', 'Post-Optimisation': 'Ready' }

export type ActionResult = { ok: true; sentAt?: string } | { ok: false; status: number; error: string; findings?: LintFinding[] }

/** Her sections flattened for the pre-publish check, nested readiness lines included. */
export function herSectionsForLint(content: unknown): Record<string, string> {
  const her = ((content as Record<string, unknown>)?.for_her ?? {}) as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(her)) {
    if (typeof v === 'string') out[k] = v
    else if (v && typeof v === 'object') for (const [k2, v2] of Object.entries(v)) if (typeof v2 === 'string') out[`${k}.${k2}`] = v2
  }
  return out
}

export async function setProgressReadPublished(admin: SupabaseClient, readId: string, action: 'publish' | 'unpublish'): Promise<ActionResult> {
  const { data: read } = await admin.from('progress_reads').select('id, client_id, content, comparison_text, is_archived').eq('id', readId).maybeSingle()
  if (!read) return { ok: false, status: 404, error: 'Progress Read not found' }
  if (read.is_archived) return { ok: false, status: 409, error: 'This draft has been replaced by a newer one.' }

  if (action === 'publish') {
    // Re-run at publish time, so a draft written before a rule changed cannot slip through.
    const { data: intake } = await admin.from('intakes').select('*').eq('client_id', read.client_id).order('submitted_at', { ascending: false }).limit(1).maybeSingle()
    const findings = lintClientReading({ sections: herSectionsForLint(read.content), sourceMaterial: JSON.stringify(intake ?? {}) + '\n' + (read.comparison_text ?? '') })
    const blocking = blockingFindings(findings)
    if (blocking.length) return { ok: false, status: 422, error: 'Her version has something that must be fixed before it can be published.', findings: blocking }
  }

  const { error } = await admin.from('progress_reads')
    .update(action === 'publish' ? { status: 'published', published_at: new Date().toISOString() } : { status: 'draft', published_at: null })
    .eq('id', read.id)
  return error ? { ok: false, status: 500, error: 'Could not update' } : { ok: true }
}

export async function notifyProgressRead(admin: SupabaseClient, readId: string): Promise<ActionResult> {
  const { data: read } = await admin.from('progress_reads').select('id, client_id, status').eq('id', readId).maybeSingle()
  if (!read) return { ok: false, status: 404, error: 'Progress Read not found' }
  if (read.status !== 'published') return { ok: false, status: 400, error: 'Publish the Progress Read before notifying her.' }

  const { data: client } = await admin.from('clients').select('id, name, email, onboarding_token').eq('id', read.client_id).single()
  if (!client?.email) return { ok: false, status: 400, error: 'Client has no email on file.' }
  if (!client.onboarding_token) return { ok: false, status: 400, error: 'Client has no portal token.' }

  const portalUrl = `${appUrl()}/portal/${client.onboarding_token}/progress-read`
  const { subject, html } = buildProgressReadEmail({ firstName: client.name?.split(' ')[0] ?? 'there', portalUrl })
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: fromCoach(), to: client.email, bcc: COACH_BCC, subject, html })
  } catch (err) {
    return { ok: false, status: 500, error: `Send failed: ${err instanceof Error ? err.message : String(err)}` }
  }
  const sentAt = new Date().toISOString()
  await admin.from('progress_reads').update({ email_sent_at: sentAt }).eq('id', read.id)
  await logClientCommunication(admin, { clientId: client.id, kind: 'progress_read_ready', subject, toAddress: client.email, meta: { progress_read_id: read.id } })
  return { ok: true, sentAt }
}

export interface HerSection { key: string; label: string; icon: 'target' | 'path' | 'hold' | 'pulse' | 'scale' | 'compass' | 'pin' | 'note'; content: string }

const READINESS_LABELS: Array<[string, string]> = [['capacity', 'Capacity'], ['schedule', 'Your week'], ['regulation', 'Regulation'], ['behaviour', 'Consistency']]

/** Exactly what her portal page renders: only the for_her sections, in order. */
export function herProgressReadView(read: { previous_body_state: string | null; body_state_classification: string; content: unknown }) {
  const her = ((read.content as Record<string, unknown>)?.for_her ?? {}) as Record<string, unknown>
  const text = (k: string) => (typeof her[k] === 'string' && (her[k] as string).trim() ? (her[k] as string) : null)
  const plain = (her.readiness_in_plain_words ?? {}) as Record<string, string>
  const readiness = READINESS_LABELS.filter(([k]) => plain[k]).map(([k, label]) => `${label}. ${plain[k]}`).join('\n\n') || null
  const then = PUBLIC_STATE[read.previous_body_state ?? ''] ?? null
  const now = PUBLIC_STATE[read.body_state_classification] ?? null
  const sections = ([
    { key: 'where_you_are_now', label: 'Where you are now', icon: 'target', content: text('where_you_are_now') },
    { key: 'what_has_changed', label: 'What has changed', icon: 'path', content: text('what_has_changed') },
    { key: 'what_has_held', label: 'What has held', icon: 'hold', content: text('what_has_held') },
    { key: 'your_pattern', label: 'Your pattern', icon: 'pulse', content: text('your_pattern') },
    { key: 'photos', label: 'What your photos and measurements show', icon: 'scale', content: text('what_the_photos_and_measurements_show') },
    { key: 'readiness', label: 'Your readiness, in four parts', icon: 'compass', content: readiness },
    { key: 'holding_back', label: 'What is holding things back', icon: 'pin', content: text('what_is_holding_things_back') },
    { key: 'tensions', label: 'Tensions and trade-offs', icon: 'note', content: text('tensions_and_tradeoffs') },
  ] as Array<Omit<HerSection, 'content'> & { content: string | null }>).filter((s): s is HerSection => !!s.content)
  const pill = then && now ? (then === now ? `${now}, holding steady` : `${then} → ${now}`) : now
  return { headline: text('headline'), pill, sections }
}
