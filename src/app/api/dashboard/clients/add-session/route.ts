import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { clientId, scheduledAt, durationMinutes } = await req.json()
  if (!clientId || !scheduledAt || !durationMinutes) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('client_sessions')
    .insert({
      client_id: clientId,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      status: 'scheduled',
    })

  if (error) {
    console.error('Add session error:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
