/**
 * Render the branded HTML of a drafted touch, so the coach can preview exactly
 * what the lead will receive before approving. Coach-gated.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data: touch } = await admin.from('outreach_touches').select('body_html').eq('id', id).maybeSingle()

  if (!touch?.body_html) return NextResponse.json({ error: 'No preview available' }, { status: 404 })

  return new NextResponse(touch.body_html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
