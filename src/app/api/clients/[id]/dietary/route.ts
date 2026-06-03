import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Coach-side edit of the eight Section D dietary/consumption free-text fields.
 *
 * These live on the most-recent intake row (not the clients table), so this
 * route resolves the latest intake for the client and updates it in place,
 * stamping dietary_updated_at so the profile staleness banner can fire.
 *
 * Mirrors the Medications editor pattern: a direct edit does NOT auto-regenerate
 * the CFFS. The coach regenerates from the macro plan / nutrition page (and the
 * CFFS if the change is material) when ready. The supplementary-intake flow is
 * the path that auto-regenerates, because that one is client-driven and the
 * coach isn't in the loop at submit time.
 */

const DIETARY_FIELDS = [
  'dietary_restrictions',
  'dietary_preferences',
  'typical_day_eating',
  'meals_per_day',
  'fluid_intake',
  'caffeine_intake',
  'alcohol_intake',
  'eating_context',
] as const

const REQUIRED_FIELDS = DIETARY_FIELDS.filter(f => f !== 'eating_context')

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const updates: Record<string, string> = {}
  for (const key of DIETARY_FIELDS) {
    if (key in body) updates[key] = typeof body[key] === 'string' ? body[key].trim() : ''
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const missing = REQUIRED_FIELDS.filter(f => f in updates && !updates[f])
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Resolve the client's most recent intake row — the same row the nutrition
  // and CFFS generators read from.
  const { data: latestIntake, error: fetchErr } = await admin
    .from('intakes')
    .select('id')
    .eq('client_id', id)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!latestIntake) {
    return NextResponse.json(
      { error: 'No intake on file for this client. Send an intake first.' },
      { status: 404 }
    )
  }

  const { error: updErr } = await admin
    .from('intakes')
    .update({ ...updates, dietary_updated_at: new Date().toISOString() })
    .eq('id', latestIntake.id)

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
