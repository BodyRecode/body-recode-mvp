import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  generateTrajectoryReadingForProgram,
  TrajectoryGenerationError,
} from '@/lib/trajectory-generator'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { program_id } = await request.json()
  if (!program_id) {
    return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })
  }

  let result
  try {
    result = await generateTrajectoryReadingForProgram(program_id)
  } catch (err) {
    if (err instanceof TrajectoryGenerationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Trajectory generation failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Coach-gated: generate ONLY drafts. Publishing (and the client email) is a
  // separate, deliberate step via /api/publish-trajectory-reading.
  const admin = createAdminClient()
  const { data: updated, error: updateErr } = await admin
    .from('programs')
    .update({
      tr_where_this_block_started: result.sections.tr_where_this_block_started,
      tr_how_your_signal_moved: result.sections.tr_how_your_signal_moved,
      tr_what_held_steady: result.sections.tr_what_held_steady,
      tr_what_this_sets_up_next: result.sections.tr_what_this_sets_up_next,
      tr_coach_note: result.sections.tr_coach_note,
      trajectory_reading_generated_at: new Date().toISOString(),
    })
    .eq('id', program_id)
    .select()
    .single()

  if (updateErr) {
    console.error('Failed to save trajectory reading:', updateErr)
    return NextResponse.json({ error: 'Failed to save reading' }, { status: 500 })
  }

  return NextResponse.json({
    program: updated,
    weeksRead: result.weeksRead,
    blockStartWeek: result.blockStartWeek,
    blockEndWeek: result.blockEndWeek,
  })
}
