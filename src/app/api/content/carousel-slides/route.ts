import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

// POST /api/content/carousel-slides
// Body: { content_text: string }
// Uses Claude to break content into 5-7 carousel slides
// Returns: { slides: { slide: number, text: string, style: string }[] }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { content_text } = await request.json()
  if (!content_text?.trim()) return NextResponse.json({ error: 'content_text required' }, { status: 400 })

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  const prompt = `You are a content strategist for Body Recode, an evidence-based performance coaching brand.

Take this piece of content and break it into a 5-7 slide Instagram carousel. Each slide should be short, punchy, and build on the previous one.

Content:
${content_text}

Rules:
- Slide 1: The hook — attention-grabbing opening, max 12 words
- Slides 2-5: One clear point per slide, max 20 words each. Build the argument or story progressively.
- Final slide: The CTA — direct, single action, max 10 words
- No emojis
- No long dashes
- Body Recode tone: calm, intelligent, direct

Return ONLY a JSON array in this exact format, nothing else:
[
  { "slide": 1, "text": "...", "style": "statement" },
  { "slide": 2, "text": "...", "style": "quote" },
  ...
]

Style options: "quote", "statement", "question"
- Use "statement" for bold assertions and the CTA
- Use "quote" for explanations and story points
- Use "question" for any slide that poses a question`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (response.content[0] as { type: string; text: string }).text.trim()

  // Parse JSON — strip any markdown code fences if present
  const jsonStr = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  const slides = JSON.parse(jsonStr)

  return NextResponse.json({ slides })
}
