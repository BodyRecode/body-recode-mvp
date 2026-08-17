/**
 * Operator Console — read tools. "Go and look."
 *
 * Each tool answers a question the coach would otherwise have to go and find by
 * clicking through pages: which leads never moved, who is drifting, what has
 * actually been sent, what is firing. The model picks the tool and the filters.
 * It never picks the practice — `scoped()` puts the coach id on every query,
 * and the model never sees a coach id to pass in the first place.
 *
 * Two rules the whole file follows:
 *
 *  1. RETURN SHAPES ARE SMALL AND FLAT. Whatever a tool returns is read into
 *     the model's context and paid for per token on every subsequent turn of
 *     the conversation. A tool that returns 200 full lead rows is a cost bug
 *     and a quality bug: it crowds out the reasoning. So results are capped,
 *     trimmed to the fields that answer the question, and counted rather than
 *     enumerated where a count is the actual answer.
 *
 *  2. NO FREE-FORM SQL. Every filter is an enumerated parameter. A "run this
 *     query" tool would be far more flexible and is exactly the thing that
 *     cannot be safely handed to a licensee — it turns a prompt injection into
 *     a database read. Flexibility here is not worth what it costs.
 */

import type Anthropic from '@anthropic-ai/sdk'
import { scoped, type ConsoleScope } from './scope'
import { computeRosterNextActions } from '@/lib/roster-next-actions'

/** Hard ceiling on rows any single tool will hand back to the model. */
const MAX_ROWS = 50

function cap(n: unknown, fallback = 20): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : fallback
  return Math.min(Math.max(v, 1), MAX_ROWS)
}

/** Days-ago → ISO, for "created in the last N days" style filters. */
function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export const READ_TOOLS: Anthropic.Tool[] = [
  {
    name: 'count_leads',
    description:
      'Count leads in the practice, optionally filtered. Use this when the question is "how many" — it is far cheaper than listing them and it is the honest answer to a counting question. Returns a total plus a breakdown by status.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Optional pipeline status to filter to, e.g. "new_check_in" (submitted the scorecard and never moved), "booked", "converted".',
        },
        created_within_days: {
          type: 'number',
          description: 'Only count leads created in the last N days.',
        },
        never_moved: {
          type: 'boolean',
          description:
            'True to count only leads still sitting at their entry status with no booking and no conversion — the dormant pool.',
        },
      },
      required: [],
    },
  },
  {
    name: 'find_leads',
    description:
      'List individual leads with their details. Use only when the coach needs to see WHO, not how many — prefer count_leads for counting. Returns name, email, status, body state, score, when they arrived and when they were last contacted.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Pipeline status to filter to.' },
        never_moved: {
          type: 'boolean',
          description: 'Only leads that never progressed past their entry status.',
        },
        body_state: {
          type: 'string',
          description: 'Filter to a body state: "Depleted State", "Transitioning State", "Ready State".',
        },
        created_within_days: { type: 'number', description: 'Only leads from the last N days.' },
        stale_days: {
          type: 'number',
          description: 'Only leads with no contact for at least N days.',
        },
        limit: { type: 'number', description: `Max rows (default 20, hard cap ${MAX_ROWS}).` },
      },
      required: [],
    },
  },
  {
    name: 'get_lead',
    description:
      'Full detail for one lead by name or email: their scorecard, notes, follow-up state, and their recent email and SMS history. Use after find_leads when the coach asks about a specific person.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Name or email to look up.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_clients',
    description:
      'List clients in the practice. Filter by active, frozen, or ended. Returns name, package, start date and status.',
    input_schema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          enum: ['active', 'frozen', 'ended', 'all'],
          description: 'Which clients to return. Defaults to active.',
        },
        limit: { type: 'number', description: `Max rows (default 30, hard cap ${MAX_ROWS}).` },
      },
      required: [],
    },
  },
  {
    name: 'roster_attention',
    description:
      'Who needs the coach today, ranked. This is the same ranking the Today\'s Focus board uses, so it will not disagree with the dashboard. Returns each client with what is owed and why.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max clients to return (default 15).' },
      },
      required: [],
    },
  },
  {
    name: 'recent_sends',
    description:
      'What has actually gone out — emails and SMS — over the last N days. Use this to audit whether something fired, or to check nobody is being double-sent before staging another send.',
    input_schema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Look back this many days (default 7).' },
        channel: {
          type: 'string',
          enum: ['email', 'sms', 'both'],
          description: 'Which channel to report on. Defaults to both.',
        },
        limit: { type: 'number', description: `Max rows (default 30, hard cap ${MAX_ROWS}).` },
      },
      required: [],
    },
  },
  {
    name: 'list_workflows',
    description:
      'The automations configured in the practice, whether each is active, and how many times each has run recently. Use this to answer "what is actually firing?" and to spot a workflow that is on but never running, or running far more than expected.',
    input_schema: {
      type: 'object',
      properties: {
        active_only: { type: 'boolean', description: 'Only active workflows. Defaults to false.' },
      },
      required: [],
    },
  },
]

/* ──────────────────────────────────────────────────────────────────────────
 * Handlers
 * ────────────────────────────────────────────────────────────────────────── */

export type ToolOutcome = {
  /** Rendered back to the model as the tool result. */
  result: unknown
  /** Row count for the audit trail. Null where a count is meaningless. */
  count: number | null
}

export async function runReadTool(
  name: string,
  args: Record<string, unknown>,
  scope: ConsoleScope,
): Promise<ToolOutcome> {
  switch (name) {
    case 'count_leads':
      return countLeads(args, scope)
    case 'find_leads':
      return findLeads(args, scope)
    case 'get_lead':
      return getLead(args, scope)
    case 'find_clients':
      return findClients(args, scope)
    case 'roster_attention':
      return rosterAttention(args, scope)
    case 'recent_sends':
      return recentSends(args, scope)
    case 'list_workflows':
      return listWorkflows(args, scope)
    default:
      throw new Error(`Unknown read tool: ${name}`)
  }
}

async function countLeads(args: Record<string, unknown>, scope: ConsoleScope): Promise<ToolOutcome> {
  let q = scoped(scope.admin.from('leads').select('status, converted_to_client_id, zoom_1_date'), scope)

  if (typeof args.status === 'string') q = q.eq('status', args.status)
  if (typeof args.created_within_days === 'number') {
    q = q.gte('created_at', daysAgoIso(args.created_within_days))
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  let rows = data ?? []
  if (args.never_moved === true) {
    rows = rows.filter(r => !r.converted_to_client_id && !r.zoom_1_date)
  }

  const byStatus: Record<string, number> = {}
  for (const r of rows) {
    const s = (r.status as string) ?? 'unknown'
    byStatus[s] = (byStatus[s] ?? 0) + 1
  }

  return { result: { total: rows.length, by_status: byStatus }, count: rows.length }
}

async function findLeads(args: Record<string, unknown>, scope: ConsoleScope): Promise<ToolOutcome> {
  const limit = cap(args.limit, 20)

  let q = scoped(
    scope.admin
      .from('leads')
      .select(
        'id, name, email, status, scorecard_body_state, scorecard_score, lead_quality, created_at, next_follow_up_at, converted_to_client_id, zoom_1_date',
      ),
    scope,
  ).order('created_at', { ascending: false })

  if (typeof args.status === 'string') q = q.eq('status', args.status)
  if (typeof args.body_state === 'string') q = q.eq('scorecard_body_state', args.body_state)
  if (typeof args.created_within_days === 'number') {
    q = q.gte('created_at', daysAgoIso(args.created_within_days))
  }
  if (typeof args.stale_days === 'number') {
    q = q.lte('created_at', daysAgoIso(args.stale_days))
  }

  // Fetch a wider window than the cap when a post-filter will thin the rows.
  const { data, error } = await q.limit(args.never_moved === true ? MAX_ROWS * 4 : limit)
  if (error) throw new Error(error.message)

  let rows = data ?? []
  if (args.never_moved === true) {
    rows = rows.filter(r => !r.converted_to_client_id && !r.zoom_1_date)
  }
  rows = rows.slice(0, limit)

  const leads = rows.map(r => ({
    name: r.name,
    email: r.email,
    status: r.status,
    body_state: r.scorecard_body_state,
    score: r.scorecard_score,
    quality: r.lead_quality,
    created: (r.created_at as string)?.slice(0, 10) ?? null,
    follow_up_due: (r.next_follow_up_at as string | null)?.slice(0, 10) ?? null,
  }))

  return { result: { returned: leads.length, leads }, count: leads.length }
}

async function getLead(args: Record<string, unknown>, scope: ConsoleScope): Promise<ToolOutcome> {
  const query = typeof args.query === 'string' ? args.query.trim() : ''
  if (!query) throw new Error('A name or email is required.')

  const { data, error } = await scoped(
    scope.admin
      .from('leads')
      .select(
        'id, name, email, phone, status, source, scorecard_body_state, scorecard_score, scorecard_profile, lead_quality, notes, created_at, next_follow_up_at, follow_up_note, zoom_1_date, converted_to_client_id',
      ),
    scope,
  )
    .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(5)

  if (error) throw new Error(error.message)
  if (!data?.length) return { result: { found: false, query }, count: 0 }

  // More than one match is an answer in itself — let the coach disambiguate
  // rather than silently picking the first.
  if (data.length > 1) {
    return {
      result: {
        found: true,
        ambiguous: true,
        matches: data.map(r => ({ name: r.name, email: r.email, status: r.status })),
      },
      count: data.length,
    }
  }

  const lead = data[0]
  const [{ data: emails }, { data: texts }] = await Promise.all([
    scope.admin
      .from('lead_events')
      .select('type, subject, sent_at')
      .eq('lead_id', lead.id)
      .order('sent_at', { ascending: false })
      .limit(10),
    scope.admin
      .from('sms_logs')
      .select('direction, trigger, status, sent_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return {
    result: {
      found: true,
      lead: {
        name: lead.name,
        email: lead.email,
        status: lead.status,
        source: lead.source,
        body_state: lead.scorecard_body_state,
        score: lead.scorecard_score,
        profile: lead.scorecard_profile,
        quality: lead.lead_quality,
        notes: lead.notes,
        created: (lead.created_at as string)?.slice(0, 10) ?? null,
        follow_up_due: (lead.next_follow_up_at as string | null)?.slice(0, 10) ?? null,
        follow_up_note: lead.follow_up_note,
        became_client: Boolean(lead.converted_to_client_id),
      },
      recent_emails: (emails ?? []).map(e => ({
        type: e.type,
        subject: e.subject,
        sent: (e.sent_at as string | null)?.slice(0, 10) ?? null,
      })),
      recent_sms: (texts ?? []).map(s => ({
        direction: s.direction,
        trigger: s.trigger,
        status: s.status,
        sent: (s.sent_at as string | null)?.slice(0, 10) ?? null,
      })),
    },
    count: 1,
  }
}

async function findClients(args: Record<string, unknown>, scope: ConsoleScope): Promise<ToolOutcome> {
  const limit = cap(args.limit, 30)
  const state = typeof args.state === 'string' ? args.state : 'active'

  let q = scoped(
    scope.admin
      .from('clients')
      .select('name, package, coaching_started_at, active, frozen_at, ended_at, end_reason'),
    scope,
  ).order('name', { ascending: true })

  if (state === 'active') q = q.eq('active', true).is('ended_at', null).is('frozen_at', null)
  else if (state === 'frozen') q = q.not('frozen_at', 'is', null)
  else if (state === 'ended') q = q.not('ended_at', 'is', null)

  const { data, error } = await q.limit(limit)
  if (error) throw new Error(error.message)

  const clients = (data ?? []).map(c => ({
    name: c.name,
    package: c.package,
    started: (c.coaching_started_at as string | null)?.slice(0, 10) ?? null,
    frozen: Boolean(c.frozen_at),
    ended: (c.ended_at as string | null)?.slice(0, 10) ?? null,
    end_reason: c.end_reason,
  }))

  return { result: { state, returned: clients.length, clients }, count: clients.length }
}

async function rosterAttention(args: Record<string, unknown>, scope: ConsoleScope): Promise<ToolOutcome> {
  const limit = cap(args.limit, 15)

  // computeRosterNextActions is the shared state machine behind Today's Focus.
  // It is NOT coach-scoped (it predates multi-tenancy), so the result is
  // intersected with this coach's own client ids before anything is returned.
  // Doing it this way keeps one ranking implementation rather than forking a
  // second that could drift from the board.
  const [{ actions }, { data: owned }] = await Promise.all([
    computeRosterNextActions(scope.admin),
    scoped(scope.admin.from('clients').select('id'), scope),
  ])

  const mine = new Set((owned ?? []).map(c => c.id as string))
  const filtered = actions.filter(a => mine.has(a.clientId)).slice(0, limit)

  return {
    result: {
      returned: filtered.length,
      clients: filtered.map(a => ({
        name: a.clientName,
        stage: a.stage,
        next_action: a.headline,
        detail: a.sublabel,
        urgency: a.priority,
        badge: a.badge,
      })),
    },
    count: filtered.length,
  }
}

async function recentSends(args: Record<string, unknown>, scope: ConsoleScope): Promise<ToolOutcome> {
  const days = typeof args.days === 'number' ? Math.min(Math.max(args.days, 1), 90) : 7
  const limit = cap(args.limit, 30)
  const channel = typeof args.channel === 'string' ? args.channel : 'both'
  const since = daysAgoIso(days)

  // lead_events and sms_logs have no coach_id of their own — they hang off a
  // lead. So the scope is applied by resolving this coach's lead ids first and
  // filtering to those. Slower than a direct filter, and correct, which is the
  // trade this file always takes.
  const { data: leadRows, error: leadErr } = await scoped(
    scope.admin.from('leads').select('id, name'),
    scope,
  )
  if (leadErr) throw new Error(leadErr.message)

  const nameById = new Map((leadRows ?? []).map(l => [l.id as string, (l.name as string) ?? 'Unknown']))
  const ids = [...nameById.keys()]
  if (!ids.length) return { result: { days, emails: [], sms: [] }, count: 0 }

  const wantEmail = channel === 'email' || channel === 'both'
  const wantSms = channel === 'sms' || channel === 'both'

  const [emailRes, smsRes] = await Promise.all([
    wantEmail
      ? scope.admin
          .from('lead_events')
          .select('lead_id, type, subject, sent_at')
          .in('lead_id', ids)
          .gte('sent_at', since)
          .order('sent_at', { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    wantSms
      ? scope.admin
          .from('sms_logs')
          .select('lead_id, direction, trigger, status, sent_at')
          .in('lead_id', ids)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])

  const emails = (emailRes.data ?? []).map(e => ({
    to: nameById.get(e.lead_id as string) ?? 'Unknown',
    type: e.type,
    subject: e.subject,
    sent: (e.sent_at as string | null)?.slice(0, 16).replace('T', ' ') ?? null,
  }))
  const sms = (smsRes.data ?? []).map(s => ({
    to: nameById.get(s.lead_id as string) ?? 'Unknown',
    direction: s.direction,
    trigger: s.trigger,
    status: s.status,
    sent: (s.sent_at as string | null)?.slice(0, 16).replace('T', ' ') ?? null,
  }))

  return {
    result: { days, email_count: emails.length, sms_count: sms.length, emails, sms },
    count: emails.length + sms.length,
  }
}

async function listWorkflows(args: Record<string, unknown>, scope: ConsoleScope): Promise<ToolOutcome> {
  let q = scoped(
    scope.admin.from('be_workflows').select('id, name, trigger_type, is_active, created_at'),
    scope,
  ).order('name', { ascending: true })

  if (args.active_only === true) q = q.eq('is_active', true)

  const { data, error } = await q.limit(MAX_ROWS)
  if (error) throw new Error(error.message)

  const workflows = data ?? []
  const ids = workflows.map(w => w.id as string)

  // Recent run counts, so "is it firing?" gets a number rather than a shrug.
  const runs = new Map<string, { total: number; failed: number }>()
  if (ids.length) {
    const { data: execs } = await scope.admin
      .from('be_workflow_executions')
      .select('workflow_id, status')
      .in('workflow_id', ids)
      .gte('started_at', daysAgoIso(30))
    for (const e of execs ?? []) {
      const key = e.workflow_id as string
      const rec = runs.get(key) ?? { total: 0, failed: 0 }
      rec.total += 1
      if (e.status === 'failed' || e.status === 'error') rec.failed += 1
      runs.set(key, rec)
    }
  }

  return {
    result: {
      returned: workflows.length,
      workflows: workflows.map(w => {
        const r = runs.get(w.id as string) ?? { total: 0, failed: 0 }
        return {
          name: w.name,
          trigger: w.trigger_type,
          active: w.is_active,
          runs_last_30_days: r.total,
          failed_last_30_days: r.failed,
        }
      }),
    },
    count: workflows.length,
  }
}
