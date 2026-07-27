import { Resend } from 'resend'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList,
  fromCoach, fromBrand,
} from './email-shell'
import { darkEmailSignature } from './email-signature'
import { coach } from '@/config/tenant'

/**
 * Confirmation email fired immediately after a NEW insert into
 * product_waitlist for challenge / blueprint / membership. Fills the
 * previously-silent gap between "user clicks Join waitlist" and the
 * Mon 13 Jul 7am launch-day broadcast (scripts/launch-day-waitlist-email).
 *
 * Distinct from:
 *   - Challenge WELCOME email (challenge-welcome-email.ts): fires on
 *     actual challenge_enrollment after doors open. Gives portal link.
 *   - Launch-Day Waitlist broadcast: manual script on Mon 13 Jul that
 *     converts every un-notified waitlist row into an enrolment CTA.
 *
 * Product-aware and state-matched (per project_bodystate_stage_recommendation_mapping):
 *   - challenge:   Depleted-state matched. Body is in protection mode;
 *                  Challenge is the free structured reset.
 *   - blueprint:   Transitioning-state matched. Foundation is there;
 *                  a specific pattern is holding the result back.
 *                  Blueprint is 6 weeks of pattern-specific corrective
 *                  work. Soft mention of the Challenge as an optional
 *                  free open door (mirrors the scorecard result page's
 *                  soft opt-in).
 *   - membership:  Ready-state matched. Foundation is done; what's
 *                  left is calibrated continuation across rotating
 *                  blocks. $49/week ongoing, cancel anytime. Same soft
 *                  Challenge mention.
 *
 * NB: launch dates are deliberately NOT written into this email. They kept
 * going stale (Challenge shipped, Blueprint was pushed back). The email says
 * "I'll email you the moment doors open"; the launch-day broadcast delivers
 * the actual date. Do not re-introduce hardcoded dates here.
 *
 * Voice matches the documented BR brand voice: clear, warm, authority
 * with restraint. No hype, no scarcity language, no fake urgency.
 */

export type WaitlistProduct = 'challenge' | 'blueprint' | 'membership'

export interface ProductWaitlistWelcomeParams {
  to: string
  firstName: string | null
  product: WaitlistProduct
}

export interface ProductWaitlistWelcomeResult {
  ok: boolean
  id?: string
  error?: string
}

function shell(body: string, previewText?: string): string {
  return darkEmailShell(`
${emailLogo()}
${body}
${darkEmailSignature()}
`, previewText ? { previewText } : undefined)
}

// ── Copy per product ────────────────────────────────────────────────────

function subjectFor(product: WaitlistProduct, firstName: string | null): string {
  const name = firstName?.trim() || null
  const prefix = name ? `You're on the list, ${name}.` : `You're on the list.`
  if (product === 'challenge') return `${prefix} I'll email you the moment doors open.`
  if (product === 'blueprint') return `${prefix} I'll email you the moment the Blueprint opens.`
  return `${prefix} I'll email you the moment the Membership opens.` // membership
}

function previewTextFor(product: WaitlistProduct): string {
  if (product === 'challenge') return 'You are on the waitlist for the 14-Day Body Decode Challenge. I will email you the moment doors open with the link to enrol.'
  if (product === 'blueprint') return 'You are on the waitlist for the 6-Week Body Rewire Blueprint. Six weeks of pattern-specific corrective work, calibrated to a Transitioning-state result. I will email you the moment doors open.'
  return 'You are on the waitlist for the Body Recode Membership. Long-arc infrastructure calibrated to a Ready-state result. $49 per week, cancel anytime. I will email you the moment doors open.'
}

const IG_URL_BRAND = 'https://www.instagram.com/body_recode_/'
const IG_URL_KADE = 'https://www.instagram.com/kade_dunstone_/'

function bodyFor(product: WaitlistProduct, firstName: string | null): string {
  const name = firstName?.trim() || 'there'

  if (product === 'challenge') {
    return `
${emailEyebrow('14-Day Body Decode Challenge · waitlist')}
${emailHeading(`You're on the list, ${name}.`)}
${emailDivider()}
${emailBody(`Hi ${name},`)}
${emailBody('Confirming you are on the waitlist for the 14-Day Body Decode Challenge.')}
${emailBody('I will email you the moment doors open with the link to enrol. No card. No commitment.')}
${emailFeaturedCard(
  emailNumberedList([
    'A daily coaching note that sets the practice for the day',
    'A 14-day training plan calibrated to your state, not to a generic week',
    'A HABNS nutrition guide (Habit-Anchored, Body-Numeric, Sustainable)',
    'A Morning Reset Sequence and an Evening Rhythm Sequence',
    'The Week One Progress Session on Day 5 - the first checkpoint of how your body is responding',
    'The Body Decode Check-In on Day 7',
    'The Body Decode Report on Day 14 - a personalised read of what your body has been telling you',
  ]),
  { eyebrow: 'What the 14 days actually look like' },
)}
${emailBody('This is not a program to grind through. It is a structure that lets your body settle enough that we can read what is actually going on.', { bottom: 28 })}
${emailBody('Nothing you need to do right now. If you want a sense of the read that comes at Day 14, the pattern breakdowns on Instagram are the best preview:', { bottom: 12 })}
${emailCta({ href: IG_URL_BRAND, label: 'Follow @body_recode_ on Instagram' })}
${emailCta({ href: IG_URL_KADE, label: 'Follow @kade_dunstone_ on Instagram' })}
${emailUrlFallback(IG_URL_BRAND, 'The launch morning email lands in your inbox first.')}
`
  }

  if (product === 'blueprint') {
    return `
${emailEyebrow('6-Week Body Rewire Blueprint · waitlist')}
${emailHeading(`You're on the Blueprint list, ${name}.`)}
${emailDivider()}
${emailBody(`Hi ${name},`)}
${emailBody('Confirming you are on the waitlist for the 6-Week Body Rewire Blueprint. I will email you the moment doors open with the link to enrol.')}
${emailBody('Your scorecard placed you in the Transitioning State - the foundation is there, but a specific compensation pattern is still holding the result back. That is precisely the shape the Blueprint is written for.')}
${emailFeaturedCard(
  emailNumberedList([
    'Training calibrated to your pattern (not to a generic week)',
    'Nutrition timed to clear the noise around the pattern',
    'Weekly coaching notes written for what your body is actually doing this week',
    'A Week 3 Check-In that recalibrates the second half based on your first-half response',
    'A Week 6 Report at the end - the pattern named, corrected, and the next-arc call',
  ]),
  { eyebrow: 'What the six weeks actually look like' },
)}
${emailBody('The Blueprint costs $97 one-time. No subscription. The 6 weeks land in your portal on Day 1 and you keep everything after.', { bottom: 28 })}
${emailFeaturedCard(`
  <p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#1A1A1A;letter-spacing:0.02em;line-height:1.35;text-transform:uppercase;">Optional · ease in first</p>
  <p style="margin:0;font-size:14px;color:#3A3A3A;line-height:1.7;">Your result points to the Blueprint, but it is a recommendation, not a gate. If you would rather start with the free 14-Day Body Decode Challenge and see what your Day 14 Report says before committing to the Blueprint, that path is open. You sign up on the Challenge page, and the first step inside is a quick scorecard that reads your state.</p>
`, { eyebrow: undefined })}
${emailBody('Nothing you need to do right now. If you want a sense of the corrective work the Blueprint does, the pattern breakdowns on Instagram are the best preview:', { bottom: 12 })}
${emailCta({ href: IG_URL_BRAND, label: 'Follow @body_recode_ on Instagram' })}
${emailCta({ href: IG_URL_KADE, label: 'Follow @kade_dunstone_ on Instagram' })}
${emailUrlFallback(IG_URL_BRAND, 'The Blueprint opening email lands in your inbox first.')}
`
  }

  // membership
  return `
${emailEyebrow('Body Recode Membership · waitlist')}
${emailHeading(`You're on the Membership list, ${name}.`)}
${emailDivider()}
${emailBody(`Hi ${name},`)}
${emailBody('Confirming you are on the waitlist for the Body Recode Membership. I will email you the moment doors open with the link to enrol.')}
${emailBody('Your scorecard placed you in the Ready State - your biology is in a position to respond, and the foundation is done. What is left is calibrated continuation across rotating training blocks. That is exactly what the Membership is built for.')}
${emailFeaturedCard(
  emailNumberedList([
    'Rotating training blocks (capacity, expression, restoration) written to your pattern',
    'Nutrition kept simple and calibrated block-to-block',
    'A weekly Check-In that shapes the coming week',
    'A monthly Loom from Kade reading your check-in data - the block-boundary call, what to lean into, what to hold back',
    'Direct access to the coaching thread for questions between check-ins',
  ]),
  { eyebrow: 'What the Membership actually is' },
)}
${emailBody('The Membership is $49 per week. Cancel anytime, no contract, no minimum term. The infrastructure is designed to compound over time, but the door out is open whenever you want it.', { bottom: 28 })}
${emailFeaturedCard(`
  <p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#1A1A1A;letter-spacing:0.02em;line-height:1.35;text-transform:uppercase;">Optional · ease in first</p>
  <p style="margin:0;font-size:14px;color:#3A3A3A;line-height:1.7;">Your result points to the Membership, but it is a recommendation, not a gate. If you would rather start with the free 14-Day Body Decode Challenge to see the work firsthand before committing to the long arc, that path is open. You sign up on the Challenge page, and the first step inside is a quick scorecard that reads your state.</p>
`, { eyebrow: undefined })}
${emailBody('Nothing you need to do right now. If you want a sense of what the ongoing work looks like, the pattern breakdowns on Instagram are the best preview:', { bottom: 12 })}
${emailCta({ href: IG_URL_BRAND, label: 'Follow @body_recode_ on Instagram' })}
${emailCta({ href: IG_URL_KADE, label: 'Follow @kade_dunstone_ on Instagram' })}
${emailUrlFallback(IG_URL_BRAND, 'The Membership opening email lands in your inbox first.')}
`
}

// ── Public builder + sender ─────────────────────────────────────────────

export function buildProductWaitlistWelcomeEmail({
  firstName,
  product,
}: {
  firstName: string | null
  product: WaitlistProduct
}): { subject: string; html: string } {
  const subject = subjectFor(product, firstName)
  const html = shell(bodyFor(product, firstName), previewTextFor(product))
  return { subject, html }
}

export async function sendProductWaitlistWelcomeEmail({
  to,
  firstName,
  product,
}: ProductWaitlistWelcomeParams): Promise<ProductWaitlistWelcomeResult> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY not set' }
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { subject, html } = buildProductWaitlistWelcomeEmail({ firstName, product })

  try {
    // BCC coach so Kade sees exactly what the joiner received. BCC (not CC)
    // keeps his address invisible to the joiner - standard for founder-side
    // visibility on lead-facing sends.
    const res = await resend.emails.send({
      from: fromCoach(),
      to,
      bcc: coach().email,
      subject,
      html,
    })
    if (res.error) return { ok: false, error: res.error.message }
    return { ok: true, id: res.data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Coach notification (Kade only) ──────────────────────────────────────

/**
 * Separate structured notification email to Kade. Fires alongside the
 * joiner welcome (not instead of the BCC - both fire). Purpose: a
 * scan-in-two-seconds summary of who joined so Kade can decide whether
 * to reply personally on IG / email if the row deserves a warm touch.
 */
export interface CoachWaitlistNotifyParams {
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  gender: string | null
  bodyState: string | null
  product: WaitlistProduct
  source: string | null
  smsOptIn: boolean
}

export async function sendCoachWaitlistNotification(
  params: CoachWaitlistNotifyParams,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' }
  const resend = new Resend(process.env.RESEND_API_KEY)

  const fullName = [params.firstName, params.lastName].filter(Boolean).join(' ').trim() || null
  const productLabel =
    params.product === 'challenge' ? '14-Day Body Decode Challenge' :
    params.product === 'blueprint' ? '6-Week Body Rewire Blueprint' :
                                     'Body Recode Membership'
  const subject = fullName
    ? `New waitlist signup · ${productLabel} · ${fullName}`
    : `New waitlist signup · ${productLabel} · ${params.email}`

  const rows: Array<[string, string | null]> = [
    ['Product', productLabel],
    ['Name', fullName],
    ['Email', params.email],
    ['Phone', params.phone],
    ['SMS opt-in', params.smsOptIn ? 'yes' : 'no'],
    ['Gender', params.gender],
    ['Body state', params.bodyState],
    ['Source', params.source],
  ]

  const rowsHtml = rows
    .map(([label, value]) => `
      <tr>
        <td style="padding:8px 14px 8px 0;font-size:12px;color:#6B6B6B;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;white-space:nowrap;vertical-align:top;">${label}</td>
        <td style="padding:8px 0;font-size:14px;color:#1A1A1A;line-height:1.6;">${value ? escapeHtml(value) : '<span style="color:#999;font-style:italic;">-</span>'}</td>
      </tr>`)
    .join('\n')

  const body = `
${emailLogo()}
${emailEyebrow('Waitlist signup')}
${emailHeading(`New ${productLabel} waitlist signup`)}
${emailDivider()}
${emailBody('A new lead joined the waitlist. Scan the details below and decide whether to reach out personally (IG DM, email reply, or wait for the launch-day broadcast).', { color: '#3A3A3A', size: 15, bottom: 20 })}
${emailFeaturedCard(`<table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>`, { eyebrow: 'Lead details' })}
${emailBody('This lead is now on the launch-day broadcast queue and will receive that email the moment doors open.', { color: '#6B6B6B', size: 13, bottom: 12 })}
${darkEmailSignature()}
`

  try {
    const res = await resend.emails.send({
      from: fromBrand(),
      to: coach().email,
      subject,
      html: darkEmailShell(body, { previewText: `${fullName ?? params.email} · ${productLabel}` }),
    })
    if (res.error) return { ok: false, error: res.error.message }
    return { ok: true, id: res.data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
