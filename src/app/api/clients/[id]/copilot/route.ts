import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { buildCopilotContext } from '@/lib/copilot-context'
import { buildCopilotSystemPrompt } from '@/lib/copilot-prompt'

export const maxDuration = 120

// Cap how much prior conversation we replay, to bound tokens + latency.
const HISTORY_LIMIT = 24

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

  let answer = ''
  try {
    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1600,
      system: buildCopilotSystemPrompt(ctx.clientName, ctx.context),
      messages: [...history, { role: 'user', content: message }],
    })
    const block = resp.content.find(b => b.type === 'text')
    answer = block && block.type === 'text' ? block.text.trim() : ''
    if (!answer) {
      return NextResponse.json({ error: 'The co-pilot returned an empty response. Please try again.' }, { status: 502 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[copilot] AI error:', msg)
    return NextResponse.json({ error: `Co-pilot error: ${msg}` }, { status: 502 })
  }

  // Persist the exchange (user then assistant). Best-effort ids returned so the
  // UI can wire the thumbs-down flag to the assistant message.
  const nowUser = new Date().toISOString()
  const { data: inserted, error: insErr } = await admin
    .from('copilot_messages')
    .insert([
      { client_id: clientId, coach_id: ctx.coachId, role: 'user', content: message, created_at: nowUser },
      { client_id: clientId, coach_id: ctx.coachId, role: 'assistant', content: answer, created_at: new Date(Date.parse(nowUser) + 1).toISOString() },
    ])
    .select('id, role, content, flagged, created_at')

  if (insErr) {
    console.error('[copilot] failed to store messages:', insErr.message)
    // The answer is still valuable; return it without persisted ids.
    return NextResponse.json({ assistant: { content: answer, id: null, flagged: false } })
  }

  const assistant = inserted?.find(m => m.role === 'assistant') ?? null
  return NextResponse.json({ assistant })
}
