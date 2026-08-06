import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCheckInWindowStatus } from '@/lib/weekly-checkin-questions'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Reopen (or close) the weekly check-in window for a single client outside
 * the standard Friday 6pm – Sunday 6:30pm Brisbane schedule.
 *
 * Body:
 *   { action: 'open',  hours?: number }  // default 24h from now
 *   { action: 'close' }                  // clears the override
 *
 * 2026-06-21: now also computes the right form to force on catch-up. If
 * the client's last submitted form matches the current global rotation,
 * the form they missed was the OTHER one — stamp that in
 * checkin_window_override_form. The portal page reads this and bypasses
 * the global rotation when the override is active. Solves the Amanda
 * W6 case: missed system week 12 (B), Reopen Monday in week 13 (A), pre-
 * fix she'd land on A again and break alternation. Post-fix she lands on
 * B as intended.
 *
 * Edge cases:
 *   - No prior check-ins → force null (use current rotation; alternation
 *     hasn't started yet so there's nothing to "miss").
 *   - Last form differs from current rotation → alternation is already
 *     intact; force null (current rotation is correct).
 *   - close action → clears both override_until and override_form.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { action, hours } = await request.json()
  if (action !== 'open' && action !== 'close') {
    return NextResponse.json({ error: 'action must be "open" or "close"' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Cap manual window at 7 days to avoid permanent open-state.
  const requestedHours = typeof hours === 'number' && hours > 0 ? Math.min(hours, 168) : 24
  const overrideUntil =
    action === 'open'
      ? new Date(Date.now() + requestedHours * 60 * 60 * 1000).toISOString()
      : null

  let overrideForm: 'A' | 'B' | null = null
  if (action === 'open') {
    const { data: lastCheckin } = await admin
      .from('weekly_checkins')
      .select('form_type')
      .eq('client_id', id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastCheckin?.form_type === 'A' || lastCheckin?.form_type === 'B') {
      const currentForm = getCheckInWindowStatus().formType
      if (lastCheckin.form_type === currentForm) {
        overrideForm = currentForm === 'A' ? 'B' : 'A'
      }
    }
  }

  const { data: updated, error } = await admin
    .from('clients')
    .update({
      checkin_window_override_until: overrideUntil,
      checkin_window_override_form: overrideForm,
    })
    .eq('id', id)
    .select('id, checkin_window_override_until, checkin_window_override_form')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: updated })
}
