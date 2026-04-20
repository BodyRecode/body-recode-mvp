import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MARKERS = [
  'energy_levels',
  'morning_energy',
  'sleep_quality',
  'afternoon_crash',
  'hunger_cravings',
  'training_recovery',
  'mood_stability',
  'physical_changes',
] as const

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, week_number, notes, ...markerValues } = body

  if (!token || !week_number) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  // Validate all 8 markers are present and 1-5
  for (const marker of MARKERS) {
    const val = markerValues[marker]
    if (typeof val !== 'number' || val < 1 || val > 5) {
      return NextResponse.json({ error: `Invalid value for ${marker}.` }, { status: 400 })
    }
  }

  const admin = createAdminClient()

  // Resolve token to enrollment id
  const { data: enrollment } = await admin
    .from('blueprint_enrollments')
    .select('id, current_week')
    .eq('token', token)
    .single()

  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found.' }, { status: 404 })
  }


  // Only allow check-in for current or past weeks
  if (week_number > enrollment.current_week) {
    return NextResponse.json({ error: 'Week not yet unlocked.' }, { status: 403 })
  }

  const { error } = await admin
    .from('blueprint_checkins')
    .insert({
      enrollment_id: enrollment.id,
      week_number,
      energy_levels: markerValues.energy_levels,
      morning_energy: markerValues.morning_energy,
      sleep_quality: markerValues.sleep_quality,
      afternoon_crash: markerValues.afternoon_crash,
      hunger_cravings: markerValues.hunger_cravings,
      training_recovery: markerValues.training_recovery,
      mood_stability: markerValues.mood_stability,
      physical_changes: markerValues.physical_changes,
      notes: notes || null,
    })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Check-in already submitted for this week.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to save check-in.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })

  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('blueprint_enrollments')
    .select('id')
    .eq('token', token)
    .single()

  if (!enrollment) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const { data: checkins } = await admin
    .from('blueprint_checkins')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .order('week_number', { ascending: true })

  return NextResponse.json({ checkins: checkins ?? [] })
}
