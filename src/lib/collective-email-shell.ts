/**
 * Body Recode Collective email primitives.
 *
 * The Collective is the B2B partner programme (locked 2026-07-08 per
 * project_body_recode_collective). Distinct visual identity from
 * consumer BR emails so coach-facing sends read as their own brand:
 *
 *   Consumer BR:   Signal Blue (#1B6DFC), DNA-double-helix logo,
 *                  broad practitioner voice.
 *   The Collective: warm-charcoal (#2C2418) accent, editorial serif-ish
 *                   wordmark, coach-facing voice ("a collective of
 *                   coaches practising to one standard").
 *
 * Reuses the same underlying darkEmailShell + Outlook-safe HTML
 * primitives from email-shell.ts - just distinct wrappers so we don't
 * fork the design system. Adds `socialIconStrip()` from the shared
 * signature so the same 4-icon set appears on Collective emails too.
 *
 * Use these instead of consumer emailLogo/emailEyebrow/emailCta/
 * darkEmailSignature when composing a Collective-brand email.
 */

import { darkEmailShell } from './email-shell'
import { socialIconStrip } from './email-signature'

// ── Palette ────────────────────────────────────────────────────────────
export const COLLECTIVE_INK = '#1A1A1A'
export const COLLECTIVE_ACCENT = '#2C2418'          // warm charcoal
export const COLLECTIVE_ACCENT_SOFT = '#F3EFE9'     // pale cream
export const COLLECTIVE_ACCENT_BORDER = '#D9D2C4'   // warm hairline
export const COLLECTIVE_MUTED = '#6B6B6B'
export const COLLECTIVE_BODY = '#3A3A3A'
export const COLLECTIVE_FF = `-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`

// ── Wordmark (top-of-email) ────────────────────────────────────────────
/**
 * Editorial wordmark: small BODY RECODE eyebrow above a large "The Collective"
 * heading. Sits at the top of every Collective email in place of the
 * consumer DNA-double-helix logo.
 */
export function collectiveLogo(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td>
    <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:0.28em;color:${COLLECTIVE_ACCENT};text-transform:uppercase;font-family:${COLLECTIVE_FF};">Body Recode</p>
    <p style="margin:2px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.015em;color:${COLLECTIVE_INK};font-family:${COLLECTIVE_FF};">The Collective</p>
  </td></tr></table>`
}

// ── Text primitives ────────────────────────────────────────────────────
export function collectiveEyebrow(text: string): string {
  return `<p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:0.14em;color:${COLLECTIVE_ACCENT};text-transform:uppercase;font-family:${COLLECTIVE_FF};">${text}</p>`
}

export function collectiveHeading(text: string): string {
  return `<h1 style="margin:0 0 18px;font-size:26px;font-weight:800;color:${COLLECTIVE_INK};letter-spacing:-0.02em;line-height:1.25;font-family:${COLLECTIVE_FF};">${text}</h1>`
}

export function collectiveDivider(): string {
  return `<div style="width:40px;height:2px;background:${COLLECTIVE_ACCENT};margin:0 0 22px;"></div>`
}

export function collectiveBody(text: string, opts: { bottom?: number; muted?: boolean } = {}): string {
  const bottom = opts.bottom ?? 16
  const color = opts.muted ? COLLECTIVE_MUTED : COLLECTIVE_BODY
  return `<p style="margin:0 0 ${bottom}px;font-size:15px;color:${color};line-height:1.75;font-family:${COLLECTIVE_FF};">${text}</p>`
}

// ── Featured card ──────────────────────────────────────────────────────
export function collectiveCard(inner: string, opts: { eyebrow?: string } = {}): string {
  const eyebrow = opts.eyebrow
    ? `<p style="margin:0 0 12px;font-size:10px;font-weight:800;letter-spacing:0.16em;color:${COLLECTIVE_ACCENT};text-transform:uppercase;font-family:${COLLECTIVE_FF};">${opts.eyebrow}</p>`
    : ''
  return `<div style="background:${COLLECTIVE_ACCENT_SOFT};border:1px solid ${COLLECTIVE_ACCENT_BORDER};border-radius:14px;padding:20px 22px;margin:16px 0 24px;font-family:${COLLECTIVE_FF};">${eyebrow}${inner}</div>`
}

// ── CTA button (charcoal, not Signal Blue) ─────────────────────────────
export function collectiveCta({ href, label }: { href: string; label: string }): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 12px;"><tr><td>
    <a href="${href}" style="display:inline-block;background:${COLLECTIVE_INK};color:#FFFFFF;font-weight:700;font-size:14px;padding:14px 22px;border-radius:10px;text-decoration:none;font-family:${COLLECTIVE_FF};">${label}</a>
  </td></tr></table>`
}

// ── Signature (brand-first, no Kade personal photo) ────────────────────
/**
 * Collective signature is brand-first, not founder-first. No personal
 * headshot; the Collective is a programme, not one person's coaching.
 * Includes the shared socialIconStrip so the same 4-icon set appears
 * on Collective emails as on consumer BR emails.
 */
export function collectiveSignature(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;margin-top:32px;border-top:1px solid #E5E5E5;width:100%;">
      <tr>
        <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:20px 0 0;font-family:${COLLECTIVE_FF};">
          <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:0.28em;color:${COLLECTIVE_ACCENT};text-transform:uppercase;">Body Recode</p>
          <p style="margin:2px 0 8px;font-size:20px;font-weight:800;letter-spacing:-0.015em;color:${COLLECTIVE_INK};">The Collective</p>
          <p style="margin:0;font-size:13px;color:${COLLECTIVE_MUTED};line-height:1.65;">A collective of coaches practising to one standard.</p>
          <p style="margin:8px 0 0;font-size:12px;color:${COLLECTIVE_MUTED};">
            <a href="https://bodyrecode.au/collective" style="color:${COLLECTIVE_MUTED};text-decoration:none;">bodyrecode.au/collective</a>
            &nbsp;·&nbsp;
            <a href="mailto:kade@bodyrecode.au" style="color:${COLLECTIVE_MUTED};text-decoration:none;">kade@bodyrecode.au</a>
          </p>
        </td>
      </tr>
    </table>
    ${socialIconStrip()}
  `
}

// ── Public shell wrapper ───────────────────────────────────────────────
/**
 * Wrap a Collective email body in the shared darkEmailShell (light Pure
 * White canvas, Outlook-safe, color-scheme:light-only). Same shell the
 * consumer emails use - only the content wrappers differ.
 */
export function collectiveShell(body: string, previewText?: string): string {
  return darkEmailShell(body, previewText ? { previewText } : undefined)
}
