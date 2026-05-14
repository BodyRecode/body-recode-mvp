import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import { darkEmailShell, COACH_BCC } from '@/lib/email-shell'
import { logClientCommunication } from '@/lib/client-communications'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .update({ medical_clearance_received_at: new Date().toISOString() })
    .eq('id', id)
    .select('name, email, onboarding_token')
    .single()

  // Notify client by email
  if (client?.email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const firstName = client.name?.split(' ')[0] ?? 'there'
    const portalUrl = `https://app.bodyrecode.au/portal/${client.onboarding_token}`
    const subject = `${firstName}, medical clearance approved`

    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: client.email,
      bcc: COACH_BCC,
      subject,
      html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your medical clearance has been reviewed and approved. Onboarding is now fully unlocked. The Foundational Intake and Baseline Documentation are open in your portal.</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Take your time with the intake. The more accurate it is, the better the read I get.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#10E1C2" style="background-color:#10E1C2;border-radius:8px;">
            <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#000000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Go to my portal</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${portalUrl}</p>
      ${darkEmailSignature()}
`, { previewText: `${firstName}, medical clearance approved — onboarding unlocked.` }),
    }).then(() =>
      logClientCommunication(admin, {
        clientId: id,
        kind: 'medical_clearance_approved',
        subject,
        toAddress: client.email,
        sentBy: user.id,
        meta: { url: portalUrl },
      })
    ).catch(err => console.error('Clearance approval email error:', err))
  }

  return NextResponse.json({ success: true })
}
