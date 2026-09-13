/**
 * The coaching commencement fee email. One template, used by every path that
 * sends it: the lead's Send to Client button, the client-stage button, and any
 * preview sent to the coach.
 *
 * Until 14 Sep 2026 the lead route and the client route each carried their own
 * hand-rolled copy of this email, from before the branded helpers existed. The
 * two had already drifted (different closing line, different preview text),
 * and neither matched the layout every other email to a lead now uses. Kade
 * previewed it before sending it to a new lead and said it was not the correct
 * template. It wasn't.
 *
 * Copy is Kade's, 14 Sep: the $297 covers onboarding, which finishes with the
 * Foundational Read, and the Progress Check at 12 weeks. He calls it the
 * commencement fee. Never describe it as one-off or a single assessment.
 */

import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailDivider,
  emailBody,
  emailCallout,
  emailStatusCard,
  emailCta,
  emailUrlFallback,
} from '@/lib/email-shell'

export function buildCommencementFeeEmail(opts: { firstName: string; checkoutUrl: string }) {
  const { firstName, checkoutUrl } = opts
  const subject = `${firstName}, your coaching commencement fee`
  const html = darkEmailShell(
    `
${emailLogo()}
${emailEyebrow('Coaching Commencement')}
${emailHeading(`Let's get you started, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('Here is the link for your coaching commencement fee. It covers your onboarding, which finishes with your Foundational Read, the full read I do on your body before we start so your program is built around where your body actually is, and your Progress Check at 12 weeks to see what has changed.', { bottom: 24 })}
${emailCallout({ eyebrow: 'Commencement fee', value: '$297' })}
${emailStatusCard({
  eyebrow: 'Once it is paid',
  headline: 'Your portal unlocks straight away',
  body: 'Your portal access, intake and the first foundational steps unlock automatically. You will get a welcome email with everything you need to start the next stage.',
})}
${emailCta({ href: checkoutUrl, label: 'Pay your commencement fee' })}
${emailUrlFallback(checkoutUrl)}
${emailBody('If anything comes up before you pay, reply to this email.', { size: 14, bottom: 0 })}
${darkEmailSignature()}
`,
    { previewText: `${firstName}, your coaching commencement fee link.` }
  )
  return { subject, html }
}
