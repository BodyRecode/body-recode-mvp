import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Toggle clients.auto_checkin_response_enabled for a single client.
 *
 * When false, the auto-coach-response Inngest worker exits at the
 * eligibility gate without generating or sending anything. The check-in
 * still surfaces as "needs response" in Today's Focus exactly as the
 * pre-automation flow did, so the coach writes manually.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { enabled } = await request.json()
  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('clients')
    .update({ auto_checkin_response_enabled: enabled })
    .eq('id', id)
    .select('id, auto_checkin_response_enabled')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: data })
}
