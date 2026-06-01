import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildTrajectoryReadingEmail } from '@/lib/trajectory-reading-email'
import { appUrl } from '@/lib/app-url'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { program_id, action } = await request.json()
  if (!program_id) {
    return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })
  }
  if (action !== 'publish' && action !== 'unpublish') {
    return NextResponse.json({ error: 'action must be publish or unpublish' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: program, error: programErr } = await admin
    .from('programs')
    .select('id, client_id, block_name, trajectory_reading_generated_at, trajectory_reading_email_sent_at')
    .eq('id', program_id)
    .single()

  if (programErr || !program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  if (action === 'publish' && !program.trajectory_reading_generated_at) {
    return NextResponse.json(
      { error: 'Generate the reading before publishing' },
      { status: 400 }
    )
  }

  const { data: updated, error: updateErr } = await admin
    .from('programs')
    .update({
      trajectory_reading_published_at: action === 'publish' ? new Date().toISOString() : null,
    })
    .eq('id', program_id)
    .select('id, trajectory_reading_published_at')
    .single()

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  // Notify the client the first time THIS block's reading is published.
  // Republishing never re-emails. Unpublishing never emails.
  let emailSent = false
  let emailError: string | null = null
  if (action === 'publish' && !program.trajectory_reading_email_sent_at) {
    const { data: client } = await admin
      .from('clients')
      .select('name, email, onboarding_token')
      .eq('id', program.client_id)
      .single()

    if (client?.email && client.onboarding_token) {
      try {
        const firstName = client.name?.split(' ')[0] ?? 'there'
        const portalUrl = `${appUrl()}/portal/${client.onboarding_token}/program/trajectory-reading`
        const { subject, html } = buildTrajectoryReadingEmail({
          firstName,
          blockName: program.block_name,
          portalUrl,
        })
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: client.email,
          subject,
          html,
        })
        await admin
          .from('programs')
          .update({ trajectory_reading_email_sent_at: new Date().toISOString() })
          .eq('id', program_id)
        emailSent = true
      } catch (err) {
        emailError = err instanceof Error ? err.message : String(err)
        console.error('Trajectory Reading email failed to send:', emailError)
      }
    }
  }

  return NextResponse.json({ program: updated, emailSent, emailError })
}
