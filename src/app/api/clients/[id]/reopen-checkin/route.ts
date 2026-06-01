import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Reopen (or close) the weekly check-in window for a single client outside
 * the standard Friday 6pm – Sunday 6:30pm Brisbane schedule.
 *
 * Body:
 *   { action: 'open',  hours?: number }  // default 24h from now
 *   { action: 'close' }                  // clears the override
 *
 * Sets clients.checkin_window_override_until. Portal page treats any future
 * timestamp here as "window open" regardless of the global schedule.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

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

  const { data: updated, error } = await admin
    .from('clients')
    .update({ checkin_window_override_until: overrideUntil })
    .eq('id', id)
    .select('id, checkin_window_override_until')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: updated })
}
