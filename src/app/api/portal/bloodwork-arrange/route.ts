import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Client-facing onboarding action: record that the client will arrange a blood
 * panel ("I'll get them done"), or undo it. This is the second completion path
 * for the Blood Work onboarding step; the first is uploading a panel via
 * /api/portal/upload-blood-panel.
 *
 * No plan influence, no clinical anything. It only stamps
 * clients.bloodwork_arranged_at so the onboarding checklist can mark the step
 * addressed. Token-authorised (portal onboarding_token) AND verified against the
 * signed-in user, matching the /bloods page's own guard.
 */
export async function POST(req: NextRequest) {
  const { token, arranged } = await req.json().catch(() => ({}))
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, email')
    .eq('onboarding_token', token)
    .maybeSingle()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('clients')
    .update({ bloodwork_arranged_at: arranged ? new Date().toISOString() : null })
    .eq('id', client.id)

  if (error) {
    console.error('bloodwork-arrange update error:', error)
    return NextResponse.json({ error: 'Could not save' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, arranged: !!arranged })
}
