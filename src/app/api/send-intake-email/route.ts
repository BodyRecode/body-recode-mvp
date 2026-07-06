import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { buildIntakeInviteEmail, type IntakeInviteMode } from '@/lib/intake-invite-email'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'

// Picks the email copy variant by looking up the invitation's kind:
//   kind='foundational' → first-time onboarding copy ("Before we begin…")
//   kind='reintake'     → re-intake / reassessment copy ("Time to re-read where
//                          you are now…")
// The coach controls which mode by clicking either the New Intake or the
// Re-intake button on the client profile. Each button creates an invitation
// with the corresponding kind; this route just reads it.

export async function POST(request: NextRequest) {
  const { clientId, clientName, clientEmail, intakeToken } = await request.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!clientEmail) return NextResponse.json({ error: 'No email address' }, { status: 400 })
  if (!intakeToken) return NextResponse.json({ error: 'No intake token' }, { status: 400 })

  const admin = createAdminClient()

  // Look up the invitation's kind to choose email copy. Defaults to 'first_time'
  // if the invitation isn't found or has no kind (grandfathers pre-migration
  // rows so behaviour is unchanged for anything already in the system).
  let mode: IntakeInviteMode = 'first_time'
  const { data: invitation } = await admin
    .from('intake_invitations')
    .select('kind')
    .eq('token', intakeToken)
    .maybeSingle()
  if (invitation?.kind === 'reintake') mode = 'reintake'

  const firstName = clientName.split(' ')[0]
  const intakeUrl = `${appUrl()}/intake/${intakeToken}`
  const { subject, html } = buildIntakeInviteEmail({ firstName, intakeUrl, mode })

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: fromCoach(),
    to: clientEmail,
    bcc: COACH_BCC,
    subject,
    html,
  })

  if (error) {
    console.error('Intake email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (clientId) {
    await logClientCommunication(admin, {
      clientId,
      kind: 'intake_invite',
      subject,
      toAddress: clientEmail,
      sentBy: user.id,
      meta: { url: intakeUrl, trigger: 'manual', mode },
    })
  }

  return NextResponse.json({ sent: true, mode })
}
