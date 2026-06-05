// Blueprint email builders.
//
// At time of writing this file covers the two weekly check-in emails sent
// by blueprintWeekAdvanceFunction in src/lib/inngest-functions.ts:
//   - Week N check-in prompt (sent when the Inngest week-advance tick fires)
//   - Week N check-in reminder (sent 2 days later if no check-in submitted)
//
// The six weekly programme emails sent by blueprintEmailSequenceFunction
// (Weeks 1-6 + Week 7 follow-up) still compose inline in inngest-functions.ts
// because they carry a pattern callout block that does not yet have a shared
// helper. They are queued for the same migration.
//
// Both builders return {subject, html} so the preview route can render the
// exact bytes that get sent.

import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta,
} from './email-shell'

function blueprintShell(body: string): string {
  return darkEmailShell(`
${emailLogo()}
${body}
${darkEmailSignature()}
`)
}

export function buildBlueprintCheckinPromptEmail({
  firstName,
  completedWeek,
  newWeek,
  portalUrl,
}: {
  firstName: string
  completedWeek: number
  newWeek: number
  portalUrl: string
}): { subject: string; html: string } {
  const subject = `Week ${completedWeek} check-in is due`
  const html = blueprintShell(`
${emailEyebrow(`Week ${completedWeek} · Check-In Due`)}
${emailHeading(`Submit your Week ${completedWeek} check-in.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Week ${completedWeek} is complete. Week ${newWeek} is now live in your portal.`)}
${emailBody(`Before you move into the new week, take 2 minutes to submit your Week ${completedWeek} check-in. It tracks the 8 biological markers that show whether the programme is working — energy, sleep, recovery, cravings, and more.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: `Submit Week ${completedWeek} Check-In` })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
`)
  return { subject, html }
}

export function buildBlueprintCheckinReminderEmail({
  firstName,
  completedWeek,
  portalUrl,
}: {
  firstName: string
  completedWeek: number
  portalUrl: string
}): { subject: string; html: string } {
  const subject = `Reminder: Week ${completedWeek} check-in not yet submitted`
  const html = blueprintShell(`
${emailEyebrow(`Week ${completedWeek} · Reminder`)}
${emailHeading(`Week ${completedWeek} check-in still outstanding.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Your Week ${completedWeek} check-in is still outstanding. It takes 2 minutes and gives you a clear read on what the programme is doing to your biology.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Submit Check-In Now' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
`)
  return { subject, html }
}
