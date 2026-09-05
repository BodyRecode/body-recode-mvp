import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

// Mirror of /api/new-intake-invitation, but stamps kind='reintake' so the
// downstream email + coach-notification + portal surfacing branch on the
// existing-client reassessment case instead of the first-time onboarding case.
//
// A re-intake:
//   - Uses the same 234-question form as the foundational intake
//   - Loads via the same /intake/{token} page (form doesn't care about kind)
//   - Sends the re-intake email variant on Send Email click
//   - On submit, skips first-time-only side effects (Portal Orientation
//     email, "baseline is remaining" coach copy) — see submit-intake route

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { clientId } = await request.json()
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  // Verify the client belongs to this coach. Same auth guard as
  // new-intake-invitation.
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Sanity guard: warn (don't block) if there's no prior completed foundational
  // for this client. A re-intake before the first-time intake is likely a coach
  // misclick — but the coach can override if they know what they're doing.
  const admin = createAdminClient()
  const { data: priorFoundational } = await admin
    .from('intake_invitations')
    .select('id')
    .eq('client_id', clientId)
    .eq('kind', 'foundational')
    .eq('status', 'complete')
    .limit(1)
    .maybeSingle()

  if (!priorFoundational) {
    return NextResponse.json(
      {
        error: 'No prior completed foundational intake for this client. Use the New Intake button (foundational) instead — a re-intake is a reassessment of an existing intake.',
      },
      { status: 400 },
    )
  }

  const { data: invitation, error } = await admin
    .from('intake_invitations')
    .insert({ client_id: clientId, kind: 'reintake' })
    .select()
    .single()

  if (error || !invitation) {
    console.error('Re-intake invitation insert error:', error)
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
  }

  return NextResponse.json({ token: invitation.token })
}
