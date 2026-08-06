import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Mark a weekly check-in as skipped (no coach response needed) or unskip it.
 * Sets/clears `coach_skipped_at`, `coach_skipped_by`, `coach_skip_reason` on
 * the weekly_checkins row.
 *
 * Skipped check-ins are treated as resolved by the action-required logic on
 * the client profile (Weekly Synthesis attention pill stays clear) and by
 * the Today's Focus state machine (no "Respond to..." row).
 *
 * Skipping is internal-only — the client portal renders nothing different
 * for a skipped check-in.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: checkinId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { action, reason } = await request.json()
  if (action !== 'skip' && action !== 'unskip') {
    return NextResponse.json({ error: 'action must be "skip" or "unskip"' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: checkin } = await admin
    .from('weekly_checkins')
    .select('id')
    .eq('id', checkinId)
    .maybeSingle()
  if (!checkin) return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })

  const update =
    action === 'skip'
      ? {
          coach_skipped_at: new Date().toISOString(),
          coach_skipped_by: user.id,
          coach_skip_reason: (reason ?? '').toString().trim() || null,
        }
      : { coach_skipped_at: null, coach_skipped_by: null, coach_skip_reason: null }

  const { data: updated, error } = await admin
    .from('weekly_checkins')
    .update(update)
    .eq('id', checkinId)
    .select('id, coach_skipped_at, coach_skipped_by, coach_skip_reason')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ checkin: updated })
}
