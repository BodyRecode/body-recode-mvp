import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { proposeNutritionRevision, applyNutritionRevision } from '@/lib/nutrition-revise-preview'

export const maxDuration = 300

/**
 * Revise a client's LIVE nutrition plan one change at a time (Kade, 1 Sep 2026).
 *   propose  words become minimal edits plus a preview; nothing is saved.
 *   apply    re-previewed on the server and written as a new DRAFT through
 *            reviseNutritionPlan; the live plan stays live until Approve.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json().catch(() => ({}))
  const admin = createAdminClient()

  if (body?.action === 'propose') {
    const instruction = String(body?.instruction ?? '').trim()
    if (!instruction) return NextResponse.json({ error: 'Say what should change.' }, { status: 400 })
    const r = await proposeNutritionRevision(admin, clientId, instruction)
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: r.status })
  }
  if (body?.action === 'apply') {
    const r = await applyNutritionRevision(admin, clientId, { operations: body?.operations, changeNote: body?.changeNote, acceptIssues: body?.acceptIssues === true })
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error, newIssues: r.newIssues }, { status: r.status })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
