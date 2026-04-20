import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_PATTERNS = ['stress-stored', 'metabolic-drift', 'hormonal-shift', 'system-overload']

export async function POST(request: NextRequest) {
  const { token, pattern } = await request.json()

  if (!token || !VALID_PATTERNS.includes(pattern)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('blueprint_enrollments')
    .update({ pattern, pattern_source: 'assessment' })
    .eq('token', token)
    .eq('pattern', 'pending')

  if (error) {
    return NextResponse.json({ error: 'Failed to update pattern.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
