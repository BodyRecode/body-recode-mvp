import { Resend } from 'resend'
import {
  darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailFeaturedCard, emailNumberedList, emailCallout, fromCoach,
} from './email-shell'
import { darkEmailSignature } from './email-signature'
import { coach } from '@/config/tenant'
import { PRICE_YEAR, PRICE_MONTH } from './rey-founding'

/**
 * Sent once, when a woman joins the founding list on bodyrecode.au/founding
 * (the Rey price test, 14 Sep 2026).
 *
 * The page promised exactly two things: the price she saw is the price she
 * keeps, and she hears from us when it opens. This email confirms those two
 * things and nothing else. It does not sell, does not name a launch date, and
 * does not name the app, because the name is not cleared yet.
 *
 * BCC Kade, same as the other lead-facing waitlist confirmations.
 */

export function buildFoundingConfirmationEmail(firstName: string | null): { subject: string; html: string } {
  const name = firstName?.trim() || null
  const subject = name ? `You're on the founding list, ${name}` : `You're on the founding list`
  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Founding list')}
${emailHeading(name ? `You're in, ${name}.` : `You're in.`)}
${emailDivider()}
${emailBody(`Confirming you are on the founding list for the new app from Body Recode.`)}
${emailBody(`It is not built yet. When it opens, the founding list gets in first, and I will email you the moment that happens.`)}
${emailCallout({ eyebrow: 'Your founding price', value: `$${PRICE_YEAR}`, unit: `a year, or $${PRICE_MONTH} a month` })}
${emailBody(`That is the price you keep for as long as you stay subscribed. Nothing to pay now.`)}
${emailFeaturedCard(
  emailNumberedList([
    'Your full read, written for you: what your body is doing, why, and what it usually gets mistaken for',
    'Training and nutrition built from that read, starting where you are: gym, home, or not training yet',
    'A coach in your ear through every session, adjusting to how you feel that day',
    'A weekly check-in that changes the plan, and a fresh read every 12 weeks',
  ]),
  { eyebrow: 'What you are on the list for' },
)}
${emailBody(`If you change your mind, reply to this email and I will take you off the list.`)}
${darkEmailSignature()}
`, { previewText: `You are on the founding list. Your price is $${PRICE_YEAR} a year, kept for as long as you stay.` })
  return { subject, html }
}

export async function sendFoundingConfirmationEmail(to: string, firstName: string | null): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' }
  const { subject, html } = buildFoundingConfirmationEmail(firstName)
  try {
    const res = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: fromCoach(),
      to,
      bcc: coach().email,
      subject,
      html,
    })
    if (res.error) return { ok: false, error: res.error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
