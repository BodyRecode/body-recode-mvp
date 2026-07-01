import { Resend } from 'resend'
import { coach } from '@/config/tenant'

const ALERT_TO = coach().email

/**
 * Fire-and-forget internal ops alert to the coach. Use for "this should never
 * happen silently" situations (e.g. a client onboarding email failed to send).
 *
 * Best-effort by design: it never throws and its own failure is only logged.
 * Because it sends through the same Resend account, it is a *backup* signal —
 * the primary signal for any user-facing flow should be the value returned to
 * the UI so the coach sees it in the moment. This catches the case where the
 * coach has already navigated away.
 */
export async function sendCoachAlert({
  subject,
  lines,
}: {
  subject: string
  /** Plain-text lines rendered top to bottom. */
  lines: string[]
}): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('[coach-alert] No RESEND_API_KEY; alert not sent:', subject)
      return
    }
    const resend = new Resend(process.env.RESEND_API_KEY)
    const body = lines
      .map((l) => `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#1A1A1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${l}</p>`)
      .join('')
    await resend.emails.send({
      from: `Body Recode Alerts <${coach().email}>`,
      to: ALERT_TO,
      subject: `[ALERT] ${subject}`,
      html: `<div style="padding:24px;max-width:560px;">${body}</div>`,
    })
  } catch (err) {
    console.error('[coach-alert] Failed to send alert:', subject, err)
  }
}
