import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Client-side practice logging from the portal. The client marks a practice
// complete on their own block. Resolved by the portal onboarding_token.
// logged_by = 'client'.
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const { token, program_id, session_index, notes = null } = await request.json()
  if (!token || !program_id || session_index === undefined || session_index === null) {
    return NextResponse.json({ error: 'Missing token, program_id or session_index' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: client } = await admin.from('clients').select('id').eq('onboarding_token', token).maybeSingle()
  if (!client) return NextResponse.json({ error: 'Invalid token' }, { status: 403 })

  const { data: program } = await admin
    .from('programs')
    .select('id, client_id, modality, is_active, sessions')
    .eq('id', program_id)
    .maybeSingle()
  if (!program || program.client_id !== client.id || !program.is_active) {
    return NextResponse.json({ error: 'Block not available' }, { status: 403 })
  }

  const sessions = (program.sessions as Array<Record<string, unknown>>) ?? []
  const session = sessions[Number(session_index)]
  if (!session) return NextResponse.json({ error: 'Practice not found' }, { status: 400 })

  const { data: row, error } = await admin
    .from('session_completions')
    .insert({
      client_id: client.id,
      program_id,
      session_index: Number(session_index),
      day_label: (session.day_label as string) ?? `Practice ${Number(session_index) + 1}`,
      session_name: (session.day_label as string) ?? null,
      week_number_in_block: 1,
      prescription_snapshot: session,
      status: 'completed',
      session_notes: notes,
      logged_by: 'client',
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: `Failed to log: ${error.message}` }, { status: 500 })

  return NextResponse.json({ ok: true, id: row.id })
}
