import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Weekly check-in for the 90-Day Body Rewire Extension. Mirrors the membership
// check-in route (the Extension portal reuses the membership portal UI) but
// resolves the token against extension_enrollments and writes extension_checkins
// (weeks 1-12). Without this, the shared portal's check-in POST hit the
// membership route with an extension token and 404'd.

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, week_number, notes, energy_levels, morning_energy, sleep_quality, afternoon_crash, hunger_cravings, training_recovery, mood_stability, physical_changes } = body

  if (!token || !week_number) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('extension_enrollments')
    .select('id, current_week')
    .eq('token', token)
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found.' }, { status: 404 })

  const { error } = await admin
    .from('extension_checkins')
    .insert({
      enrollment_id: enrollment.id,
      week_number,
      energy_levels,
      morning_energy,
      sleep_quality,
      afternoon_crash,
      hunger_cravings,
      training_recovery,
      mood_stability,
      physical_changes,
      notes: notes ?? null,
    })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Check-in for this week already submitted.' }, { status: 409 })
    }
    console.error('Extension check-in insert error:', error)
    return NextResponse.json({ error: 'Failed to save check-in.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })

  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('extension_enrollments')
    .select('id')
    .eq('token', token)
    .maybeSingle()

  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found.' }, { status: 404 })

  const { data: checkins } = await admin
    .from('extension_checkins')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .order('week_number', { ascending: true })

  return NextResponse.json({ checkins: checkins ?? [] })
}
