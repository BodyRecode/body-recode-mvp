// GET /api/feedback/day21-enrollment/[token]
// Public lookup by enrolment token. Returns the IDs + name fields the Day 21
// feedback form needs to capture context. Same security model as the rest of
// the /challenge/[token]/* portal pages - token IS the auth.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  if (!token || token.length < 16) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }
  const admin = createAdminClient()
  const { data: enrollment } = await admin
    .from('challenge_enrollments')
    .select('id, lead_id, leads(name)')
    .eq('token', token)
    .single()
  if (!enrollment) {
    return NextResponse.json({ error: 'enrollment_not_found' }, { status: 404 })
  }
  const nameStr = (enrollment.leads && typeof enrollment.leads === 'object' && 'name' in enrollment.leads ? (enrollment.leads as { name: string | null }).name : null) ?? null
  let firstName: string | null = null
  let lastInitial: string | null = null
  if (nameStr) {
    const parts = nameStr.trim().split(/\s+/)
    firstName = parts[0] ?? null
    lastInitial = parts[1]?.[0]?.toUpperCase() ?? null
  }
  return NextResponse.json({
    id: enrollment.id,
    leadId: enrollment.lead_id ?? null,
    firstName,
    lastInitial,
  })
}
