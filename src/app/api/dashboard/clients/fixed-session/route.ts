import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { clientId, day, time, duration, sessionType } = await req.json()

  if (clientId === undefined || day === undefined || !time || !duration || !sessionType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('clients')
    .update({
      fixed_session_day: day,
      fixed_session_time: time,
      fixed_session_duration: duration,
      session_type: sessionType,
    })
    .eq('id', clientId)

  if (error) {
    console.error('Fixed session update error:', error)
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
