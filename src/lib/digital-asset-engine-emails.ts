// Email builders for the instant_engine fulfilment branch (Phase C bolt_on_ai).
//
// Two emails per purchase:
//   1. "Generating" — sent immediately by the Stripe webhook so the buyer
//      knows the order landed and an engine run is in progress.
//   2. "Ready" — sent by the Inngest fulfilment function when the PDF has
//      been rendered and uploaded to the library.
//
// Composed from email-shell helpers, sits on darkEmailShell (which produces
// a LIGHT email despite the legacy name — see [[project_dark_email_shell_rename]]).

import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailStatusCard,
} from './email-shell'

export function buildDeepDiveGeneratingEmail({
  firstName,
  productTitle,
  etaMinutes,
}: {
  firstName: string
  productTitle: string
  etaMinutes: number
}): { subject: string; html: string } {
  const subject = `${productTitle} is being generated`

  const inner = `
${emailLogo()}
${emailEyebrow('Body Recode AI Deep-Dive')}
${emailHeading(`Generating your ${productTitle}, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Thanks for ordering the ${productTitle}. Your AI deep-dive is now in the engine. The reading reads your actual data and writes a personalised document. That takes a few minutes - the typical run is under ${etaMinutes} minutes.`)}
${emailBody(`As soon as it is ready, you will get a second email with the PDF and a reader link. No action needed from you.`)}
${emailStatusCard({
  eyebrow: 'What happens next',
  headline: 'You will get the ready email shortly.',
  body: 'If you have not received the second email within 30 minutes, reply to this email and we will look into it.',
})}
${darkEmailSignature()}
`
  return { subject, html: darkEmailShell(inner, { previewText: `Generating your ${productTitle}.` }) }
}

export function buildDeepDiveReadyEmail({
  firstName,
  productTitle,
  pdfUrl,
  readerUrl,
}: {
  firstName: string
  productTitle: string
  pdfUrl: string
  readerUrl: string | null
}): { subject: string; html: string } {
  const subject = `${productTitle} is ready`

  const readerCta = readerUrl
    ? `${emailCta({ href: readerUrl, label: 'Read in your library' })}
${emailUrlFallback(readerUrl, 'Or paste the reader link into your browser')}`
    : ''

  const inner = `
${emailLogo()}
${emailEyebrow('Body Recode AI Deep-Dive')}
${emailHeading(`Your ${productTitle} is ready, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`The engine has finished its run. Your deep-dive is written, rendered, and waiting for you. The PDF is yours - download it, save it, return to it later.`)}
${emailCta({ href: pdfUrl, label: 'Download the PDF' })}
${emailUrlFallback(pdfUrl, 'Or paste this link into your browser')}
${readerCta}
${emailStatusCard({
  eyebrow: 'How to read it',
  headline: 'Read it once, slow. Then return to it during the next block.',
  body: 'Deep-dives surface signal the day-to-day programming cannot. Mark it up. Bring observations into your next weekly check-in.',
})}
${darkEmailSignature()}
`
  return { subject, html: darkEmailShell(inner, { previewText: `Your ${productTitle} is ready in your library.` }) }
}
