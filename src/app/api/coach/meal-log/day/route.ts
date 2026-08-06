/**
 * POST /api/coach/meal-log/day — coach updates a client's day-level meal-log
 * fields. Dashboard session-cookie auth.
 * Body: { clientId, hungerSignal?, satisfactionSignal?, overallNote?, status? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { updateDay } from '@/lib/meal-log-write'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await req.json()
  const { clientId, hungerSignal, satisfactionSignal, overallNote, status } = body as {
    clientId?: string
    hungerSignal?: string | null
    satisfactionSignal?: string | null
    overallNote?: string | null
    status?: 'in_progress' | 'logged'
  }

  if (!clientId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()
  const result = await updateDay(admin, { clientId, hungerSignal, satisfactionSignal, overallNote, status })
  return NextResponse.json(result.body, { status: result.status })
}
