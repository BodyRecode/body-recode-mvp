import { darkEmailSignature, type SignatureCoach } from './email-signature'
import { darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailBody, emailCta, emailUrlFallback } from './email-shell'

/**
 * "Your Progress Read is ready." Sent only when the coach clicks Notify on a
 * published Progress Read (coach-gated, separate from publishing, like every
 * other read). Links to her portal page for it.
 */
export function buildProgressReadEmail({ firstName, portalUrl, signature }: {
  firstName: string
  portalUrl: string
  /** Who signs it. Omit for the tenant's own coach. */
  signature?: SignatureCoach
}): { subject: string; html: string } {
  const subject = `${firstName}, your Progress Read is ready`
  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Progress Read')}
${emailHeading(`Here is what has moved, ${escapeHtml(firstName)}.`)}
${emailBody('Your Progress Read is in your portal. It reads everything since your last read: your Progress Check, your measurements and photos, and your weekly check-ins, and sets where you are now against where you were.')}
${emailBody('It covers what has changed, what has held steady, your pattern, and what is holding things back right now. Holding steady counts: it is often the result that matters most.')}
${emailCta({ href: portalUrl, label: 'Read your Progress Read' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature(signature)}
`, { previewText: subject })
  return { subject, html }
}

function escapeHtml(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
