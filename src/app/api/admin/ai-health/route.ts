import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

/**
 * GET /api/admin/ai-health  (Bearer CRON_SECRET)
 *
 * Smoke-tests the live ANTHROPIC_API_KEY with the cheapest possible call.
 *
 * Exists because the production key sat revoked for an unknown stretch and
 * nothing noticed (found 2026-07-28). Most AI paths in this app degrade to a
 * fallback template or a null return rather than throwing, so a dead key looks
 * like "the copy is a bit generic today" instead of an outage. There was no way
 * to answer "is the key actually working right now" without reading the value.
 *
 * Also reports whether the stored value has surrounding whitespace — the second
 * half of that same incident was a correct key saved into Vercel with a
 * trailing newline, which the API rejects exactly like a revoked key does.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const raw = process.env.ANTHROPIC_API_KEY
  if (!raw) {
    return NextResponse.json({ ok: false, reason: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  const trimmed = raw.trim()
  const untrimmed = raw !== trimmed

  try {
    const anthropic = new Anthropic({ apiKey: trimmed, maxRetries: 0 })
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8,
      messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
    })
    const text = res.content.find(b => b.type === 'text')
    return NextResponse.json({
      ok: true,
      model: res.model,
      reply: text && text.type === 'text' ? text.text.trim() : null,
      key_length: trimmed.length,
      key_had_surrounding_whitespace: untrimmed,
    })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        reason: e instanceof Error ? e.message : String(e),
        key_length: trimmed.length,
        key_had_surrounding_whitespace: untrimmed,
      },
      { status: 500 },
    )
  }
}
