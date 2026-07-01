import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildProgramReadingEmail } from '@/lib/program-reading-email'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'

// Coach-gated "Notify client" send for an active training program.
// Mirror of /api/notify-client-nutrition-plan shipped earlier today.
// Pre-2026-06-09 the email was bolted to generate-program-reading using
// a sticky first-time-per-row flag. Two broken cases in production matched
// the nutrition flow (promote new block without regen reading; regen
// reading on same program). This route is the explicit publish-to-client
// step decoupled from reading state.

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { program_id } = await request.json()
  if (!program_id) {
    return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: program, error: programErr } = await admin
    .from('programs')
    .select('id, client_id, block_name, status, program_reading_published_at, published_to_client_at')
    .eq('id', program_id)
    .single()

  if (programErr || !program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  if (program.status !== 'active') {
    return NextResponse.json(
      { error: 'Program must be active before notifying the client. Promote the draft first.' },
      { status: 400 }
    )
  }

  if (!program.program_reading_published_at) {
    return NextResponse.json(
      { error: 'Publish the Program Reading before notifying the client. The reading frames the block.' },
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
  const baseUrl = appUrl()
  const portalUrl = `${baseUrl}/portal/${client.onboarding_token}/program`
  const { subject, html } = buildProgramReadingEmail({
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
    console.error('Notify client training plan email failed:', msg)
    return NextResponse.json({ error: `Send failed: ${msg}` }, { status: 500 })
  }

  const now = new Date().toISOString()
  const { error: stampErr } = await admin
    .from('programs')
    .update({
      published_to_client_at: now,
      published_to_client_by: user.id,
    })
    .eq('id', program_id)

  if (stampErr) {
    console.error('Notify training stamp failed (email sent):', stampErr.message)
  }

  return NextResponse.json({ ok: true, sent_at: now })
}
