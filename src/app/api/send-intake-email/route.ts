import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody, emailCta,
} from '@/lib/email-shell'
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
    subject,
    html: darkEmailShell(`
${emailLogo()}
${emailEyebrow('Foundational Intake')}
${emailHeading(`${firstName}, your intake is ready.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('Before we begin, I need you to complete your foundational intake. This is how I build an accurate picture of where you are starting from: your training history, recovery patterns, stress load, sleep, and lifestyle.')}
${emailBody('It takes around 15 to 20 minutes and there are no right or wrong answers. Just answer based on your typical experience, not your best or worst days. This intake forms the foundation of everything we do together, so take your time with it.', { bottom: 28 })}
${emailCta({ href: intakeUrl, label: 'Complete my intake' })}
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
