import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { substanceBySlug } from '@/lib/supplement-substances-seed'

/**
 * POST { substance_slug, coach_note? }
 * Creates a new active assignment. Refuses if the client already has
 * an active assignment for the same substance.
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
  const substanceSlug = typeof body.substance_slug === 'string' ? body.substance_slug : null
  const coachNote = typeof body.coach_note === 'string' ? body.coach_note.trim() : null

  if (!substanceSlug) return NextResponse.json({ error: 'substance_slug required' }, { status: 400 })
  const substance = substanceBySlug(substanceSlug)
  if (!substance) return NextResponse.json({ error: `Unknown substance_slug: ${substanceSlug}` }, { status: 400 })

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('supplement_assignments')
    .select('id')
    .eq('client_id', id)
    .eq('substance_slug', substanceSlug)
    .eq('status', 'active')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Client already has an active assignment for this substance' }, { status: 409 })
  }

  const { data, error } = await admin
    .from('supplement_assignments')
    .insert({
      client_id: id,
      substance_slug: substanceSlug,
      status: 'active',
      coach_note: coachNote && coachNote.length > 0 ? coachNote : null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('supplement assignment create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, assignment: data })
}
