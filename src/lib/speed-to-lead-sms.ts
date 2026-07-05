/**
 * Speed-to-lead SMS helpers — logged, consent-checked, frequency-capped sends.
 *
 * Every outbound SMS through this file writes a row to sms_logs BEFORE the
 * Twilio API call, then updates that row with the delivery outcome. If the
 * API call throws, we still have the attempt row + error stamped.
 *
 * Never call the raw src/lib/twilio.ts sendSms directly for speed-to-lead
 * traffic. Use this file so consent + frequency caps + logging can't be
 * silently skipped.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendSms as twilioSendSms, formatPhone } from '@/lib/twilio'
import type { SmsTrigger } from '@/lib/sms-send-window'

export type SpeedToLeadResult =
  | { ok: true; sid: string; logId: string }
  | { ok: false; reason: 'no_phone' | 'not_opted_in' | 'opted_out' | 'frequency_capped' | 'send_failed'; error?: string; logId?: string }

type LeadRow = {
  id: string
  phone: string | null
  phone_e164: string | null
  sms_opt_in_at: string | null
  sms_opted_out_at: string | null
  name: string | null
}

/**
 * Send an SMS to a lead, respecting opt-in state + frequency caps.
 * Writes to sms_logs for compliance audit.
 *
 * Caps enforced:
 *   - max 1 outbound SMS per lead per 24h
 *   - max 3 outbound SMS per lead per rolling 7 days
 *   - HARD STOP if sms_opted_out_at is set (regardless of trigger)
 */
export async function sendLeadSms({
  leadId,
  trigger,
  body,
  overrideCap = false,
}: {
  leadId: string
  trigger: SmsTrigger
  body: string
  overrideCap?: boolean
}): Promise<SpeedToLeadResult> {
  const admin = createAdminClient()

  const { data: leadRaw, error: leadErr } = await admin
    .from('leads')
    .select('id, phone, phone_e164, sms_opt_in_at, sms_opted_out_at, name')
    .eq('id', leadId)
    .maybeSingle()

  if (leadErr) return { ok: false, reason: 'send_failed', error: leadErr.message }
  const lead = leadRaw as LeadRow | null
  if (!lead) return { ok: false, reason: 'send_failed', error: 'lead not found' }

  const to = lead.phone_e164 ?? (lead.phone ? formatPhone(lead.phone) : null)
  if (!to) return { ok: false, reason: 'no_phone' }

  if (lead.sms_opted_out_at) return { ok: false, reason: 'opted_out' }
  if (!lead.sms_opt_in_at) return { ok: false, reason: 'not_opted_in' }

  if (!overrideCap) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { count: last24h } = await admin
      .from('sms_logs')
      .select('id', { head: true, count: 'exact' })
      .eq('lead_id', leadId)
      .eq('direction', 'outbound')
      .gte('sent_at', dayAgo)
    if ((last24h ?? 0) >= 1) return { ok: false, reason: 'frequency_capped', error: 'already sent within 24h' }

    const { count: last7d } = await admin
      .from('sms_logs')
      .select('id', { head: true, count: 'exact' })
      .eq('lead_id', leadId)
      .eq('direction', 'outbound')
      .gte('sent_at', weekAgo)
    if ((last7d ?? 0) >= 3) return { ok: false, reason: 'frequency_capped', error: '3 sends already this week' }
  }

  const { data: logRow, error: insertErr } = await admin
    .from('sms_logs')
    .insert({
      lead_id: leadId,
      direction: 'outbound',
      trigger,
      to_number: to,
      body,
      status: 'queued',
    })
    .select('id')
    .single()

  if (insertErr) return { ok: false, reason: 'send_failed', error: insertErr.message }
  const logId = logRow.id as string

  try {
    await twilioSendSms({ to, message: body })
    await admin
      .from('sms_logs')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', logId)
    return { ok: true, sid: '', logId }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await admin
      .from('sms_logs')
      .update({ status: 'failed', error: msg })
      .eq('id', logId)
    return { ok: false, reason: 'send_failed', error: msg, logId }
  }
}

/**
 * Persist opt-in on a lead. Also normalise the phone into phone_e164.
 * Called from the scorecard submit route when the user ticks the checkbox.
 */
export async function persistSmsOptIn(leadId: string, rawPhone: string): Promise<void> {
  const admin = createAdminClient()
  const phone_e164 = formatPhone(rawPhone)
  await admin
    .from('leads')
    .update({
      phone_e164,
      sms_opt_in_at: new Date().toISOString(),
      sms_opted_out_at: null,
    })
    .eq('id', leadId)
}

/**
 * Persist STOP — sets sms_opted_out_at and logs the inbound.
 * Called from the Twilio inbound webhook when a STOP reply is received.
 */
export async function persistSmsOptOut({
  fromNumber,
  body,
  twilioSid,
}: {
  fromNumber: string
  body: string
  twilioSid?: string | null
}): Promise<{ leadId: string | null }> {
  const admin = createAdminClient()

  // Find the lead by phone_e164 (or fallback phone)
  const { data: leadA } = await admin
    .from('leads')
    .select('id')
    .eq('phone_e164', fromNumber)
    .maybeSingle()
  let leadId: string | null = leadA?.id ?? null

  if (!leadId) {
    const { data: leadB } = await admin
      .from('leads')
      .select('id')
      .eq('phone', fromNumber)
      .maybeSingle()
    leadId = leadB?.id ?? null
  }

  if (leadId) {
    await admin
      .from('leads')
      .update({ sms_opted_out_at: new Date().toISOString() })
      .eq('id', leadId)
  }

  await admin.from('sms_logs').insert({
    lead_id: leadId,
    direction: 'inbound',
    to_number: process.env.TWILIO_MESSAGING_SERVICE_SID ?? 'body-recode',
    from_number: fromNumber,
    body,
    twilio_sid: twilioSid ?? null,
    status: 'received',
    trigger: null,
  })

  return { leadId }
}

/**
 * Log an inbound SMS that isn't STOP — captured so the coach can reply
 * from the CRM inbox.
 */
export async function persistInboundNonStop({
  fromNumber,
  body,
  twilioSid,
}: {
  fromNumber: string
  body: string
  twilioSid?: string | null
}): Promise<{ leadId: string | null }> {
  const admin = createAdminClient()

  const { data: leadA } = await admin
    .from('leads')
    .select('id')
    .eq('phone_e164', fromNumber)
    .maybeSingle()
  let leadId: string | null = leadA?.id ?? null

  if (!leadId) {
    const { data: leadB } = await admin
      .from('leads')
      .select('id')
      .eq('phone', fromNumber)
      .maybeSingle()
    leadId = leadB?.id ?? null
  }

  await admin.from('sms_logs').insert({
    lead_id: leadId,
    direction: 'inbound',
    to_number: process.env.TWILIO_MESSAGING_SERVICE_SID ?? 'body-recode',
    from_number: fromNumber,
    body,
    twilio_sid: twilioSid ?? null,
    status: 'received',
    trigger: null,
  })

  return { leadId }
}
