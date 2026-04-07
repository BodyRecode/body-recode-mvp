import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fireTrigger } from '@/lib/automation-engine'

const CORS = {
  'Access-Control-Allow-Origin': 'https://performance.bodyrecode.au',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// POST /api/scorecard/submit
// Creates or finds a lead, logs their scorecard result, fires automation trigger

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch (e) {
    console.error('[scorecard/submit] Failed to parse JSON body:', e)
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: CORS })
  }
  const { first_name, email, score, body_state, source } = body as { first_name: string; email: string; score: number; body_state: string; source: string }
  console.log('[scorecard/submit] Received:', { first_name, email, score, body_state, source })

  if (!first_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400, headers: CORS })
  }

  const supabase = createAdminClient()

  // Find or create lead — fetch all rows by email, take first in JS to avoid PostgREST single-row errors
  const { data: existingRows, error: lookupError } = await supabase
    .from('leads')
    .select('id, coach_id')
    .eq('email', email.toLowerCase().trim())

  if (lookupError) {
    console.error('[scorecard/submit] Lead lookup error:', lookupError)
    return NextResponse.json({ error: 'Database error.' }, { status: 500, headers: CORS })
  }

  const existing = existingRows?.[0] ?? null

  let leadId: string

  if (existing) {
    leadId = existing.id
    console.log('[scorecard/submit] Found existing lead:', leadId)
  } else {
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name: first_name.trim(),
        email: email.toLowerCase().trim(),
        source: source ?? 'other',
        source_detail: 'scorecard',
        status: 'new_check_in',
        active: true,
      })
      .select('id')
      .single()

    if (leadError || !newLead) {
      console.error('[scorecard/submit] Lead insert error:', leadError)
      return NextResponse.json({ error: 'Failed to create lead.' }, { status: 500, headers: CORS })
    }

    leadId = newLead.id
    console.log('[scorecard/submit] Created new lead:', leadId)

    // Fire lead_created automation
    await fireTrigger('lead_created', { leadId })
  }

  // Log scorecard result as a lead event
  await logLeadEvent({
    leadId,
    type: 'scorecard_completed',
    subject: 'Scorecard completed',
    notes: `Score: ${score}/15. Body state: ${body_state}.`,
  })
  console.log('[scorecard/submit] Event logged for lead:', leadId)

  // Fire form_submitted trigger for scorecard-specific automations
  await fireTrigger('form_submitted', { leadId }, { form: 'scorecard' })
  console.log('[scorecard/submit] Automation triggered for lead:', leadId)

  return NextResponse.json({ success: true, lead_id: leadId }, { headers: CORS })
}
