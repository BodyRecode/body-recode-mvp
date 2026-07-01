import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildNutritionReadingEmail } from '@/lib/nutrition-reading-email'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'

// Coach-gated "Notify client" send for an active nutrition plan.
//
// Pre-2026-06-09 the client email was bolted to generate-nutrition-reading
// and used the reading's first-time-per-row sticky as its trigger. Two
// broken cases in production: (1) promoting a new plan without regenerating
// the reading sent nothing, (2) regenerating the reading on the same plan
// row also sent nothing because the sticky was already set. This route is
// the explicit publish-to-client step decoupled from reading state.

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { plan_id } = await request.json()
  if (!plan_id) {
    return NextResponse.json({ error: 'Missing plan_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: plan, error: planErr } = await admin
    .from('nutrition_plans')
    .select('id, client_id, plan_name, is_active, status, nutrition_reading_published_at, published_to_client_at')
    .eq('id', plan_id)
    .single()

  if (planErr || !plan) {
    return NextResponse.json({ error: 'Nutrition plan not found' }, { status: 404 })
  }

  if (!plan.is_active || plan.status !== 'active') {
    return NextResponse.json(
      { error: 'Plan must be active before notifying the client. Approve the draft first.' },
      { status: 400 }
    )
  }

  if (!plan.nutrition_reading_published_at) {
    return NextResponse.json(
      { error: 'Publish the Nutrition Reading before notifying the client. The reading frames the plan.' },
      { status: 400 }
    )
  }

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', plan.client_id)
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  if (!client.email) {
    return NextResponse.json({ error: 'Client has no email on file.' }, { status: 400 })
  }

  if (!client.onboarding_token) {
    return NextResponse.json({ error: 'Client has no portal token.' }, { status: 400 })
  }

  const firstName = client.name?.split(' ')[0] ?? 'there'
  const baseUrl = appUrl()
  const portalUrl = `${baseUrl}/portal/${client.onboarding_token}/my-plan`
  const { subject, html } = buildNutritionReadingEmail({
    firstName,
    planName: plan.plan_name,
    portalUrl,
  })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: fromCoach(),
      to: client.email,
      bcc: COACH_BCC,
      subject,
      html,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Notify client nutrition plan email failed:', msg)
    return NextResponse.json({ error: `Send failed: ${msg}` }, { status: 500 })
  }

  const now = new Date().toISOString()
  const { error: stampErr } = await admin
    .from('nutrition_plans')
    .update({
      published_to_client_at: now,
      published_to_client_by: user.id,
    })
    .eq('id', plan_id)

  if (stampErr) {
    console.error('Notify stamp failed (email sent):', stampErr.message)
  }

  return NextResponse.json({ ok: true, sent_at: now })
}
