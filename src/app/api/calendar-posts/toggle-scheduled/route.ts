// POST /api/calendar-posts/toggle-scheduled
//
// Manually flip the `scheduled` boolean on a calendar_posts row. Used for
// posts where we can't auto-publish (personal brand → different IG account,
// stories → API gate, LinkedIn → different platform). The user schedules
// these manually in IG / Meta Business Suite / LinkedIn, then clicks the
// "Mark as scheduled" button so the day-view badge surfaces.
//
// Body: { id: string, scheduled: boolean }

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const sessionClient = await createServerSupabaseClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  }
  if (!(await isCoachUser(user))) return forbidden()

  let body: { id?: string; scheduled?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (!body.id || typeof body.scheduled !== 'boolean') {
    return NextResponse.json({ error: 'id and scheduled (boolean) required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('calendar_posts')
    .update({ scheduled: body.scheduled })
    .eq('id', body.id)
  if (error) {
    return NextResponse.json({ error: 'update_failed', message: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: body.id, scheduled: body.scheduled })
}
