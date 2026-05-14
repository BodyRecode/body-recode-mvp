import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import { darkEmailShell } from '@/lib/email-shell'
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
    html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your portal is open. Four steps to complete before we start coaching:</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><strong style="color:#ffffff;">1.</strong> Coaching Agreement</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><strong style="color:#ffffff;">2.</strong> Health Declaration</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><strong style="color:#ffffff;">3.</strong> Foundational Intake (208 questions across 8 areas. Take your time. The more accurate it is, the better your read.)</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><strong style="color:#ffffff;">4.</strong> Baseline Documentation</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Once your intake is in, your CFFS generates automatically. That is the read I work from to write your program. No template. Built around what your body is actually doing.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#10E1C2" style="background-color:#10E1C2;border-radius:8px;">
            <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#000000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Open my portal</a>
          </td>
        </tr>
      </table>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Sign in with your email. No password. The code does the work.</p>
      ${darkEmailSignature()}
      <p style="margin:20px 0 0;font-size:13px;color:#a8a29e;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${portalUrl}</p>
`, { previewText: `Welcome ${firstName} — four steps to complete before we start coaching.` }),
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
