import twilio from 'twilio'
import { getTenant } from '@/config/tenant'

/**
 * Send an SMS via Twilio. Routes through the tenant's Subaccount + Messaging
 * Service if the current tenant has one configured on licence.twilioSubaccountSid.
 * Otherwise falls back to the platform account (Kade's Twilio, BR default).
 *
 * Subaccounts share the parent account's Auth Token by default. If a tenant
 * has a separate auth token, add TWILIO_AUTH_TOKEN_{TENANT_SLUG} env vars +
 * extend this function to look them up. For Founding Ten scale, the shared
 * parent auth token is fine.
 */
export async function sendSms({
  to,
  message,
}: {
  to: string
  message: string
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
  // access by default. This is fine for Founding Ten scale.
  const client = twilio(accountSid, platformAuthToken)

  await client.messages.create({
    body: message,
    messagingServiceSid,
    to,
  })
}

export function formatPhone(phone: string): string {
  // Normalise Australian mobile numbers to E.164 (+61...)
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('61')) return `+${digits}`
  if (digits.startsWith('0')) return `+61${digits.slice(1)}`
  return `+${digits}`
}
