import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Coach-gated publish for a yoga practice. Promotes the draft to active and
// makes it visible in the client's portal. Deactivates any prior active
// program for the client (one active practice at a time), mirroring the
// strength promote-to-active behaviour.
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { program_id } = await request.json()
  if (!program_id) return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })

  const admin = createAdminClient()

  const { data: program, error: progErr } = await admin
    .from('programs')
    .select('id, client_id, modality')
    .eq('id', program_id)
    .single()
  if (progErr || !program) return NextResponse.json({ error: 'Practice not found' }, { status: 404 })
  if (program.modality !== 'yoga') {
    return NextResponse.json({ error: 'Not a yoga practice' }, { status: 400 })
  }

  // Deactivate any other active program for this client.
  await admin
    .from('programs')
    .update({ is_active: false })
    .eq('client_id', program.client_id)
    .eq('is_active', true)
    .neq('id', program_id)

  const { error: updErr } = await admin
    .from('programs')
    .update({
      status: 'active',
      is_active: true,
      published_to_client_at: new Date().toISOString(),
    })
    .eq('id', program_id)
  if (updErr) return NextResponse.json({ error: `Failed to publish: ${updErr.message}` }, { status: 500 })

  return NextResponse.json({ ok: true, published: true })
}
