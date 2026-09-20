import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * A half-finished intake, saved so it can be picked up on another device.
 *
 * WHY (20 September 2026). The form already saved every answer as she typed
 * it, but into her browser. Start on the phone, open the link on the laptop,
 * and the laptop was blank. The intake is now a 25 to 35 minute job, which is
 * long enough that moving devices part-way through is a realistic thing to do,
 * and we tell her in four places that it saves as she goes.
 *
 * THE TOKEN IS THE PERMISSION, exactly as it is for the intake itself, so this
 * route is unauthenticated by design and every call re-checks that the
 * invitation exists and is not already complete.
 *
 * CONSENT. She ticks the health consent on the first screen before any health
 * question is asked. This route REFUSES to store anything until that tick is
 * present in the payload, so a partly-filled form cannot put health
 * information in the database ahead of the consent that covers it. That is
 * checked here rather than trusted to the browser.
 *
 * FIRE AND FORGET. A failure here must never cost her an answer or block her
 * from continuing: the browser copy is still the instant layer, and this is
 * the layer that follows her between devices.
 */

const MAX_BYTES = 256 * 1024

async function loadInvitation(token: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('intake_invitations')
    .select('id, status, draft_data, draft_section, draft_updated_at')
    .eq('token', token)
    .maybeSingle()
  return { admin, invitation: data }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { invitation } = await loadInvitation(token)
  if (!invitation || invitation.status === 'complete') {
    // Not an error: a finished or unknown invitation simply has no draft.
    return NextResponse.json({ draft: null })
  }
  return NextResponse.json({
    draft: invitation.draft_data
      ? {
          formData: invitation.draft_data,
          sectionIndex: invitation.draft_section ?? 0,
          updatedAt: invitation.draft_updated_at,
        }
      : null,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  let body: { formData?: Record<string, unknown>; sectionIndex?: number }
  try {
    body = (await req.json()) as { formData?: Record<string, unknown>; sectionIndex?: number }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const formData = body.formData ?? {}
  const serialised = JSON.stringify(formData)
  if (serialised.length > MAX_BYTES) {
    // Refused rather than truncated: half a draft is worse than none, because
    // she would resume into a form that looks complete and is not.
    return NextResponse.json({ ok: false, reason: 'too large' }, { status: 413 })
  }

  // The consent tick has to be present before anything is stored. Its key is
  // the same one the form writes when she ticks the box on the first screen.
  const consented = formData.health_consent === true || formData.health_consent === 'true'
  if (!consented) return NextResponse.json({ ok: false, reason: 'no consent yet' })

  const { admin, invitation } = await loadInvitation(token)
  if (!invitation || invitation.status === 'complete') return NextResponse.json({ ok: false })

  const { error } = await admin
    .from('intake_invitations')
    .update({
      draft_data: formData,
      draft_section: typeof body.sectionIndex === 'number' ? body.sectionIndex : 0,
      draft_updated_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  if (error) {
    console.error('[intake draft] save failed:', error.message)
    return NextResponse.json({ ok: false })
  }
  return NextResponse.json({ ok: true })
}
