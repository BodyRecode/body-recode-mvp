/**
 * Booking Agent — branded email assembler.
 *
 * Takes the LLM's structured copy (greeting/sign-off excluded) and wraps it in
 * the shared Body Recode email shell: logo, greeting, body paragraphs, an
 * optional held-slots card (Vicki-style), the CTA button + Safe-Links
 * fallback, a "Talk soon," sign-off, and Kade's signature.
 *
 * Used by BOTH the initial draft and the "save edits" path, so an edited
 * touch re-renders through exactly the same shell.
 */

import {
  darkEmailShell,
  emailLogo,
  emailBody,
  emailFeaturedCard,
  emailCta,
  emailUrlFallback,
  EMAIL_GRAPHITE,
  EMAIL_FF,
} from '@/lib/email-shell'
import { darkEmailSignature } from '@/lib/email-signature'

export interface AssembleTouchInput {
  firstName: string
  paragraphs: string[]
  ctaLabel: string
  ctaUrl: string
  previewText?: string
  /** Optional held slots to show in a card (labels already formatted for display). */
  slots?: string[]
}

function slotRow(label: string): string {
  return `<p style="margin:0 0 6px;font-size:16px;color:${EMAIL_GRAPHITE};line-height:1.6;font-family:${EMAIL_FF};"><strong style="font-weight:800;">${label}</strong></p>`
}

export function assembleTouchHtml(input: AssembleTouchInput): string {
  const body = input.paragraphs.map(p => emailBody(p)).join('\n')

  const slotsCard =
    input.slots && input.slots.length > 0
      ? emailFeaturedCard(input.slots.map(slotRow).join('\n'), { eyebrow: 'Times I have held open (Brisbane)' })
      : ''

  const inner = `${emailLogo(130)}
${emailBody(`Hi ${input.firstName},`)}
${body}
${slotsCard}
${emailCta({ href: input.ctaUrl, label: input.ctaLabel })}
${emailUrlFallback(input.ctaUrl)}
${emailBody('Talk soon,')}
${darkEmailSignature()}`

  return darkEmailShell(inner, { previewText: input.previewText })
}
