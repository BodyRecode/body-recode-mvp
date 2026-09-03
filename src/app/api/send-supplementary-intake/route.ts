import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Adds a pending supplementary intake invitation for the client. The
 * invitation surfaces as a task card on the client's portal landing page;
 * we do NOT email the link (the portal IS the channel).
 *
 * Supplementary intakes ask only the fields added after the original
 * 230-question intake (currently: medications + 4 dietary context fields). On
 * submission, the answers UPDATE the most recent intake row for the client,
 * update clients.medications, and trigger CFFS regeneration.
 *
 * Idempotent: if a pending supplementary invitation already exists for this
 * client, the existing one is returned rather than creating a duplicate.
 */
export async function POST(request: NextRequest) {
  const { clientId } = await request.json()
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const admin = createAdminClient()

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .single()
  if (clientErr || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Don't create a duplicate pending invitation.
  const { data: existing } = await admin
    .from('intake_invitations')
    .select('id, token')
    .eq('client_id', clientId)
    .eq('kind', 'supplementary')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, token: existing.token, reused: true })
  }

  const { data: invitation, error: insErr } = await admin
    .from('intake_invitations')
    .insert({ client_id: clientId, kind: 'supplementary' })
    .select('id, token')
    .single()

  if (insErr || !invitation) {
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, token: invitation.token, reused: false })
}
