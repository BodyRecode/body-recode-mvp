import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell,
  emailUrlFallback,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailDivider,
  emailBody,
  emailCta,
} from './email-shell'

export type IntakeInviteMode = 'first_time' | 'reintake'

export interface IntakeInviteEmailParams {
  firstName: string
  intakeUrl: string
  mode: IntakeInviteMode
}

/**
 * Build the branded intake-invite email.
 *
 * `first_time` — for pre-coaching onboarding, sent when the client's foundational
 * intake hasn't been captured yet. Copy is orientation-forward ("before we
 * begin") and pitches the intake as the foundation of the coaching relationship.
 *
 * `reintake` — for existing clients who've been coaching for a stretch and are
 * at a natural reassessment point (block-end, life-context shift, post-travel,
 * etc.). Copy acknowledges the coaching is already underway, explains WHY a
 * fresh read is being asked for.
 *
 * TIME QUOTED IS 15-20 MINUTES, everywhere, on Kade's instruction (3 Sep 2026).
 * A previous note here argued the re-intake copy should say 30-40 because
 * "15-20 under-sold it". That was overruled: the surfaces disagreed with each
 * other (15-20, 30-40, 30-60) and 15-20 is the figure of record. Nobody has
 * ever measured it against submitted-intake timestamps, so if the number ever
 * needs defending, measure it first.
 */
export function buildIntakeInviteEmail({
  firstName,
  intakeUrl,
  mode,
}: IntakeInviteEmailParams): { subject: string; html: string; previewText: string } {
  const isReintake = mode === 'reintake'

  const subject = isReintake
    ? `${firstName}, time for a fresh intake`
    : `${firstName}, your Body Recode intake is ready`

  const previewText = isReintake
    ? `${firstName}, a reassessment intake so I can re-read where you're at.`
    : `${firstName}, your foundational intake is ready.`

  const eyebrow = isReintake ? 'Re-intake · Reassessment' : 'Foundational Intake'
  const heading = isReintake
    ? `${firstName}, time to re-read where you are.`
    : `${firstName}, your intake is ready.`

  const bodyParagraphs: string[] = []
  bodyParagraphs.push(emailBody(`Hi ${firstName},`))

  if (isReintake) {
    bodyParagraphs.push(
      emailBody(
        'You are further into coaching now than you were when we started, and enough has shifted (training exposure, stress patterns, sleep, life context) that your original intake is no longer an accurate picture. Rather than guess at how much has moved, I am asking you to work through the intake again. Same questions, fresh answers reflecting where you are today.',
      ),
    )
    bodyParagraphs.push(
      emailBody(
        'This is what tells me whether to hold the current phase, step up in the next training block, or adjust the nutrition frame. Fresh data in, better decisions out.',
      ),
    )
    bodyParagraphs.push(
      emailBody(
        'Give it 15 to 20 minutes when you have a quiet block. It is 234 questions, most of them quick. There are no right or wrong answers, just where you are at now, not your best or worst days.',
        { bottom: 28 },
      ),
    )
  } else {
    bodyParagraphs.push(
      emailBody(
        'Before we begin, I need you to complete your foundational intake. This is how I build an accurate picture of where you are starting from: your training history, recovery patterns, stress load, sleep, and lifestyle.',
      ),
    )
    bodyParagraphs.push(
      emailBody(
        'It takes around 15 to 20 minutes and there are no right or wrong answers. Just answer based on your typical experience, not your best or worst days. This intake forms the foundation of everything we do together, so take your time with it.',
        { bottom: 28 },
      ),
    )
  }

  const ctaLabel = isReintake ? 'Complete my re-intake' : 'Complete my intake'

  const html = darkEmailShell(
    `
${emailLogo()}
${emailEyebrow(eyebrow)}
${emailHeading(heading)}
${emailDivider()}
${bodyParagraphs.join('\n')}
${emailCta({ href: intakeUrl, label: ctaLabel })}
${emailUrlFallback(intakeUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`,
    { previewText },
  )

  return { subject, html, previewText }
}
