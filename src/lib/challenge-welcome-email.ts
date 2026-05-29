import { Resend } from 'resend'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList,
} from './email-shell'
import { darkEmailSignature } from './email-signature'

export interface ChallengeWelcomeParams {
  to: string
  firstName: string
  portalUrl: string
  returning?: boolean
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

export async function sendChallengeWelcomeEmail({
  to,
  firstName,
  portalUrl,
  returning = false,
}: ChallengeWelcomeParams): Promise<ChallengeWelcomeResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY missing' }
  }

  const resend = new Resend(apiKey)

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
    'Your morning and evening reset sequences',
    'The Body Decode Check-In — unlocks on Day 7',
  ]),
  { eyebrow: 'Inside your challenge portal' },
)}
${emailBody(
  returning
    ? 'Pick up where you are. Follow the structure. The system carries the load, not you.'
    : 'Start simple. Follow the structure. Do not try to be perfect on Day 1.',
  { bottom: 28 },
)}
${emailCta({ href: portalUrl, label: 'Open my challenge portal' })}
${emailUrlFallback(portalUrl, 'Bookmark this link — your portal for the full 14 days')}
`)

  try {
    const { data, error } = await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
