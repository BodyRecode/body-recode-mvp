import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BLUEPRINT_PATTERN_SLUGS } from '@/lib/pattern-taxonomy'

// Resolves the "confirm or adjust" step shown when a pattern was carried into
// the Blueprint from a prior read (Challenge / scorecard) but not yet confirmed
// by the buyer.
//   - confirm:  keep the carried pattern + its provenance, just stamp confirmed.
//   - change:   buyer picked a different pattern → overwrite, mark as an
//               in-portal assessment, and stamp confirmed.
export async function POST(request: NextRequest) {
  const { token, pattern, change } = await request.json()

  if (!token) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  if (change) {
    if (!BLUEPRINT_PATTERN_SLUGS.includes(pattern)) {
      return NextResponse.json({ error: 'Invalid pattern.' }, { status: 400 })
    }
    const { error } = await admin
      .from('blueprint_enrollments')
      .update({ pattern, pattern_source: 'assessment', pattern_confirmed_at: now })
      .eq('token', token)
    if (error) return NextResponse.json({ error: 'Failed to update pattern.' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Confirm as-is: keep pattern + source, just stamp it confirmed.
  const { error } = await admin
    .from('blueprint_enrollments')
    .update({ pattern_confirmed_at: now })
    .eq('token', token)
  if (error) return NextResponse.json({ error: 'Failed to confirm pattern.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
