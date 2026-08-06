import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Revoke or restore a guest link. Coach-only.
 * PATCH body: { action: 'revoke' | 'restore' }.
 * Revoking sets revoked_at; the /room gate then shows the "no longer active"
 * screen for that one link without touching anyone else's access.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const action = body.action

  if (action !== 'revoke' && action !== 'restore') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('partner_rooms')
    .update({ revoked_at: action === 'revoke' ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to update room' }, { status: 500 })
  }

  return NextResponse.json(data)
}
