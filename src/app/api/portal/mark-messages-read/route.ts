import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Marks the coach's messages as read for this client.
 *
 * Called from the portal thread on mount rather than during the server render:
 * a server-side write would also fire on route prefetch, marking messages read
 * the client never actually looked at.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { clientId } = await req.json().catch(() => ({}))
  if (!clientId) return NextResponse.json({ error: 'Missing client' }, { status: 400 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, email')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const userEmail = (user.email ?? '').toLowerCase()
  const isOwner = userEmail === (client.email ?? '').toLowerCase()
  // A coach previewing the portal should not clear the client's unread state.
  if (!isOwner) {
    if (isCoachEmail(userEmail)) return NextResponse.json({ success: true, skipped: 'coach-preview' })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('client_messages')
    .update({ client_read_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .eq('sender', 'coach')
    .is('client_read_at', null)

  if (error) {
    console.error('[mark-messages-read] failed:', error)
    return NextResponse.json({ error: 'Could not update' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
