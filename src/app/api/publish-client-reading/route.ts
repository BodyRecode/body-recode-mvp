import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { cffs_id, action } = await request.json()
  if (!cffs_id) {
    return NextResponse.json({ error: 'Missing cffs_id' }, { status: 400 })
  }
  if (action !== 'publish' && action !== 'unpublish') {
    return NextResponse.json({ error: 'action must be publish or unpublish' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: cffs, error: cffsErr } = await admin
    .from('cffs')
    .select('id, client_reading_generated_at')
    .eq('id', cffs_id)
    .single()

  if (cffsErr || !cffs) {
    return NextResponse.json({ error: 'CFFS not found' }, { status: 404 })
  }

  if (action === 'publish' && !cffs.client_reading_generated_at) {
    return NextResponse.json(
      { error: 'Generate the reading before publishing' },
      { status: 400 }
    )
  }

  const { data: updated, error: updateErr } = await admin
    .from('cffs')
    .update({
      client_reading_published_at: action === 'publish' ? new Date().toISOString() : null,
    })
    .eq('id', cffs_id)
    .select('id, client_reading_published_at')
    .single()

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ cffs: updated })
}
