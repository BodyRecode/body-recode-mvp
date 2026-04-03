import twilio from 'twilio'

export function sendSms({
  to,
  message,
}: {
  to: string
  message: string
}): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !from) {
    console.warn('[SMS] Twilio credentials not configured — skipping SMS')
    return Promise.resolve()
  }

  const client = twilio(accountSid, authToken)

  return client.messages
    .create({ body: message, from, to })
    .then(() => undefined)
}

export function formatPhone(phone: string): string {
  // Normalise Australian mobile numbers to E.164 (+61...)
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('61')) return `+${digits}`
  if (digits.startsWith('0')) return `+61${digits.slice(1)}`
  return `+${digits}`
}
