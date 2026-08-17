/**
 * Operator Console — the chat endpoint and the tool loop.
 *
 * This is where the console differs from the co-pilot. The co-pilot is given
 * a pre-built block of context and answers from it in one pass. The console is
 * given TOOLS and runs a loop: it asks the model, the model calls a tool, we
 * execute the tool under this coach's scope, we hand back the result, and we
 * ask again — until the model stops calling tools and produces an answer.
 *
 * Everything the loop does is written to `console_tool_calls` as it happens.
 * That is not instrumentation added for tidiness; it is the only way to answer
 * "why did my client get that email?" after the fact, which is the first
 * question a licensee asks when something surprises them.
 *
 * Two ceilings bound the loop:
 *   MAX_TURNS   how many times the model may call tools before we stop. A model
 *               that has genuinely finished stops on its own; this catches the
 *               case where it loops.
 *   HISTORY_LIMIT how much prior conversation is replayed. The transcript lives
 *               in the database, so a long thread would otherwise grow the bill
 *               on every single turn.
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { resolveConsoleScope, type ConsoleScope } from '@/lib/console/scope'
import { READ_TOOLS, runReadTool } from '@/lib/console/tools-read'
import { ACTION_TOOLS, runActionTool } from '@/lib/console/tools-action'
import { buildConsolePrompt } from '@/lib/console/prompt'
import { getCoachPreferences } from '@/lib/copilot-context'
import { withTemporalContext } from '@/lib/temporal-context'
import { AI_MODELS } from '@/lib/ai-models'
import { coach } from '@/config/tenant'

export const maxDuration = 300

const MAX_TURNS = 8
const HISTORY_LIMIT = 20
const MAX_TOKENS = 4096

const ALL_TOOLS: Anthropic.Tool[] = [...READ_TOOLS, ...ACTION_TOOLS]
const ACTION_TOOL_NAMES = new Set(ACTION_TOOLS.map(t => t.name))

type TraceEntry = { tool: string; ok: boolean; count: number | null; error?: string }

export async function POST(request: NextRequest) {
  const gate = await resolveConsoleScope()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const { scope } = gate

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const threadIdIn = typeof body.thread_id === 'string' ? body.thread_id : ''
  if (!message) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  // Resolve or open the thread. A thread id from the client is verified against
  // this coach before it is used — it arrives from the browser, so it is an
  // input to check, not a fact to trust.
  const threadId = await resolveThread(scope, threadIdIn, message)
  if (!threadId) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const history = await loadHistory(scope, threadId)

  await scope.admin.from('console_messages').insert({
    thread_id: threadId,
    coach_id: scope.coachId,
    role: 'user',
    content: message,
  })

  let coachPreferences = ''
  try {
    coachPreferences = await getCoachPreferences(scope.admin, scope.email)
  } catch {
    /* preferences are a nicety — never block the answer on them */
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })
  const system = withTemporalContext(
    buildConsolePrompt(coach().firstName, coachPreferences),
  )

  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: message },
  ]

  const trace: TraceEntry[] = []
  const stagedActionIds: string[] = []
  let answer = ''

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await anthropic.messages.create({
        // Operational reasoning over live business data: a wrong answer is
        // visible and costs a retry, but it is also the thing the coach acts
        // on, so this sits at the clinical/structural tier rather than the
        // cheap one. See src/lib/ai-models.ts — pick by consequence.
        model: AI_MODELS.structural,
        max_tokens: MAX_TOKENS,
        system,
        tools: ALL_TOOLS,
        messages,
      })

      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === 'text',
      )
      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      )

      if (!toolUses.length) {
        answer = textBlocks.map(b => b.text).join('\n').trim()
        break
      }

      // Keep the assistant turn intact — dropping the tool_use blocks would
      // orphan the tool_result blocks we are about to send back.
      messages.push({ role: 'assistant', content: response.content })

      const results: Anthropic.ToolResultBlockParam[] = []
      for (const use of toolUses) {
        const args = (use.input ?? {}) as Record<string, unknown>
        const started = Date.now()
        try {
          const outcome = ACTION_TOOL_NAMES.has(use.name)
            ? await runActionTool(use.name, args, scope, threadId)
            : await runReadTool(use.name, args, scope)

          // Surface staged action ids so the UI can render approval cards.
          const res = outcome.result as Record<string, unknown> | null
          if (res && typeof res === 'object' && typeof res.action_id === 'string') {
            stagedActionIds.push(res.action_id)
          }

          trace.push({ tool: use.name, ok: true, count: outcome.count })
          await recordToolCall(scope, threadId, use.name, args, true, null, outcome.count, Date.now() - started)
          results.push({
            type: 'tool_result',
            tool_use_id: use.id,
            content: JSON.stringify(outcome.result),
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          trace.push({ tool: use.name, ok: false, count: null, error: msg })
          await recordToolCall(scope, threadId, use.name, args, false, msg, null, Date.now() - started)
          // Hand the failure back rather than aborting: the model can often
          // recover by trying different arguments, and a partial answer with a
          // stated gap beats a 500.
          results.push({
            type: 'tool_result',
            tool_use_id: use.id,
            content: `Error: ${msg}`,
            is_error: true,
          })
        }
      }

      messages.push({ role: 'user', content: results })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[console] loop failed:', msg)
    return NextResponse.json({ error: `The console hit an error: ${msg}` }, { status: 502 })
  }

  if (!answer) {
    answer =
      'I ran out of steps before I could finish that. Try narrowing the question — asking about one thing at a time usually gets there.'
  }

  const { data: saved } = await scope.admin
    .from('console_messages')
    .insert({
      thread_id: threadId,
      coach_id: scope.coachId,
      role: 'assistant',
      content: answer,
      tool_trace: trace,
    })
    .select('id')
    .single()

  await scope.admin
    .from('console_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId)

  const pendingActions = stagedActionIds.length
    ? await loadPendingActions(scope, stagedActionIds)
    : []

  return NextResponse.json({
    thread_id: threadId,
    assistant: { id: saved?.id ?? null, content: answer, tool_trace: trace },
    pending_actions: pendingActions,
  })
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

async function resolveThread(
  scope: ConsoleScope,
  threadIdIn: string,
  firstMessage: string,
): Promise<string | null> {
  if (threadIdIn) {
    const { data } = await scope.admin
      .from('console_threads')
      .select('id')
      .eq('id', threadIdIn)
      .eq('coach_id', scope.coachId)
      .maybeSingle()
    return data ? (data.id as string) : null
  }

  // Title from the opening question — enough to recognise the thread later
  // without a second model call just to name it.
  const title = firstMessage.length > 60 ? `${firstMessage.slice(0, 57)}…` : firstMessage
  const { data, error } = await scope.admin
    .from('console_threads')
    .insert({ coach_id: scope.coachId, title })
    .select('id')
    .single()

  if (error) throw new Error(`Could not open a thread: ${error.message}`)
  return data.id as string
}

async function loadHistory(scope: ConsoleScope, threadId: string): Promise<Anthropic.MessageParam[]> {
  const { data } = await scope.admin
    .from('console_messages')
    .select('role, content, created_at')
    .eq('thread_id', threadId)
    .eq('coach_id', scope.coachId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT)

  return (data ?? [])
    .reverse()
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content as string }))
}

async function recordToolCall(
  scope: ConsoleScope,
  threadId: string,
  toolName: string,
  args: Record<string, unknown>,
  ok: boolean,
  error: string | null,
  resultCount: number | null,
  durationMs: number,
) {
  // Best-effort: a failed audit write must not take down the answer, but it is
  // logged loudly because a silently missing audit trail is worse than none.
  const { error: writeErr } = await scope.admin.from('console_tool_calls').insert({
    thread_id: threadId,
    coach_id: scope.coachId,
    tool_name: toolName,
    arguments: args,
    ok,
    error,
    result_count: resultCount,
    duration_ms: durationMs,
  })
  if (writeErr) console.error('[console] AUDIT WRITE FAILED:', writeErr.message)
}

async function loadPendingActions(scope: ConsoleScope, ids: string[]) {
  const { data } = await scope.admin
    .from('console_pending_actions')
    .select('id, action_type, summary, preview, status, expires_at')
    .in('id', ids)
    .eq('coach_id', scope.coachId)
  return data ?? []
}
