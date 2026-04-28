import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('onboarding_token')
    .ilike('email', user.email ?? '')
    .maybeSingle()

  if (!client?.onboarding_token) {
    return NextResponse.json({ error: 'No client record found for this email' }, { status: 404 })
  }

  return NextResponse.json({ url: `/portal/${client.onboarding_token}` })
}
