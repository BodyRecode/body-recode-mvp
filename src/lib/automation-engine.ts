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
  const { data: workflows } = await admin
    .from('be_workflows')
    .select('id, trigger_config, be_workflow_steps(*)')
    .eq('trigger_type', triggerType)
    .eq('is_active', true)

  if (!workflows || workflows.length === 0) return

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
