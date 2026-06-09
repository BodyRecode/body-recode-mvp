import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { logClientCommunication } from '@/lib/client-communications'
import { createPortalLoginCode, COACH_ISSUED_CODE_TTL_MINUTES } from '@/lib/portal-login-code'

/**
 * Coach fallback: mint a portal login code for a client and return it directly
 * so the coach can relay it by phone/text. This bypasses email entirely, for
 * clients whose provider silently blocks the self-serve code email
 * (Outlook/Microsoft being the usual culprit).
 *
 * The code is real and goes through the same verify-code flow the client uses,
 * so no special-casing is needed on the portal side.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  // Minting a login credential — restrict to the coach allowlist, not just any
  // authenticated session.
  if (!isCoachEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('id', id)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })

  const created = await createPortalLoginCode(admin, client.email, COACH_ISSUED_CODE_TTL_MINUTES)
  if (!created) {
    return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
  }

  await logClientCommunication(admin, {
    clientId: client.id,
    kind: 'portal_login_code',
    subject: 'Portal login code (coach-issued)',
    toAddress: client.email.toLowerCase(),
    meta: { trigger: 'coach-issued', expires_in_minutes: COACH_ISSUED_CODE_TTL_MINUTES, issued_by: user.email },
  })

  return NextResponse.json({
    code: created.code,
    email: client.email.toLowerCase(),
    expiresAt: created.expiresAt,
    expiresInMinutes: COACH_ISSUED_CODE_TTL_MINUTES,
  })
}
