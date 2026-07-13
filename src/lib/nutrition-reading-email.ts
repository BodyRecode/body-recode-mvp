import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailBody,
  emailCta,
  emailUrlFallback,
} from './email-shell'

export interface NutritionReadingEmailParams {
  firstName: string
  planName: string
  portalUrl: string
}

export function buildNutritionReadingEmail({
  firstName,
  planName,
  portalUrl,
}: NutritionReadingEmailParams): { subject: string; html: string } {
  const subject = `${firstName}, your new nutrition plan is ready`

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Nutrition Reading')}
${emailHeading(`Your new nutrition plan is ready, ${escapeHtml(firstName)}.`)}
${emailBody(`${escapeHtml(planName)} is live in your portal. Before the meals, you will find your Nutrition Reading: the read of what this plan is for, what it is asking of your body, and how we will know it is working.`)}
${emailBody(`The reading sits at the top of your plan so the why frames how you eat to it.`)}
${emailCta({ href: portalUrl, label: 'Open your nutrition plan' })}
${emailBody('Take a minute to read the framing before you sit down to your first meal of the week. It is short and it sets the lens.', { size: 13, color: '#6B6B6B' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`, { previewText: subject })

  return { subject, html }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
