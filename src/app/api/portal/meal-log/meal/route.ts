/**
 * POST /api/portal/meal-log/meal — client records one meal's outcome for today
 * (ate / swapped / skipped, + optional note). Token+email portal auth.
 * Body: { token, clientId, mealNumber, mealName?, sortOrder?, outcome, note? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { upsertMealOutcome } from '@/lib/meal-log-write'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { token, clientId, mealNumber, mealName, sortOrder, outcome, note } = body as {
    token?: string
    clientId?: string
    mealNumber?: number
    mealName?: string | null
    sortOrder?: number
    outcome?: string
    note?: string | null
  }

  if (!token || !clientId || mealNumber == null || !outcome) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()
  if (!client) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const result = await upsertMealOutcome(admin, {
    clientId: client.id,
    mealNumber,
    mealName,
    sortOrder,
    outcome,
    note,
  })
  return NextResponse.json(result.body, { status: result.status })
}
