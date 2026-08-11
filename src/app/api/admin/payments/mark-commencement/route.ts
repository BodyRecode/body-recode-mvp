/**
 * Manually mark a client's commencement fee as paid. Used when the automatic
 * detection (one-off ~$297 Stripe charge) didn't catch it.
 *
 * POST body: { client_id: string, paid_at?: ISO date string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { markCommencementPaid } from '@/lib/stripe-sync'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json().catch(() => null)
  const clientId = body?.client_id
  const paidAt = body?.paid_at ? new Date(body.paid_at) : new Date()
  if (!clientId || typeof clientId !== 'string') {
    return NextResponse.json({ error: 'client_id required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, coach_id')
    .eq('id', clientId)
    .single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (client.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await markCommencementPaid(admin, clientId, 'manual', paidAt)
  return NextResponse.json({ ok: true })
}
