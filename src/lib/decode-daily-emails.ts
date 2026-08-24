// The Body Decode — the five daily emails, plus the one nudge.
//
// WHY THIS EXISTS, and it is the whole reason the product was rebuilt.
//
// The Challenge lost 14 of the 15 people who cleared every form between Day 1
// and Day 14. The Day 7 Check-In prompts did not exist in code until 3 August,
// so 28 of 29 enrolments went through a funnel that never once asked them to
// come back. Building the portal without these sends would repeat that exactly:
// five good pages nobody returns to.
//
// SHAPE. One email a day for five days, each pointing at that day's lesson.
// They are short on purpose. The reading happens in the portal, not the inbox,
// so an email that restates the lesson gives her a reason NOT to open it.
//
// EVERY SEND LOGS. `project_checkin_prompt_logging_and_cohort` is explicit:
// any email on a gating funnel step MUST log, or its completion number cannot
// be interpreted. Without it "ignored the prompt" and "never got one" look
// identical, which is precisely why the Challenge's central number took two
// months to establish. The Inngest function writes a lead event per send.
//
// NO DAY-COUNT LANGUAGE THAT ASSUMES COMPLIANCE. The Challenge emails praised
// people for streaks ("you have made it to Day 5, that puts you ahead of most
// people who started"). There is nothing to comply with here, so nothing to
// congratulate. Opening a page is not an achievement and treating it as one
// makes the whole thing feel like homework.

import {
  darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailDivider,
  emailBody, emailCta, emailUrlFallback, emailCallout,
} from './email-shell'
import { darkEmailSignature } from './email-signature'
import { DECODE_DAYS } from './decode-days'

function decodeShell(body: string, previewText: string): string {
  return darkEmailShell(`
${emailLogo()}
${body}
${darkEmailSignature()}
`, { previewText })
}

/** Per-day email copy. Kept beside the day definitions so they cannot drift. */
const DAY_EMAIL: Record<number, { subject: (n: string) => string; preview: string; lines: string[]; cta: string }> = {
  1: {
    subject: n => `${n}, your two lowest scores`,
    preview: 'The two that decide whether any of the training turns into anything.',
    lines: [
      'Your read has five scores in it. Today is about the two at the bottom.',
      'They are almost always sleep and stress load, and they are almost always the two nobody has ever measured. They decide whether your body can do anything with the work you put in.',
      'Two minutes, and it is your own numbers rather than anybody else&rsquo;s.',
    ],
    cta: 'See my two lowest',
  },
  2: {
    subject: n => `Why it is happening, ${n}`,
    preview: 'Your body has decided this is not a safe time to let go.',
    lines: [
      'Yesterday was which two are holding you back. Today is why.',
      'The short version: your body has decided this is not a good time to let go of stored fat. Eating less and training harder tells it the same thing again, which is why the last plan went the way it did.',
      'Today&rsquo;s lesson goes through what is causing that in your case specifically.',
    ],
    cta: 'Read why',
  },
  3: {
    subject: n => `You will recognise this one, ${n}`,
    preview: 'A pattern does not arrive as a diagnosis. It arrives as an ordinary week.',
    lines: [
      'This is the one people tell us lands hardest.',
      'A pattern does not turn up as a diagnosis. It turns up as an ordinary week you have stopped noticing is strange. Awake at three. The afternoon dropping out. The same clothes fitting differently while the scale does not move.',
      'Today is where yours shows up, in your week rather than in general.',
    ],
    cta: 'See where it shows up',
  },
  4: {
    subject: n => `The part most people skip`,
    preview: 'Laziness, willpower, too many carbs, just getting older.',
    lines: [
      'Today is the section almost everybody skims, and it is the one worth reading twice.',
      'Laziness. No willpower. Too many carbs. Just getting older. Every one of those came with a plan attached, you tried it, it did not work, and that got read as you failing at it.',
      'It was aimed at the wrong thing. Today is about which explanations to stop carrying.',
    ],
    cta: 'Read what it is not',
  },
  5: {
    subject: n => `${n}, where to start`,
    preview: 'Three things, in the order that matters.',
    lines: [
      'Last one. Today is what actually moves your pattern.',
      'Three things, specific to you rather than to the average, and in an order that matters more than the list does. The first two look least like progress and they are what make the third one work.',
      'Your read stays where it is afterwards. It is yours either way.',
    ],
    cta: 'See where to start',
  },
}

export function buildDecodeDayEmail({
  day,
  firstName,
  dayUrl,
}: {
  day: number
  firstName: string
  dayUrl: string
}): { subject: string; html: string } {
  const copy = DAY_EMAIL[day]
  const meta = DECODE_DAYS.find(d => d.day === day)
  if (!copy || !meta) throw new Error(`No Body Decode email copy for day ${day}`)

  const html = decodeShell(`
${emailEyebrow(`Day ${day} of 5 · ${meta.title}`)}
${emailHeading(meta.title)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${copy.lines.map((l, i) => emailBody(l, { bottom: i === copy.lines.length - 1 ? 28 : 16 })).join('\n')}
${emailCta({ href: dayUrl, label: copy.cta })}
${emailUrlFallback(dayUrl, 'Or paste this link into your browser')}
`, copy.preview)

  return { subject: copy.subject(firstName), html }
}

/**
 * The one nudge: she signed up and never answered the questions.
 *
 * This is the single highest-value send in the whole arc. The in-portal
 * scorecard lost 9 of the Challenge's first 29 people, and someone who has not
 * answered has no read, so every one of the five days is meaningless to her.
 * Everything else can be missed; this cannot.
 *
 * Fires ~20h after signup and only if the questions are still unanswered.
 */
export function buildDecodeQuestionsNudgeEmail({
  firstName,
  portalUrl,
}: {
  firstName: string
  portalUrl: string
}): { subject: string; html: string } {
  const html = decodeShell(`
${emailEyebrow('Your read is waiting')}
${emailHeading('You have not answered the questions yet.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You signed up and then something got in the way, which is completely normal. The questions are still there and they take about two minutes.')}
${emailCallout({ eyebrow: 'To get your read', value: '2', unit: 'minutes' })}
${emailBody('There is nothing to pay, nothing to download and nothing to do afterwards unless you want to. Your report is on screen the moment you finish, and it is yours to keep whatever you decide.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Answer the questions' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
`, 'Two minutes, and your report is on screen the moment you finish.')

  return { subject: `${firstName}, two minutes and your read is done`, html }
}

/** SMS, one per day. Short by design; the portal does the work. */
export const DECODE_SMS: Record<number, string> = {
  1: `{{name}}, day 1 of your Body Decode is open: your two lowest scores, and why they are the two that matter. {{url}}`,
  2: `Day 2 is up, {{name}}. Why it is happening, and why eating less has been making it worse. {{url}}`,
  3: `Day 3, {{name}}. This is the one people say lands hardest: where your pattern shows up in an ordinary week. {{url}}`,
  4: `Day 4 is the part most people skip, {{name}}, and it is the one worth reading twice. What your pattern is NOT. {{url}}`,
  5: `Last one, {{name}}. Three things that actually move your pattern, in the order that matters. {{url}}`,
}

/** Sent ~26h after signup if the questions are still unanswered. */
export const DECODE_SMS_QUESTIONS_NUDGE =
  `{{name}}, your Body Decode read is still waiting on about two minutes of questions. Nothing to pay. {{url}}`
