import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

// Coach Co-Pilot Phase 8 — coach-style memory. A coach-owned free-text note the
// co-pilot reads as SOFT guidance. Explicit (the coach edits it), never
// inferred, and it never overrides doctrine. Keyed by coach email.

export const MAX_PREFERENCES = 4000

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Coach access only' }, { status: 403 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('coach_preferences')
    .select('preferences')
    .eq('coach_email', user.email!)
    .maybeSingle()
  return NextResponse.json({ preferences: (data?.preferences as string) ?? '' })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Coach access only' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const text = (typeof body?.preferences === 'string' ? body.preferences : '').slice(0, MAX_PREFERENCES)

  const admin = createAdminClient()
  const { error } = await admin
    .from('coach_preferences')
    .upsert({ coach_email: user.email!, preferences: text, updated_at: new Date().toISOString() }, { onConflict: 'coach_email' })
  if (error) {
    console.error('[copilot preferences] save failed:', error.message)
    return NextResponse.json({ error: 'Could not save preferences' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, preferences: text })
}
