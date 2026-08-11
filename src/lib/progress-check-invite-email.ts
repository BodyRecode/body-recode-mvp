import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell,
  emailUrlFallback,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailDivider,
  emailBody,
  emailCta,
} from './email-shell'

export interface ProgressCheckInviteEmailParams {
  firstName: string
  checkUrl: string
}

/**
 * Build the branded Progress Check invite email.
 *
 * The Progress Check is the short re-assessment a client completes at block-end.
 * Its answers let the system re-read where the client sits now (Depleted /
 * Transitioning / Ready) and produce the Progress Read. This is deliberately
 * light: a handful of questions, five minutes, not the 221-question intake.
 */
export function buildProgressCheckInviteEmail({
  firstName,
  checkUrl,
}: ProgressCheckInviteEmailParams): { subject: string; html: string; previewText: string } {
  const subject = `${firstName}, quick Progress Check before your next block`
  const previewText = `${firstName}, a five-minute check-in so I can re-read where you're at.`

  const bodyParagraphs = [
    emailBody(`Hi ${firstName},`),
    emailBody(
      'You have just finished a block, so this is a good moment to stop and take stock. Before I read the whole block back to you, I want a fresh sense of where you are sitting right now: your energy, your recovery, your stress, how training and food have been landing.',
    ),
    emailBody(
      'This is short. A handful of questions, about five minutes. There are no right or wrong answers, just where you are at today, not your best or worst days.',
    ),
    emailBody(
      'Once you have done it, I will read it alongside your weekly check-ins and send through your Progress Read: where your body started this block, where it sits now, and what that sets up next.',
      { bottom: 28 },
    ),
  ]

  const html = darkEmailShell(
    `
${emailLogo()}
${emailEyebrow('Progress Check')}
${emailHeading(`${firstName}, let's see how far this block moved you.`)}
${emailDivider()}
${bodyParagraphs.join('\n')}
${emailCta({ href: checkUrl, label: 'Start my Progress Check' })}
${emailUrlFallback(checkUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`,
    { previewText },
  )

  return { subject, html, previewText }
}
