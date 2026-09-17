import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { CLIENT_BLOOD_READ_ENABLED, CLIENT_BLOOD_READ_PAUSED_MESSAGE } from '@/lib/blood-read-gate'

/**
 * Toggle client-portal visibility of a Blood Panel Reading. Visibility only;
 * no client email is sent (the reading surfaces on the portal landing under
 * "Your Readings"). Mirrors the Medications Reading publish toggle.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; panelId: string }> }
) {
  const { id, panelId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { action } = await req.json().catch(() => ({ action: 'publish' }))

  // Unpublishing stays available while the read is paused: pulling one down is
  // always allowed, putting a new one up is not. See lib/blood-read-gate.ts.
  if (action === 'publish' && !CLIENT_BLOOD_READ_ENABLED) {
    return NextResponse.json({ error: CLIENT_BLOOD_READ_PAUSED_MESSAGE }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: panel } = await admin
    .from('blood_panels')
    .select('id, reading')
    .eq('id', panelId)
    .eq('client_id', id)
    .maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Blood panel not found' }, { status: 404 })

  if (action === 'publish' && !panel.reading) {
    return NextResponse.json({ error: 'Generate the client read before publishing.' }, { status: 400 })
  }

  const publishedAt = action === 'publish' ? new Date().toISOString() : null
  const { data: updated, error } = await admin
    .from('blood_panels')
    .update({ reading_published_at: publishedAt })
    .eq('id', panelId)
    .select('reading_published_at')
    .single()
  if (error) return NextResponse.json({ error: `Publish failed: ${error.message}` }, { status: 500 })

  return NextResponse.json({ panel: updated })
}
