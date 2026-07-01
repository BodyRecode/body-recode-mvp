import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPortalOrientationEmail } from '@/lib/portal-orientation-email'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'
import { fromCoach } from '@/lib/email-shell'
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', id)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })
  if (!client.onboarding_token) return NextResponse.json({ error: 'No onboarding token for this client' }, { status: 400 })

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  const baseUrl = appUrl()
  const firstName = client.name?.split(' ')[0] ?? 'there'
  const portalUrl = `${baseUrl}/portal/${client.onboarding_token}`
  const { subject, html } = buildPortalOrientationEmail({ firstName, portalUrl })

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: fromCoach(),
    to: client.email,
    subject,
    html,
  })

  await logClientCommunication(admin, {
    clientId: id,
    kind: 'portal_orientation',
    subject,
    toAddress: client.email,
    sentBy: user.id,
    meta: { trigger: 'manual' },
  })

  return NextResponse.json({ sent: true })
}
