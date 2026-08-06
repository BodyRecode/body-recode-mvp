import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

  const { clientId, dayOfWeek, sessionTime, durationMinutes } = await request.json()

  if (!clientId || dayOfWeek === undefined || !sessionTime || !durationMinutes) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('client_fixed_slots')
    .insert({
      client_id: clientId,
      day_of_week: dayOfWeek,
      session_time: sessionTime,
      duration_minutes: durationMinutes,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('client_fixed_slots')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
