/**
 * Operator Console — action tools. "Go and do", behind a gate.
 *
 * THE MODEL CAN NEVER COMPLETE AN ACTION. Every tool here does exactly one
 * thing: work out what WOULD happen, write it to `console_pending_actions` with
 * status 'pending', and hand back a preview. Execution happens somewhere else
 * entirely — POST /api/console/actions/[id]/confirm, reached only by a human
 * clicking a button in the UI.
 *
 * That split is the whole safety design, and it is structural rather than
 * instructional. There is no argument, no phrasing, and no prompt injection
 * that gets a send out of this file, because this file contains no code that
 * sends. The worst a confused or manipulated model can do is stage something
 * the coach then reads and declines.
 *
 * Why staging is worth the extra step rather than just asking the model to
 * describe what it would do: a described plan and an executed plan can differ.
 * Staging pins the exact payload that will run, so the thing the coach approves
 * is the thing that happens — not a re-derivation of it a moment later against
 * data that may have moved.
 *
 * The pattern this follows is the one already proven in production by the
 * dormant reactivation built 12-13 August: dry run → a human reads the actual
 * list → explicit confirm. See src/app/api/admin/dormant-reactivation/route.ts.
 */

import type Anthropic from '@anthropic-ai/sdk'
import { scoped, type ConsoleScope } from './scope'
import type { ToolOutcome } from './tools-read'
import {
  ineligibleReason,
  INELIGIBLE_LABELS,
  type DormantCandidate,
} from '@/lib/dormant-lead-eligibility'

/** Action types the confirm endpoint knows how to execute. */
export const ACTION_TYPES = ['dormant_reactivation', 'set_lead_follow_up'] as const
export type ActionType = (typeof ACTION_TYPES)[number]

export const ACTION_TOOLS: Anthropic.Tool[] = [
  {
    name: 'stage_dormant_reactivation',
    description:
      'Work out who would receive the dormant lead re-engagement sequence and STAGE it for the coach to approve. This does NOT send anything — it runs the eligibility check and returns the list plus who is excluded and why. The coach must click Confirm before a single message goes out. Use when the coach wants to re-engage leads who never moved.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'stage_lead_follow_up',
    description:
      'Stage a follow-up reminder on a lead — a date, and optionally a note about what to raise. This writes nothing until the coach confirms. It does not message the lead; it puts the lead on the coach\'s own follow-up list.',
    input_schema: {
      type: 'object',
      properties: {
        lead_query: { type: 'string', description: 'Name or email of the lead.' },
        follow_up_date: {
          type: 'string',
          description: 'Date to follow up, as YYYY-MM-DD.',
        },
        note: { type: 'string', description: 'Optional note about what to raise.' },
      },
      required: ['lead_query', 'follow_up_date'],
    },
  },
]

export async function runActionTool(
  name: string,
  args: Record<string, unknown>,
  scope: ConsoleScope,
  threadId: string,
): Promise<ToolOutcome> {
  switch (name) {
    case 'stage_dormant_reactivation':
      return stageDormantReactivation(scope, threadId)
    case 'stage_lead_follow_up':
      return stageLeadFollowUp(args, scope, threadId)
    default:
      throw new Error(`Unknown action tool: ${name}`)
  }
}

/** Write the staged action and return what the model should say about it. */
async function stage(
  scope: ConsoleScope,
  threadId: string,
  actionType: ActionType,
  summary: string,
  payload: Record<string, unknown>,
  preview: Record<string, unknown>,
) {
  const { data, error } = await scope.admin
    .from('console_pending_actions')
    .insert({
      thread_id: threadId,
      coach_id: scope.coachId,
      action_type: actionType,
      summary,
      payload,
      preview,
    })
    .select('id, expires_at')
    .single()

  if (error) throw new Error(`Could not stage the action: ${error.message}`)
  return data
}

async function stageDormantReactivation(scope: ConsoleScope, threadId: string): Promise<ToolOutcome> {
  const { data, error } = await scoped(
    scope.admin
      .from('leads')
      .select(
        'id, name, email, scorecard_body_state, scorecard_score, scorecard_profile, scorecard_profile_confidence, storage_direction, active, sms_opted_out_at, converted_to_client_id',
      ),
    scope,
  )
    .eq('status', 'new_check_in')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const candidates = (data ?? []) as DormantCandidate[]
  const eligible: DormantCandidate[] = []
  const excluded: Array<{ name: string | null; reason: string }> = []

  for (const c of candidates) {
    const reason = ineligibleReason(c)
    if (reason) excluded.push({ name: c.name, reason: INELIGIBLE_LABELS[reason] })
    else eligible.push(c)
  }

  const excludedByReason = excluded.reduce<Record<string, number>>((acc, e) => {
    acc[e.reason] = (acc[e.reason] ?? 0) + 1
    return acc
  }, {})

  // Nothing to approve — say so rather than staging an empty action the coach
  // then has to dismiss.
  if (!eligible.length) {
    return {
      result: {
        staged: false,
        reason: 'No eligible leads. Nothing to send.',
        dormant_total: candidates.length,
        excluded_by_reason: excludedByReason,
      },
      count: 0,
    }
  }

  const summary = `Send the dormant re-engagement sequence to ${eligible.length} lead${eligible.length === 1 ? '' : 's'}`
  const preview = {
    would_send_to: eligible.length,
    dormant_total: candidates.length,
    excluded_count: excluded.length,
    excluded_by_reason: excludedByReason,
    recipients: eligible.slice(0, 100).map(c => ({
      name: c.name,
      email: c.email,
      state: c.scorecard_body_state,
      sms: c.sms_opted_out_at ? 'opted out' : 'yes',
    })),
    sequence: 'Read email now, SMS at +4 days, offer email at +6 days. Every step re-checks and stops if they reply, book or convert.',
  }

  const staged = await stage(
    scope,
    threadId,
    'dormant_reactivation',
    summary,
    { lead_ids: eligible.map(c => c.id) },
    preview,
  )

  return {
    result: {
      staged: true,
      action_id: staged.id,
      summary,
      would_send_to: eligible.length,
      excluded_count: excluded.length,
      excluded_by_reason: excludedByReason,
      expires_at: staged.expires_at,
      note: 'NOTHING HAS BEEN SENT. The coach sees an approval card and must click Confirm. Tell them the numbers and what is excluded, and let them decide.',
    },
    count: eligible.length,
  }
}

async function stageLeadFollowUp(
  args: Record<string, unknown>,
  scope: ConsoleScope,
  threadId: string,
): Promise<ToolOutcome> {
  const query = typeof args.lead_query === 'string' ? args.lead_query.trim() : ''
  const date = typeof args.follow_up_date === 'string' ? args.follow_up_date.trim() : ''
  const note = typeof args.note === 'string' ? args.note.trim() : ''

  if (!query) throw new Error('A lead name or email is required.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('follow_up_date must be YYYY-MM-DD.')

  const { data, error } = await scoped(
    scope.admin.from('leads').select('id, name, email, status'),
    scope,
  )
    .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(5)

  if (error) throw new Error(error.message)
  if (!data?.length) return { result: { staged: false, reason: `No lead matching "${query}".` }, count: 0 }
  if (data.length > 1) {
    return {
      result: {
        staged: false,
        reason: 'More than one lead matches. Ask the coach which one.',
        matches: data.map(l => ({ name: l.name, email: l.email })),
      },
      count: data.length,
    }
  }

  const lead = data[0]
  const summary = `Set a follow-up on ${lead.name ?? lead.email} for ${date}`
  const staged = await stage(
    scope,
    threadId,
    'set_lead_follow_up',
    summary,
    { lead_id: lead.id, follow_up_date: date, note },
    { lead: lead.name ?? lead.email, date, note: note || '(none)' },
  )

  return {
    result: {
      staged: true,
      action_id: staged.id,
      summary,
      note: 'Not saved yet — the coach must confirm.',
    },
    count: 1,
  }
}
