import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { notifyProgressRead } from '@/lib/progress-read-publish'

export const maxDuration = 60

/** Coach-gated "your Progress Read is ready" email for a PUBLISHED Progress Read. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()
  const { progress_read_id } = await request.json().catch(() => ({}))
  if (typeof progress_read_id !== 'string') return NextResponse.json({ error: 'progress_read_id required' }, { status: 400 })
  const r = await notifyProgressRead(createAdminClient(), progress_read_id)
  return r.ok ? NextResponse.json({ ok: true, sent_at: r.sentAt }) : NextResponse.json({ error: r.error }, { status: r.status })
}
