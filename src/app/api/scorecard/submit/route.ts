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
  const { first_name, email, score, body_state } = await request.json()

  if (!first_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400, headers: CORS })
  }

  const supabase = createAdminClient()

  // Find or create lead
  const { data: existing } = await supabase
    .from('leads')
    .select('id, coach_id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  let leadId: string

  if (existing) {
    leadId = existing.id
  } else {
    // Get the first coach via auth.users (single-coach app)
    const { data: users } = await supabase.auth.admin.listUsers()
    const coachId = users?.users?.[0]?.id
    if (!coachId) return NextResponse.json({ error: 'No coach found.' }, { status: 500, headers: CORS })

    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        coach_id: coachId,
        name: first_name.trim(),
        email: email.toLowerCase().trim(),
        source: 'other',
        source_detail: 'scorecard',
      })
      .select('id')
      .single()

    if (leadError || !newLead) {
      return NextResponse.json({ error: 'Failed to create lead.' }, { status: 500, headers: CORS })
    }

    leadId = newLead.id

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

  // Fire form_submitted trigger for scorecard-specific automations
  await fireTrigger('form_submitted', { leadId }, { form: 'scorecard' })

  return NextResponse.json({ success: true, lead_id: leadId }, { headers: CORS })
}
