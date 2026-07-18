/**
 * Skip a drafted outreach touch (coach decided not to send it).
 * The sequence continues — later touches still draft on schedule.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()

  const { data: touch } = await admin.from('outreach_touches').select('status').eq('id', id).maybeSingle()
  if (!touch) return NextResponse.json({ error: 'Touch not found' }, { status: 404 })
  if (touch.status === 'sent') return NextResponse.json({ error: 'Already sent' }, { status: 409 })

  await admin
    .from('outreach_touches')
    .update({ status: 'skipped', updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
