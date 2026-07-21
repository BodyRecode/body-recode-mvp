import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { protocolBySlug } from '@/lib/recovery-protocols-seed'

/**
 * POST { protocol_slug, coach_note?, custom_dosing? }
 *   Creates a new active assignment for this client. Returns the row.
 *   Refuses if the client already has an active assignment for the same slug
 *   (client can only be on one instance of a given protocol at a time).
 *
 * Coach-authenticated.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ error: 'Coach only' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const protocolSlug = typeof body.protocol_slug === 'string' ? body.protocol_slug : null
  const coachNote = typeof body.coach_note === 'string' ? body.coach_note.trim() : null
  const customDosing = body.custom_dosing && typeof body.custom_dosing === 'object' ? body.custom_dosing : null

  if (!protocolSlug) return NextResponse.json({ error: 'protocol_slug required' }, { status: 400 })
  const protocol = protocolBySlug(protocolSlug)
  if (!protocol) return NextResponse.json({ error: `Unknown protocol_slug: ${protocolSlug}` }, { status: 400 })

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('recovery_protocol_assignments')
    .select('id')
    .eq('client_id', id)
    .eq('protocol_slug', protocolSlug)
    .eq('status', 'active')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Client already has an active assignment for this protocol' }, { status: 409 })
  }

  const { data, error } = await admin
    .from('recovery_protocol_assignments')
    .insert({
      client_id: id,
      protocol_slug: protocolSlug,
      status: 'active',
      coach_note: coachNote && coachNote.length > 0 ? coachNote : null,
      custom_dosing: customDosing,
    })
    .select('*')
    .single()

  if (error) {
    console.error('recovery assignment create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, assignment: data })
}
