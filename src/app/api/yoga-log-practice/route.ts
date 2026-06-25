import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Coach-side practice logging. The coach, training the client in person and
// viewing the client's program on the dashboard, logs a completed practice on
// the client's behalf. logged_by = 'coach'. (Client self-logging via the portal
// is a separate route.)
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { program_id, session_index, notes = null, week_number_in_block = 1 } = await request.json()
  if (!program_id || session_index === undefined || session_index === null) {
    return NextResponse.json({ error: 'Missing program_id or session_index' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: program, error: progErr } = await admin
    .from('programs')
    .select('id, client_id, modality, sessions')
    .eq('id', program_id)
    .single()
  if (progErr || !program) return NextResponse.json({ error: 'Block not found' }, { status: 404 })
  if (program.modality !== 'yoga') return NextResponse.json({ error: 'Not a yoga block' }, { status: 400 })

  const sessions = (program.sessions as Array<Record<string, unknown>>) ?? []
  const session = sessions[Number(session_index)]
  if (!session) return NextResponse.json({ error: 'Practice not found in block' }, { status: 400 })

  const { data: row, error } = await admin
    .from('session_completions')
    .insert({
      client_id: program.client_id,
      program_id,
      session_index: Number(session_index),
      day_label: (session.day_label as string) ?? `Practice ${Number(session_index) + 1}`,
      session_name: (session.day_label as string) ?? null,
      week_number_in_block,
      prescription_snapshot: session,
      status: 'completed',
      session_notes: notes,
      logged_by: 'coach',
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: `Failed to log: ${error.message}` }, { status: 500 })

  return NextResponse.json({ ok: true, id: row.id })
}
