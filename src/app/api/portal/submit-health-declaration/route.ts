import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { sendMedicalClearanceRequiredEmail } from '@/lib/medical-clearance-required-email'

export async function POST(req: NextRequest) {
  const { clientId, requiresClearance, data } = await req.json()
  if (!clientId) return NextResponse.json({ error: 'Missing client' }, { status: 400 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('name, email, onboarding_token')
    .eq('id', clientId)
    .maybeSingle()

  const { error } = await admin
    .from('clients')
    .update({
      health_declaration_submitted_at: new Date().toISOString(),
      medical_clearance_required: requiresClearance,
      health_declaration_data: data,
    })
    .eq('id', clientId)

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })

  // Client-facing follow-up runs FIRST so the result can be surfaced in the
  // coach notification body. That gives Kade a single email to read with the
  // status of both sides: did the client also get notified, or do they need a
  // manual nudge? Best-effort: any throw is caught and reported, never blocks.
  let clientEmailStatus: 'sent' | 'skipped_no_email' | 'skipped_no_token' | 'skipped_no_resend_key' | 'failed' | null = null
  let clientEmailError: string | null = null

  if (requiresClearance && client) {
    if (!client.email) {
      clientEmailStatus = 'skipped_no_email'
    } else if (!client.onboarding_token) {
      clientEmailStatus = 'skipped_no_token'
    } else if (!process.env.RESEND_API_KEY) {
      clientEmailStatus = 'skipped_no_resend_key'
    } else {
      try {
        const sent = await sendMedicalClearanceRequiredEmail({
          admin,
          client: {
            id: clientId,
            name: client.name ?? '',
            email: client.email,
            onboarding_token: client.onboarding_token,
          },
          trigger: 'health_declaration_submit',
        })
        clientEmailStatus = sent ? 'sent' : 'failed'
        if (!sent) clientEmailError = 'Helper returned false (check logs)'
      } catch (e) {
        clientEmailStatus = 'failed'
        clientEmailError = e instanceof Error ? e.message : String(e)
        console.error('Clearance-required client email failed:', e)
      }
    }
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const name = client?.name ?? 'A client'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bodyrecode.au'

    // Compose status line for the coach email reflecting what happened with
    // the client-facing follow-up. Only included when clearance is required.
    let statusLine: string | null = null
    if (requiresClearance) {
      switch (clientEmailStatus) {
        case 'sent':
          statusLine = '<span style="color:#14b8a6;">✓ Client was also auto-emailed</span> with the portal link and three-step instructions. No manual nudge needed.'
          break
        case 'skipped_no_email':
          statusLine = '<strong style="color:#ef4444;">⚠ Client email NOT sent: no email address on record.</strong> Reach out manually or add an email and re-run scripts/send-clearance-required-email.ts.'
          break
        case 'skipped_no_token':
          statusLine = '<strong style="color:#ef4444;">⚠ Client email NOT sent: no onboarding_token on record.</strong> Reach out manually.'
          break
        case 'skipped_no_resend_key':
          statusLine = '<strong style="color:#ef4444;">⚠ Client email NOT sent: RESEND_API_KEY not configured.</strong> Reach out manually.'
          break
        case 'failed':
          statusLine = `<strong style="color:#ef4444;">⚠ Client email FAILED to send.</strong> ${clientEmailError ?? 'Reason unknown'}. Reach out manually or re-run scripts/send-clearance-required-email.ts.`
          break
      }
    }

    const body = requiresClearance
      ? [
          `${name} has completed their health declaration.`,
          '<strong style="color:#f59e0b;">Medical clearance required.</strong> Their intake is gated until you approve a completed clearance form. They will be prompted to upload it inside the portal.',
          ...(statusLine ? [statusLine] : []),
        ]
      : `${name} has completed their health declaration. No medical clearance flagged. Their Foundational Intake task is now unlocked.`

    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `${name} submitted their health declaration${requiresClearance ? ' (clearance required)' : ''}`,
      html: buildCoachNotificationEmail({
        eyebrow: 'Health Declaration',
        heading: `${name} submitted their health declaration`,
        body,
        ctaLabel: 'Open client profile',
        ctaUrl: `${baseUrl}/dashboard/clients/${clientId}`,
        accent: requiresClearance ? 'amber' : 'teal',
      }),
    })
  } catch (e) {
    console.error('Notification email failed:', e)
  }

  return NextResponse.json({ success: true })
}
