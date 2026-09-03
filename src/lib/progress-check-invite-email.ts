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
  /** Her portal home. The email sends her there rather than deep into the form. */
  portalUrl: string
}

/**
 * Build the branded Progress Check invite email.
 *
 * The Progress Check is the re-assessment a client completes at block-end. Its
 * answers let the system re-read where the client sits now (Depleted /
 * Transitioning / Ready) and produce the Progress Read.
 *
 * It is far lighter than the 230-question intake, but it is NOT five minutes:
 * as of 27 Aug it also requires her measurements and three photos, which is
 * what finally makes a before-and-after possible. This email has to say so.
 * A client who opens it expecting five minutes and meets a tape measure has
 * been ambushed, and the one who abandons there loses her answers too.
 *
 * The email links to her PORTAL, not into the form. One front door: she goes
 * where she always goes, and the Progress Check is waiting there under This
 * week. A deep link into a form is also a link that outlives its context - it
 * still resolves weeks later, from an old email, out of sequence.
 */
export function buildProgressCheckInviteEmail({
  firstName,
  portalUrl,
}: ProgressCheckInviteEmailParams): { subject: string; html: string; previewText: string } {
  const subject = `${firstName}, your Progress Check before the next block`
  const previewText = `${firstName}, a few questions plus your measurements and photos, so I can re-read where you're at.`

  const bodyParagraphs = [
    emailBody(`Hi ${firstName},`),
    emailBody(
      'You have just finished a block, so this is a good moment to stop and take stock. Before I read the whole block back to you, I want a fresh sense of where you are sitting right now: your energy, your recovery, your stress, how training and food have been landing.',
    ),
    emailBody(
      'It is a handful of questions - ten minutes or so. There are no right or wrong answers, just where you are at today, not your best or worst days.',
    ),
    emailBody(
      'Two things to have ready before you start: your scales and a tape measure, and somewhere you can take three photos - front, side and back. Both are needed to finish. They are the part that lets me show you what has changed rather than just tell you, and only I ever see the photos.',
    ),
    emailBody(
      'Open your portal and it is waiting under This week. Once you have done it, I will read it alongside your weekly check-ins and send through your Progress Read: where your body started this block, where it sits now, and what that sets up next.',
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
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`,
    { previewText },
  )

  return { subject, html, previewText }
}
