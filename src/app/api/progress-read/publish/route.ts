import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { setProgressReadPublished } from '@/lib/progress-read-publish'

/**
 * Publish or unpublish a Progress Read. Publishing shows her sections in her
 * portal and sends nothing; the pre-publish check is re-run at publish time.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()
  const { progress_read_id, action } = await request.json().catch(() => ({}))
  if (typeof progress_read_id !== 'string') return NextResponse.json({ error: 'progress_read_id required' }, { status: 400 })
  if (action !== 'publish' && action !== 'unpublish') return NextResponse.json({ error: 'action must be publish or unpublish' }, { status: 400 })
  const r = await setProgressReadPublished(createAdminClient(), progress_read_id, action)
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error, findings: r.findings }, { status: r.status })
}
