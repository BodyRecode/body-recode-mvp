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

export interface CoachInviteEmailParams {
  fullName: string
  businessName: string
  acceptUrl: string
  /** Who invited them, for the one line that says who this is from. */
  invitedByName: string
  /** Days until the link stops working, so the email can say it plainly. */
  expiresInDays: number
}

/**
 * The invitation to become a coach on the platform.
 *
 * Written 19 September 2026 for the capped pilot. It replaces the only method
 * that existed: Kade signing in, filling in a provisioning form and typing
 * somebody else's password for them. That does not scale past about three
 * people and it means no coach ever sets their own credentials.
 *
 * Deliberately plain. This goes to practitioners being invited into a pilot,
 * not to leads, so it sells nothing and promises nothing. It says what the
 * platform is, what they are being asked to do, how long the link lasts, and
 * nothing else. No unsubscribe footer: an invitation to a named person who
 * agreed to be invited is transactional, not marketing.
 */
export function buildCoachInviteEmail({
  fullName,
  businessName,
  acceptUrl,
  invitedByName,
  expiresInDays,
}: CoachInviteEmailParams): { subject: string; html: string; previewText: string } {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName

  const subject = `${firstName}, your Body Recode coach account`
  const previewText = `Set your password and sign in. The link lasts ${expiresInDays} days.`

  const body = [
    emailBody(`Hi ${firstName},`),
    emailBody(
      `${invitedByName} has set up a Body Recode coach account for ${businessName}. This is the platform that reads a client's assessment and tells you what is actually going on with them, before anything is prescribed, and then keeps reading as they change.`,
    ),
    emailBody(
      'Click below to set your own password and sign in. Nobody else knows it, including us, and you can change it whenever you like.',
    ),
    emailBody(
      'You will land on an empty dashboard, which is correct: you only ever see your own clients, never anybody else\'s, and nobody sees yours. Add your first client whenever you are ready.',
      { bottom: 28 },
    ),
  ]

  const html = darkEmailShell(
    `
${emailLogo()}
${emailEyebrow('Coach account')}
${emailHeading(`${firstName}, your account is ready.`)}
${emailDivider()}
${body.join('\n')}
${emailCta({ href: acceptUrl, label: 'Set my password' })}
${emailUrlFallback(acceptUrl, 'Or paste this link into your browser')}
${emailBody(`This link works once and expires in ${expiresInDays} days. If it has run out, reply to this email and a fresh one will be sent.`, { bottom: 8 })}
${darkEmailSignature()}
`,
    { previewText },
  )

  return { subject, html, previewText }
}
