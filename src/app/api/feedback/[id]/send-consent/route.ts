// POST /api/feedback/[id]/send-consent
// Coach-triggered consent email fire from the feedback triage dashboard.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { sendConsentEmail } from '@/lib/feedback-emails'

export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await createServerSupabaseClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })

  const { id } = await ctx.params
  const r = await sendConsentEmail(id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
