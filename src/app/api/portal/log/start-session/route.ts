/**
 * POST /api/portal/log/start-session
 *
 * Get-or-create endpoint: opens a new session_completion for the given
 * (client × program × session_index × week_number_in_block), or returns the
 * existing one if it's already in_progress / completed.
 *
 * On creation, also pre-creates the session_exercise_completions rows from
 * the prescription snapshot, so the live logging UI can write set logs
 * directly without further setup.
 *
 * Body:
 *   { token: string, clientId: string, sessionIndex: number, weekNumberInBlock: number }
 *
 * Returns:
 *   { sessionCompletionId: string, status: 'in_progress' | 'completed' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { parsePrescribedSessions, type PrescribedSession } from '@/lib/workout-logging'

export async function POST(req: NextRequest) {
  // Portal auth: client must be logged in via the portal email/code
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { token, clientId, sessionIndex, weekNumberInBlock } = body as {
    token?: string
    clientId?: string
    sessionIndex?: number
    weekNumberInBlock?: number
  }

  if (!token || !clientId || sessionIndex == null || weekNumberInBlock == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify token + email match this client
  const { data: client } = await admin
    .from('clients')
    .select('id, email')
    .eq('id', clientId)
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Load active program
  const { data: program } = await admin
    .from('programs')
    .select('id, sessions, week_duration')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'No active program' }, { status: 404 })

  const prescribedSessions = parsePrescribedSessions(program.sessions)
  const prescribed: PrescribedSession | undefined = prescribedSessions[sessionIndex]
  if (!prescribed) return NextResponse.json({ error: 'Invalid sessionIndex' }, { status: 400 })

  // Validate week number against program's week_duration
  if (program.week_duration && weekNumberInBlock > program.week_duration) {
    return NextResponse.json(
      { error: `Week ${weekNumberInBlock} is past the block end (${program.week_duration} weeks)` },
      { status: 400 },
    )
  }

  // Get-or-create: look for any existing completion for this combo (any status)
  const { data: existing } = await admin
    .from('session_completions')
    .select('id, status')
    .eq('client_id', client.id)
    .eq('program_id', program.id)
    .eq('session_index', sessionIndex)
    .eq('week_number_in_block', weekNumberInBlock)
    .neq('status', 'abandoned')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ sessionCompletionId: existing.id, status: existing.status })
  }

  // Create the session_completion row
  const { data: created, error: createErr } = await admin
    .from('session_completions')
    .insert({
      client_id: client.id,
      program_id: program.id,
      session_index: sessionIndex,
      day_label: prescribed.day_label,
      session_name: prescribed.skeleton ?? null,
      week_number_in_block: weekNumberInBlock,
      prescription_snapshot: {
        day_label: prescribed.day_label,
        skeleton: prescribed.skeleton,
        movement_prep: prescribed.movement_prep,
        blocks: prescribed.blocks,
      },
      status: 'in_progress',
    })
    .select('id, status')
    .single()

  if (createErr || !created) {
    console.error('[start-session] insert failed:', createErr)
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
  }

  // Pre-create session_exercise_completions for every prescribed exercise
  const exerciseRows = prescribed.flatExercises.map(({ block_label, exercise, sort_order }) => ({
    session_completion_id: created.id,
    block_label,
    sort_order,
    prescribed_exercise_name: exercise.exercise_name,
    prescribed_sets: exercise.sets,
    prescribed_reps: exercise.reps,
    prescribed_rpe: exercise.rpe,
    prescribed_rest: exercise.rest,
    prescribed_notes: exercise.notes,
    substituted: false,
  }))

  if (exerciseRows.length > 0) {
    const { error: exErr } = await admin.from('session_exercise_completions').insert(exerciseRows)
    if (exErr) {
      console.error('[start-session] exercise rows insert failed:', exErr)
      // Roll back the session_completion to keep state clean
      await admin.from('session_completions').delete().eq('id', created.id)
      return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
    }
  }

  return NextResponse.json({ sessionCompletionId: created.id, status: created.status })
}
