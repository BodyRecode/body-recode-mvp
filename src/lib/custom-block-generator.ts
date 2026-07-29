// "Your Custom Block" deep-dive generator.
//
// Member-tier engine. Buyer describes their constraints (travel, injury,
// time-limited, equipment, recovery situation) and the engine returns a
// 2-week adapted training block grounded in their pattern + body state.
//
// Differs from member_question:
//   - Output is structured around a 2-week schedule (Week 1 + Week 2)
//     not free-form prose around a single question.
//   - Voice still Kade-functional but more prescriptive.
//   - Cap on input the same (480 chars, Stripe metadata).
//
// Reads: membership_enrollments (pattern, current block/week) +
// last 4 weekly check-ins (to spot signal already moving) + the
// buyer's constraint text. Does NOT read coaching tables.

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { AI_MODELS } from './ai-models'

export type CustomBlockSessionLine = {
  title: string
  focus: string
  movements: string
  notes: string
}

export type CustomBlockSections = {
  cb_reading: string                            // 80-140 words: how their pattern + constraints interact
  cb_week_one_intent: string                    // 60-100 words: what week 1 is doing for them
  cb_week_one_sessions: CustomBlockSessionLine[] // 4-5 sessions
  cb_week_two_intent: string                    // 60-100 words: what evolves in week 2
  cb_week_two_sessions: CustomBlockSessionLine[] // 4-5 sessions
  cb_return_to_normal: string                   // 60-100 words: how to step back into standard programme
}

export type CustomBlockResult = {
  sections: CustomBlockSections
  memberName: string
  patternLabel: string
  blockLabel: string
  weekNumber: number
  constraints: string
  checkInsRead: number
}

export class CustomBlockGenerationError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

const PATTERN_LABELS: Record<string, string> = {
  'stress-stored': 'Stress-Stored',
  'metabolic-drift': 'Insulin-Drift',
  'hormonal-shift': 'Estrogen-Shift',
  'system-overload': 'Androgen-Decline',
}

const PATTERN_TRAINING_RULES: Record<string, string> = {
  'stress-stored': 'Training is regulatory load. High volume + high intensity stacks on top of an elevated cortisol curve and slows progress. The right adaptations come from FEWER demanding sessions executed well, NOT more. Resistance training 3-4x/week (full body or upper/lower split), 1 walk per day, 1 conditioning session capped at zone 2 if energy allows.',
  'metabolic-drift': 'Training is an insulin sensitiser. Compound resistance training 3-4x/week + a daily post-meal walk + 1-2 conditioning sessions (intervals or hill walks). The post-meal walk is non-negotiable - it does more for insulin signalling than any single training session.',
  'hormonal-shift': 'Training is cycle-aware. Follicular phase (week 1-2 of cycle): train hard, push intensity, expect peak capacity. Luteal phase (week 3-4): drop intensity 15-20%, hold volume, expect lower energy. Train 3-4x/week resistance + 2 walks/day. If the constraint window crosses a phase change, plan for it.',
  'system-overload': 'Training is the input, recovery is the output. Resistance training 3x/week (full body or 2-on-1-off upper/lower split), heavy enough to drive androgen signalling, short enough to not crash recovery. Conditioning capped at 1 zone 2 session/week. Walking unlimited. NO chronic high-intensity intervals during this pattern.',
}

const CUSTOM_BLOCK_SYSTEM_PROMPT = `You are Kade Dunstone designing a 2-week custom training block for a Body Recode member dealing with a temporary constraint (travel, injury, time-limited, low equipment, recovery week needed).

Voice rules:
- No em dashes. Use commas, full stops, or restructure.
- No motivational padding ("you've got this", "trust the process", etc).
- Direct second person. Plain functional language.
- Mechanism first, prescription second. "Sleep is the input, train shorter and walk more" not "rest more".
- Specific. "30-minute upper-body session, push-pull pairing, 4 working sets each" not "an upper body session".
- Do not invent equipment they did not list. If they did not list a gym, design around bodyweight + bands + dumbbells.
- Respect their pattern's training rules (provided in user prompt).
- Respect their current phase. If they are in a Deload week, the block should hold deload load. If they are in Build, hold build intensity. If they did not say what they want, default to Reset-level intensity (lower than current phase) to manage the constraint without overshooting.

Block-design rules:
- 2 weeks. Each week has 4-5 sessions. Sessions can be 20-60 minutes.
- Week 1 is for adaptation to the constraint. Lower intensity, learn the new routine.
- Week 2 progresses if signal is good - add load, add a session, or lengthen sessions.
- Each session has: title (e.g. "Upper Body Strength A"), focus (one sentence), movements (concise comma-separated list with sets x reps), notes (one sentence on cue/intent).
- Include rest days explicitly - either as "Rest" sessions or by listing only 4 sessions and naming the rest days.

Output exactly this JSON shape, no markdown, no preamble:
{
  "cb_reading": "...",
  "cb_week_one_intent": "...",
  "cb_week_one_sessions": [
    {"title": "...", "focus": "...", "movements": "...", "notes": "..."},
    ...
  ],
  "cb_week_two_intent": "...",
  "cb_week_two_sessions": [
    {"title": "...", "focus": "...", "movements": "...", "notes": "..."},
    ...
  ],
  "cb_return_to_normal": "..."
}

Section guidance:
- cb_reading (80-140 words): How their pattern + constraints interact. What the constraint actually means for their body in mechanism terms (e.g. travel disrupts cortisol-melatonin rhythm; injury means downregulation around the joint; less time means cutting cardio first because resistance is the bigger lever).
- cb_week_one_intent (60-100 words): What week 1 is doing for their body. Concrete intent.
- cb_week_one_sessions: 4-5 sessions. See block-design rules.
- cb_week_two_intent (60-100 words): What evolves in week 2. Either intensify, lengthen, add a session, OR explicitly hold position if signal is unclear.
- cb_week_two_sessions: 4-5 sessions.
- cb_return_to_normal (60-100 words): Specific re-entry to their normal programme. Which session to do first. Whether to deload the first week back. How to interpret if energy is still off.

Total target: 600-900 words across all prose + structured session lists.`

export async function generateCustomBlock(args: {
  enrolmentId: string
  constraints: string
}): Promise<CustomBlockResult> {
  const admin = createAdminClient()

  if (!args.constraints || args.constraints.trim().length < 12) {
    throw new CustomBlockGenerationError('Constraints text is too short')
  }
  const constraints = args.constraints.trim().slice(0, 1200)

  const { data: enrolment } = await admin
    .from('membership_enrollments')
    .select('id, first_name, email, pattern, current_block, current_week')
    .eq('id', args.enrolmentId)
    .maybeSingle()
  if (!enrolment) throw new CustomBlockGenerationError('Member enrolment not found', 404)

  const patternKey = (enrolment.pattern ?? 'stress-stored').toLowerCase()
  const patternLabel = PATTERN_LABELS[patternKey] ?? 'Stress-Stored'
  const patternRules = PATTERN_TRAINING_RULES[patternKey] ?? PATTERN_TRAINING_RULES['stress-stored']
  const blockLabel = enrolment.current_block ?? 'A'
  const weekNumber: number = enrolment.current_week ?? 1
  const phase = weekNumber <= 2 ? 'Reset' : weekNumber <= 4 ? 'Build' : weekNumber === 5 ? 'Load' : 'Deload'

  const { data: checkins } = await admin
    .from('membership_checkins')
    .select('week_number, energy_levels, sleep_quality, training_recovery, mood_stability, physical_changes, notes')
    .eq('enrollment_id', args.enrolmentId)
    .order('week_number', { ascending: false })
    .limit(4)

  const checkinsBlock = (checkins ?? []).length
    ? (checkins ?? []).reverse().map(c =>
        `Week ${c.week_number}: Energy ${c.energy_levels}/5, Sleep ${c.sleep_quality}/5, Training Recovery ${c.training_recovery}/5, Mood ${c.mood_stability}/5, Physical Changes ${c.physical_changes}/5${c.notes ? `. Note: "${c.notes}"` : ''}`
      ).join('\n')
    : '(No weekly check-ins submitted yet - design conservatively from the pattern + phase.)'

  const userPrompt = `You are designing a 2-week custom block for a Body Recode member.

Member: ${enrolment.first_name ?? 'there'}
Pattern: ${patternLabel}
Training rules for this pattern (do not violate these): ${patternRules}
Current position in normal programme: Block ${blockLabel}, Week ${weekNumber}, Phase ${phase}

Last ${checkins?.length ?? 0} weekly check-ins (1-5 scale, higher is better):
${checkinsBlock}

Their constraint description, in their own words:
"""
${constraints}
"""

Return the JSON shape specified in your instructions. No markdown, no preamble.`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  const message = await anthropic.messages.create({
    model: AI_MODELS.structural,
    max_tokens: 6000,
    system: CUSTOM_BLOCK_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
  if (content.type !== 'text') {
    throw new CustomBlockGenerationError('Unexpected response from AI', 500)
  }
  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    throw new CustomBlockGenerationError(`Could not parse response: ${content.text.slice(0, 120)}`, 500)
  }
  let parsed: Partial<CustomBlockSections>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new CustomBlockGenerationError(`JSON parse failed: ${jsonText.slice(0, 120)}`, 500)
  }

  // Validation
  const requiredStrings: (keyof CustomBlockSections)[] = ['cb_reading', 'cb_week_one_intent', 'cb_week_two_intent', 'cb_return_to_normal']
  for (const key of requiredStrings) {
    if (!parsed[key] || typeof parsed[key] !== 'string') {
      throw new CustomBlockGenerationError(`Missing or invalid section: ${key}`, 500)
    }
  }
  if (!Array.isArray(parsed.cb_week_one_sessions) || parsed.cb_week_one_sessions.length < 3) {
    throw new CustomBlockGenerationError('cb_week_one_sessions must have at least 3 entries', 500)
  }
  if (!Array.isArray(parsed.cb_week_two_sessions) || parsed.cb_week_two_sessions.length < 3) {
    throw new CustomBlockGenerationError('cb_week_two_sessions must have at least 3 entries', 500)
  }

  // Defense-in-depth em-dash strip across all string fields.
  const stripEm = (s: string) => s.replace(/—/g, ', ')
  const stripSessions = (sessions: CustomBlockSessionLine[]) =>
    sessions.map(s => ({
      title: stripEm(s.title ?? ''),
      focus: stripEm(s.focus ?? ''),
      movements: stripEm(s.movements ?? ''),
      notes: stripEm(s.notes ?? ''),
    }))

  const cleaned: CustomBlockSections = {
    cb_reading: stripEm(parsed.cb_reading!),
    cb_week_one_intent: stripEm(parsed.cb_week_one_intent!),
    cb_week_one_sessions: stripSessions(parsed.cb_week_one_sessions),
    cb_week_two_intent: stripEm(parsed.cb_week_two_intent!),
    cb_week_two_sessions: stripSessions(parsed.cb_week_two_sessions),
    cb_return_to_normal: stripEm(parsed.cb_return_to_normal!),
  }

  return {
    sections: cleaned,
    memberName: enrolment.first_name ?? 'there',
    patternLabel,
    blockLabel,
    weekNumber,
    constraints,
    checkInsRead: checkins?.length ?? 0,
  }
}
