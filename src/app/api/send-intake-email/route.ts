import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { darkEmailShell, emailUrlFallback, COACH_BCC } from '@/lib/email-shell'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'

export async function POST(request: NextRequest) {
  const { clientId, clientName, clientEmail, intakeToken } = await request.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!clientEmail) return NextResponse.json({ error: 'No email address' }, { status: 400 })
  if (!intakeToken) return NextResponse.json({ error: 'No intake token' }, { status: 400 })

  const firstName = clientName.split(' ')[0]
  const intakeUrl = `${appUrl()}/intake/${intakeToken}`
  const subject = `${firstName}, your Body Recode intake is ready`

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: clientEmail,
    bcc: COACH_BCC,
    subject,
    html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Before we begin, I need you to complete your foundational intake. This is how I build an accurate picture of where you are starting from, your training history, recovery patterns, stress load, sleep, and lifestyle.</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">It takes around 15 to 20 minutes and there are no right or wrong answers. Just answer based on your typical experience, not your best or worst days. This intake forms the foundation of everything we do together, so take your time with it.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#10E1C2" style="background-color:#10E1C2;border-radius:8px;">
            <a href="${intakeUrl}" style="display:inline-block;padding:14px 28px;color:#000000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Complete my intake</a>
          </td>
        </tr>
      </table>
      ${emailUrlFallback(intakeUrl, 'Or paste this link into your browser')}
      ${darkEmailSignature()}
`, { previewText: `${firstName}, your foundational intake is ready.` }),
  })

  if (error) {
    console.error('Intake email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (clientId) {
    const admin = createAdminClient()
    await logClientCommunication(admin, {
      clientId,
      kind: 'intake_invite',
      subject,
      toAddress: clientEmail,
      sentBy: user.id,
      meta: { url: intakeUrl, trigger: 'manual' },
    })
  }

  return NextResponse.json({ sent: true })
}
