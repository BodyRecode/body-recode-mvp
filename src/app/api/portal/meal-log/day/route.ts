/**
 * POST /api/portal/meal-log/day — client updates today's day-level fields
 * (hunger + satisfaction signal, overall note, status). Token+email auth.
 * Body: { token, clientId, hungerSignal?, satisfactionSignal?, overallNote?, status? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { updateDay } from '@/lib/meal-log-write'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { token, clientId, hungerSignal, satisfactionSignal, overallNote, status } = body as {
    token?: string
    clientId?: string
    hungerSignal?: string | null
    satisfactionSignal?: string | null
    overallNote?: string | null
    status?: 'in_progress' | 'logged'
  }

  if (!token || !clientId) {
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

  const result = await updateDay(admin, {
    clientId: client.id,
    hungerSignal,
    satisfactionSignal,
    overallNote,
    status,
  })
  return NextResponse.json(result.body, { status: result.status })
}
