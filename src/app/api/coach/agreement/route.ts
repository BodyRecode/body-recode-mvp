/**
 * A coach accepts their agreement here, and the acceptance is recorded.
 *
 * 20 September 2026. GET says whether this coach has accepted the version in
 * force. POST records an acceptance.
 *
 * The name is typed by the coach and stored as they typed it. It is NOT filled
 * in from what we already know about them: a name we supplied is not an
 * acceptance, it is a form we completed on somebody's behalf.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/api-auth'
import { CURRENT_AGREEMENT, hasAcceptedCurrent, nameLooksReal } from '@/lib/coach-agreement'

export async function GET() {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

  const admin = createAdminClient()
  const accepted = await hasAcceptedCurrent(admin, gate.userId)

  const { data } = await admin
    .from('coach_agreements')
    .select('version, accepted_at, accepted_name')
    .eq('coach_id', gate.userId)
    .order('accepted_at', { ascending: false })

  return NextResponse.json({
    version: CURRENT_AGREEMENT.version,
    cleared: CURRENT_AGREEMENT.cleared,
    accepted,
    history: data ?? [],
  })
}

export async function POST(request: NextRequest) {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

  // An uncleared agreement cannot be accepted. Recording somebody's acceptance
  // of terms no lawyer has read would be worse than having no agreement, since
  // it would look like consent to something nobody checked.
  if (!CURRENT_AGREEMENT.cleared) {
    return NextResponse.json(
      { error: 'This agreement is still in draft and cannot be accepted yet.' },
      { status: 409 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const typedName = String(body?.name ?? '')

  if (!nameLooksReal(typedName)) {
    return NextResponse.json(
      { error: 'Please type your full name, first and last, as you would sign it.' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  if (await hasAcceptedCurrent(admin, gate.userId)) {
    return NextResponse.json({ ok: true, alreadyAccepted: true })
  }

  const { error } = await admin.from('coach_agreements').insert({
    coach_id: gate.userId,
    agreement_kind: CURRENT_AGREEMENT.kind,
    version: CURRENT_AGREEMENT.version,
    accepted_name: typedName.trim(),
    ip_address:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null,
    user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
  })

  if (error) {
    // Unique index: two tabs, one coach, same version. Not an error to them.
    if (error.code === '23505') return NextResponse.json({ ok: true, alreadyAccepted: true })
    return NextResponse.json({ error: 'Could not record that. Try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
