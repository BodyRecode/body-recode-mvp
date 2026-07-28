import { sendSms, formatPhone } from '@/lib/twilio'
import { coach } from '@/config/tenant'

/**
 * SMS heads-up for portal messages, in both directions.
 *
 * Why this exists: an email reply to an app-sent email already fires an SMS to
 * the coach (see /api/inbox/inbound), but a portal message did not. Once the
 * portal became the only client contact channel, that gap meant a Saturday
 * message could sit unseen until Monday. The client side is the mirror: they
 * get the reply by email, but an email is easy to miss and the whole point of
 * moving off WhatsApp was that replies should feel as immediate.
 *
 * Both are best-effort and silent-fail. The email carries the actual content in
 * each direction; the SMS is only a nudge to go and look.
 *
 * ⚠️ SMS from Body Recode is ONE-WAY. It sends from the alphanumeric sender ID
 * "BodyRecode" (no number in the Twilio pool), so a recipient physically cannot
 * reply — a reply just fails. Client-facing copy must therefore never invite a
 * reply. Point them at the portal instead. See project_sms_one_way_sender.
 */

/** Mon-Sat 08:30-20:00 AEST. Shared shape with the coach window. */
function withinWindow(now: Date, openMinutes: number, closeMinutes: number, allowSunday: boolean): boolean {
  // AEST = UTC+10 year round (Queensland, no DST).
  const aest = new Date(now.getTime() + 10 * 60 * 60 * 1000)
  const day = aest.getUTCDay()
  if (!allowSunday && day === 0) return false
  const mins = aest.getUTCHours() * 60 + aest.getUTCMinutes()
  return mins >= openMinutes && mins < closeMinutes
}

/**
 * Client-facing window. Tighter and more conservative than the coach's: a
 * paying client should never be woken up by a coaching notification, and
 * Sunday is allowed because a weekend reply is a good experience, not an
 * intrusion, at a civilised hour.
 */
export function isWithinClientSmsWindow(now: Date = new Date()): boolean {
  return withinWindow(now, 8 * 60, 20 * 60, true)
}

/** Texts the coach that a client has written to them. */
export async function smsNotifyCoachOfClientMessage(clientName: string): Promise<boolean> {
  // Reuse the coach window: outside it, the notification email covers it.
  if (!withinWindow(new Date(), 8 * 60 + 30, 20 * 60, false)) return false
  const rawPhone = coach().whatsAppNumber?.trim()
  if (!rawPhone) return false
  try {
    await sendSms({
      to: formatPhone(rawPhone),
      message: `📨 ${clientName} sent you a message in the portal.`,
    })
    return true
  } catch (err) {
    console.error('[message-notifications] coach SMS failed:', err instanceof Error ? err.message : err)
    return false
  }
}

/**
 * Texts the client that their coach has replied.
 *
 * No reply CTA: the sender ID cannot receive messages. The link is the action.
 */
export async function smsNotifyClientOfCoachReply(opts: {
  phone: string | null
  firstName: string
  threadUrl: string
  /** False when the coach started the conversation, so it is not a "reply". */
  isReply?: boolean
}): Promise<boolean> {
  const { phone, firstName, threadUrl, isReply = true } = opts
  if (!phone?.trim()) return false
  if (!isWithinClientSmsWindow()) return false
  try {
    await sendSms({
      to: formatPhone(phone.trim()),
      message: isReply
        ? `Hi ${firstName}, ${coach().firstName} has replied to your message. Read it in your portal: ${threadUrl}`
        : `Hi ${firstName}, ${coach().firstName} has sent you a message. Read it in your portal: ${threadUrl}`,
    })
    return true
  } catch (err) {
    console.error('[message-notifications] client SMS failed:', err instanceof Error ? err.message : err)
    return false
  }
}
