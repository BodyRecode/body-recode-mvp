/**
 * Booking-flow email builders.
 *
 * Composition for the four emails in the call-booking flow:
 *   1. Custom time request      -> coach   (/api/book-request)
 *   2. Booking confirmation     -> lead    (/api/book-request)
 *   3. Call prep brief          -> coach   (/api/book-prep)
 *   4. Session confirmed        -> client  (/api/portal/reschedule-session)
 *
 * All four were originally hand-rolled inside their routes and drifted off
 * the house style. Worse, they carried a dark-theme leftover: value text in
 * Graphite (#1A1A1A) sitting on a near-black (#1a1a1a) card, which rendered
 * the preferred time and the session date invisible. They now compose from
 * the shared `email-shell` primitives like every other Body Recode email.
 *
 * Builders live here (not inline in the routes) so `scripts/preview-booking-
 * emails.ts` sends the exact same markup the routes send - a preview that
 * can drift from the real email is worse than no preview.
 */
import {
  darkEmailShell,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailBody,
  emailFeaturedCard,
  emailCta,
  emailUrlFallback,
  EMAIL_GRAPHITE,
  EMAIL_BODY,
  EMAIL_MUTED,
  EMAIL_BLUE_DARK,
  EMAIL_FF,
} from '@/lib/email-shell'
import { darkEmailSignature } from '@/lib/email-signature'

/** Graphite value line for a featured card (e.g. the requested time). Preserves line breaks. */
function valueLine(value: string): string {
  return `<p style="margin:0;font-size:16px;color:${EMAIL_GRAPHITE};line-height:1.6;white-space:pre-wrap;font-family:${EMAIL_FF};">${value}</p>`
}

/** Preformatted multi-line block for AI report / raw answers inside a card. */
function preBlock(text: string, color: string): string {
  return `<pre style="margin:0;font-family:${EMAIL_FF};font-size:14px;line-height:1.65;color:${color};white-space:pre-wrap;word-wrap:break-word;">${text}</pre>`
}

/** 1. Lead asked for a custom call time -> notify the coach. Reply-to is the lead. */
export function buildCustomTimeRequestEmail(opts: {
  name: string
  email: string
  phone?: string | null
  preferredTime: string
  note?: string | null
  leadUrl: string
}): { subject: string; html: string } {
  const subject = `Custom time request — ${opts.name}`
  const html = darkEmailShell(
    `${emailLogo(130)}
${emailEyebrow('New booking request')}
${emailHeading(subject, { size: 26 })}
${emailBody(`${opts.email}${opts.phone ? ' · ' + opts.phone : ''}`, { color: EMAIL_MUTED, size: 14, bottom: 10 })}
${emailBody('They want to book a call and suggested the times below — reply to this email to confirm and book them in.', { size: 15, bottom: 22 })}
${emailFeaturedCard(valueLine(opts.preferredTime), { eyebrow: 'Preferred time' })}
${opts.note ? emailFeaturedCard(valueLine(opts.note), { eyebrow: 'Note' }) : ''}
${emailCta({ href: opts.leadUrl, label: 'View lead →' })}
${darkEmailSignature()}`,
    { previewText: `${opts.name} suggested: ${opts.preferredTime}` },
  )
  return { subject, html }
}

/** 2. Confirm the request back to the lead + push them into the pre-call form. */
export function buildBookingConfirmationEmail(opts: {
  firstName: string
  preferredTime: string
  prepUrl: string
}): { subject: string; html: string } {
  const subject = `Got your time request, ${opts.firstName}`
  const html = darkEmailShell(
    `${emailLogo(150)}
${emailEyebrow('Booking request received')}
${emailHeading(`Thanks, ${opts.firstName}`)}
${emailBody("Got your request. I'll get back to you within 24 hours to either confirm the time or suggest the closest slot that works.")}
${emailFeaturedCard(valueLine(opts.preferredTime), { eyebrow: 'You requested' })}
${emailBody("One thing before we talk: please take 3-4 minutes to fill this in. It means I walk into our call already understanding where you're at, so we can go straight to what matters.")}
${emailCta({ href: opts.prepUrl, label: 'Complete this before our call →' })}
${emailUrlFallback(opts.prepUrl)}
${darkEmailSignature()}`,
    { previewText: "Got your request — I'll confirm within 24 hours." },
  )
  return { subject, html }
}

/** 3. Lead completed the pre-call form -> send the coach the AI prep read + raw answers. */
export function buildCallPrepEmail(opts: {
  name: string
  email: string
  report: string
  rawAnswers: string
  leadUrl: string
}): { subject: string; html: string } {
  const subject = `Call prep — ${opts.name}`
  const html = darkEmailShell(
    `${emailLogo(130)}
${emailEyebrow('Pre-call brief')}
${emailHeading(subject, { size: 26 })}
${emailBody(opts.email, { color: EMAIL_MUTED, size: 14, bottom: 10 })}
${emailBody('They completed the pre-call form. Here is your prep read.', { size: 15, bottom: 22 })}
${emailFeaturedCard(preBlock(opts.report, EMAIL_GRAPHITE))}
${emailFeaturedCard(preBlock(opts.rawAnswers || '(none)', EMAIL_BODY), { eyebrow: 'Their raw answers' })}
${emailCta({ href: opts.leadUrl, label: 'View lead →' })}
${darkEmailSignature()}`,
    { previewText: `Pre-call brief for ${opts.name}` },
  )
  return { subject, html }
}

/** 4. Client booked/rescheduled a face-to-face session -> confirm the slot to them. */
export function buildSessionConfirmedEmail(opts: {
  firstName: string
  displayDate: string
  displayTime: string
  durationMinutes: number
  location?: string
}): { subject: string; html: string } {
  const location = opts.location ?? 'AF Newstead'
  const subject = `Session booked: ${opts.displayDate} at ${opts.displayTime}`
  const html = darkEmailShell(
    `${emailLogo(130)}
${emailHeading('Session confirmed', { size: 28 })}
${emailBody(`Hey ${opts.firstName}, your session has been booked.`)}
${emailFeaturedCard(
      `<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${EMAIL_BLUE_DARK};letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FF};">Face-to-Face Session</p>
<p style="margin:0 0 4px;font-size:18px;font-weight:800;color:${EMAIL_GRAPHITE};font-family:${EMAIL_FF};">${opts.displayDate}</p>
<p style="margin:0;font-size:14px;color:${EMAIL_MUTED};font-family:${EMAIL_FF};">${opts.displayTime} · ${opts.durationMinutes} min · ${location}</p>`,
    )}
${emailBody('If you need to make any changes, log in to your client portal and visit the Sessions page.')}
${darkEmailSignature()}`,
    { previewText: subject },
  )
  return { subject, html }
}
