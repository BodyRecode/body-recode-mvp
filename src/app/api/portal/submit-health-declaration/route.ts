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

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const name = client?.name ?? 'A client'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bodyrecode.au'
    const body = requiresClearance
      ? [
          `${name} has completed their health declaration.`,
          '<strong style="color:#f59e0b;">Medical clearance required.</strong> Their intake is gated until you approve a completed clearance form. They will be prompted to upload it inside the portal.',
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

  // Client-facing follow-up: if clearance is required, point them at the
  // Medical Clearance card on their portal so they don't have to wait for
  // their next login to discover the next step. Best-effort; failure to
  // send (e.g. missing email/token) never blocks the submission.
  if (requiresClearance && client) {
    try {
      await sendMedicalClearanceRequiredEmail({
        admin,
        client: {
          id: clientId,
          name: client.name ?? '',
          email: client.email ?? null,
          onboarding_token: client.onboarding_token ?? null,
        },
        trigger: 'health_declaration_submit',
      })
    } catch (e) {
      console.error('Clearance-required client email failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
