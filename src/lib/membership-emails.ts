// Membership email builders.
//
// All Membership-side outbound emails compose from this file so the preview
// route at /dashboard/preview/membership-emails can render exactly what gets
// sent.
//
// Inventory:
//   - buildMembershipPurchaseWelcomeEmail   — Stripe webhook, "Welcome to the Body Recode Membership"
//   - buildMembershipCoachNotificationEmail — Stripe webhook, coach-only "Membership purchased - {firstName}"
//   - buildMembershipCheckinPromptEmail     — membershipWeekAdvanceFunction, Block N Week N check-in due
//   - buildMembershipCheckinReminderEmail   — membershipWeekAdvanceFunction, 2-day reminder
//
// All builders return {subject, html}. Outbound shell is darkEmailShell
// (which produces a LIGHT-themed email — name is legacy, see
// project_dark_email_shell_rename memory).

import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailStatusCard,
} from './email-shell'

// ─── Stripe Webhook Emails ────────────────────────────────────────────────

export function buildMembershipPurchaseWelcomeEmail({
  firstName,
  portalUrl,
}: {
  firstName: string
  portalUrl: string
}): { subject: string; html: string } {
  const subject = `Welcome to the Body Recode Membership`
  const inner = `
${emailLogo()}
${emailEyebrow('Body Recode Membership')}
${emailHeading(`Welcome to the Membership, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You are in. Your Body Recode Membership is active and <strong style="color:#1A1A1A;">Block A is loaded into your portal</strong>.')}
${emailBody('Block A — Consolidate picks up directly from where the Blueprint ended. Your pattern rules carry forward. The training and nutrition have been built on top of the foundation you have already established.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${emailStatusCard({
  eyebrow: 'What is next',
  headline: 'Week 4 coach Loom · monthly group Q&A',
  body: 'Your first monthly coach Loom will be sent at the end of Week 4. Monthly group Q&A call details to follow.',
})}
${darkEmailSignature()}
`
  return {
    subject,
    html: darkEmailShell(inner, { previewText: `Welcome ${firstName}, your Membership is active.` }),
  }
}

export function buildMembershipCoachNotificationEmail({
  firstName,
  email,
  pattern,
  blueprintToken,
}: {
  firstName: string
  email: string
  pattern: string | null
  blueprintToken: string | null
}): { subject: string; html: string } {
  const subject = `Membership purchased - ${firstName}`
  const inner = `
${emailLogo()}
${emailEyebrow('Membership Purchased')}
${emailHeading(`${firstName} joined the Membership.`)}
${emailDivider()}
${emailStatusCard({
  eyebrow: 'New enrollment',
  headline: `Email: ${email}`,
  body: `Pattern: ${pattern || 'Pending assessment'}. Blueprint token: ${blueprintToken || 'None — direct join'}. Week-advance sequence fired via Inngest.`,
})}
${darkEmailSignature()}
`
  return {
    subject,
    html: darkEmailShell(inner, { previewText: `${firstName} joined the Membership.` }),
  }
}

// ─── Weekly Check-In Emails (per Block × Week) ────────────────────────────

export function buildMembershipCheckinPromptEmail({
  firstName,
  block,
  completedWeek,
  newWeek,
  portalUrl,
}: {
  firstName: string
  block: string
  completedWeek: number
  newWeek: number
  portalUrl: string
}): { subject: string; html: string } {
  const subject = `Block ${block} Week ${completedWeek} check-in is due`
  const inner = `
${emailLogo()}
${emailEyebrow(`Membership · Block ${block} Week ${completedWeek}`)}
${emailHeading(`Block ${block} Week ${completedWeek} check-in is due.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Block ${block} Week ${completedWeek} is complete. Week ${newWeek} is now live in your portal.`)}
${emailBody(`Submit your Week ${completedWeek} check-in before moving on. This is the data that feeds your monthly Loom review — the more consistent the data, the more useful the feedback.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: `Submit Week ${completedWeek} check-in` })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  return {
    subject,
    html: darkEmailShell(inner, { previewText: `${firstName}, submit your Block ${block} Week ${completedWeek} check-in.` }),
  }
}

export function buildMembershipCheckinReminderEmail({
  firstName,
  block,
  completedWeek,
  portalUrl,
}: {
  firstName: string
  block: string
  completedWeek: number
  portalUrl: string
}): { subject: string; html: string } {
  const subject = `Reminder: Block ${block} Week ${completedWeek} check-in not yet submitted`
  const inner = `
${emailLogo()}
${emailEyebrow(`Membership · Block ${block} Week ${completedWeek}`)}
${emailHeading('Your check-in is still outstanding.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Your Block ${block} Week ${completedWeek} check-in is still outstanding. This data is what your monthly Loom review is built from — without it, I am working blind.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Submit check-in now' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
  return {
    subject,
    html: darkEmailShell(inner, { previewText: `${firstName}, your Block ${block} Week ${completedWeek} check-in is overdue.` }),
  }
}
