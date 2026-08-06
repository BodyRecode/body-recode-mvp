import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildFoundationalReadingEmail } from '@/lib/foundational-reading-email'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'
import { isCoachUser, forbidden } from '@/lib/api-auth'

// Coach-gated "Notify client" send for a published Foundational Reading.
//
// Readings publish silently by default (2026-06-09 decision — see
// project_notify_client_nutrition_plan). This route is the explicit,
// coach-initiated "your reading is ready" notification, added 2026-07-12 so a
// brand-new client can be told their first deliverable is live before any plan
// exists. Reuses the existing (previously-scrapped) foundational-reading-email
// builder. Stamps client_reading_email_sent_at on the cffs row.

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  if (!(await isCoachUser(user))) return forbidden()

  const { cffs_id } = await request.json()
  if (!cffs_id) {
    return NextResponse.json({ error: 'Missing cffs_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: cffs, error: cffsErr } = await admin
    .from('cffs')
    .select('id, client_id, body_state_classification, client_reading_published_at')
    .eq('id', cffs_id)
    .single()

  if (cffsErr || !cffs) {
    return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
  }

  if (!cffs.client_reading_published_at) {
    return NextResponse.json(
      { error: 'Publish the reading before notifying the client.' },
      { status: 400 }
    )
  }

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', cffs.client_id)
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
  const portalUrl = `${appUrl()}/portal/${client.onboarding_token}/foundational-reading`
  const { subject, html } = buildFoundationalReadingEmail({
    firstName,
    bodyState: cffs.body_state_classification ?? null,
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
    console.error('Notify client foundational reading email failed:', msg)
    return NextResponse.json({ error: `Send failed: ${msg}` }, { status: 500 })
  }

  const now = new Date().toISOString()
  const { error: stampErr } = await admin
    .from('cffs')
    .update({ client_reading_email_sent_at: now })
    .eq('id', cffs_id)

  if (stampErr) {
    console.error('FR notify stamp failed (email sent):', stampErr.message)
  }

  return NextResponse.json({ ok: true, sent_at: now })
}
