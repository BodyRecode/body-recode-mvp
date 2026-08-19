/**
 * Monday reassessment digest.
 *
 * The weekly check-in window closes Sunday 6:30pm Brisbane and the CFWS generates
 * on submit, so by Monday morning every trigger for the week exists. This pushes
 * them to the coach rather than waiting for a dashboard visit.
 *
 * Two sections, because they need different responses:
 *   Overdue   open more than OVERDUE_AFTER_DAYS. These have already been sent once.
 *   New       fired since the last digest.
 *
 * Anything already notified only reappears once it is overdue. A digest that
 * repeats the same unresolved item every week trains you to ignore it.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import {
  REASON_LABEL,
  OVERDUE_AFTER_DAYS,
  isOverdue,
  type ReassessmentTriggerRow,
} from '@/lib/reassessment-triggers'
import { appUrl } from '@/lib/app-url'
import type { ReassessmentReason } from '@/lib/readiness-monitor'

export interface DigestRow extends ReassessmentTriggerRow {
  client_name: string
}

export interface DigestResult {
  subject: string
  html: string
  newCount: number
  overdueCount: number
  triggerIds: string[]
}

function label(reason: string): string {
  return REASON_LABEL[reason as ReassessmentReason] ?? reason
}

function daysOpen(row: ReassessmentTriggerRow, now: Date): number {
  return Math.floor((now.getTime() - new Date(row.fired_at).getTime()) / (24 * 60 * 60 * 1000))
}

function renderList(rows: DigestRow[], now: Date): string {
  return rows
    .map(r => {
      const age = daysOpen(r, now)
      const ageText = age === 0 ? 'today' : age === 1 ? '1 day ago' : `${age} days ago`
      return `<li style="margin:0 0 10px 0;line-height:1.5;">
  <strong>${r.client_name}</strong> &mdash; ${label(r.reason)}<br />
  <span style="color:#6B6B6B;font-size:13px;">${r.message} &middot; fired ${ageText}</span>
</li>`
    })
    .join('')
}

/**
 * Build the digest. Returns null when there is nothing to send, so the cron
 * stays silent on a clean week rather than sending an empty email.
 */
export function buildReassessmentDigest(rows: DigestRow[], now = new Date()): DigestResult | null {
  const overdue = rows.filter(r => isOverdue(r, now))
  const fresh = rows.filter(r => !isOverdue(r, now) && !r.notified_at)

  if (!overdue.length && !fresh.length) return null

  const total = overdue.length + fresh.length
  const subject =
    overdue.length > 0
      ? `${total} reassessment ${total === 1 ? 'trigger' : 'triggers'} open, ${overdue.length} overdue`
      : `${total} reassessment ${total === 1 ? 'trigger' : 'triggers'} this week`

  const sections: string[] = []

  if (overdue.length) {
    sections.push(
      `<p style="margin:0 0 8px 0;font-weight:700;color:#DC2626;">Overdue (open more than ${OVERDUE_AFTER_DAYS} days)</p>
<ul style="margin:0 0 20px 18px;padding:0;">${renderList(overdue, now)}</ul>`
    )
  }

  if (fresh.length) {
    sections.push(
      `<p style="margin:0 0 8px 0;font-weight:700;color:#1A1A1A;">New this week</p>
<ul style="margin:0 0 20px 18px;padding:0;">${renderList(fresh, now)}</ul>`
    )
  }

  const html = buildCoachNotificationEmail({
    eyebrow: 'Reassessment queue',
    heading: subject,
    body: [
      'These are clients whose signals crossed a reassessment threshold. Each one stays open until you either send a Progress Check or dismiss it with a reason.',
      sections.join(''),
    ],
    ctaLabel: 'Open the coaching dashboard',
    ctaUrl: `${appUrl()}/dashboard/coaching`,
    footnote:
      'Deterministic triggers (block end, twelve-week cap) are listed here too. Signal-derived triggers are the ones that need your judgement.',
    accent: overdue.length ? 'red' : 'teal',
  })

  return {
    subject,
    html,
    newCount: fresh.length,
    overdueCount: overdue.length,
    triggerIds: [...overdue, ...fresh].map(r => r.id),
  }
}

/** Load every open trigger with its client name, newest first. */
export async function loadOpenTriggersWithClients(admin: SupabaseClient): Promise<DigestRow[]> {
  const { data, error } = await admin
    .from('reassessment_triggers')
    .select('*, clients!inner(name, ended_at, frozen_at)')
    .eq('status', 'open')
    .order('fired_at', { ascending: false })

  if (error) {
    console.error('[reassessment-digest] load failed', error)
    return []
  }

  return (data ?? [])
    // Defensive: a client offboarded or frozen after a trigger fired should not
    // keep generating work.
    .filter((r: Record<string, unknown>) => {
      const c = r.clients as { ended_at?: string | null; frozen_at?: string | null } | null
      return !c?.ended_at && !c?.frozen_at
    })
    .map((r: Record<string, unknown>) => {
      const c = r.clients as { name?: string } | null
      const { clients: _clients, ...rest } = r as Record<string, unknown> & { clients?: unknown }
      return { ...(rest as unknown as ReassessmentTriggerRow), client_name: c?.name ?? 'Unknown client' }
    })
}
