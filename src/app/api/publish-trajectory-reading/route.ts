import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { checkReadingBeforePublish } from '@/lib/reading-publish-guard'

// Reading-published client emails scrapped 2026-06-09. The Block-End Trajectory
// Reading still gets generated + published; this route just flips
// trajectory_reading_published_at. No email. The next training block's plan
// publish (Notify Client on the new program) is the next client touchpoint.

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  if (!(await isCoachUser(user))) return forbidden()

  const { program_id, action } = await request.json()
  if (!program_id) {
    return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })
  }
  if (action !== 'publish' && action !== 'unpublish') {
    return NextResponse.json({ error: 'action must be publish or unpublish' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: program, error: programErr } = await admin
    .from('programs')
    .select('id, client_id, block_name, trajectory_reading_generated_at')
    .eq('id', program_id)
    .single()

  if (programErr || !program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  if (action === 'publish' && !program.trajectory_reading_generated_at) {
    return NextResponse.json(
      { error: 'Generate the reading before publishing' },
      { status: 400 }
    )
  }

  // Same no-invented-facts lint gate the other client-facing readings pass. The
  // trajectory / Progress Read reaches the portal, so it must clear it too.
  if (action === 'publish') {
    const check = await checkReadingBeforePublish(admin, 'trajectory', program_id, program.client_id)
    if (!check.ok) {
      return NextResponse.json({ error: `${check.label} cannot be published yet.`, findings: check.findings }, { status: 422 })
    }
  }

  const { data: updated, error: updateErr } = await admin
    .from('programs')
    .update({
      trajectory_reading_published_at: action === 'publish' ? new Date().toISOString() : null,
    })
    .eq('id', program_id)
    .select('id, trajectory_reading_published_at')
    .single()

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ program: updated })
}
