import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateFeedbackDraft } from '@/lib/weekly-checkin-feedback-generate'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Generate a draft coach response for a weekly check-in.
 *
 * Thin auth + admin-client wrapper around the shared generator at
 * `src/lib/weekly-checkin-feedback-generate.ts`. The shared function is
 * also called by the Inngest auto-response worker, which needs the same
 * generation logic without a Supabase auth session.
 *
 * Does NOT save or send. The coach reviews the draft in the existing
 * feedback form and approves by clicking Save + email.
 */
export const maxDuration = 300

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: checkinId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const admin = createAdminClient()
  const result = await generateFeedbackDraft(admin, checkinId)

  if (!result.ok) {
    const status = result.error === 'Check-in not found' || result.error === 'Client not found' ? 404 : 500
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ draft: result.draft, attempts: result.attempts })
}
