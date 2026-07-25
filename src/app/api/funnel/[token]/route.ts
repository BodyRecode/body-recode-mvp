import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Statuses this endpoint is allowed to set on a challenge enrollment. Kept to a
// small allowlist so the coach UI can only activate/deactivate - never write an
// arbitrary status. 'inactive' drops the enrollment out of the Day 0 scorecard
// report and the active funnel view (both filter status = 'active') without
// deleting anything, including the SMS compliance logs tied to the lead.
const ALLOWED_STATUSES = ['active', 'inactive'] as const

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { token } = await params
  const body = await request.json().catch(() => ({}))
  const status = body?.status

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('challenge_enrollments')
    .update({ status })
    .eq('token', token)
    .select('token, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
