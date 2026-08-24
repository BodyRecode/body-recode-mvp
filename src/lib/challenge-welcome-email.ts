import { Resend } from 'resend'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList, emailStatusCard,
} from './email-shell'
import { darkEmailSignature } from './email-signature'
import { fromCoach, fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'

export interface ChallengeWelcomeParams {
  to: string
  firstName: string
  portalUrl: string
  returning?: boolean
  /** 'decode' sends The Body Decode welcome. Anything else keeps the Challenge one. */
  product?: string
}

export interface ChallengeWelcomeResult {
  ok: boolean
  id?: string
  error?: string
}

function challengeEmailShell(body: string): string {
  return darkEmailShell(`
${emailLogo()}
${body}
${darkEmailSignature()}
`)
}

// Pure builder: returns {subject, html} so the preview route can render the
// exact bytes that get sent. Send path below composes this and hands the
// HTML to Resend.
export function buildChallengeWelcomeEmail({
  firstName,
  portalUrl,
  returning = false,
}: {
  firstName: string
  portalUrl: string
  returning?: boolean
}): { subject: string; html: string } {
  const subject = returning
    ? `Here is your challenge portal link, ${firstName}.`
    : `You're in, ${firstName}. Day 1 starts now.`

  const heading = returning ? `Welcome back, ${firstName}.` : `Welcome in, ${firstName}.`

  const intro = returning
    ? [
      `Hi ${firstName},`,
      'You are already enrolled in the 14-Day Body Decode Challenge. Here is your portal link again so you can pick up where you left off.',
    ]
    : [
      `Hi ${firstName},`,
      'You are in. Day 1 starts today.',
      'Over the next 14 days you will follow a simple structure designed to calm your system, rebuild your baseline, and help you understand what is actually driving the way your body looks and feels.',
    ]

  const html = challengeEmailShell(`
${emailEyebrow('14-Day Body Decode Challenge')}
${emailHeading(heading)}
${emailDivider()}
${intro.map(line => emailBody(line)).join('\n')}
${emailFeaturedCard(
  emailNumberedList([
    'Your daily coaching note — opens each morning',
    'Your 14-day training plan',
    'Your HABNS nutrition guide',
    'Your Morning Reset Sequence and Evening Rhythm Sequence',
    'Week One Progress Session — unlocks Day 5',
    'The Body Decode Check-In — unlocks Day 7',
    'Your Body Decode Report — released Day 14',
  ]),
  { eyebrow: 'Inside your challenge portal' },
)}
${emailBody(
  returning
    ? 'Pick up where you are. Follow the structure. The system carries the load, not you.'
    : 'Start simple. Follow the structure. Do not try to be perfect on Day 1.',
  { bottom: 28 },
)}
${emailBody('Your first step inside: a quick scorecard that reads your starting point. A couple of minutes, then your 14 days begin.', { bottom: 20 })}
${emailCta({ href: portalUrl, label: 'Open my challenge portal' })}
${emailUrlFallback(portalUrl, 'Bookmark this link — your portal for the full 14 days')}
${emailBody('Not seeing our emails? Check your junk or spam folder and move this one to your inbox (or mark it "not spam"). That way your daily coaching and reminders land every morning.')}
`)

  return { subject, html }
}

/**
 * The Body Decode welcome.
 *
 * ADDED 25 Aug 2026, after a signup received the Challenge welcome: subject
 * "You're in, {name}. Day 1 starts now", body "over the next 14 days", and a
 * contents list promising a 14-day training plan, the HABNS nutrition guide,
 * the Morning Reset and Evening Rhythm sequences, a Day 7 Check-In and a Day 14
 * report. NONE of that exists in The Body Decode. She is asked for nothing
 * across the five days, which is the entire point of the rebuild.
 *
 * The cutover on 24 Aug moved the landing page and the portal hub but never
 * touched this send, because the enrol route is shared and the email was one
 * call inside it with no product argument to branch on.
 *
 * NO DAY-COUNT LANGUAGE AND NOTHING TO COMPLY WITH, matching
 * decode-daily-emails.ts. There is no streak to praise here.
 *
 * The CTA label is state-neutral on purpose. Signup redirects her straight
 * into the portal, so by the time she opens this she has usually already
 * answered the questions - and the hub renders either the intake or her read
 * depending on which. "Start the questions" would be wrong for most readers.
 */
export function buildBodyDecodeWelcomeEmail({
  firstName,
  portalUrl,
  returning = false,
}: {
  firstName: string
  portalUrl: string
  returning?: boolean
}): { subject: string; html: string } {
  const subject = returning
    ? `Here is your Body Decode link again, ${firstName}.`
    : `${firstName}, your report is waiting.`

  const heading = returning ? `Welcome back, ${firstName}.` : `You are in, ${firstName}.`

  const intro = returning
    ? [
      `Hi ${firstName},`,
      'Here is your link back into The Body Decode. Your report is where you left it, and it stays there.',
    ]
    : [
      `Hi ${firstName},`,
      'About two minutes of questions, and then your report opens. All of it, straight away.',
      'Nothing is kept back and nothing unlocks later.',
    ]

  const html = challengeEmailShell(`
${emailEyebrow('The Body Decode')}
${emailHeading(heading)}
${emailDivider()}
${intro.map(line => emailBody(line)).join('\n')}
${emailFeaturedCard(
  emailNumberedList([
    'Five things about you, scored out of three',
    'Your two lowest, named',
    'Which pattern is yours, and why it is happening',
    'Where you will recognise it in an ordinary week',
    'What it usually gets mistaken for, and the three things that shift it',
  ]),
  { eyebrow: 'What your report gives you' },
)}
${emailBody('Then five short videos, one a day, walking you through it a part at a time, because it is a lot to take in at once.', { bottom: 28 })}
${emailBody('It is free, and there is nothing to buy to get it.', { bottom: 20 })}
${emailCta({ href: portalUrl, label: 'Open my Body Decode' })}
${emailUrlFallback(portalUrl, 'Bookmark this link — it is the way back to your report any time')}
${emailBody('Not seeing our emails? Check your junk or spam folder and move this one to your inbox (or mark it "not spam"), so each day\'s video lands.')}
`)

  return { subject, html }
}

export async function sendChallengeWelcomeEmail({
  to,
  firstName,
  portalUrl,
  returning = false,
  product,
}: ChallengeWelcomeParams): Promise<ChallengeWelcomeResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY missing' }
  }

  const resend = new Resend(apiKey)
  const build = product === 'decode' ? buildBodyDecodeWelcomeEmail : buildChallengeWelcomeEmail
  const { subject, html } = build({ firstName, portalUrl, returning })

  try {
    const { data, error } = await resend.emails.send({
      from: fromCoach(),
      to,
      subject,
      html,
    })
    if (error) {
      return { ok: false, error: error.message ?? JSON.stringify(error) }
    }
    return { ok: true, id: data?.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export interface CoachEnrollmentNotifyParams {
  firstName: string
  email: string
  phone?: string
  portalUrl: string
  returning?: boolean
}

export async function sendCoachEnrollmentNotification({
  firstName,
  email,
  phone,
  portalUrl,
  returning = false,
}: CoachEnrollmentNotifyParams): Promise<ChallengeWelcomeResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY missing' }
  }

  const resend = new Resend(apiKey)
  const enrolledAt = new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const subject = returning
    ? `Re-signup - ${firstName} (existing enrollment)`
    : `New enrollment - ${firstName}`

  const headline = returning
    ? `${firstName} re-submitted the signup form.`
    : `${firstName} just enrolled.`

  const cardBody = returning
    ? `Phone: ${phone ?? 'Not provided'}. Re-submitted: ${enrolledAt} (AEST). They already had an active enrollment - existing token returned, portal link re-sent. No new drip scheduled.`
    : `Phone: ${phone ?? 'Not provided'}. Enrolled: ${enrolledAt} (AEST). 14-day automated drip + SMS sequence is now firing.`

  const html = challengeEmailShell(`
${emailEyebrow(returning ? 'Challenge Re-Signup' : 'New Challenge Enrollment')}
${emailHeading(headline)}
${emailDivider()}
${emailStatusCard({
  eyebrow: 'Enrollment details',
  headline: `${firstName} · ${email}`,
  body: cardBody,
})}
${emailCta({ href: portalUrl, label: 'View their portal' })}
`)

  try {
    const { data, error } = await resend.emails.send({
      from: fromBrand(),
      to: coach().email,
      subject,
      html,
    })
    if (error) {
      return { ok: false, error: error.message ?? JSON.stringify(error) }
    }
    return { ok: true, id: data?.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
