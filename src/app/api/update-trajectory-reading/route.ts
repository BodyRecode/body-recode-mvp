import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_FIELDS = new Set([
  'tr_where_this_block_started',
  'tr_how_your_signal_moved',
  'tr_what_held_steady',
  'tr_what_this_sets_up_next',
  'tr_coach_note',
  'tr_coach_guidance',
])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { program_id, field, value } = await request.json()
  if (!program_id) {
    return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })
  }
  if (typeof field !== 'string' || !ALLOWED_FIELDS.has(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }
  if (typeof value !== 'string' && value !== null) {
    return NextResponse.json({ error: 'Value must be a string or null' }, { status: 400 })
  }

  // Strip em dashes from any inline edits to honour the content rule.
  const cleaned = typeof value === 'string' ? value.replace(/—/g, ', ') : value

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('programs')
    .update({ [field]: cleaned })
    .eq('id', program_id)
    .select(`id, ${field}`)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ program: data })
}
