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
 * Product-aware:
 *   - challenge:  confirms waitlist, sets exact launch moment,
 *                 IG follow CTA.
 *   - blueprint:  acknowledges Blueprint list, explains Blueprint lands
 *                 after the read, funnels to the free Challenge as the
 *                 read that comes first.
 *   - membership: same funnel pattern - Membership works on a body
 *                 that has already been read via the Challenge.
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
  if (product === 'challenge') return `${prefix} Doors open Monday 13 July.`
  if (product === 'blueprint') return `${prefix} The Challenge comes first.`
  return `${prefix} Start with the read.` // membership
}

function previewTextFor(product: WaitlistProduct): string {
  if (product === 'challenge') return 'The 14-Day Body Decode Challenge opens 7am AEST Monday 13 July. I will email you the moment doors open.'
  if (product === 'blueprint') return 'The Blueprint lands harder when your pattern is already identified. The 14-Day Challenge is the read that comes first. Free.'
  return 'The Membership works on a body that has already been read. The 14-Day Challenge is the read. Free.'
}

const IG_URL = 'https://www.instagram.com/body_recode_/'

function bodyFor(product: WaitlistProduct, firstName: string | null): string {
  const name = firstName?.trim() || 'there'

  if (product === 'challenge') {
    return `
${emailEyebrow('14-Day Body Decode Challenge · waitlist')}
${emailHeading(`You're on the list, ${name}.`)}
${emailDivider()}
${emailBody(`Hi ${name},`)}
${emailBody('Confirming you are on the waitlist for the 14-Day Body Decode Challenge.')}
${emailBody('The doors open at 7am AEST on Monday 13 July. I will email you the moment they do with the link to enrol. No card. No commitment.')}
${emailFeaturedCard(
  emailNumberedList([
    'A daily coaching note that sets the practice for the day',
    'A 14-day training plan calibrated to your state, not to a generic week',
    'A HABNS nutrition guide (Habit-Anchored, Body-Numeric, Sustainable)',
    'A morning and an evening reset sequence',
    'The Body Decode Check-In on Day 7',
    'The Body Decode Report on Day 14 - a personalised read of what your body has been telling you',
  ]),
  { eyebrow: 'What the 14 days actually look like' },
)}
${emailBody('This is not a program to grind through. It is a structure that lets your body settle enough that we can read what is actually going on.', { bottom: 28 })}
${emailBody('Nothing you need to do between now and Monday. If you want a sense of the read that comes at Day 14, the pattern breakdowns on Instagram are the best preview:', { bottom: 12 })}
${emailCta({ href: IG_URL, label: 'Follow @body_recode_ on Instagram' })}
${emailUrlFallback(IG_URL, 'The launch morning email lands in your inbox first.')}
`
  }

  if (product === 'blueprint') {
    return `
${emailEyebrow('6-Week Body Rewire Blueprint · waitlist')}
${emailHeading(`You're on the Blueprint list, ${name}.`)}
${emailDivider()}
${emailBody(`Hi ${name},`)}
${emailBody('Confirming you are on the waitlist for the 6-Week Body Rewire Blueprint.')}
${emailBody('The Blueprint will open in the weeks after the Challenge launches. It is designed to work on a body whose pattern has already been named - which is what the free 14-Day Body Decode Challenge does. The Challenge opens 7am AEST Monday 13 July. Take it first.')}
${emailFeaturedCard(`
  <p style="margin:0 0 10px;font-size:16px;font-weight:800;color:#1A1A1A;letter-spacing:-0.01em;line-height:1.35;">Why the Challenge comes first</p>
  <p style="margin:0;font-size:14px;color:#3A3A3A;line-height:1.7;">On Day 14 the Body Decode Report reveals the pattern your biology has settled into - what it means, the misreads it produces, and the three actions specific to it. Only then does the Blueprint know what to work on. Without the read, it is guessing.</p>
`, { eyebrow: 'The read before the prescription' })}
${emailBody('I will email you again the moment the Challenge doors open. The Blueprint waitlist stays live - the moment you have your Day 14 read, the Blueprint will be waiting.', { bottom: 28 })}
${emailCta({ href: IG_URL, label: 'Follow @body_recode_ on Instagram' })}
${emailUrlFallback(IG_URL, 'The launch morning email lands in your inbox first.')}
`
  }

  // membership
  return `
${emailEyebrow('Body Recode Membership · waitlist')}
${emailHeading(`You're on the Membership list, ${name}.`)}
${emailDivider()}
${emailBody(`Hi ${name},`)}
${emailBody('Confirming you are on the waitlist for the Body Recode Membership.')}
${emailBody('The Membership will open in the weeks after the Challenge launches. It is the long-arc coaching container - designed to run on a body whose pattern has already been read. That read is the free 14-Day Body Decode Challenge, and it opens 7am AEST Monday 13 July.')}
${emailFeaturedCard(`
  <p style="margin:0 0 10px;font-size:16px;font-weight:800;color:#1A1A1A;letter-spacing:-0.01em;line-height:1.35;">The read comes before the container</p>
  <p style="margin:0;font-size:14px;color:#3A3A3A;line-height:1.7;">The Membership is where the work becomes ongoing. But the coaching only lands when the pattern is known. Take the free 14-Day Challenge first - the Day 14 Report names what your biology has settled into, and the Membership picks up from there.</p>
`, { eyebrow: 'Why the Challenge comes first' })}
${emailBody('I will email you again the moment the Challenge doors open. The Membership waitlist stays live - the moment you have your Day 14 read, the Membership will be waiting.', { bottom: 28 })}
${emailCta({ href: IG_URL, label: 'Follow @body_recode_ on Instagram' })}
${emailUrlFallback(IG_URL, 'The launch morning email lands in your inbox first.')}
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
${emailBody('This lead is now on the launch-day broadcast queue and will receive that email at 7am AEST on Monday 13 July (or the wave-reopen equivalent).', { color: '#6B6B6B', size: 13, bottom: 12 })}
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
