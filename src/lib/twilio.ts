import twilio from 'twilio'
import { getTenant } from '@/config/tenant'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Send an SMS via Twilio. Routes through the tenant's Subaccount + Messaging
 * Service if the current tenant has one configured on licence.twilioSubaccountSid.
 * Otherwise falls back to the platform account (Kade's Twilio, BR default).
 *
 * Subaccounts share the parent account's Auth Token by default. If a tenant
 * has a separate auth token, add TWILIO_AUTH_TOKEN_{TENANT_SLUG} env vars +
 * extend this function to look them up. At Collective scale (~10 partners), the shared
 * parent auth token is fine.
 *
 * EVERY SEND IS LOGGED (added 2026-08-14). Until now only speed-to-lead wrote
 * to sms_logs; the other ten call sites - including all 17 messages of the
 * 14-day Challenge arc and both Day 7 Check-In nudges - sent silently. That
 * made the Check-In completion figure impossible to read: "ignored the nudge"
 * and "never received one" looked identical from the database, and the only
 * record of what actually went out lived in Twilio's console.
 *
 * Pass `leadId` and `trigger` wherever they are known so the row is
 * attributable. A send with neither still logs; an unattributed row is far
 * better than no row.
 */
export async function sendSms({
  to,
  message,
  leadId = null,
  trigger = null,
  skipLog = false,
}: {
  to: string
  message: string
  /** Attributes the send to a lead's timeline. Null is allowed, not preferred. */
  leadId?: string | null
  /** Short label for which sequence sent this, e.g. 'challenge_day7'. */
  trigger?: string | null
  /**
   * Set by callers that write their own sms_logs row. Only speed-to-lead does:
   * it inserts a 'queued' row first, then flips it to sent/failed, so logging
   * here as well would double-count - and its frequency cap counts rows, so a
   * duplicate would start blocking real sends.
   */
  skipLog?: boolean
}): Promise<void> {
  const platformAccountSid = process.env.TWILIO_ACCOUNT_SID
  const platformAuthToken = process.env.TWILIO_AUTH_TOKEN
  const platformMessagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (!platformAccountSid || !platformAuthToken || !platformMessagingServiceSid) {
    console.warn('[SMS] Twilio platform credentials not configured — skipping SMS')
    return
  }

  const tenant = getTenant()
  const tenantSubaccountSid = tenant.licence.twilioSubaccountSid ?? null
  const tenantMessagingServiceSid = tenant.licence.twilioMessagingServiceSid ?? null

  // Decide account + messaging service. Tenant subaccount overrides platform.
  const accountSid = tenantSubaccountSid ?? platformAccountSid
  const messagingServiceSid = tenantMessagingServiceSid ?? platformMessagingServiceSid

  // Auth token: for now use the parent auth token. Subaccounts inherit parent
  // access by default. This is fine at Collective scale (~10 partners).
  const client = twilio(accountSid, platformAuthToken)

  let twilioSid: string | null = null
  let sendError: unknown = null
  try {
    const res = await client.messages.create({
      body: message,
      messagingServiceSid,
      to,
    })
    twilioSid = res.sid ?? null
  } catch (e) {
    sendError = e
  }

  // Log the attempt either way. Never let a logging failure take down a send
  // that already succeeded, or mask the real Twilio error on one that did not.
  if (!skipLog) try {
    await createAdminClient().from('sms_logs').insert({
      lead_id: leadId,
      direction: 'outbound',
      to_number: to,
      from_number: messagingServiceSid,
      body: message,
      twilio_sid: twilioSid,
      status: sendError ? 'failed' : 'sent',
      error: sendError ? String((sendError as Error)?.message ?? sendError).slice(0, 500) : null,
      trigger,
      sent_at: sendError ? null : new Date().toISOString(),
    })
  } catch (logErr) {
    console.error('[SMS] send logged failed:', logErr)
  }

  // Preserve the original contract: callers and Inngest retries still see throws.
  if (sendError) throw sendError
}

export function formatPhone(phone: string): string {
  // Normalise Australian mobile numbers to E.164 (+61...)
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('61')) return `+${digits}`
  if (digits.startsWith('0')) return `+61${digits.slice(1)}`
  return `+${digits}`
}
