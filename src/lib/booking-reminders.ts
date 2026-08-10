/**
 * Zoom booking confirmation + reminder emails, and the scheduling around them.
 *
 * Extracted from `/api/bookings/route.ts` on 2026-08-10 so the reschedule path
 * can reuse the exact same markup rather than growing a second, drifting copy.
 *
 * The thing that forced this: reminders are queued with Resend at booking time
 * using `scheduledAt`, which means their content and their send time are both
 * frozen the moment the booking is created. Until now their IDs were thrown
 * away, so a booking made at the wrong time could not be corrected — the stale
 * reminders sat in Resend's queue and fired at the old time regardless of what
 * the dashboard said. `be_bookings.reminder_email_ids` now holds them so they
 * can be cancelled and re-queued.
 */
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailStatusCard,
  fromCoach,
} from '@/lib/email-shell'

export interface BookingTimeStrings {
  dateStr: string
  timeStr: string
}

/** Brisbane-formatted date and time, used in every booking email. */
export function formatBookingTimes(scheduledAt: Date): BookingTimeStrings {
  return {
    dateStr: scheduledAt.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Australia/Brisbane',
    }),
    timeStr: scheduledAt.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Brisbane',
    }),
  }
}

export interface BookingEmailContext {
  firstName: string
  dateStr: string
  timeStr: string
  durationMinutes: number
  meetingLink: string | null
  /**
   * Pre-call form URL. Rendered only when the booking is for a lead who has not
   * completed it. Before 2026-08-06 the link existed in exactly one email in the
   * product, so anyone booked straight from the dashboard never saw it.
   */
  prepUrl?: string | null
  /** True when this confirms a MOVED booking rather than a new one. */
  rescheduled?: boolean
}

export function buildBookingConfirmationEmail(ctx: BookingEmailContext): { subject: string; html: string } {
  const subject = ctx.rescheduled
    ? `Updated: your Zoom call is now ${ctx.dateStr}`
    : `Your Zoom call is confirmed. ${ctx.dateStr}`

  const heading = ctx.rescheduled
    ? `New time, ${ctx.firstName}.`
    : `See you ${ctx.dateStr.split(',')[0]}, ${ctx.firstName}.`

  const opener = ctx.rescheduled
    ? 'Your Zoom call has been moved. The details below are the correct ones, and the join link is unchanged, so any earlier invite still works.'
    : 'Your Zoom call with Kade is confirmed.'

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow(ctx.rescheduled ? 'Zoom Call · Time Updated' : 'Zoom Call · Confirmed')}
${emailHeading(heading)}
${emailDivider()}
${emailBody(`Hi ${ctx.firstName},`)}
${emailBody(opener, { bottom: 24 })}
${emailStatusCard({
    eyebrow: ctx.rescheduled ? 'New time' : 'When',
    headline: `${ctx.dateStr} · ${ctx.timeStr} Brisbane`,
    body: `${ctx.durationMinutes} minutes on Zoom. Tap the button below at the time to join.`,
  })}
${ctx.meetingLink ? emailCta({ href: ctx.meetingLink, label: 'Join Zoom' }) : ''}
${ctx.meetingLink ? emailUrlFallback(ctx.meetingLink, 'Or paste the Zoom link into your browser') : ''}
${emailBody('Open the attached calendar file (.ics) to add this to your calendar.', { size: 13, bottom: ctx.prepUrl ? 24 : 0 })}
${ctx.prepUrl ? emailDivider() : ''}
${ctx.prepUrl ? emailBody('One thing before we talk. Three minutes, six short questions, and only the first one is required. It means I walk in already understanding where you are at, so we go straight to what matters for you instead of starting from zero.') : ''}
${ctx.prepUrl ? emailCta({ href: ctx.prepUrl, label: 'Complete this before our call →' }) : ''}
${ctx.prepUrl ? emailUrlFallback(ctx.prepUrl) : ''}
${darkEmailSignature()}
`, {
    previewText: ctx.rescheduled
      ? `${ctx.firstName}, your Zoom call has moved to ${ctx.dateStr}.`
      : `${ctx.firstName}, your Zoom call is confirmed for ${ctx.dateStr}.`,
  })

  return { subject, html }
}

function buildReminderEmail(ctx: BookingEmailContext, minutesBefore: 120 | 30): { subject: string; html: string } {
  const label = minutesBefore === 120 ? '2 hours' : '30 minutes'
  const subject = `Your Zoom call is in ${label}. ${ctx.timeStr} Brisbane`
  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Zoom Call Reminder')}
${emailHeading(`Starting in ${label}, ${ctx.firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${ctx.firstName},`)}
${emailBody(`Your Zoom call with Kade is in ${label}.`, { bottom: 24 })}
${emailStatusCard({
    eyebrow: 'When',
    headline: `${ctx.dateStr} · ${ctx.timeStr} Brisbane`,
    body: `${ctx.durationMinutes} minutes on Zoom. Tap below at the time to join.`,
  })}
${ctx.meetingLink ? emailCta({ href: ctx.meetingLink, label: 'Join Zoom' }) : ''}
${ctx.meetingLink ? emailUrlFallback(ctx.meetingLink, 'Or paste the Zoom link into your browser') : ''}
${darkEmailSignature()}
`, { previewText: `${ctx.firstName}, your Zoom call starts in ${label}.` })
  return { subject, html }
}

/**
 * Queue the 2h and 30min reminders and return their Resend IDs so they can be
 * cancelled later. A reminder whose send time has already passed is skipped,
 * which is why the returned array can be shorter than two, or empty.
 *
 * Never throws: a booking that saves but fails to queue a reminder is far
 * better than a booking that fails outright.
 */
export async function scheduleBookingReminders(opts: {
  to: string
  scheduledAt: Date
  ctx: BookingEmailContext
}): Promise<string[]> {
  if (!process.env.RESEND_API_KEY) return []

  const resend = new Resend(process.env.RESEND_API_KEY)
  const now = Date.now()
  const ids: string[] = []

  const windows: Array<{ minutes: 120 | 30; at: number }> = [
    { minutes: 120, at: opts.scheduledAt.getTime() - 2 * 60 * 60 * 1000 },
    { minutes: 30, at: opts.scheduledAt.getTime() - 30 * 60 * 1000 },
  ]

  for (const w of windows) {
    // 60s of headroom — Resend rejects a scheduled time that lands in the past
    // between us computing it and the request arriving.
    if (w.at <= now + 60_000) continue
    try {
      const built = buildReminderEmail(opts.ctx, w.minutes)
      const res = await resend.emails.send({
        from: fromCoach(),
        to: opts.to,
        subject: built.subject,
        scheduledAt: new Date(w.at).toISOString(),
        html: built.html,
      })
      if (res.data?.id) ids.push(res.data.id)
    } catch (e) {
      console.error(`[booking-reminders] failed to queue ${w.minutes}min reminder:`, e)
    }
  }

  return ids
}

export interface CancelRemindersResult {
  attempted: number
  cancelled: number
  /**
   * True when Resend rejected the call because the API key is send-only.
   * Verified 2026-08-10: the key in use is a "Sending access" key, and
   * POST /emails/:id/cancel returns 401 `restricted_api_key` for those. The
   * whole cancel path is inert until RESEND_API_KEY is swapped for a Full
   * Access key, and the caller surfaces this so it cannot fail silently.
   */
  restrictedKey: boolean
}

/**
 * Cancel queued reminders. Best-effort and never throws — an already-sent or
 * already-cancelled ID returns an error from Resend, and that is not a reason
 * to fail the reschedule the caller is in the middle of. The RESULT is what
 * matters: a caller that ignores it will happily report success while two
 * stale reminders remain queued at the old time.
 */
export async function cancelBookingReminders(
  ids: string[] | null | undefined,
): Promise<CancelRemindersResult> {
  const result: CancelRemindersResult = { attempted: ids?.length ?? 0, cancelled: 0, restrictedKey: false }
  if (!ids?.length || !process.env.RESEND_API_KEY) return result

  const resend = new Resend(process.env.RESEND_API_KEY)
  for (const id of ids) {
    try {
      const res = await resend.emails.cancel(id)
      if (res.error) {
        if (res.error.name === 'restricted_api_key') result.restrictedKey = true
        console.error(`[booking-reminders] failed to cancel ${id}:`, res.error)
      } else {
        result.cancelled++
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('restricted')) result.restrictedKey = true
      console.error(`[booking-reminders] failed to cancel ${id}:`, e)
    }
  }
  return result
}

/**
 * Calendar invite for a booking.
 *
 * `sequence` matters on a reschedule: RFC 5545 says a client updates an event
 * in place when it receives the same UID with a HIGHER sequence number. Send a
 * moved booking at sequence 0 and most clients ignore it, leaving the old time
 * sitting in the diary. The UID is the booking row id, so it is stable across
 * reschedules by construction.
 */
export function generateBookingIcs({
  title,
  startTime,
  durationMinutes,
  location,
  description,
  uid,
  sequence = 0,
}: {
  title: string
  startTime: string
  durationMinutes: number
  location: string
  description: string
  uid: string
  sequence?: number
}): string {
  const start = new Date(startTime)
  const end = new Date(start.getTime() + durationMinutes * 60_000)

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Body Recode//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}@bodyrecode.au`,
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
