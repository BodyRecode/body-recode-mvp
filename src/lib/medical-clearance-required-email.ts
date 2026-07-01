import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList,
  fromCoach,
} from '@/lib/email-shell'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from "@/lib/app-url";

interface MedicalClearanceRequiredClient {
  id: string
  name: string
  email: string | null
  onboarding_token: string | null
}

interface SendMedicalClearanceRequiredOpts {
  admin: SupabaseClient
  client: MedicalClearanceRequiredClient
  trigger: string  // e.g. 'health_declaration_submit', 'manual_backfill'
  sentBy?: string | null
}

/**
 * Client-facing email sent when the health declaration flags that a medical
 * clearance is required (cardio symptoms or pregnancy/postpartum). Directs
 * the client to the Medical Clearance card on their portal where they can
 * download the GP form, take it for signing, and upload it back.
 *
 * Parallels portal-access-email.ts in voice + dark-template layout. Logged
 * to client_communications as kind 'medical_clearance_required'.
 *
 * Returns false silently if the client has no email or onboarding token,
 * or if RESEND_API_KEY is not configured (preserves dev-env behaviour).
 */
export async function sendMedicalClearanceRequiredEmail({
  admin,
  client,
  trigger,
  sentBy = null,
}: SendMedicalClearanceRequiredOpts): Promise<boolean> {
  if (!client.email || !client.onboarding_token) return false
  if (!process.env.RESEND_API_KEY) return false

  const firstName = client.name.split(' ')[0]
  const portalUrl = `${appUrl()}/portal/${client.onboarding_token}/medical-clearance`
  const subject = `${firstName}, one step before we start coaching`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: fromCoach(),
    to: client.email,
    subject,
    html: darkEmailShell(`
${emailLogo()}
${emailEyebrow('Medical Clearance', '#B7791F')}
${emailHeading('One step before we start coaching.')}
${emailDivider('#B7791F')}
${emailBody(`Hi ${firstName},`)}
${emailBody('Your health declaration is in. Thanks for the detail.')}
${emailBody('One of your answers means we need a GP sign-off before coaching starts. This is a routine duty-of-care step, not a flag against you.', { bottom: 20 })}
${emailFeaturedCard(
  emailNumberedList([
    'Download the form (one page, pre-filled with your name)',
    'See your GP and have them sign it',
    'Upload the signed form back to your portal',
  ]),
  { eyebrow: 'Three steps on your Medical Clearance card' },
)}
${emailBody("The moment it lands I'll review and approve. Once approved, your Foundational Intake unlocks and we keep moving.", { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my portal', bg: '#B7791F' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${emailBody('Any questions, reply to this email.', { size: 14, bottom: 0 })}
${darkEmailSignature()}
`, { previewText: `${firstName}, one duty-of-care step before we start coaching.` }),
  })

  await logClientCommunication(admin, {
    clientId: client.id,
    kind: 'medical_clearance_required',
    subject,
    toAddress: client.email,
    sentBy,
    meta: { url: portalUrl, trigger },
  })

  return true
}
