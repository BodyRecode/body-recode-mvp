import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/api-auth'
import { MIN_HEIGHT_CM, MAX_HEIGHT_CM } from '@/lib/client-height'

/**
 * Coach-side entry of a client's height.
 *
 * Height was only ever capturable through the client-facing baseline form, so
 * a coach who knew the number had nowhere to put it, and clients who never
 * submitted a baseline could never have one at all. That is why every energy
 * estimate in the system read NULL. This route writes the standing record on
 * clients.height_cm; see src/lib/client-height.ts for how it is resolved
 * against the per-capture baseline height.
 *
 * Saving does NOT regenerate anything. Same rule as the Medications and
 * Dietary editors: the coach regenerates the nutrition plan from the nutrition
 * page when ready, so a correction never silently rewrites a live plan.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = await request.json()

  const raw = body?.height_cm

  // An empty submission clears the record rather than erroring — the coach
  // needs a way to undo a value entered against the wrong client.
  if (raw === null || raw === undefined || raw === '') {
    const admin = createAdminClient()
    const { error } = await admin
      .from('clients')
      .update({ height_cm: null, height_recorded_at: null, height_source: null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, height_cm: null })
  }

  const heightCm = typeof raw === 'number' ? raw : Number(raw)

  if (!Number.isFinite(heightCm)) {
    return NextResponse.json({ error: 'Height must be a number in centimetres.' }, { status: 400 })
  }

  // Catches the common unit error (5.9 typed for 5ft 9in, or inches typed
  // straight in) before it reaches a BMR equation that would happily return a
  // 400 kcal target off it.
  if (heightCm < MIN_HEIGHT_CM || heightCm > MAX_HEIGHT_CM) {
    return NextResponse.json(
      { error: `Height must be between ${MIN_HEIGHT_CM}cm and ${MAX_HEIGHT_CM}cm. Enter centimetres, not feet or inches.` },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({
      height_cm: Math.round(heightCm * 10) / 10,
      height_recorded_at: new Date().toISOString(),
      height_source: 'coach',
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, height_cm: Math.round(heightCm * 10) / 10 })
}
