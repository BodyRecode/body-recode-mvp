// Digital asset delivery email builder.
//
// Sent by the Stripe webhook on `digital_asset_purchase` checkout.session.completed
// when fulfilment_kind = 'instant_pdf'. Carries the PDF download URL + a
// reader URL (if the buyer has portal entitlement) + a state-matched
// ascension CTA pulled from digital_asset_metadata.ascension_cta_path.
//
// Returns {subject, html} so the preview route /dashboard/preview/digital-asset-emails
// can render exactly what gets sent. Composed from email-shell helpers, sits
// on darkEmailShell (which produces a LIGHT email despite the legacy name —
// see project_dark_email_shell_rename memory).

import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailStatusCard,
} from './email-shell'

export function buildDigitalAssetDeliveryEmail({
  firstName,
  productTitle,
  pdfUrl,
  readerUrl,
  ascensionCtaLabel,
  ascensionCtaUrl,
}: {
  firstName: string
  productTitle: string
  pdfUrl: string
  readerUrl: string | null
  ascensionCtaLabel: string
  ascensionCtaUrl: string
}): { subject: string; html: string } {
  const subject = `${productTitle} — your download is ready`

  const readerLine = readerUrl
    ? emailBody(`If you would rather read it inside your portal, that link is below as well.`)
    : ''

  const readerCta = readerUrl
    ? `${emailCta({ href: readerUrl, label: 'Read in your portal' })}
${emailUrlFallback(readerUrl, 'Or paste the reader link into your browser')}`
    : ''

  const inner = `
${emailLogo()}
${emailEyebrow('Body Recode Library')}
${emailHeading(`Your ${productTitle} is ready, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Thanks for grabbing ${productTitle}. The PDF is yours — download it, save it, mark it up. It is written to be read once and referenced often.`)}
${readerLine}
${emailCta({ href: pdfUrl, label: 'Download the PDF' })}
${emailUrlFallback(pdfUrl, 'Or paste this link into your browser')}
${readerCta}
${emailStatusCard({
  eyebrow: 'When you have read it',
  headline: ascensionCtaLabel,
  body: 'The Field Guide tells you what the work is. The next rung gives you the structure to actually do it.',
})}
${emailCta({ href: ascensionCtaUrl, label: ascensionCtaLabel })}
${emailUrlFallback(ascensionCtaUrl, 'Or paste this link into your browser')}
${emailBody('Or just reply to this email if you want to talk through where to start. I read every reply personally.', { size: 14, bottom: 0 })}
${darkEmailSignature()}
`

  return {
    subject,
    html: darkEmailShell(inner, { previewText: `${firstName}, your ${productTitle} PDF is ready.` }),
  }
}

// ─── Ascension CTA mapping by state (Q3 from Reconcile §6) ───────────────
// Locked 2026-06-06. The ascension target depends on which state the
// buyer was matched to (or the bundle they bought). Used by the Stripe
// webhook when composing the delivery email — the metadata sits on the
// digital_asset_metadata.ascension_cta_path column but the LABEL is
// resolved here so it stays in sync with the rest of the funnel copy.

export type AscensionTarget =
  | 'depleted'      // → /challenge
  | 'transitioning' // → /blueprint
  | 'ready'         // → /membership
  | 'bundle'        // → /membership (bundle signals higher intent)

export function ascensionCtaFor(
  target: AscensionTarget,
  source: string,
): { label: string; url: string } {
  const base = 'https://bodyrecode.au'
  switch (target) {
    case 'depleted':
      return {
        label: 'Start the 14-Day Body Decode Challenge — free',
        url: `${base}/challenge?source=${source}`,
      }
    case 'transitioning':
      return {
        label: 'Start the 6-Week Body Rewire Blueprint — $97',
        url: `${base}/blueprint?source=${source}`,
      }
    case 'ready':
      return {
        label: 'Join the Body Recode Membership — $49/week',
        url: `${base}/membership?source=${source}`,
      }
    case 'bundle':
      return {
        label: 'Join the Body Recode Membership — $49/week',
        url: `${base}/membership?source=${source}`,
      }
  }
}
