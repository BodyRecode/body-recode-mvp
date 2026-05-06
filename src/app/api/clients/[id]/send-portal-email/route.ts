import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPortalAccessEmail } from '@/lib/portal-access-email'

export async function POST(
  _request: NextRequest,
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
  if (!client.onboarding_token) return NextResponse.json({ error: 'No onboarding token' }, { status: 400 })

  const sent = await sendPortalAccessEmail({
    admin,
    client,
    sentBy: user.id,
    trigger: 'manual',
  })

  return NextResponse.json({ sent })
}
