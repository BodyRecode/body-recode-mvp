import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { coachOwnsAnyClient } from '@/lib/coach-scope'
import { checkCopilotAllowance } from '@/lib/copilot-limits'
import { buildCopilotContext, getCoachPreferences } from '@/lib/copilot-context'
import { buildCopilotSystemPrompt } from '@/lib/copilot-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'

export const maxDuration = 120

// Cap how much prior conversation we replay, to bound tokens + latency.
const HISTORY_LIMIT = 24

// The GET that returned this client's whole message history was removed on
// 2026-08-17: opening the bubble now starts a fresh conversation, so there is no
// history to load. Past rows remain in copilot_messages for the flagged-exchanges
// review page (/dashboard/copilot-review), which reads them directly.

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params

  // Coach-only. The co-pilot is never client-facing.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  // Any coach may use the co-pilot on a client they own. Middleware has
  // already refused this route for a client that is not theirs, so reaching
  // here means the client is theirs or they are the owner.
  if (!isCoachEmail(user.email) && !(await coachOwnsAnyClient(user.id))) {
    return NextResponse.json({ error: 'Coach access only' }, { status: 403 })
  }

  const allowance = await checkCopilotAllowance(user.id, isCoachEmail(user.email))
  if (!allowance.allowed) {
    return NextResponse.json({ error: allowance.message }, { status: 429 })
  }

  const { message, session_id: sessionId } = await request.json().catch(() => ({ message: null, session_id: null }))
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'Missing session' }, { status: 400 })
  }

  const admin = createAdminClient()

  const ctx = await buildCopilotContext(admin, clientId)
  if (!ctx) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Coach-style memory (Phase 8) — soft guidance keyed by coach email.
  const coachPreferences = await getCoachPreferences(admin, user.email)

  // Prior turns of THIS conversation only (oldest first), capped. Scoping to the
  // session is what stops a chat from weeks ago steering today's answer — the
  // coach starts fresh every time they open the bubble, and so does the model.
  const { data: historyRows } = await admin
    .from('copilot_messages')
    .select('role, content, created_at')
    .eq('client_id', clientId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT)
  const history = (historyRows ?? [])
    .reverse()
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content as string }))

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })

  // Retry loop: the model occasionally returns an empty text block (a transient
  // blip the SDK's own retries don't cover). Try up to 3 times before failing,
  // so the chat doesn't surface an "empty response" for a one-off.
  let answer = ''
  // SAFETY GATES ON THE ANSWER, 21 September 2026.
  //
  // Every read and every plan is checked before it saves and refused if it
  // breaks a rule for this client. The co-pilot answered in a conversation and
  // nothing checked it at all, which made it the one surface where the engine
  // could tell a coach to do something for a woman on spironolactone that the
  // read itself would have been refused for saying.
  //
  // Survivable with Kade's own clients, because he would catch it. Not
  // survivable with somebody else's.
  const { loadGateContext, findReadingGateViolations, readingGateRetryMessage } =
    await import('@/lib/reading-safety-check')
  const gateContext = await loadGateContext(admin, clientId)
  let gateFeedback = ''
  let gatesSeen: string[] = []

  let lastErr = 'unknown error'
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        // 4096, not 1600: substantive doctrine answers (e.g. "given this CFFS,
        // what goes in every training-program field?") were hitting the cap and
        // returning an empty text block with stop_reason=max_tokens.
        max_tokens: 4096,
        // CACHED, 21 Sep 2026. Measuring the cost found the whole client file,
        // about 34,000 characters, being re-sent at full price on every single
        // question. A coach asking five questions about one woman paid for her
        // file five times.
        //
        // The file does not change inside a conversation, which is exactly what
        // caching is for. Marking the system prompt makes every question after
        // the first read it at a tenth of the price.
        system: [
          {
            type: 'text' as const,
            text: withTemporalContext(buildCopilotSystemPrompt(ctx.clientName, ctx.context, coachPreferences)),
            cache_control: { type: 'ephemeral' as const },
          },
        ],
        messages: [...history, { role: 'user', content: gateFeedback ? `${message}\n\n${gateFeedback}` : message }],
      })
      const block = resp.content.find(b => b.type === 'text')
      const candidate = block && block.type === 'text' ? block.text.trim() : ''

      if (candidate) {
        const violations = findReadingGateViolations({ answer: candidate }, gateContext)
        if (violations.length > 0) {
          gatesSeen = Array.from(new Set([...gatesSeen, ...violations.map(v => v.code)]))
          gateFeedback = readingGateRetryMessage(violations)
          lastErr = `safety gate breach: ${violations.map(v => v.code).join(', ')}`
          console.warn(`[copilot] attempt ${attempt}/3 ${lastErr}`)
          // The unsafe text is never kept, so it can never be shown.
          continue
        }
        answer = candidate
      }
      if (answer) break
      lastErr = `empty response (stop_reason=${resp.stop_reason})`
      console.warn(`[copilot] attempt ${attempt}/3: ${lastErr}`)
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
      console.error(`[copilot] attempt ${attempt}/3 API error:`, lastErr)
    }
  }
  if (!answer) {
    if (gatesSeen.length > 0) {
      return NextResponse.json(
        {
          error: `Every answer to that broke a safety rule for this client (${gatesSeen.join(', ')}), so none of them is being shown to you. That is a hard gate rather than a wording problem: it usually means the question is reaching for something her medicines or her health screen answers rule out. Check those, and tell Kade.`,
        },
        { status: 422 },
      )
    }
    return NextResponse.json({ error: `The co-pilot couldn't respond after 3 tries (${lastErr}). Please try again.` }, { status: 502 })
  }

  // Suggested follow-ups — a fast, cheap second pass so the coach can keep the
  // thread moving without typing. Non-blocking: on any failure we omit them.
  let followups: string[] = []
  try {
    const fu = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: withTemporalContext('You suggest what a COACH might ask next in a doctrine-coaching conversation about a client. Given the last question and answer, propose exactly 3 short follow-up questions or steers the coach could tap next. Each 9 words or fewer, specific to what was just discussed, no numbering, no quotes. Return ONLY JSON: {"followups":["...","...","..."]}'),
      messages: [{ role: 'user', content: `QUESTION:\n${message}\n\nANSWER:\n${answer}\n\nPropose 3 follow-ups.` }],
    })
    const fblock = fu.content.find(b => b.type === 'text')
    if (fblock && fblock.type === 'text') {
      const json = extractFirstJsonObject(fblock.text)
      if (json) {
        const parsed = JSON.parse(json)
        if (Array.isArray(parsed.followups)) {
          followups = parsed.followups.filter((s: unknown) => typeof s === 'string' && s.trim()).slice(0, 3)
        }
      }
    }
  } catch { /* non-blocking — chips just won't show */ }

  // Persist the exchange (user then assistant). Best-effort ids returned so the
  // UI can wire the thumbs-down flag + follow-up chips to the assistant message.
  const nowUser = new Date().toISOString()
  const { data: inserted, error: insErr } = await admin
    .from('copilot_messages')
    .insert([
      { client_id: clientId, coach_id: ctx.coachId, session_id: sessionId, role: 'user', content: message, created_at: nowUser },
      { client_id: clientId, coach_id: ctx.coachId, session_id: sessionId, role: 'assistant', content: answer, followups, created_at: new Date(Date.parse(nowUser) + 1).toISOString() },
    ])
    .select('id, role, content, flagged, followups, created_at')

  if (insErr) {
    console.error('[copilot] failed to store messages:', insErr.message)
    // The answer is still valuable; return it without persisted ids.
    return NextResponse.json({ assistant: { content: answer, id: null, flagged: false, followups } })
  }

  const assistant = inserted?.find(m => m.role === 'assistant') ?? null
  return NextResponse.json({ assistant })
}
