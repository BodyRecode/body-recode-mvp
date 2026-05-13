/**
 * On-demand Stripe refresh for a single client.
 *
 * Triggered by the "Refresh from Stripe" button on the per-client Payments
 * section. Pulls live subscription state from Stripe and rewrites
 * client_subscriptions for that client.
 *
 * POST body: { client_id: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refreshClientFromStripe } from '@/lib/stripe-sync'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const clientId = body?.client_id
  if (!clientId || typeof clientId !== 'string') {
    return NextResponse.json({ error: 'client_id required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the requesting coach owns this client (defence in depth — RLS
  // also enforces this, but the admin client bypasses RLS so we check
  // explicitly here).
  const { data: client } = await admin
    .from('clients')
    .select('id, coach_id')
    .eq('id', clientId)
    .single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (client.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await refreshClientFromStripe(admin, clientId)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Refresh failed' },
      { status: 500 }
    )
  }
}
