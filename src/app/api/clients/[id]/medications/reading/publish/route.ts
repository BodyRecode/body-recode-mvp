import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Toggle the published state of the Medications Reading. Mirrors the
 * publish-program-reading / publish-nutrition-reading pattern: coach
 * clicks Publish to make the reading visible on the client portal, or
 * Unpublish to hide it again.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { action } = await request.json()
  if (action !== 'publish' && action !== 'unpublish') {
    return NextResponse.json({ error: 'action must be publish or unpublish' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, medications_reading, medications_reading_generated_at')
    .eq('id', id)
    .maybeSingle()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  if (action === 'publish' && !client.medications_reading_generated_at) {
    return NextResponse.json({ error: 'Generate the Medications Reading before publishing' }, { status: 400 })
  }

  const { data: updated, error } = await admin
    .from('clients')
    .update({
      medications_reading_published_at: action === 'publish' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('id, medications_reading_published_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: updated })
}
