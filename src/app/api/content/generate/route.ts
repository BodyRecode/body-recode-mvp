import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { temporalContext } from '@/lib/temporal-context'

export const maxDuration = 300

// POST /api/content/generate
// Body: { hook_ids: string[], message_ids: string[], cta_ids: string[], platform: string, campaign_id?: string }
// Generates one content variant per hook × message × cta combination and stores in be_content_outputs
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { hook_ids, message_ids, cta_ids, platform, campaign_id } = await request.json()

  if (!hook_ids?.length || !message_ids?.length || !cta_ids?.length) {
    return NextResponse.json({ error: 'Select at least one hook, message, and CTA.' }, { status: 400 })
  }

  // Fetch selected components
  const [{ data: hooks }, { data: messages }, { data: ctas }] = await Promise.all([
    supabase.from('be_content_hooks').select('*').in('id', hook_ids).eq('coach_id', user.id),
    supabase.from('be_content_messages').select('*').in('id', message_ids).eq('coach_id', user.id),
    supabase.from('be_content_ctas').select('*').in('id', cta_ids).eq('coach_id', user.id),
  ])

  if (!hooks?.length || !messages?.length || !ctas?.length) {
    return NextResponse.json({ error: 'Could not load selected components.' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })
  const adminSupabase = createAdminClient()
  const outputs: { id: string; content_text: string; platform: string }[] = []

  const platformLabels: Record<string, string> = {
    meta: 'Meta ad copy (primary text, 125 chars max, punchy)',
    instagram: 'Instagram caption (conversational, 150-200 chars, hook in first line)',
    tiktok: 'TikTok video script (spoken word, 30-45 seconds, casual and direct)',
    email: 'Email snippet (subject line + 2-3 sentence opener)',
    landing_page: 'Landing page headline + subheadline pair',
  }
  const platformInstruction = platformLabels[platform] ?? 'short-form ad copy'

  for (const hook of hooks) {
    for (const message of messages) {
      for (const cta of ctas) {
        const prompt = `You are a performance marketing strategist for Body Recode, an evidence-based performance coaching brand.

Body Recode's positioning:
- Coaches people whose bodies are stuck — fat won't shift, energy is low, training isn't working
- The reason is always biological: stress, hormones, sleep, metabolism — not willpower
- Body Recode interprets the body first, then prescribes — not the other way around
- Tone: direct, intelligent, no hype, no long dashes, no exclamation marks, no bro-speak

Using these three content components:

HOOK: ${hook.hook_text}
MESSAGE: ${message.message_text}
CTA: ${cta.cta_text}

Generate ${platformInstruction}.

Rules:
- Open with the hook (word-for-word or very close)
- Weave in the message naturally
- End with the CTA
- No hype language
- No long dashes (—)
- Conversational and intelligent
- Body Recode voice: calm authority, not salesy

Return only the final copy. No labels, no explanation.`

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: temporalContext(),
          messages: [{ role: 'user', content: prompt }],
        })

        const content_text = (response.content[0] as { type: string; text: string }).text.trim()

        const { data: saved, error } = await adminSupabase
          .from('be_content_outputs')
          .insert({
            coach_id: user.id,
            hook_id: hook.id,
            message_id: message.id,
            cta_id: cta.id,
            campaign_id: campaign_id ?? null,
            platform,
            content_text,
            status: 'draft',
          })
          .select()
          .single()

        if (!error && saved) {
          outputs.push({ id: saved.id, content_text: saved.content_text, platform: saved.platform })
        }
      }
    }
  }

  return NextResponse.json({ generated: outputs.length, outputs })
}
