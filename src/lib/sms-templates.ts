/**
 * SMS copy for speed-to-lead triggers.
 *
 * Voice rules (per feedback_spoken_script_voice + feedback_no_em_dashes):
 *   - Signed off "-K" (not "Kade")
 *   - Contractions natural ("here's", "you're")
 *   - No exclamation marks
 *   - Hyphens, not em dashes
 *   - Every message includes "STOP to opt out" for Aussie Spam Act compliance
 *   - Aim for <= 160 chars (1 segment) after interpolation
 */

import { coach, brand } from '@/config/tenant'

type TemplateInputs = {
  firstName?: string | null
  bookingUrl?: string
}

/** Scorecard just completed. Warmest possible trigger. */
export function tplScorecardCompleted({ firstName, bookingUrl }: TemplateInputs): string {
  const name = firstName ? `Hi ${firstName}, ` : 'Hi, '
  const c = coach()
  const url = bookingUrl ?? `${brand().marketingDomain}/book`
  return `${name}${c.firstName} here. Got your Body State Scorecard. Want to talk through your pattern? Book: ${url}. STOP to opt out. -${c.firstName[0]}`
}

/** Challenge just enrolled (Funnel B). */
export function tplChallengeEnrolled({ firstName }: TemplateInputs): string {
  const name = firstName ? `Hi ${firstName}, ` : 'Hi, '
  const c = coach()
  return `${name}welcome to the 14-Day Body Decode. Day 1 lands tomorrow morning. STOP to opt out. -${c.firstName[0]}`
}

/** Report just purchased. */
export function tplPurchaseReport({ firstName, bookingUrl }: TemplateInputs): string {
  const name = firstName ? `Hi ${firstName}, ` : 'Hi, '
  const c = coach()
  const url = bookingUrl ?? `${brand().marketingDomain}/book`
  return `${name}your Body Decode Report is on the way. Want to book a call to walk through it? ${url}. STOP to opt out. -${c.firstName[0]}`
}

/** Zoom no-show reminder. */
export function tplNoShowReminder({ firstName, bookingUrl }: TemplateInputs): string {
  const name = firstName ? `Hi ${firstName}, ` : 'Hi, '
  const c = coach()
  const url = bookingUrl ?? `${brand().marketingDomain}/book`
  return `${name}we had a call scheduled and I missed you. Grab a new time: ${url}. STOP to opt out. -${c.firstName[0]}`
}
