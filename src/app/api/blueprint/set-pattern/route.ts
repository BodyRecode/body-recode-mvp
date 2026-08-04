import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAssessmentPattern, type AssessmentSex } from '@/lib/pattern-taxonomy'

// Fallback assessment: only reached when nothing carried over from a prior read
// (no Challenge result, no high-confidence scorecard). Resolution happens here
// rather than client-side so the doctrine lives in one place.
//
// Storage location leads, the symptom signal confirms, and sex hard-gates —
// mirroring src/lib/fat-map-profile.ts. Ref: Fat_Map_Definitions_LOCKED.md v2.0.
export async function POST(request: NextRequest) {
  const { token, storage, signal, sex } = await request.json()

  if (!token) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const pattern = resolveAssessmentPattern({
    storage,
    signal,
    sex: sex === 'F' || sex === 'M' ? (sex as AssessmentSex) : null,
  })

  if (!pattern) {
    return NextResponse.json({ error: 'Invalid pattern.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('blueprint_enrollments')
    .update({ pattern, pattern_source: 'assessment', pattern_confirmed_at: new Date().toISOString() })
    .eq('token', token)
    .eq('pattern', 'pending')

  if (error) {
    return NextResponse.json({ error: 'Failed to update pattern.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, pattern })
}
