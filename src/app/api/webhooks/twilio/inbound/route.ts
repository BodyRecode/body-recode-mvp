/**
 * Twilio inbound SMS webhook.
 *
 * Handles two kinds of inbound messages:
 *   1. STOP (or STOPALL / UNSUBSCRIBE / CANCEL / QUIT / END) → hard opt-out.
 *      Set leads.sms_opted_out_at, log inbound, respond with a plain-text
 *      confirmation Twilio auto-forwards.
 *   2. Anything else → log inbound + notify Kade via email so he can reply
 *      from the CRM inbox.
 *
 * Twilio POSTs form-urlencoded fields; we validate the request signature
 * with the standard @twilio/webhook helper before touching the DB.
 *
 * The endpoint is at /api/webhooks/twilio/inbound — configure the messaging
 * service's inbound webhook URL to this path.
 */

import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { persistSmsOptOut, persistInboundNonStop } from '@/lib/speed-to-lead-sms'
import { Resend } from 'resend'
import { fromCoach } from '@/lib/email-shell'
import { coach } from '@/config/tenant'
import { appUrl } from '@/lib/app-url'

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'QUIT', 'END', 'REVOKE'])

function xmlResponse(twiml: string, status = 200): NextResponse {
  return new NextResponse(twiml, {
    status,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}

function respondTwiml(message?: string): NextResponse {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
  return xmlResponse(body)
}

export async function POST(req: NextRequest) {
  const url = req.nextUrl.toString()
  const signature = req.headers.get('x-twilio-signature') ?? ''
  const formText = await req.text()
  const params = Object.fromEntries(new URLSearchParams(formText))

  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (authToken) {
    const valid = twilio.validateRequest(authToken, signature, url, params as Record<string, string>)
    if (!valid) {
      console.warn('[twilio/inbound] signature failed', { url })
      return NextResponse.json({ error: 'invalid signature' }, { status: 403 })
    }
  }

  const from = (params.From as string | undefined) ?? ''
  const body = ((params.Body as string | undefined) ?? '').trim()
  const twilioSid = (params.MessageSid as string | undefined) ?? null

  if (!from || !body) {
    return respondTwiml()
  }

  const upperBody = body.toUpperCase().replace(/[^A-Z]/g, '')
  const isStop = STOP_KEYWORDS.has(upperBody)

  if (isStop) {
    await persistSmsOptOut({ fromNumber: from, body, twilioSid })
    return respondTwiml(`Opted out. You will not receive further messages. -${coach().firstName[0]}`)
  }

  const { leadId } = await persistInboundNonStop({ fromNumber: from, body, twilioSid })

  // Notify Kade so they can reply from the CRM inbox
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const c = coach()
      const leadLink = leadId ? `${appUrl()}/dashboard/leads/${leadId}` : `${appUrl()}/dashboard/leads`
      await resend.emails.send({
        from: fromCoach(),
        to: c.adminEmail,
        subject: `SMS reply from ${from}: ${body.slice(0, 60)}`,
        text: [
          `From: ${from}`,
          `Body: ${body}`,
          '',
          leadId ? `Lead: ${leadLink}` : 'Lead not matched by phone_e164 or phone. Search manually.',
        ].join('\n'),
      })
    } catch (e) {
      console.error('[twilio/inbound] notify email failed:', e)
    }
  }

  return respondTwiml()
}
