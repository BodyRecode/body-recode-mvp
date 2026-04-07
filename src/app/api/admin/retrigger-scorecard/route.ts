import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fireTrigger } from '@/lib/automation-engine'

// POST /api/admin/retrigger-scorecard
// Re-fires the scorecard follow-up automation for any lead who has a
// scorecard_completed event but no workflow execution for the scorecard workflow.

export async function POST() {
  const admin = createAdminClient()

  // Get the scorecard workflow
  const { data: workflow } = await admin
    .from('be_workflows')
    .select('id')
    .eq('name', 'Scorecard — Follow-up Sequence')
    .eq('is_active', true)
    .maybeSingle()

  if (!workflow) {
    return NextResponse.json({ error: 'Scorecard workflow not found or not active.' }, { status: 404 })
  }

  // Get all lead IDs that have a scorecard_completed event
  const { data: scorecardEvents } = await admin
    .from('lead_events')
    .select('lead_id')
    .eq('type', 'scorecard_completed')

  if (!scorecardEvents || scorecardEvents.length === 0) {
    return NextResponse.json({ triggered: 0, message: 'No scorecard completions found.' })
  }

  const leadIds = [...new Set(scorecardEvents.map(e => e.lead_id))]

  // Find which leads already have a workflow execution for this workflow
  const { data: existingExecutions } = await admin
    .from('be_workflow_executions')
    .select('lead_id')
    .eq('workflow_id', workflow.id)
    .in('lead_id', leadIds)

  const alreadyTriggered = new Set((existingExecutions ?? []).map(e => e.lead_id))
  const toTrigger = leadIds.filter(id => !alreadyTriggered.has(id))

  if (toTrigger.length === 0) {
    return NextResponse.json({ triggered: 0, message: 'All scorecard leads already have the automation.' })
  }

  // Re-fire the automation for each lead that hasn't had it
  let triggered = 0
  let failed = 0

  for (const leadId of toTrigger) {
    try {
      await fireTrigger('form_submitted', { leadId }, { form: 'scorecard' })
      triggered++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ triggered, failed, skipped: alreadyTriggered.size })
}
