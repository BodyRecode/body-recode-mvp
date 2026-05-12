import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import { logClientCommunication } from '@/lib/client-communications'

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
  const portalUrl = `https://app.bodyrecode.au/portal/${client.onboarding_token}/medical-clearance`
  const subject = `${firstName}, one step before we start coaching`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: client.email,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:40px;">
      <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
    </div>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Hi ${firstName},</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your health declaration is in. Thanks for the detail.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">One of your answers means we need a GP sign-off before coaching starts. This is a routine duty-of-care step, not a flag against you.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 12px;">Your portal now has a <strong style="color:#fff;">Medical Clearance</strong> card. Three steps:</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 8px;"><strong style="color:#fff;">1.</strong> Download the form (one page, pre-filled with your name)</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 8px;"><strong style="color:#fff;">2.</strong> See your GP and have them sign it</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 24px;"><strong style="color:#fff;">3.</strong> Upload the signed form back to your portal</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 28px;">The moment it lands I'll review and approve. Once approved, your Foundational Intake unlocks and we keep moving.</p>
    <a href="${portalUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Open my portal</a>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Any questions, reply to this email.</p>
    ${darkEmailSignature()}
    <p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${portalUrl}</p>
  </div>
</body>
</html>`,
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
