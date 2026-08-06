import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DailyRoutine } from '@/lib/daily-routine-defaults'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Save an updated Morning Reset + Evening Rhythm sequence for a client.
 *
 * PATCH `{ daily_routine: DailyRoutine | null }` — null resets to canonical
 * defaults (fall-back logic lives in resolveDailyRoutine on read).
 *
 * Coach-authenticated; the client-facing portal page reads the same field
 * with public admin access via the token, so this route is the ONLY write
 * path.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const routine = body.daily_routine as DailyRoutine | null | undefined

  // Basic validation. Null is explicitly allowed (resets to defaults).
  if (routine !== null && routine !== undefined) {
    if (typeof routine !== 'object') {
      return NextResponse.json({ error: 'daily_routine must be an object or null' }, { status: 400 })
    }
    // Trim step arrays and reject completely-empty sequences (caller should
    // send null to reset, not empty objects — this catches accidental blanks).
    for (const key of ['morning', 'evening'] as const) {
      const seq = routine[key]
      if (seq && !Array.isArray(seq.steps)) {
        return NextResponse.json({ error: `${key}.steps must be an array` }, { status: 400 })
      }
    }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({ daily_routine: routine ?? null })
    .eq('id', id)

  if (error) {
    console.error('daily-routine save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
