import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPortalAccessEmail } from '@/lib/portal-access-email'
import { sendCoachAlert } from '@/lib/coach-alert'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  // Optional flag — when true, the coach has confirmed the commencement fee
  // is already in (e.g. cash, transfer). When false (the default), the client
  // is created but the lead's status is left alone so the commencement-fee
  // link can still be sent later. Once Stripe webhook records the payment it
  // moves the status to 'commencement_fee_paid'.
  let markPaid = false
  try {
    const body = await request.json()
    markPaid = body?.markPaid === true
  } catch {
    // empty body is fine - default false
  }

  // Get lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.converted_to_client_id) return NextResponse.json({ error: 'Already converted' }, { status: 400 })

  // Create client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({ coach_id: user.id, name: lead.name, email: lead.email || null })
    .select()
    .single()

  if (clientError || !client) return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })

  // Create intake invitation
  const { data: invitation, error: invError } = await supabase
    .from('intake_invitations')
    .insert({ client_id: client.id })
    .select()
    .single()

  if (invError || !invitation) return NextResponse.json({ error: 'Failed to generate intake link' }, { status: 500 })

  // Update lead. Only flip the status to 'commencement_fee_paid' when the
  // coach has confirmed the fee is in. Otherwise leave the existing status
  // so the commencement-fee link can still be sent later.
  const update: Record<string, unknown> = {
    converted_to_client_id: client.id,
    converted_at: new Date().toISOString(),
  }
  if (markPaid) update.status = 'commencement_fee_paid'

  await supabase
    .from('leads')
    .update(update)
    .eq('id', id)

  // Open the portal: email the client their portal link straight away so they
  // can start the onboarding stack (agreement, health declaration, intake,
  // baseline). A delivery failure must NOT fail the conversion (the client and
  // intake already exist) but it must NEVER be silent: the result is returned
  // to the UI and, as a backup, an alert is emailed to the coach.
  const portalUrl = client.onboarding_token
    ? `https://app.bodyrecode.au/portal/${client.onboarding_token}`
    : null

  const emailResult = await sendPortalAccessEmail({
    admin: createAdminClient(),
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      onboarding_token: client.onboarding_token,
    },
    sentBy: user.id,
    trigger: markPaid ? 'convert_paid' : 'convert_no_payment',
  })

  if (!emailResult.ok) {
    console.error('[leads/convert] Portal access email failed:', emailResult.reason, emailResult.detail ?? '')
    await sendCoachAlert({
      subject: `Portal email did NOT send to ${client.name}`,
      lines: [
        `<strong>${client.name}</strong> was just converted to a client, but their portal access email failed to send.`,
        `Reason: <strong>${emailResult.reason}</strong>${emailResult.detail ? ` (${emailResult.detail})` : ''}`,
        client.email ? `Email on file: ${client.email}` : `No email address is on file for this client.`,
        portalUrl ? `Send them this portal link manually: <a href="${portalUrl}">${portalUrl}</a>` : `No onboarding token yet, so no portal link could be generated.`,
        `They will not be able to start onboarding until they have this link.`,
      ],
    })
  }

  return NextResponse.json({
    client_id: client.id,
    intake_token: invitation.token,
    portal_url: portalUrl,
    portal_email_sent: emailResult.ok,
    portal_email_reason: emailResult.ok ? null : emailResult.reason,
  })
}
