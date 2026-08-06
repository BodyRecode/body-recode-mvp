import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Approve (or revoke) a blood panel for PLAN INFLUENCE. This is the coach gate:
 * only an approved panel's markers inject into CFFS regeneration (which then
 * propagates downstream to the Foundational Reading, program, and nutrition,
 * the same way the baseline-photo signal does). Approving does not itself
 * regenerate the CFFS; the coach runs Regenerate CFFS afterwards.
 *
 * A panel needs transcribed markers to be approvable. We do not auto-unapprove
 * older panels — the CFFS injection always picks the most recently approved
 * panel, so the latest one wins.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; panelId: string }> }
) {
  const { id, panelId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { action } = await req.json().catch(() => ({ action: 'approve' }))
  const admin = createAdminClient()

  const { data: panel } = await admin
    .from('blood_panels')
    .select('id, markers, analysis')
    .eq('id', panelId)
    .eq('client_id', id)
    .maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Blood panel not found' }, { status: 404 })

  if (action === 'approve') {
    const markers = (panel.markers ?? []) as unknown[]
    if (markers.length === 0) {
      return NextResponse.json({ error: 'This panel has no transcribed markers to feed the plan.' }, { status: 400 })
    }
    const { data: updated, error } = await admin
      .from('blood_panels')
      .update({ approved_for_plan: true, approved_at: new Date().toISOString(), status: 'approved' })
      .eq('id', panelId)
      .select('approved_for_plan, approved_at')
      .single()
    if (error) return NextResponse.json({ error: `Approve failed: ${error.message}` }, { status: 500 })
    return NextResponse.json({ panel: updated })
  }

  // Revoke
  const { data: updated, error } = await admin
    .from('blood_panels')
    .update({ approved_for_plan: false, approved_at: null, status: panel.analysis ? 'analyzed' : 'extracted' })
    .eq('id', panelId)
    .select('approved_for_plan, approved_at')
    .single()
  if (error) return NextResponse.json({ error: `Revoke failed: ${error.message}` }, { status: 500 })
  return NextResponse.json({ panel: updated })
}
