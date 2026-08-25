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
  return `${name}${c.firstName} here. Got your Readiness Scorecard. Want to talk through your pattern? Book: ${url}. STOP to opt out. -${c.firstName[0]}`
}

/**
 * Challenge just enrolled (Funnel B).
 *
 * RETIRED COPY, DELIBERATELY LEFT ACCURATE. It names the 14-Day product because
 * that is the only thing it can now be sent to: speed-to-lead-challenge returns
 * early for product 'decode' (25 Aug 2026), and nothing creates a Challenge
 * enrolment any more because /challenge redirects. Rewording it to say "Body
 * Decode" would make it a lie about whichever product it did reach.
 *
 * The Body Decode sends its own SMS from decode-daily-arc. There is nothing for
 * this template to do there.
 */
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

/** Waitlist joined (pre-launch). Kept product-agnostic so the same template
 *  serves Blueprint / Membership / Extension waitlist joiners.
 *
 *  THE FALLBACK NAMES NO PRODUCT. It used to default to '14-Day Body Decode',
 *  which was retired on 24 Aug 2026 - so any caller that forgot productName
 *  would have texted someone the name of a product that no longer exists. Every
 *  live caller passes it (blueprint, membership, extension); no page offers a
 *  Challenge waitlist any more. */
export function tplWaitlistJoined({ firstName, productName }: TemplateInputs & { productName?: string }): string {
  const name = firstName ? `Hi ${firstName}, ` : 'Hi, '
  const c = coach()
  const product = productName ?? 'programme you asked about'
  return `${name}${c.firstName} here. You are on the list for the ${product}. I will text you the moment doors open. STOP to opt out. -${c.firstName[0]}`
}
