import { Resend } from 'resend'
import { fromCoach, fromBrand } from './email-shell'
import { coach } from '@/config/tenant'
import {
  collectiveShell, collectiveLogo, collectiveEyebrow, collectiveHeading,
  collectiveDivider, collectiveBody, collectiveCard, collectiveCta,
  collectiveSignature,
  COLLECTIVE_INK, COLLECTIVE_ACCENT, COLLECTIVE_MUTED, COLLECTIVE_FF,
} from './collective-email-shell'

/**
 * Body Recode Collective expression-of-interest emails. Fires from
 * /api/collective/submit after a coach completes the Fit Scorecard at
 * bodyrecode.au/collective/apply:
 *
 *   1. Applicant confirmation (to the coach who submitted). Warm-
 *      professional, sets the review timeline, invites patience. Does
 *      NOT reveal the internal fit tier (that's Kade's read).
 *   2. Kade notification (internal). Structured summary with tier
 *      badge + dimension scores + full applicant details + reply-to
 *      the applicant.
 *
 * Both use Collective-brand primitives (warm-charcoal, editorial
 * wordmark) distinct from the consumer BR emails. Coach-facing brand.
 */

export type FitTier = 'ready' | 'building' | 'not_yet'
/** One of 'green' | 'amber' | 'red' - mirrors Rating from collective-fit.ts. */
export type FitRating = 'green' | 'amber' | 'red'
export type FitDimensions = {
  method: FitRating
  audience: FitRating
  modality: FitRating
  readiness: FitRating
}

const RATING_LABEL: Record<FitRating, { label: string; color: string; bg: string }> = {
  green: { label: 'Strong',   color: '#0F5C36', bg: '#E6F4EC' },
  amber: { label: 'Building', color: '#7A5220', bg: '#FBEEDA' },
  red:   { label: 'Weak',     color: '#7A2418', bg: '#FBE3DC' },
}

// ──────────────────────────────────────────────────────────────────────
// Applicant confirmation
// ──────────────────────────────────────────────────────────────────────
export interface ApplicantConfirmationParams {
  to: string
  firstName: string
}

export function buildApplicantConfirmationEmail({
  firstName,
}: {
  firstName: string
}): { subject: string; html: string } {
  const name = firstName?.trim() || 'there'
  const subject = `Received - your Body Recode Collective application, ${name}.`

  const body = `
${collectiveLogo()}
${collectiveEyebrow('Application received')}
${collectiveHeading(`Thank you, ${name}.`)}
${collectiveDivider()}
${collectiveBody(`Hi ${name},`)}
${collectiveBody('Confirming your expression of interest for The Body Recode Collective has arrived.')}
${collectiveBody('The Collective is intentionally curated - we spend time reading every application against the four dimensions the Fit Scorecard measured (method, audience, modality, readiness). I sit with each one personally rather than sorting on volume, so expect a considered reply within 3-5 business days.')}
${collectiveCard(`
  <p style="margin:0 0 10px;font-size:15px;font-weight:800;color:${COLLECTIVE_INK};letter-spacing:-0.01em;line-height:1.35;font-family:${COLLECTIVE_FF};">What happens next</p>
  <p style="margin:0 0 8px;font-size:14px;color:${COLLECTIVE_MUTED};line-height:1.7;font-family:${COLLECTIVE_FF};"><strong style="color:${COLLECTIVE_INK};">If the fit is clear</strong> - I'll invite you to a 45-minute Foundation Call to walk through the platform, the doctrine, and whether the Collective is the right next step for your practice.</p>
  <p style="margin:0 0 8px;font-size:14px;color:${COLLECTIVE_MUTED};line-height:1.7;font-family:${COLLECTIVE_FF};"><strong style="color:${COLLECTIVE_INK};">If you're close but not quite</strong> - I'll share a resource pack and mark you for the next Founding Member cohort intake.</p>
  <p style="margin:0;font-size:14px;color:${COLLECTIVE_MUTED};line-height:1.7;font-family:${COLLECTIVE_FF};"><strong style="color:${COLLECTIVE_INK};">If the timing isn't right</strong> - I'll tell you plainly, and point you toward the pieces of the Body Recode engine that already answer what you asked about.</p>
`, { eyebrow: 'The reply you can expect' })}
${collectiveBody('Nothing you need to do in the meantime. If you want to see the platform under a coach who is already running it, the pattern breakdowns at bodyrecode.au/challenge are the shortest window into how the read + prescription work in practice.', { bottom: 22 })}
${collectiveCta({ href: 'https://bodyrecode.au/collective', label: 'Revisit The Collective overview' })}
${collectiveBody('Speak soon.', { muted: true, bottom: 6 })}
${collectiveSignature()}
`

  return {
    subject,
    html: collectiveShell(body, `A considered reply within 3-5 business days from Kade personally.`),
  }
}

export async function sendApplicantConfirmationEmail({
  to,
  firstName,
}: ApplicantConfirmationParams): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { subject, html } = buildApplicantConfirmationEmail({ firstName })
  try {
    const res = await resend.emails.send({
      from: fromCoach(),
      to,
      bcc: coach().email,
      subject,
      html,
    })
    if (res.error) return { ok: false, error: res.error.message }
    return { ok: true, id: res.data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ──────────────────────────────────────────────────────────────────────
// Kade coach notification (internal)
// ──────────────────────────────────────────────────────────────────────
export interface CoachApplicationNotifyParams {
  applicantName: string
  email: string
  businessName?: string | null
  phone?: string | null
  website?: string | null
  heardFrom?: string | null
  modality?: string | null
  oneLiner?: string | null
  methodClarity?: string | null
  trackRecord?: string | null
  audience?: string | null
  audienceSize?: string | null
  currentSetup?: string[] | null
  whatsBroken?: string | null
  timeline?: string | null
  mindset?: string | null
  tier: FitTier
  dimensions: FitDimensions
}

const TIER_META: Record<FitTier, { label: string; color: string; bg: string; border: string; blurb: string }> = {
  ready:    { label: 'Collective-ready', color: '#0F5C36', bg: '#E6F4EC', border: '#B4DDC5', blurb: 'Method, audience, modality, and readiness all strong. Prime candidate for the Foundation Call.' },
  building: { label: 'Building',         color: '#7A5220', bg: '#FBEEDA', border: '#EDD3A6', blurb: 'Close but one dimension is still forming. Resource pack + revisit at next cohort intake.' },
  not_yet:  { label: 'Not yet',          color: '#7A2418', bg: '#FBE3DC', border: '#EDBAAF', blurb: 'Timing or fundamentals not aligned yet. Send a considered decline pointing at the engine layer.' },
}

export function buildCoachApplicationNotifyEmail(p: CoachApplicationNotifyParams): { subject: string; html: string } {
  const t = TIER_META[p.tier]
  const subject = `${t.label === 'Collective-ready' ? '🟢' : t.label === 'Building' ? '🟡' : '🔴'} New Collective application - ${p.applicantName} (${t.label})`
  const firstName = p.applicantName.split(' ')[0] || p.applicantName

  const tierBlock = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 20px;"><tr><td>
      <div style="background:${t.bg};border:1px solid ${t.border};border-radius:12px;padding:16px 18px;font-family:${COLLECTIVE_FF};">
        <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:0.16em;color:${t.color};text-transform:uppercase;">Fit tier</p>
        <p style="margin:6px 0 4px;font-size:22px;font-weight:800;color:${t.color};letter-spacing:-0.01em;">${t.label}</p>
        <p style="margin:0;font-size:13px;color:#3A3A3A;line-height:1.6;">${t.blurb}</p>
      </div>
    </td></tr></table>
  `

  const dimRow = (label: string, rating: FitRating) => {
    const r = RATING_LABEL[rating]
    return `
    <tr>
      <td style="padding:6px 14px 6px 0;font-size:12px;color:${COLLECTIVE_MUTED};text-transform:uppercase;letter-spacing:0.12em;font-weight:700;font-family:${COLLECTIVE_FF};white-space:nowrap;">${label}</td>
      <td style="padding:6px 0;font-size:14px;font-family:${COLLECTIVE_FF};font-weight:700;">
        <span style="display:inline-block;padding:3px 10px;border-radius:99px;background:${r.bg};color:${r.color};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">${r.label}</span>
      </td>
    </tr>`
  }

  const dims = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 8px;">
      ${dimRow('Method', p.dimensions.method)}
      ${dimRow('Audience', p.dimensions.audience)}
      ${dimRow('Modality', p.dimensions.modality)}
      ${dimRow('Readiness', p.dimensions.readiness)}
    </table>
  `

  const escapeHtml = (s: string): string => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

  const kv = (label: string, value: string | null | undefined | string[]): string => {
    const raw = Array.isArray(value) ? value.filter(Boolean).join(', ') : (value ?? '')
    const v = raw?.trim()
    if (!v) return ''
    return `
      <tr>
        <td style="padding:8px 14px 8px 0;font-size:11px;color:${COLLECTIVE_MUTED};text-transform:uppercase;letter-spacing:0.12em;font-weight:700;font-family:${COLLECTIVE_FF};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;font-size:14px;color:${COLLECTIVE_INK};line-height:1.55;font-family:${COLLECTIVE_FF};">${escapeHtml(v)}</td>
      </tr>`
  }

  const detailsTable = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
      ${kv('Name', p.applicantName)}
      ${kv('Business', p.businessName)}
      ${kv('Email', p.email)}
      ${kv('Phone', p.phone)}
      ${kv('Website', p.website)}
      ${kv('Modality', p.modality)}
      ${kv('One-liner', p.oneLiner)}
      ${kv('Method clarity', p.methodClarity)}
      ${kv('Track record', p.trackRecord)}
      ${kv('Audience', p.audience)}
      ${kv('Audience size', p.audienceSize)}
      ${kv('Current setup', p.currentSetup ?? null)}
      ${kv("What's broken", p.whatsBroken)}
      ${kv('Timeline', p.timeline)}
      ${kv('Mindset', p.mindset)}
      ${kv('Heard via', p.heardFrom)}
    </table>
  `

  const body = `
${collectiveLogo()}
${collectiveEyebrow('New expression of interest')}
${collectiveHeading(`New Collective application`)}
${collectiveDivider()}
${collectiveBody(`${p.applicantName} just completed the Fit Scorecard. Tier + dimensions below; scan and decide how to reply.`, { muted: true, bottom: 22 })}
${tierBlock}
${collectiveCard(dims, { eyebrow: 'Dimension scores' })}
${collectiveCard(detailsTable, { eyebrow: 'Applicant details' })}
${collectiveCta({ href: `mailto:${p.email}?subject=${encodeURIComponent(`Re: your Body Recode Collective application, ${firstName}`)}`, label: `Reply to ${firstName}` })}
${collectiveSignature()}
`

  return {
    subject,
    html: collectiveShell(body, `Fit ${t.label} · Method ${p.dimensions.method} · Audience ${p.dimensions.audience} · Modality ${p.dimensions.modality} · Readiness ${p.dimensions.readiness}`),
  }
}

export async function sendCoachApplicationNotifyEmail(
  p: CoachApplicationNotifyParams,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { subject, html } = buildCoachApplicationNotifyEmail(p)
  try {
    const res = await resend.emails.send({
      from: fromBrand(),
      to: coach().email,
      replyTo: p.email,
      subject,
      html,
    })
    if (res.error) return { ok: false, error: res.error.message }
    return { ok: true, id: res.data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
