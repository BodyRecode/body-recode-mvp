import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Verify coach is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { clientId } = await req.json()
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const admin = createAdminClient()

  // Get client record
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, portal_user_id')
    .eq('id', clientId)
    .single()

  if (!client || !client.email) {
    return NextResponse.json({ error: 'Client not found or missing email' }, { status: 404 })
  }

  // If portal_user_id already set, generate a new magic link for existing user
  if (client.portal_user_id) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: client.email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodyrecode.au'}/auth/callback?next=/portal/dashboard` },
    })
    if (error || !data) return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
    return NextResponse.json({ link: data.properties.action_link })
  }

  // Create new auth user via invite
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: client.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodyrecode.au'}/auth/callback?next=/portal/dashboard` },
  })

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }

  // Link the new auth user to the client record
  await admin
    .from('clients')
    .update({ portal_user_id: data.user.id })
    .eq('id', clientId)

  return NextResponse.json({ link: data.properties.action_link })
}
