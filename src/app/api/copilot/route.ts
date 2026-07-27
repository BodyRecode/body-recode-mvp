import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { buildGeneralCopilotSystemPrompt } from '@/lib/copilot-prompt'
import { buildRosterContext } from '@/lib/copilot-context'
import { extractFirstJsonObject } from '@/lib/extract-json'

// Global co-pilot endpoint — the SAME co-pilot as the client-scoped one, but for
// pages where no client is loaded (Today, Business, Marketing, etc.). It answers
// about the method/doctrine generally. Stateless: the conversation lives in the
// bubble's client-side state and is replayed here each turn (no per-coach
// persistence yet), so no DB write and no schema change.

export const maxDuration = 120

// Cap how much prior conversation we replay, to bound tokens + latency.
const HISTORY_LIMIT = 24

type ChatMsg = { role: 'user' | 'assistant'; content: string }

function sanitiseHistory(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return []
  const out: ChatMsg[] = []
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue
    const rec = m as Record<string, unknown>
    const role = rec.role
    const content = rec.content
    if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
      out.push({ role, content })
    }
  }
  return out.slice(-HISTORY_LIMIT)
}

export async function POST(request: NextRequest) {
  // Coach-only. The co-pilot is never client-facing.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Coach access only' }, { status: 403 })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const history = sanitiseHistory(body.history)

  // Practice-wide roster snapshot (Phase 4). Best-effort: if it fails, the
  // co-pilot still answers as the general doctrine tutor without it.
  let rosterContext = ''
  try {
    rosterContext = await buildRosterContext(createAdminClient())
  } catch (err) {
    console.error('[copilot-general] roster context failed:', err instanceof Error ? err.message : String(err))
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })

  // Retry loop mirrors the client-scoped route: the model occasionally returns
  // an empty text block; try up to 3 times before failing.
  let answer = ''
  let lastErr = 'unknown error'
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        // 4096, not 1600: long doctrine answers were hitting the cap and
        // returning an empty text block (stop_reason=max_tokens). Kept in sync
        // with the client-scoped copilot route.
        max_tokens: 4096,
        system: buildGeneralCopilotSystemPrompt(rosterContext),
        messages: [...history, { role: 'user', content: message }],
      })
      const block = resp.content.find(b => b.type === 'text')
      answer = block && block.type === 'text' ? block.text.trim() : ''
      if (answer) break
      lastErr = `empty response (stop_reason=${resp.stop_reason})`
      console.warn(`[copilot-general] attempt ${attempt}/3: ${lastErr}`)
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
      console.error(`[copilot-general] attempt ${attempt}/3 API error:`, lastErr)
    }
  }
  if (!answer) {
    return NextResponse.json({ error: `The co-pilot couldn't respond after 3 tries (${lastErr}). Please try again.` }, { status: 502 })
  }

  // Suggested follow-ups — a fast, cheap second pass. Non-blocking.
  let followups: string[] = []
  try {
    const fu = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: 'You suggest what a COACH might ask next in a Body Recode doctrine conversation (no specific client loaded). Given the last question and answer, propose exactly 3 short follow-up questions the coach could tap next. Each 9 words or fewer, specific to what was just discussed, no numbering, no quotes. Return ONLY JSON: {"followups":["...","...","..."]}',
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

  return NextResponse.json({ assistant: { content: answer, followups } })
}
