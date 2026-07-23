import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { buildCopilotContext } from '@/lib/copilot-context'
import { buildCopilotSystemPrompt } from '@/lib/copilot-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'

export const maxDuration = 120

// Cap how much prior conversation we replay, to bound tokens + latency.
const HISTORY_LIMIT = 24

/**
 * GET — the client's co-pilot history, loaded lazily when the coach first
 * opens the bubble (rather than eagerly in the client layout on every page).
 * Coach-only, same as POST.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Coach access only' }, { status: 403 })

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('copilot_messages')
    .select('id, role, content, flagged, followups, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
    .limit(200)

  const messages = (rows ?? []).map(m => ({
    id: m.id as string,
    role: m.role as 'user' | 'assistant',
    content: m.content as string,
    flagged: !!m.flagged,
    followups: Array.isArray(m.followups) ? (m.followups as string[]) : [],
  }))
  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params

  // Coach-only. The co-pilot is never client-facing.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Coach access only' }, { status: 403 })

  const { message } = await request.json().catch(() => ({ message: null }))
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  }

  const admin = createAdminClient()

  const ctx = await buildCopilotContext(admin, clientId)
  if (!ctx) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Prior conversation for this client (oldest first), capped.
  const { data: historyRows } = await admin
    .from('copilot_messages')
    .select('role, content, created_at')
    .eq('client_id', clientId)
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
  let lastErr = 'unknown error'
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        // 4096, not 1600: substantive doctrine answers (e.g. "given this CFFS,
        // what goes in every training-program field?") were hitting the cap and
        // returning an empty text block with stop_reason=max_tokens.
        max_tokens: 4096,
        system: buildCopilotSystemPrompt(ctx.clientName, ctx.context),
        messages: [...history, { role: 'user', content: message }],
      })
      const block = resp.content.find(b => b.type === 'text')
      answer = block && block.type === 'text' ? block.text.trim() : ''
      if (answer) break
      lastErr = `empty response (stop_reason=${resp.stop_reason})`
      console.warn(`[copilot] attempt ${attempt}/3: ${lastErr}`)
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
      console.error(`[copilot] attempt ${attempt}/3 API error:`, lastErr)
    }
  }
  if (!answer) {
    return NextResponse.json({ error: `The co-pilot couldn't respond after 3 tries (${lastErr}). Please try again.` }, { status: 502 })
  }

  // Suggested follow-ups — a fast, cheap second pass so the coach can keep the
  // thread moving without typing. Non-blocking: on any failure we omit them.
  let followups: string[] = []
  try {
    const fu = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: 'You suggest what a COACH might ask next in a doctrine-coaching conversation about a client. Given the last question and answer, propose exactly 3 short follow-up questions or steers the coach could tap next. Each 9 words or fewer, specific to what was just discussed, no numbering, no quotes. Return ONLY JSON: {"followups":["...","...","..."]}',
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
      { client_id: clientId, coach_id: ctx.coachId, role: 'user', content: message, created_at: nowUser },
      { client_id: clientId, coach_id: ctx.coachId, role: 'assistant', content: answer, followups, created_at: new Date(Date.parse(nowUser) + 1).toISOString() },
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
