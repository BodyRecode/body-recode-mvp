/**
 * One-shot backfill: walk every paid be_payments row that looks like a
 * commencement fee (no stripe_subscription_id + amount = $240) and ensure
 * client_payment_plan.commencement_fee_paid_at is populated for the matching
 * client. Idempotent — markCommencementPaid skips clients already marked.
 *
 * Why it exists: the lead-stage commencement webhook previously inserted into
 * be_payments only, never into client_payment_plan. Every historical client
 * paid that way (Luke et al) showed as "Not tracked for payments" on their
 * profile even though the fee had landed. This patches the data so the per-
 * client section reads truthfully without manual Mark-Commencement clicks.
 *
 * Auth: coach session required (admin pattern used by the rest of
 * /api/admin/*). POST-only so a stray GET can't trigger the backfill.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { markCommencementPaid } from '@/lib/stripe-sync'
import { isCoachUser, forbidden } from '@/lib/api-auth'

const DEFAULT_COMMENCEMENT_AMOUNT = 240

export async function POST(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const admin = createAdminClient()

  // Pull every paid be_payment that walks like a commencement fee. The shape
  // we expect: no subscription link AND amount matches the default $240. If
  // you have non-default plan amounts you'd extend this — for now $240 is
  // canonical per the Hormozi default plan.
  const { data: candidates, error } = await admin
    .from('be_payments')
    .select('client_id, amount, paid_at, created_at, stripe_payment_id, stripe_subscription_id, status')
    .eq('status', 'paid')
    .is('stripe_subscription_id', null)
    .eq('amount', DEFAULT_COMMENCEMENT_AMOUNT)
    .not('client_id', 'is', null)

  if (error) {
    console.error('[backfill-commencement] fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Dedupe by client_id (a client may have multiple matching rows — earliest
  // wins, since that's the "real" commencement). markCommencementPaid is
  // idempotent so duplicates are safe, but we still pick deterministically.
  const earliestByClient = new Map<string, typeof candidates[number]>()
  for (const row of candidates ?? []) {
    if (!row.client_id) continue
    const existing = earliestByClient.get(row.client_id)
    const rowTs = new Date(row.paid_at ?? row.created_at ?? 0).getTime()
    const existingTs = existing ? new Date(existing.paid_at ?? existing.created_at ?? 0).getTime() : Infinity
    if (!existing || rowTs < existingTs) {
      earliestByClient.set(row.client_id, row)
    }
  }

  let alreadyMarked = 0
  let newlyMarked = 0
  let failed = 0

  for (const [clientId, row] of earliestByClient.entries()) {
    // Skip if already marked in client_payment_plan — saves the lookup inside
    // markCommencementPaid but we report it for visibility.
    const { data: existingPlan } = await admin
      .from('client_payment_plan')
      .select('commencement_fee_paid_at')
      .eq('client_id', clientId)
      .maybeSingle()
    if (existingPlan?.commencement_fee_paid_at) {
      alreadyMarked++
      continue
    }

    try {
      await markCommencementPaid(
        admin,
        clientId,
        row.stripe_payment_id ?? '',
        new Date(row.paid_at ?? row.created_at ?? Date.now()),
      )
      newlyMarked++
    } catch (e) {
      console.error('[backfill-commencement] markCommencementPaid failed:', clientId, e)
      failed++
    }
  }

  return NextResponse.json({
    scanned: candidates?.length ?? 0,
    uniqueClients: earliestByClient.size,
    alreadyMarked,
    newlyMarked,
    failed,
  })
}
