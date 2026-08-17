import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { substanceBySlug } from '@/lib/supplement-substances-seed'
import { protocolBySlug } from '@/lib/recovery-protocols-seed'

/**
 * Approve a whole suggested plan in one action.
 *
 * POST { kind: 'supplement' | 'recovery', slugs: string[], coach_note?: string }
 *
 * Assigns every slug in the list. Per-item Assign still exists on each card
 * for partial approval; this is the "the plan is right, ship it" path.
 *
 * Idempotent per slug: anything the client already has active is skipped and
 * reported back as skipped rather than erroring the whole batch. One bad slug
 * does not lose the rest of the plan.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json().catch(() => ({}))
  const kind = body.kind === 'supplement' || body.kind === 'recovery' ? body.kind : null
  const slugs: string[] = Array.isArray(body.slugs) ? body.slugs.filter((s: unknown) => typeof s === 'string') : []
  const coachNote = typeof body.coach_note === 'string' && body.coach_note.trim() ? body.coach_note.trim() : null

  if (!kind) return NextResponse.json({ error: "kind must be 'supplement' or 'recovery'" }, { status: 400 })
  if (slugs.length === 0) return NextResponse.json({ error: 'slugs required' }, { status: 400 })

  const table = kind === 'supplement' ? 'supplement_assignments' : 'recovery_protocol_assignments'
  const slugColumn = kind === 'supplement' ? 'substance_slug' : 'protocol_slug'
  const lookup = kind === 'supplement'
    ? (s: string) => substanceBySlug(s)
    : (s: string) => protocolBySlug(s)

  const admin = createAdminClient()

  // Everything the client already has active, so a re-approve is a no-op
  // rather than a duplicate row or a 409 that kills the batch.
  const { data: existingRows } = await admin
    .from(table)
    .select(slugColumn)
    .eq('client_id', id)
    .eq('status', 'active')

  const existing = new Set(
    (existingRows ?? []).map(r => (r as Record<string, string>)[slugColumn])
  )

  const assigned: string[] = []
  const skipped: Array<{ slug: string; reason: string }> = []

  for (const slug of slugs) {
    if (!lookup(slug)) {
      skipped.push({ slug, reason: 'Not in the library' })
      continue
    }
    if (existing.has(slug)) {
      skipped.push({ slug, reason: 'Already assigned and active' })
      continue
    }

    const { error } = await admin.from(table).insert({
      client_id: id,
      [slugColumn]: slug,
      status: 'active',
      coach_note: coachNote,
    })

    if (error) {
      skipped.push({ slug, reason: error.message })
      continue
    }
    assigned.push(slug)
  }

  return NextResponse.json({ assigned, skipped })
}
