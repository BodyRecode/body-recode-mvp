import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PORTAL_ACCESS_STATUSES } from '@/lib/challenge-access'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { token, formType, responses } = body as {
    token: string
    formType: 'parq' | 'health_dec'
    responses?: Record<string, string>
  }

  if (!token || !formType) {
    return NextResponse.json({ error: 'Missing token or formType.' }, { status: 400 })
  }

  if (formType !== 'parq' && formType !== 'health_dec') {
    return NextResponse.json({ error: 'Invalid formType.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: enrollment, error: fetchError } = await admin
    .from('challenge_enrollments')
    .select('id')
    .eq('token', token)
    .in('status', PORTAL_ACCESS_STATUSES)
    .single()

  if (fetchError || !enrollment) {
    return NextResponse.json({ error: 'Enrollment not found.' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const updateData =
    formType === 'parq'
      ? { parq_completed_at: now, parq_responses: responses ?? {} }
      : { health_dec_completed_at: now }

  const { error: updateError } = await admin
    .from('challenge_enrollments')
    .update(updateData)
    .eq('id', enrollment.id)

  if (updateError) {
    console.error('[challenge/forms] update error:', updateError)
    return NextResponse.json({ error: 'Failed to save form.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
