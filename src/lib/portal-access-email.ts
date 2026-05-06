import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import { logClientCommunication } from '@/lib/client-communications'

interface PortalAccessClient {
  id: string
  name: string
  email: string | null
  onboarding_token: string | null
}

interface SendPortalAccessOpts {
  admin: SupabaseClient
  client: PortalAccessClient
  sentBy?: string | null
  trigger: string  // e.g. 'manual', 'convert_no_payment', 'convert_paid'
}

/**
 * Sends the portal access email and logs to client_communications.
 * Returns false if the client has no email or no onboarding token.
 */
export async function sendPortalAccessEmail({
  admin,
  client,
  sentBy = null,
  trigger,
}: SendPortalAccessOpts): Promise<boolean> {
  if (!client.email || !client.onboarding_token) return false
  if (!process.env.RESEND_API_KEY) return false

  const firstName = client.name.split(' ')[0]
  const portalUrl = `https://app.bodyrecode.au/portal/${client.onboarding_token}`
  const subject = `${firstName}, your portal is ready`

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
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your portal is open. Four steps to complete before we start coaching:</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 8px;"><strong style="color:#fff;">1.</strong> Coaching Agreement</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 8px;"><strong style="color:#fff;">2.</strong> Health Declaration</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 8px;"><strong style="color:#fff;">3.</strong> Foundational Intake (208 questions across 8 areas. Take your time. The more accurate it is, the better your read.)</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 24px;"><strong style="color:#fff;">4.</strong> Baseline Documentation</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 24px;">Once your intake is in, your CFFS generates automatically. That is the read I work from to write your program. No template. Built around what your body is actually doing.</p>
    <a href="${portalUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Open my portal</a>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Sign in with your email. No password. The link does the work.</p>
    ${darkEmailSignature()}
    <p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${portalUrl}</p>
  </div>
</body>
</html>`,
  })

  await logClientCommunication(admin, {
    clientId: client.id,
    kind: 'portal_access',
    subject,
    toAddress: client.email,
    sentBy,
    meta: { url: portalUrl, trigger },
  })

  return true
}
