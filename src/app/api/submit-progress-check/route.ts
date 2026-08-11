import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PROGRESS_CHECK_QUESTION_IDS } from '@/lib/progress-check-questions'

// Stores a completed Progress Check. Token-authorised (the client reaches it via
// their unique link), service-role write. No client-facing side effects yet;
// the Phase 3 trigger will auto-draft the Progress Read from this submission.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { token?: string; responses?: Record<string, unknown> } | null
  const token = body?.token
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const admin = createAdminClient()
  const { data: pc } = await admin
    .from('progress_checks')
    .select('id, status')
    .eq('token', token)
    .maybeSingle()
  if (!pc) return NextResponse.json({ error: 'Progress Check not found' }, { status: 404 })
  if (pc.status === 'complete') return NextResponse.json({ ok: true, already: true })

  // Persist only known question ids, as strings. Ignore anything unexpected.
  const clean: Record<string, string> = {}
  for (const id of PROGRESS_CHECK_QUESTION_IDS) {
    const v = body?.responses?.[id]
    if (v != null && String(v).trim() !== '') clean[id] = String(v)
  }

  const { error } = await admin
    .from('progress_checks')
    .update({ responses: clean, status: 'complete', submitted_at: new Date().toISOString() })
    .eq('id', pc.id)

  if (error) {
    console.error('submit-progress-check update error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
