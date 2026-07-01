import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromCoach, darkEmailShell, emailUrlFallback, COACH_BCC } from '@/lib/email-shell'
import { darkEmailSignature } from '@/lib/email-signature'
import { logClientCommunication } from '@/lib/client-communications'

/**
 * Sends the supplementary intake reminder email.
 *
 * Flow:
 *   1. Coach clicks "Add follow-up to portal" -> creates the
 *      intake_invitations row (kind='supplementary', status='pending')
 *      via /api/send-supplementary-intake. NO email is sent at this step.
 *   2. Coach clicks "Email link" on the supplementary status row -> this
 *      endpoint emails the client with the prominent button + plain-text
 *      URL fallback.
 *
 * The reason this is a second, opt-in step (rather than auto-emailing on
 * creation) is that the supplementary intake was originally designed
 * portal-only ("the portal IS the channel" per
 * project_supplementary_intake.md). The email flow is the explicit
 * escape hatch for clients who don't log in between coaching weeks.
 *
 * Refuses to send if no pending supplementary invitation exists, so the
 * UI's "Email link" action stays in lockstep with what the client would
 * actually see on their portal.
 *
 * Sister script: scripts/send-supplementary-intake-email.mjs (same
 * content, runnable from the CLI for one-off backfills).
 */
export async function POST(request: NextRequest) {
  const { clientId } = await request.json()
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('id', clientId)
    .maybeSingle()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })

  const { data: invitation } = await admin
    .from('intake_invitations')
    .select('token')
    .eq('client_id', clientId)
    .eq('kind', 'supplementary')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!invitation) {
    return NextResponse.json(
      { error: 'No pending supplementary intake. Click "Add follow-up to portal" first.' },
      { status: 400 },
    )
  }

  const firstName = client.name.split(' ')[0]
  const supplementUrl = `https://app.bodyrecode.au/intake-supplement/${invitation.token}`
  const subject = `${firstName}, a quick follow-up intake (3 minutes)`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const sendResult = await resend.emails.send({
    from: fromCoach(),
    to: client.email,
    bcc: COACH_BCC,
    subject,
    html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;border:0;" />
      </div>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Since you completed your original intake I've added five short follow-up questions covering medications and dietary context. They feed straight into your Foundational Reading and program, so the next iteration is built on the most accurate picture of where you actually are.</p>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">It's about three minutes. The form picks up where you left off if you have to step away mid-way.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:8px;">
            <a href="${supplementUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Complete the 5 questions</a>
          </td>
        </tr>
      </table>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Anything come up while you're filling it in, reply to this email.</p>
      ${emailUrlFallback(supplementUrl, 'Or paste this link into your browser')}
      ${darkEmailSignature()}
`, { previewText: `${firstName}, five quick follow-up questions for your intake.` }),
  })

  await logClientCommunication(admin, {
    clientId: client.id,
    kind: 'supplementary_intake_invite',
    channel: 'email',
    subject,
    toAddress: client.email,
    sentBy: user.id,
    meta: {
      url: supplementUrl,
      trigger: 'manual',
      resend_email_id: sendResult.data?.id ?? null,
    },
  })

  return NextResponse.json({ sent: true })
}
