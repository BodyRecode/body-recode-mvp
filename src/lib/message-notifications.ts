import { sendSms, formatPhone } from '@/lib/twilio'
import { coach } from '@/config/tenant'

/**
 * SMS heads-up for portal messages. COACH DIRECTION ONLY.
 *
 * Why this exists: an email reply to an app-sent email already fires an SMS to
 * the coach (see /api/inbox/inbound), but a portal message did not. Once the
 * portal became the only client contact channel, that gap meant a Saturday
 * message could sit unseen until Monday.
 *
 * ⚠️ CLIENTS ARE NEVER SENT SMS FOR PORTAL MESSAGES. Kade's call, 2026-07-29:
 * notifications to clients go by email only. The email already carries the
 * preview and the portal link, so a text was a second interruption saying the
 * same thing, on a one-way sender they cannot reply to. Do not reintroduce a
 * client-facing SMS here without asking.
 *
 * Best-effort and silent-fail. The email carries the actual content; the SMS is
 * only a nudge to the coach to go and look.
 *
 * ⚠️ SMS from Body Recode is ONE-WAY. It sends from the alphanumeric sender ID
 * "BodyRecode" (no number in the Twilio pool), so a recipient physically cannot
 * reply — a reply just fails. Copy must therefore never invite a reply.
 * See project_sms_one_way_sender.
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
