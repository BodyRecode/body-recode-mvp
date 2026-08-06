import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildTrajectoryReadingEmail } from '@/lib/trajectory-reading-email'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'
import { isCoachUser, forbidden } from '@/lib/api-auth'

// Coach-gated "Notify Client" send for a published trajectory reading.
// Mirror of /api/notify-client-training-plan and /api/notify-client-nutrition-plan
// — keeps the notification explicit and separate from publish state.
//
// Background: publish-trajectory-reading stopped sending emails 2026-06-09
// in favour of the new-program-publish being the next client touchpoint.
// 2026-06-22 reversed that for the trajectory reading specifically — block-end
// readings are their own reflection moment and deserve their own coach-gated
// notification, mirroring the existing Program / Nutrition pattern. Same shape:
// coach explicitly clicks Notify Client; email goes; trajectory_reading_email_sent_at
// stamps; button label flips to Notify Again with prior send date shown.

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  if (!(await isCoachUser(user))) return forbidden()

  const { program_id } = await request.json()
  if (!program_id) {
    return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: program, error: programErr } = await admin
    .from('programs')
    .select('id, client_id, block_name, trajectory_reading_published_at, trajectory_reading_email_sent_at')
    .eq('id', program_id)
    .single()

  if (programErr || !program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  if (!program.trajectory_reading_published_at) {
    return NextResponse.json(
      { error: 'Publish the trajectory reading before notifying the client.' },
      { status: 400 }
    )
  }

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', program.client_id)
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
  const portalUrl = `${appUrl()}/portal/${client.onboarding_token}/program/trajectory-reading`
  const { subject, html } = buildTrajectoryReadingEmail({
    firstName,
    blockName: program.block_name,
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
    console.error('Notify client trajectory reading email failed:', msg)
    return NextResponse.json({ error: `Send failed: ${msg}` }, { status: 500 })
  }

  const now = new Date().toISOString()
  const { error: stampErr } = await admin
    .from('programs')
    .update({ trajectory_reading_email_sent_at: now })
    .eq('id', program_id)

  if (stampErr) {
    console.error('Notify trajectory stamp failed (email sent):', stampErr.message)
  }

  return NextResponse.json({ ok: true, sent_at: now })
}
