import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { computeRosterNextActions } from '@/lib/roster-next-actions'

// Lightweight counts for the co-pilot bubble's attention badge (Phase 6).
// Same ranking engine as the Today's Focus board, reduced to three numbers so
// the everywhere-bubble can show "N awaiting you" without opening.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Coach access only' }, { status: 403 })

  try {
    const { actions } = await computeRosterNextActions(createAdminClient())
    const awaiting = actions.filter(a => a.priority <= 20).length
    const drifting = actions.filter(a => a.priority === 30).length
    return NextResponse.json({ awaiting, drifting, total: actions.length })
  } catch (err) {
    console.error('[copilot roster-summary]', err instanceof Error ? err.message : String(err))
    // Non-blocking: a failed count just means no badge.
    return NextResponse.json({ awaiting: 0, drifting: 0, total: 0 })
  }
}
