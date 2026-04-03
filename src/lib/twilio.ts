import twilio from 'twilio'

export async function sendSms({
  to,
  message,
}: {
  to: string
  message: string
}): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (!accountSid || !authToken || !messagingServiceSid) {
    console.warn('[SMS] Twilio credentials not configured — skipping SMS')
    return
  }

  const client = twilio(accountSid, authToken)

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
