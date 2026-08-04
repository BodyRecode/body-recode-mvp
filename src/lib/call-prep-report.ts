/**
 * Call-prep report generator.
 *
 * Fires when a lead completes the /book/prep form after requesting a call.
 * Synthesises everything we know about them — the prep-form answers, plus
 * their scorecard result if they did one — into a concise one-page brief so
 * Kade walks into the call already informed.
 *
 * Where scorecard data exists we hand the AI the deterministic pre-call brief
 * (see pre-call-brief.ts) as authoritative grounding so the report never
 * contradicts the Body Recode read. Where it doesn't, the AI works from the
 * prep answers and basic stats alone.
 */

import Anthropic from '@anthropic-ai/sdk'
import { generatePreCallBrief, type LeadBriefInput } from './pre-call-brief'
import type { SectionScores, StateName } from './fat-map-profile'

export interface PrepAnswers {
  goal?: string | null
  frustration?: string | null
  tried?: string | null
  age?: string | null
  sex?: string | null
  height?: string | null
  weight?: string | null
  routine?: string | null
  other?: string | null
}

export interface CallPrepInput {
  name: string
  answers: PrepAnswers
  requestedTime?: string | null
  // Scorecard signals off the lead row (all optional — cold leads have none).
  scorecard_score?: number | null
  scorecard_body_state?: string | null
  scorecard_section_scores?: SectionScores | null
  approach_response?: 'A' | 'B' | 'C' | 'D' | null
  investment_readiness?: 'A' | 'B' | 'C' | 'D' | null
  lead_quality?: 'green' | 'yellow' | 'red' | null
  biological_sex?: string | null
  age_band?: string | null
  fat_storage?: string | null
  cycle_status?: string | null
}

const VALID_STATES: StateName[] = ['Depleted State', 'Transitioning State', 'Ready State']

/** Build the deterministic Body Recode brief if the lead has scorecard data. */
function deterministicBrief(input: CallPrepInput): string | null {
  if (
    !input.scorecard_body_state ||
    !VALID_STATES.includes(input.scorecard_body_state as StateName) ||
    !input.scorecard_section_scores ||
    input.scorecard_score == null
  ) {
    return null
  }
  const briefInput: LeadBriefInput = {
    name: input.name,
    scorecard_score: input.scorecard_score,
    scorecard_body_state: input.scorecard_body_state as StateName,
    scorecard_section_scores: input.scorecard_section_scores,
    approach_response: input.approach_response ?? null,
    investment_readiness: input.investment_readiness ?? null,
    lead_quality: input.lead_quality ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    biological_sex: (input.biological_sex ?? null) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    age_band: (input.age_band ?? null) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fat_storage: (input.fat_storage ?? null) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cycle_status: (input.cycle_status ?? null) as any,
  }
  try {
    return generatePreCallBrief(briefInput)
  } catch {
    return null
  }
}

function answersBlock(a: PrepAnswers): string {
  const rows: string[] = []
  const add = (label: string, v?: string | null) => {
    if (v && v.trim()) rows.push(`${label}: ${v.trim()}`)
  }
  add('#1 goal', a.goal)
  add('Biggest frustration', a.frustration)
  add('Already tried', a.tried)
  add('Age', a.age)
  add('Biological sex', a.sex)
  add('Height', a.height)
  add('Weight', a.weight)
  add('Normal week (training + eating)', a.routine)
  add('Anything else', a.other)
  return rows.length ? rows.join('\n') : '(No prep answers provided.)'
}

const SYSTEM = `You are the pre-call analyst for Body Recode, a body-state coaching practice run by coach Kade Dunstone in Brisbane.

Body Recode reads the body as being in one of three states: Depleted (foundations of sleep/energy/stress on the floor, body in protection mode), Transitioning (compensating, one clear bottleneck dragging the rest down), or Ready (foundation intact, the block is prescription not biology). Fat storage patterns map to four drivers, and location alone does not separate them - three of the four push fat centrally, so the accompanying signal decides: Stress-Stored (front of stomach/waist, limbs staying lean), Insulin-Drift (mid-back, lower back, love handles plus deep abdominal, front spared; afternoon crash and evening cravings), Estrogen-Shift (hips/thighs first, then moving centrally as oestrogen falls), Androgen-Decline (not a location - central fat rising while muscle, tone and drive fall).

Your job: turn what we know about a lead who has booked a call into a tight, scannable one-page prep brief FOR KADE (not for the lead). He reads it in the two minutes before the call. Be concrete and specific to THIS person's answers. No filler, no restating the obvious back to him.

Rules:
- Write in plain text. Use short section headers in CAPS and simple bullet points with "- ".
- Hyphens, never em dashes.
- If a deterministic Body Recode brief is supplied, treat its body-state and pattern read as authoritative. Do not contradict it. Your value-add is integrating the lead's own words (goal, frustration, what they tried, stats) on top of it.
- If NO scorecard data is supplied, infer a LIKELY body state and fat-storage pattern from the stats and answers, and clearly mark it as a hypothesis to confirm on the call.
- Keep it to roughly 250-400 words. This is a prep brief, not an essay.

Produce exactly these sections:
SNAPSHOT — one or two lines: who they are, likely state/pattern (or confirmed if from scorecard), and how ready they seem to invest.
WHAT THEY WANT — their goal and the real frustration underneath it, in their language.
WHAT'S LIKELY GOING ON — the body-state read tied to their specific answers.
WHAT TO PROBE ON THE CALL — 3-4 sharp questions or things to watch for.
LIKELY OBJECTION + ANGLE — the objection this person is most likely to raise, and how to meet it.`

export async function generateCallPrepReport(input: CallPrepInput): Promise<string> {
  const brief = deterministicBrief(input)
  const scorecardLine = input.scorecard_body_state
    ? `Scorecard: ${input.scorecard_score}/15, ${input.scorecard_body_state}. Approach answer: ${input.approach_response ?? 'n/a'}. Investment readiness: ${input.investment_readiness ?? 'n/a'}. Lead quality: ${input.lead_quality ?? 'n/a'}.`
    : 'No scorecard on file for this lead — infer from the prep answers and stats below.'

  const userContent = [
    `LEAD: ${input.name}`,
    input.requestedTime ? `Requested call time: ${input.requestedTime}` : '',
    '',
    scorecardLine,
    '',
    'PREP-FORM ANSWERS:',
    answersBlock(input.answers),
    '',
    brief
      ? `AUTHORITATIVE BODY RECODE BRIEF (already generated from their scorecard — align to this, add the lead's own words on top):\n\n${brief}`
      : '',
    '',
    'Write the one-page prep brief for Kade now.',
  ]
    .filter(Boolean)
    .join('\n')

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: userContent }],
  })

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()

  return text || 'Report generation returned empty. See the raw prep answers below.'
}
