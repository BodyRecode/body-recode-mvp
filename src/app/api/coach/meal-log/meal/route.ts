/**
 * POST /api/coach/meal-log/meal — coach records a client's meal outcome for
 * today (in-person / on their behalf). Dashboard session-cookie auth.
 * Body: { clientId, mealNumber, mealName?, sortOrder?, outcome, note? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { upsertMealOutcome } from '@/lib/meal-log-write'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await req.json()
  const { clientId, mealNumber, mealName, sortOrder, outcome, note } = body as {
    clientId?: string
    mealNumber?: number
    mealName?: string | null
    sortOrder?: number
    outcome?: string
    note?: string | null
  }

  if (!clientId || mealNumber == null || !outcome) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const result = await upsertMealOutcome(admin, { clientId, mealNumber, mealName, sortOrder, outcome, note })
  return NextResponse.json(result.body, { status: result.status })
}
