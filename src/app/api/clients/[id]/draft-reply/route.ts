import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { buildCopilotContext } from '@/lib/copilot-context'
import { withTemporalContext } from '@/lib/temporal-context'
import {
  buildReplyDraftSystemPrompt,
  buildReplyDraftUserPrompt,
  type ReplyDraftMessage,
} from '@/lib/reply-draft-prompt'
import { AI_MODELS } from '@/lib/ai-models'

export const maxDuration = 120

/**
 * Draft a reply to a client, grounded in their own artefacts.
 *
 * Returns text only. It writes NOTHING to client_messages and sends NOTHING to
 * the client — the draft lands in the coach's reply box for him to edit,
 * approve or discard. The send path is unchanged (reply-message).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const admin = createAdminClient()

  const { data: messageRows } = await admin
    .from('client_messages')
    .select('sender, body, created_at, anchor_label')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
    .limit(40)

  const thread = (messageRows ?? []) as ReplyDraftMessage[]
  if (thread.length === 0) {
    return NextResponse.json({ error: 'No messages to reply to yet' }, { status: 400 })
  }
  if (!thread.some(m => m.sender === 'client')) {
    return NextResponse.json({ error: 'Nothing from the client to answer' }, { status: 400 })
  }

  const built = await buildCopilotContext(admin, clientId)
  if (!built) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // The anchor on the latest client message tells the model what they were
  // looking at when they asked, which is often the whole question.
  const latestClient = [...thread].reverse().find(m => m.sender === 'client')

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 })

  let text = ''
  try {
    const message = await anthropic.messages.create({
      model: AI_MODELS.operational,
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: withTemporalContext(buildReplyDraftSystemPrompt(built.clientName)),
      messages: [
        {
          role: 'user',
          content: buildReplyDraftUserPrompt({
            clientName: built.clientName,
            context: built.context,
            thread,
            anchorLabel: latestClient?.anchor_label ?? null,
          }),
        },
      ],
    })

    if (message.stop_reason === 'refusal') {
      return NextResponse.json(
        { error: 'The model declined to draft this one. Write it yourself.' },
        { status: 422 }
      )
    }

    text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
  } catch (e) {
    console.error('[draft-reply] generation failed:', e)
    return NextResponse.json({ error: 'Could not draft a reply. Try again.' }, { status: 502 })
  }

  if (!text) {
    return NextResponse.json({ error: 'Empty draft. Try again.' }, { status: 502 })
  }

  // The prompt's explicit bail-out when it cannot answer safely from context.
  if (text.startsWith('NEEDS_COACH:')) {
    return NextResponse.json({
      draft: null,
      needsCoach: text.replace('NEEDS_COACH:', '').trim(),
    })
  }

  return NextResponse.json({ draft: text, needsCoach: null })
}
