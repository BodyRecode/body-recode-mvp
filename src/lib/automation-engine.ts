// Body Recode Automation Execution Engine
// Fires workflows when triggers occur — enqueues Inngest jobs for durable execution

import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from './inngest'

export type TriggerType =
  | 'lead_created'
  | 'booking_created'
  | 'payment_completed'
  | 'pipeline_stage_changed'
  | 'tag_added'
  | 'form_submitted'

export interface TriggerContext {
  leadId?: string
  clientId?: string
  bookingId?: string
  paymentId?: string
  stage?: string
  tag?: string
  formId?: string
  bookingType?: string
}

interface Contact {
  name: string
  email: string | null
  phone: string | null
}

async function resolveContact(
  admin: ReturnType<typeof createAdminClient>,
  ctx: TriggerContext
): Promise<Contact | null> {
  if (ctx.leadId) {
    const { data } = await admin
      .from('leads')
      .select('name, email, phone')
      .eq('id', ctx.leadId)
      .single()
    return data
  }
  if (ctx.clientId) {
    const { data } = await admin
      .from('clients')
      .select('name, email')
      .eq('id', ctx.clientId)
      .single()
    return data ? { ...data, phone: null } : null
  }
  return null
}

export async function fireTrigger(
  triggerType: TriggerType,
  ctx: TriggerContext,
  matchConfig?: Record<string, string>
): Promise<void> {
  const admin = createAdminClient()

  // Find all active workflows for this trigger
  const { data: allWorkflows } = await admin
    .from('be_workflows')
    .select('id, name, created_at, trigger_config, be_workflow_steps(*)')
    .eq('trigger_type', triggerType)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (!allWorkflows || allWorkflows.length === 0) return

  // Duplicate guard, added 2026-08-12.
  //
  // Two active workflows on the same trigger with the same trigger_config means
  // every matching contact gets both sequences. It has happened twice: a legacy
  // "Scorecard — Follow-up Sequence" duplicate was deleted on 2026-06-24, and a
  // fresh one appeared on 2026-07-13 (launch day) and quietly double-sent to
  // eight leads until it was caught on 2026-08-12.
  //
  // Deleting the duplicate fixes the day. This stops it recurring: for any given
  // trigger + config, only the OLDEST active workflow runs. The newer one is
  // skipped and logged loudly rather than silently double-sending.
  const seen = new Map<string, { id: string; name: string }>()
  const workflows: typeof allWorkflows = []
  for (const w of allWorkflows) {
    const key = JSON.stringify(w.trigger_config ?? {})
    const first = seen.get(key)
    if (first) {
      console.error(
        `[automation] DUPLICATE WORKFLOW SKIPPED. Trigger "${triggerType}" has more than one ` +
        `active workflow with the same config. Running "${first.name}" (${first.id}), skipping ` +
        `"${w.name}" (${w.id}). Deactivate one of them in Business → Automations.`
      )
      continue
    }
    seen.set(key, { id: w.id, name: w.name as string })
    workflows.push(w)
  }

  const contact = await resolveContact(admin, ctx)

  const templateVars: Record<string, string> = {
    contact_name: contact?.name ?? '',
    contact_email: contact?.email ?? '',
    contact_phone: contact?.phone ?? '',
    first_name: contact?.name?.split(' ')[0] ?? '',
  }

  // Add scorecard data if available for this lead
  if (ctx.leadId) {
    const { data: scorecardEvent } = await admin
      .from('lead_events')
      .select('notes')
      .eq('lead_id', ctx.leadId)
      .eq('type', 'scorecard_completed')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (scorecardEvent?.notes) {
      const scoreMatch = scorecardEvent.notes.match(/Score: (\d+)\/15/)
      const stateMatch = scorecardEvent.notes.match(/Body state: (.+?)\./)
      if (scoreMatch) templateVars.scorecard_score = scoreMatch[1]
      if (stateMatch) templateVars.scorecard_state = stateMatch[1]
    }
  }

  for (const workflow of workflows) {
    // Check trigger config matches (e.g. specific booking type, pipeline stage)
    const trigConfig = workflow.trigger_config as Record<string, string>
    if (trigConfig && Object.keys(trigConfig).length > 0 && matchConfig) {
      const matches = Object.entries(trigConfig).every(
        ([key, val]) => !val || matchConfig[key] === val
      )
      if (!matches) continue
    }

    // Create execution record
    const { data: execution } = await admin
      .from('be_workflow_executions')
      .insert({
        workflow_id: workflow.id,
        lead_id: ctx.leadId ?? null,
        client_id: ctx.clientId ?? null,
        status: 'running',
        current_step: 0,
      })
      .select()
      .single()

    // Enqueue Inngest job — Inngest handles wait steps durably
    try {
      await inngest.send({
        name: 'automation/workflow.triggered',
        data: {
          workflowId: workflow.id,
          executionId: execution?.id ?? null,
          ctx,
          contact,
          templateVars,
        },
      })
    } catch (e) {
      console.error('[automation-engine] inngest.send failed (dev server may not be running):', e)
    }
  }
}
