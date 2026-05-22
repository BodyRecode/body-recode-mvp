/**
 * Shared builder for coach-facing notification emails sent when a client
 * completes a portal task (baseline, intake, agreement, health declaration,
 * medical clearance, weekly check-in, session confirmations and reschedules,
 * portal messages, feedback / refer / pause requests).
 *
 * Composes from the design helpers in `src/lib/email-shell.ts` so every
 * coach notification renders in the same visual language as client-facing
 * mail — Pure White canvas, Graphite Black headings, Signal Blue accents
 * (or amber / red for non-default accent contexts).
 *
 * Migrated 2026-05-22 (Phase 2 of the email design migration) from the
 * hand-rolled dark-card-on-white version. Same callsite contract; only
 * the rendered output changes.
 */

import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, EMAIL_BLUE, EMAIL_MUTED, EMAIL_BODY_SOFT, EMAIL_FF,
} from '@/lib/email-shell'
import { darkEmailSignature } from '@/lib/email-signature'

export interface CoachNotificationParams {
  /** Small uppercase label above the heading (e.g. "BASELINE", "INTAKE") */
  eyebrow: string
  /** Main headline (e.g. "Samantha submitted their baseline") */
  heading: string
  /** One or more paragraphs of body copy */
  body: string | string[]
  /** Optional bulleted list rendered between body and CTA */
  details?: string[]
  /** Primary CTA */
  ctaLabel: string
  ctaUrl: string
  /** Optional secondary muted note shown below the CTA */
  footnote?: string
  /** Accent colour for the eyebrow + divider + CTA. Defaults to Signal Blue. */
  accent?: 'teal' | 'amber' | 'red'
}

const ACCENT_COLORS: Record<NonNullable<CoachNotificationParams['accent']>, string> = {
  teal:  EMAIL_BLUE,   // historical name — actually Signal Blue since the palette overhaul
  amber: '#B7791F',
  red:   '#DC2626',
}

function renderDetails(items: string[]): string {
  const lis = items
    .map(d => `<li style="margin-bottom:6px;color:${EMAIL_BODY_SOFT};">${d}</li>`)
    .join('')
  return `<ul style="padding-left:20px;margin:0 0 22px;font-size:14px;line-height:1.7;color:${EMAIL_BODY_SOFT};font-family:${EMAIL_FF};">${lis}</ul>`
}

export function buildCoachNotificationEmail({
  eyebrow,
  heading,
  body,
  details,
  ctaLabel,
  ctaUrl,
  footnote,
  accent = 'teal',
}: CoachNotificationParams): string {
  const accentColor = ACCENT_COLORS[accent]
  const paragraphs = Array.isArray(body) ? body : [body]
  const lastIdx = paragraphs.length - 1

  const bodyBlocks = paragraphs
    .map((p, i) => emailBody(p, { bottom: i === lastIdx ? 24 : 14 }))
    .join('')

  const inner = `
${emailLogo()}
${emailEyebrow(eyebrow, accentColor)}
${emailHeading(heading)}
${emailDivider(accentColor)}
${bodyBlocks}
${details && details.length > 0 ? renderDetails(details) : ''}
${emailCta({ href: ctaUrl, label: ctaLabel, bg: accentColor })}
${emailUrlFallback(ctaUrl)}
${footnote ? emailBody(footnote, { size: 12, color: EMAIL_MUTED, bottom: 0 }) : ''}
${darkEmailSignature()}
`

  return darkEmailShell(inner, { previewText: heading })
}
