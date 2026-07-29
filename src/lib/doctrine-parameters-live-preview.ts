/**
 * Live-LLM preview add-on for Mode A+ doctrine parameters.
 *
 * Complements the deterministic preview (doctrine-parameters-preview.ts)
 * by running ONE real Anthropic call using the coach's current form
 * values as the tuning input. The coach sees an actual generated
 * check-in reply in their tuned voice - not just the system-prompt
 * fragment.
 *
 * Cost note: every click of the "Generate a real sample" button fires
 * one Haiku call (~1500 input tokens, ~500 output). Kade estimates
 * ~$0.001 per click - trivial for the coach-onboarding usecase.
 *
 * The stub check-in data is deliberately fixed (Sarah, Week 3) so the
 * only variable across previews is the tuning. Two clicks with the
 * same config produce comparable output; two clicks with different
 * tunings show the effect of the tuning cleanly.
 */

import Anthropic from '@anthropic-ai/sdk'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { applyTerminologyWith, findBannedIn } from '@/lib/doctrine-parameters'
import { findLeakedTerms } from '@/lib/banned-client-terms'
import type { PreviewInput } from '@/lib/doctrine-parameters-preview'

export type LivePreviewResult = {
  interpretation: string
  reframe: string
  next_focus: string
  meta: {
    modelId: string
    latencyMs: number
    inputTokens: number | null
    outputTokens: number | null
    partnerBannedHits: string[]
    platformBannedHits: string[]
    terminologySubsApplied: string[]
  }
}

const STUB_CHECKIN = {
  clientName: 'Sarah',
  weekNumber: 3,
  formType: 'B',
  answers: {
    trajectory: 'Better than last week. I felt like my body finally let me settle into the Wednesday practice instead of fighting it.',
    quote: 'The breath cues in Friday made the shorter session feel like enough.',
    obstacle: 'Tuesday deadlines meant I skipped the morning routine two days.',
    win: 'First time I actually noticed the sensation of nasal breath through mobility without you telling me to.',
  },
}

function buildStubSystemPrompt(params: PreviewInput): string {
  const tone = params.voiceTone?.trim()
  const banned = (params.bannedPhrases ?? []).filter((p) => p.trim().length > 0)
  const guidance = params.checkinCoachingGuidance?.trim()

  const tuningLines: string[] = []
  if (tone) tuningLines.push(`- Additional tone cue to apply throughout: ${tone}`)
  if (banned.length > 0) {
    tuningLines.push(`- Additional banned phrases (do NOT use, in addition to the platform-wide banned-terms list): ${banned.map((p) => `"${p}"`).join(', ')}`)
  }
  if (guidance) {
    tuningLines.push(`- Partner check-in coaching philosophy: ${guidance}`)
  }
  const tuningBlock =
    tuningLines.length === 0
      ? ''
      : `\nPARTNER TUNING (Mode A+ overlay - additive, does not replace platform voice discipline):\n${tuningLines.join('\n')}\n`

  return `You are a movement coach writing a weekly check-in reply to a student. Your voice is grounded, warm, present, non-clinical. Never use em dashes. Never use "downregulate" or platform-internal jargon.
${tuningBlock}
Return valid JSON with exactly three string fields:
- interpretation: 3-4 sentences on what you noticed in the student's answers
- reframe: 2-3 sentences on what to hold or reframe this week
- next_focus: 1-2 sentences on the one thing to focus on this week

No preface, no signoff, no markdown, no commentary outside the JSON object.`
}

function buildUserPrompt(): string {
  const s = STUB_CHECKIN
  return `Student: ${s.clientName} (Week ${s.weekNumber}, Form ${s.formType})

Check-in answers:
- Trajectory: ${s.answers.trajectory}
- Quote of the week: ${s.answers.quote}
- Obstacle: ${s.answers.obstacle}
- Win: ${s.answers.win}

Write the reply now, in valid JSON.`
}

export async function generateLivePreview(params: PreviewInput): Promise<LivePreviewResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
  const anthropic = new Anthropic({ apiKey, maxRetries: 2 })

  const modelId = 'claude-haiku-4-5-20251001'
  const t0 = Date.now()
  const message = await anthropic.messages.create({
    model: modelId,
    max_tokens: 900,
    system: buildStubSystemPrompt(params),
    messages: [{ role: 'user', content: buildUserPrompt() }],
  })
  const latencyMs = Date.now() - t0

  const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
  if (!content || content.type !== 'text') {
    throw new Error('Unexpected response shape from Anthropic')
  }
  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    throw new Error(`Could not parse response as JSON. First 200 chars: ${content.text.slice(0, 200)}`)
  }
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonText)
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`)
  }

  const REQUIRED = ['interpretation', 'reframe', 'next_focus'] as const
  for (const k of REQUIRED) {
    if (typeof parsed[k] !== 'string' || !(parsed[k] as string).trim()) {
      throw new Error(`Missing or empty required field: ${k}`)
    }
  }

  // Apply partner terminology substitutions to the output (mirrors what the
  // real generator does before display).
  const subs = params.terminologySubstitutions ?? {}
  const rewritten: Record<'interpretation' | 'reframe' | 'next_focus', string> = {
    interpretation: applyTerminologyWith(parsed.interpretation as string, subs),
    reframe: applyTerminologyWith(parsed.reframe as string, subs),
    next_focus: applyTerminologyWith(parsed.next_focus as string, subs),
  }

  // Report which subs actually matched
  const allText = [rewritten.interpretation, rewritten.reframe, rewritten.next_focus].join(' ')
  const subsApplied: string[] = []
  const originalText = [parsed.interpretation, parsed.reframe, parsed.next_focus].join(' ') as string
  for (const [from, to] of Object.entries(subs)) {
    if (!from.trim() || !to.trim()) continue
    if (originalText.toLowerCase().includes(from.toLowerCase())) {
      subsApplied.push(`"${from}" -> "${to}"`)
    }
  }

  // Check both platform + partner banned phrases against the rewritten output
  const partnerBanned = (params.bannedPhrases ?? []).filter((p) => p.trim().length > 0)
  const partnerBannedHits: string[] = []
  for (const phrase of partnerBanned) {
    const hit = findBannedIn(allText, [phrase])
    if (hit && !partnerBannedHits.includes(hit)) partnerBannedHits.push(hit)
  }
  const platformBannedHits = findLeakedTerms(allText)

  return {
    interpretation: rewritten.interpretation,
    reframe: rewritten.reframe,
    next_focus: rewritten.next_focus,
    meta: {
      modelId,
      latencyMs,
      inputTokens: message.usage?.input_tokens ?? null,
      outputTokens: message.usage?.output_tokens ?? null,
      partnerBannedHits,
      platformBannedHits,
      terminologySubsApplied: subsApplied,
    },
  }
}
