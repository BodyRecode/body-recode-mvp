/**
 * Booking Agent — draft orchestrator (server-side).
 *
 * Called by the Inngest sequence at each touch's scheduled time. It:
 *   1. Re-checks the lead is still eligible (active, not booked, agent active).
 *   2. Pulls held slots from the availability engine for slot-offer touches.
 *   3. Writes the copy (LLM) and assembles the branded email.
 *   4. Inserts a DRAFTED outreach_touches row for Kade to approve.
 *
 * Nothing is sent here — under Option A a human approves every touch. Safe to
 * call more than once for the same (lead, step): a second call is a no-op if a
 * draft/sent row already exists for that step.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { appUrl } from '@/lib/app-url'
import { brand } from '@/config/tenant'
import { STOP_STATUSES, type TouchDef } from './sequence'
import { writeTouch, type TouchLeadContext } from './write-touch'
import { assembleTouchHtml } from './assemble-email'

const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Format a UTC ISO slot as a Brisbane-time label, e.g. "Tuesday 22 July, 5:00pm". */
function brisbaneLabel(iso: string): string {
  const b = new Date(new Date(iso).getTime() + BRISBANE_OFFSET_MS)
  const day = DAYS[b.getUTCDay()]
  const date = b.getUTCDate()
  const month = MONTHS[b.getUTCMonth()]
  let h = b.getUTCHours()
  const m = b.getUTCMinutes()
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12 || 12
  const mm = m === 0 ? '' : `:${String(m).padStart(2, '0')}`
  return `${day} ${date} ${month}, ${h}${mm}${ampm}`
}

/** Fetch up to `max` open slot labels across distinct days from the availability engine. */
async function fetchSlotLabels(max = 3): Promise<string[]> {
  try {
    const res = await fetch(`${appUrl()}/api/booking-slots?days=10`, { cache: 'no-store' })
    if (!res.ok) return []
    const iso: string[] = await res.json()
    const seenDays = new Set<string>()
    const labels: string[] = []
    for (const s of iso) {
      const dayKey = new Date(new Date(s).getTime() + BRISBANE_OFFSET_MS).toISOString().slice(0, 10)
      if (seenDays.has(dayKey)) continue
      seenDays.add(dayKey)
      labels.push(brisbaneLabel(s))
      if (labels.length >= max) break
    }
    return labels
  } catch (e) {
    console.error('[booking-agent] fetchSlotLabels failed:', e)
    return []
  }
}

export interface DraftTouchResult {
  status: 'drafted' | 'skipped_ineligible' | 'skipped_exists'
  touchId?: string
}

export async function draftTouch(leadId: string, touch: TouchDef): Promise<DraftTouchResult> {
  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('id, coach_id, name, email, status, active, booking_agent_state, scorecard_body_state, scorecard_score, fat_storage, lead_quality, pre_call_brief')
    .eq('id', leadId)
    .maybeSingle()

  // Eligibility gate — stop the moment they've booked, gone inactive, or the
  // agent was paused/finished by Kade.
  if (
    !lead ||
    !lead.email ||
    lead.active === false ||
    lead.booking_agent_state !== 'active' ||
    STOP_STATUSES.has(lead.status)
  ) {
    return { status: 'skipped_ineligible' }
  }

  // Idempotency: never double-draft the same step for the same lead.
  const { data: existing } = await admin
    .from('outreach_touches')
    .select('id')
    .eq('lead_id', leadId)
    .eq('step_key', touch.key)
    .not('status', 'in', '("skipped")')
    .limit(1)
  if (existing && existing.length > 0) {
    return { status: 'skipped_exists', touchId: existing[0].id }
  }

  const firstName = (lead.name || '').split(' ')[0] || 'there'
  const ctx: TouchLeadContext = {
    firstName,
    bodyState: lead.scorecard_body_state,
    score: lead.scorecard_score,
    fatStorage: lead.fat_storage,
    leadQuality: lead.lead_quality,
    preCallBrief: lead.pre_call_brief,
  }

  const slots = touch.offerSlots ? await fetchSlotLabels(3) : []
  const written = await writeTouch(ctx, touch, { slots })
  const bookingUrl = `${brand().marketingDomain}/book`

  const html = assembleTouchHtml({
    firstName,
    paragraphs: written.paragraphs,
    ctaLabel: written.ctaLabel,
    ctaUrl: bookingUrl,
    previewText: written.previewText,
    slots,
  })

  const { data: inserted, error } = await admin
    .from('outreach_touches')
    .insert({
      lead_id: leadId,
      coach_id: lead.coach_id ?? null,
      channel: 'email',
      step_key: touch.key,
      step_index: touch.index,
      status: 'drafted',
      subject: written.subject,
      body_text: written.paragraphs.join('\n\n'),
      body_html: html,
      booking_url: bookingUrl,
      ai_model: written.fallback ? 'fallback-template' : 'claude-haiku-4-5-20251001',
      meta: { slots, previewText: written.previewText, ctaLabel: written.ctaLabel, fallback: !!written.fallback },
    })
    .select('id')
    .single()

  if (error || !inserted) {
    console.error(`[booking-agent] draft insert failed for lead ${leadId} step ${touch.key}:`, error)
    throw new Error('draft insert failed')
  }

  return { status: 'drafted', touchId: inserted.id }
}
