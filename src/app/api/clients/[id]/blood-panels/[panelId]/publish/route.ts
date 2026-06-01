import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const { action } = await req.json().catch(() => ({ action: 'publish' }))
  const admin = createAdminClient()

  const { data: panel } = await admin
    .from('blood_panels')
    .select('id, reading')
    .eq('id', panelId)
    .eq('client_id', id)
    .maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Blood panel not found' }, { status: 404 })

  if (action === 'publish' && !panel.reading) {
    return NextResponse.json({ error: 'Generate the client reading before publishing.' }, { status: 400 })
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
