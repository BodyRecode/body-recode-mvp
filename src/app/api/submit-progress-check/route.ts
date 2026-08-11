import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { PROGRESS_CHECK_QUESTION_IDS } from '@/lib/progress-check-questions'
import { fromCoach } from '@/lib/email-shell'
import { coach } from '@/config/tenant'
import { appUrl } from '@/lib/app-url'

// Stores a completed Progress Check. Token-authorised (the client reaches it via
// their unique link), service-role write. On completion it notifies the coach so
// they can generate the Progress Read (which re-scores body state from these
// answers). No client-facing publish happens here - the coach stays the gate.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { token?: string; responses?: Record<string, unknown> } | null
  const token = body?.token
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const admin = createAdminClient()
  const { data: pc } = await admin
    .from('progress_checks')
    .select('id, status, client_id, program_id')
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

  // Notify the coach so they can generate + review the Progress Read. Best-effort;
  // a failed notification must not fail the client's submission.
  try {
    const { data: client } = await admin
      .from('clients')
      .select('name')
      .eq('id', pc.client_id)
      .maybeSingle()
    const clientName = client?.name || 'A client'
    const programUrl = `${appUrl()}/dashboard/clients/${pc.client_id}/program`
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: fromCoach(),
      to: coach().adminEmail,
      subject: `Progress Check submitted: ${clientName}`,
      html: `<p>${clientName} has completed their Progress Check.</p>
<p>Open their program, then use <b>Generate</b> on the Block-End / Progress Read panel to draft the reading. It will re-score their body state from these answers. Review it, then publish.</p>
<p><a href="${programUrl}">${programUrl}</a></p>`,
    })
  } catch (e) {
    console.error('Progress Check coach notification failed (non-fatal):', e)
  }

  return NextResponse.json({ ok: true })
}
