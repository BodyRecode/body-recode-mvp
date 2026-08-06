import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPortalAccessEmail } from '@/lib/portal-access-email'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', id)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })
  if (!client.onboarding_token) return NextResponse.json({ error: 'No onboarding token' }, { status: 400 })

  const result = await sendPortalAccessEmail({
    admin,
    client,
    sentBy: user.id,
    trigger: 'manual',
  })

  if (!result.ok) {
    const messages: Record<string, string> = {
      no_email: 'No email address for this client',
      no_token: 'No onboarding token',
      no_api_key: 'Email service is not configured',
      send_error: 'Email provider rejected the send',
    }
    return NextResponse.json(
      { sent: false, error: messages[result.reason] ?? result.reason, reason: result.reason },
      { status: 502 },
    )
  }

  return NextResponse.json({ sent: true })
}
