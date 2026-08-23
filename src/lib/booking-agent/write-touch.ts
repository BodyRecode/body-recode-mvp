/**
 * Booking Agent — per-lead touch writer.
 *
 * Writes the copy for one outreach touch in Kade's email voice, grounded in
 * the lead's scorecard read (the deterministic pre-call brief already stored
 * on the lead is handed in as authoritative context, exactly like
 * call-prep-report.ts does). Returns structured pieces so the assembler can
 * wrap them in the branded shell — the model never emits HTML.
 *
 * Model: Haiku (fast, cheap — this runs per lead per touch). Falls back to a
 * safe templated copy if the model errors or returns unparseable output, so a
 * draft always lands in the approval queue.
 */

import Anthropic from '@anthropic-ai/sdk'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { coach } from '@/config/tenant'
import type { TouchDef } from './sequence'

export interface TouchLeadContext {
  firstName: string
  bodyState?: string | null
  score?: number | null
  fatStorage?: string | null
  leadQuality?: string | null
  /** The deterministic Body Recode pre-call brief, if the lead has one. */
  preCallBrief?: string | null
}

export interface WrittenTouch {
  /** Email subject line. */
  subject: string
  /** Hidden preview/preheader text. */
  previewText: string
  /** Body paragraphs, no greeting and no sign-off (the assembler adds those). */
  paragraphs: string[]
  /** CTA button label (defaults to the touch's ctaLabel if the model omits it). */
  ctaLabel: string
  /** True when this came from the fallback template, not the model. */
  fallback?: boolean
}

const SYSTEM = `You are the outreach writer for Body Recode, a body-state coaching practice run by coach Kade Dunstone in Brisbane. You write short follow-up emails to a lead who completed the Readiness Scorecard but has not yet booked a free strategy call. Your only goal for every email is to move them toward booking that call.

Body Recode reads the body as being in one of three states: Depleted (foundations of sleep/energy/stress on the floor, body in protection mode), Transitioning (compensating, one clear bottleneck dragging the rest), or Ready (foundation intact, the block is prescription not biology). Fat-storage patterns map to four drivers, and location alone does not separate them - three of the four push fat centrally, so the accompanying signal decides: Stress-Stored (front of stomach/waist, limbs staying lean), Insulin-Drift (mid-back, lower back, love handles; afternoon crash and evening cravings), Estrogen-Shift (hips/thighs first, then moving centrally), Androgen-Decline (not a location - central fat rising while muscle, tone and drive fall).

VOICE (match this exactly — it is Kade's):
- Write as Kade, first person, talking to one real person. Warm, grounded, direct. Never salesy or hyped.
- Use contractions. Vary sentence rhythm. Read like a person typed it, not a template.
- The core reframe: when effort stops giving results, that is physiological, not a discipline or willpower failure — and it's readable. That reframe should breathe through the copy without being repeated verbatim every time.
- Be specific to THIS person's state and pattern. No generic "hope you're well" filler.
- The call is a free 30-minute Zoom. No pitch on the call. Say that plainly when relevant; don't oversell it.
- Australian English spelling.

HARD RULES:
- NEVER use em dashes. Use a hyphen with spaces, a comma, or a full stop instead.
- No greeting line (no "Hi Sarah,") and no sign-off (no "Talk soon, Kade"). Those are added around your paragraphs automatically.
- Do not invent facts about the person beyond what the brief and state/pattern support.
- Do not mention prices, other products, or the scorecard SCORE number. Keep it about them and the call.
- 2 to 4 short paragraphs. This is a follow-up email, not an essay.

Return ONLY a JSON object, no prose around it:
{
  "subject": "short, lowercase-ish, personal — not a marketing subject line",
  "previewText": "one line of preheader text, under 90 characters",
  "paragraphs": ["para 1", "para 2", "para 3"],
  "ctaLabel": "button label, 2-5 words"
}`

/**
 * Enforce the house rule (no em dashes, ever) deterministically, so a model
 * slip never reaches a lead. Em/en dashes become spaced hyphens; ellipsis
 * characters become three dots. See feedback: no em dashes.
 */
function sanitiseCopy(s: string): string {
  return s
    .replace(/\s*[—–]\s*/g, ' - ')
    .replace(/…/g, '...')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function fallbackTouch(lead: TouchLeadContext, touch: TouchDef): WrittenTouch {
  const state = lead.bodyState ? lead.bodyState.replace(' State', '') : 'current'
  return {
    subject: `${lead.firstName}, let's talk through your result`,
    previewText: "A free 30-minute call to map out what to do first.",
    paragraphs: [
      `I've been looking back over your Readiness Scorecard. The read points to a ${state.toLowerCase()} pattern, and the short version is this: if effort hasn't been giving you anything back, that's physiological, not a willpower problem. It's readable, and it's fixable.`,
      `The clearest next step is a free 30-minute call. We go through exactly what your result means for you, find the specific reason your body has stalled, and map out what to do first. No pitch.`,
      `Tap below to grab a time and I'll take it from there.`,
    ],
    ctaLabel: touch.ctaLabel,
    fallback: true,
  }
}

export async function writeTouch(
  lead: TouchLeadContext,
  touch: TouchDef,
  opts?: { slots?: string[] },
): Promise<WrittenTouch> {
  if (!process.env.ANTHROPIC_API_KEY) return fallbackTouch(lead, touch)

  const slotLine =
    touch.offerSlots && opts?.slots && opts.slots.length > 0
      ? `Open times being offered (these render in a card below your copy, so refer to them generally, do not list them out): ${opts.slots.join('; ')}.`
      : ''

  const userContent = [
    `LEAD FIRST NAME: ${lead.firstName}`,
    lead.bodyState ? `Body state: ${lead.bodyState}` : '',
    lead.fatStorage ? `Fat-storage pattern: ${lead.fatStorage}` : '',
    lead.leadQuality ? `Lead quality: ${lead.leadQuality}` : '',
    '',
    lead.preCallBrief
      ? `AUTHORITATIVE BODY RECODE READ (from their scorecard — align to this, do not contradict it):\n\n${lead.preCallBrief}`
      : 'No detailed brief on file — work from the body state and pattern above, and keep claims general.',
    '',
    `THIS EMAIL'S JOB: ${touch.intent}`,
    slotLine,
    '',
    'Write the email now. Return only the JSON object.',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()

    const json = extractFirstJsonObject(text)
    if (!json) return fallbackTouch(lead, touch)

    const parsed = JSON.parse(json) as Partial<WrittenTouch>
    const paragraphs = Array.isArray(parsed.paragraphs)
      ? parsed.paragraphs.filter(p => typeof p === 'string' && p.trim()).map(p => p.trim())
      : []

    if (!parsed.subject || paragraphs.length === 0) return fallbackTouch(lead, touch)

    return {
      subject: sanitiseCopy(String(parsed.subject)),
      previewText: sanitiseCopy(String(parsed.previewText ?? '')) || 'A free 30-minute call, no pitch.',
      paragraphs: paragraphs.map(sanitiseCopy),
      ctaLabel: sanitiseCopy(String(parsed.ctaLabel ?? '')) || touch.ctaLabel,
    }
  } catch (e) {
    console.error(`[booking-agent] writeTouch failed for ${touch.key} (${coach().firstName} voice), using fallback:`, e)
    return fallbackTouch(lead, touch)
  }
}
