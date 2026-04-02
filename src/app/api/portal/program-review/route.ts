import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, adherence_confirmed, signal_category, signals_noted, direction } = body

  if (!token || !direction) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  const { data: program } = await admin
    .from('programs')
    .select('id')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'No active program' }, { status: 404 })

  const { error: reviewError } = await admin
    .from('program_reviews')
    .insert({
      program_id: program.id,
      client_id: client.id,
      adherence_confirmed: adherence_confirmed ?? false,
      signal_category: signal_category || null,
      signal_strength: 'moderate',
      days_under_observation: 7,
      signals_noted: signals_noted || null,
      direction,
      submitted_by: 'client',
    })

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })

  await admin
    .from('programs')
    .update({ current_direction: direction, last_review_at: new Date().toISOString() })
    .eq('id', program.id)

  return NextResponse.json({ ok: true })
}
