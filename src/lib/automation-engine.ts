// Body Recode Automation Execution Engine
// Fires workflows when triggers occur, executes steps in sequence

import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

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

interface Step {
  id: string
  type: string
  action_type: string | null
  config: Record<string, string | number>
  position: number
}

// Interpolate {{variables}} in template strings
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
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

async function executeStep(
  step: Step,
  ctx: TriggerContext,
  contact: Contact | null,
  templateVars: Record<string, string>
): Promise<void> {
  const admin = createAdminClient()
  const config = step.config as Record<string, string>

  switch (step.action_type) {
    case 'send_email': {
      if (!contact?.email || !process.env.RESEND_API_KEY) break
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: contact.email,
        subject: interpolate(config.subject ?? '', templateVars),
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#aaa;">
          <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
          <div style="font-size:15px;line-height:1.9;color:#aaa;">
            ${interpolate(config.body ?? '', templateVars).replace(/\n/g, '<br/>')}
          </div>
        </div>`,
      })
      break
    }

    case 'notify_coach': {
      if (!process.env.RESEND_API_KEY) break
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Automation: ${interpolate(config.message ?? 'Action triggered', templateVars)}`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#aaa;">
          <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
          <p style="font-size:16px;color:#fff;font-weight:600;">${interpolate(config.message ?? '', templateVars)}</p>
          ${contact ? `<p style="color:#aaa;">Contact: ${contact.name} (${contact.email ?? 'no email'})</p>` : ''}
        </div>`,
      })
      break
    }

    case 'add_tag': {
      if (!config.tag || !ctx.leadId) break
      // Find or create tag
      const { data: existingTag } = await admin
        .from('be_tags')
        .select('id')
        .eq('name', config.tag)
        .maybeSingle()

      let tagId = existingTag?.id
      if (!tagId) {
        const { data: newTag } = await admin
          .from('be_tags')
          .insert({ name: config.tag, coach_id: (await admin.from('leads').select('coach_id').eq('id', ctx.leadId).single()).data?.coach_id })
          .select('id')
          .single()
        tagId = newTag?.id
      }

      if (tagId && ctx.leadId) {
        await admin
          .from('be_lead_tags')
          .upsert({ lead_id: ctx.leadId, tag_id: tagId })
      }
      break
    }

    case 'remove_tag': {
      if (!config.tag || !ctx.leadId) break
      const { data: tag } = await admin
        .from('be_tags')
        .select('id')
        .eq('name', config.tag)
        .maybeSingle()
      if (tag) {
        await admin
          .from('be_lead_tags')
          .delete()
          .eq('lead_id', ctx.leadId)
          .eq('tag_id', tag.id)
      }
      break
    }

    case 'move_pipeline_stage': {
      if (!config.stage || !ctx.leadId) break
      await admin
        .from('leads')
        .update({ status: config.stage })
        .eq('id', ctx.leadId)
      break
    }

    case 'send_sms': {
      // SMS integration placeholder — log for now
      console.log(`[Automation] SMS to ${contact?.phone ?? 'no phone'}: ${interpolate(config.message ?? '', templateVars)}`)
      break
    }
  }
}

function waitMs(step: Step): number {
  const config = step.config as Record<string, string>
  const amount = parseInt(config.amount as string) || 1
  const unit = config.unit as string || 'hours'
  const multipliers: Record<string, number> = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  }
  return amount * (multipliers[unit] ?? multipliers.hours)
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

  for (const workflow of workflows) {
    // Check trigger config matches (e.g. specific stage, booking type)
    const trigConfig = workflow.trigger_config as Record<string, string>
    if (trigConfig && Object.keys(trigConfig).length > 0 && matchConfig) {
      const matches = Object.entries(trigConfig).every(
        ([key, val]) => !val || matchConfig[key] === val
      )
      if (!matches) continue
    }

    // Log execution start
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

    const steps = ((workflow.be_workflow_steps as Step[]) ?? [])
      .sort((a, b) => a.position - b.position)

    // Build template vars
    const templateVars: Record<string, string> = {
      contact_name: contact?.name ?? '',
      contact_email: contact?.email ?? '',
      contact_phone: contact?.phone ?? '',
      first_name: contact?.name?.split(' ')[0] ?? '',
    }

    // Execute steps (wait steps are scheduled, actions run immediately)
    // For production: use a queue. For now: run inline with setTimeout for waits
    let hasError = false
    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]

        if (execution) {
          await admin
            .from('be_workflow_executions')
            .update({ current_step: i })
            .eq('id', execution.id)
        }

        if (step.type === 'wait') {
          // In production this would be a queue job — for now we skip waits in execution
          // and log them. A proper queue (e.g. Inngest, BullMQ) would be added here.
          console.log(`[Automation] Wait step: ${waitMs(step) / 1000}s — queuing not yet implemented, skipping`)
          continue
        }

        if (step.type === 'action') {
          await executeStep(step, ctx, contact, templateVars)
        }
      }
    } catch (err) {
      hasError = true
      console.error(`[Automation] Workflow ${workflow.id} failed:`, err)
      if (execution) {
        await admin
          .from('be_workflow_executions')
          .update({ status: 'failed', error_message: String(err), completed_at: new Date().toISOString() })
          .eq('id', execution.id)
      }
    }

    if (!hasError && execution) {
      await admin
        .from('be_workflow_executions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', execution.id)
    }
  }
}
