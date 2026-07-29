// Member-side "A Question for Kade" deep-dive generator.
//
// Reads Membership-tier data (NOT coaching-client Performance Coaching tables)
// so the product serves all Members in Funnel B, not just the small overlap
// with coaching clients.
//
// Inputs per call:
//   - the member's enrolment row (pattern, current block/week)
//   - their last 4 weekly check-in markers
//   - their free-text question (captured pre-purchase via Stripe metadata)
//
// Output:
//   - 4 sections of personalised prose: What you're actually asking / What
//     the data says about your situation / Body Recode reading / What to do
//     this week
//   - In Kade's declarative-functional voice. No em dashes. No motivational
//     padding. Reads like a written response from him.

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractFirstJsonObject } from '@/lib/extract-json'

export type MemberQuestionSections = {
  mq_what_youre_asking: string
  mq_what_the_data_says: string
  mq_body_recode_reading: string
  mq_this_week: string
}

export type MemberQuestionResult = {
  sections: MemberQuestionSections
  memberName: string
  patternLabel: string
  blockLabel: string
  weekNumber: number
  question: string
  checkInsRead: number
}

export class MemberQuestionGenerationError extends Error {
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

const PATTERN_DRIVERS: Record<string, string> = {
  'stress-stored': 'Cortisol is the driver. The body holds composition because the regulatory load is elevated. The intervention is to drop the cortisol curve, not to push training harder. Magnesium, caffeine cutoff at noon, evening anchor meal, breathing protocols, sleep priority over volume.',
  'metabolic-drift': 'Insulin sensitivity is the constraint. Carb cycling, protein at every meal, the post-meal walk, fasted training in the right phase. The body recomposes when insulin signalling restores, not when calories drop further.',
  'hormonal-shift': 'Sex hormone synthesis depends on dietary fat. Restriction makes this pattern worse. Cycle-aware eating, generous fat (especially saturated and monounsaturated), training the follicular peak hard and respecting luteal recovery. Magnesium, omega-3, zinc.',
  'system-overload': 'Testosterone signalling has dropped at the receptor level. Sleep, resistance training over conditioning, adequate protein and fat, zinc and Vitamin D, removing chronic volume and alcohol. Recovery is the input, not the output.',
}

const BODY_RECODE_VOICE_PROMPT = `You are Kade Dunstone responding to a Body Recode member's question. You wrote the Body Recode methodology. Your voice is declarative, functional, and grounded in mechanism. You do not motivate. You do not soften. You explain what is happening in the body and what to do.

Voice rules:
- No em dashes. Use commas, full stops, or restructure.
- No motivational phrases ("you've got this", "trust the process", "small wins compound", etc).
- Plain functional language. "The cortisol curve is elevated" not "Your stress hormones are sky-high".
- Direct second person. "You" not "the body".
- Concrete prescriptions when prescribing. Not "consider your sleep". "Cut caffeine after midday for the next two weeks."
- Mechanism first, instruction second. "Magnesium supports cortisol clearance, take 300mg before bed" not "take magnesium for stress".
- Do not name supplements outside the ones already in the Body Recode protocols for that pattern (see pattern driver).
- Do not invent metrics or numbers from the check-in data; quote what is provided.

Body Recode language anchors:
- "Body state": Depleted / Transitioning / Ready. The state describes regulatory capacity, not body composition.
- "Pattern": one of four (Stress-Stored, Insulin-Drift, Estrogen-Shift, Androgen-Decline). The pattern describes the dominant constraint.
- "Block": a 6-week training and nutrition arc. Three blocks make a 24-week cycle. A → B → C.
- "Phase": four phases inside a block: Reset (weeks 1-2), Build (weeks 3-4), Load (week 5), Deload (week 6).
- "Signal": what the weekly check-in markers tell us about regulatory state. Direction held across weeks is the signal. A single week is never the verdict.
- Body Recode is not a fat-loss programme. It is a recoding of the regulatory inputs that produced the current state. Composition follows.

Output exactly this JSON shape, no markdown, no preamble:
{
  "mq_what_youre_asking": "...",
  "mq_what_the_data_says": "...",
  "mq_body_recode_reading": "...",
  "mq_this_week": "..."
}

Section guidance:
- mq_what_youre_asking (60-120 words): Reframe the member's question in Body Recode terms. Strip the loaded vocabulary (e.g. "stubborn fat", "willpower", "metabolism is broken") and restate what they are actually observing in their body. If the question is unclear, name what the question seems to be asking underneath.
- mq_what_the_data_says (80-160 words): Read their check-in markers directly. Name the trends. Direction held across weeks is signal; a single bad week is not. Quote specific marker movements ("training recovery moved from 2 to 4 across the last three weeks"). Tie the data to the pattern.
- mq_body_recode_reading (120-220 words): The Body Recode interpretation. What is actually happening in their body, in mechanism terms, given their pattern and the data. This is the heart of the response.
- mq_this_week (80-140 words): Concrete prescription for THIS week. Three or fewer actions. Specific. Includes WHY each one matters in mechanism terms. Aligned with their current phase (e.g. don't prescribe high intensity in a Deload week).

Total target: 350-600 words. Quality over length.`

export async function generateMemberQuestion(args: {
  enrolmentId: string
  question: string
}): Promise<MemberQuestionResult> {
  const admin = createAdminClient()

  if (!args.question || args.question.trim().length < 8) {
    throw new MemberQuestionGenerationError('Question is too short to respond to')
  }
  const question = args.question.trim().slice(0, 1200)

  const { data: enrolment } = await admin
    .from('membership_enrollments')
    .select('id, first_name, email, pattern, current_block, current_week')
    .eq('id', args.enrolmentId)
    .maybeSingle()
  if (!enrolment) throw new MemberQuestionGenerationError('Member enrolment not found', 404)

  const patternKey = (enrolment.pattern ?? 'stress-stored').toLowerCase()
  const patternLabel = PATTERN_LABELS[patternKey] ?? 'Stress-Stored'
  const patternDriver = PATTERN_DRIVERS[patternKey] ?? PATTERN_DRIVERS['stress-stored']
  const blockLabel = enrolment.current_block ?? 'A'
  const weekNumber: number = enrolment.current_week ?? 1
  const phase = weekNumber <= 2 ? 'Reset' : weekNumber <= 4 ? 'Build' : weekNumber === 5 ? 'Load' : 'Deload'

  // Last 4 weeks of check-ins for trend visibility.
  const { data: checkins } = await admin
    .from('membership_checkins')
    .select('week_number, energy_levels, morning_energy, sleep_quality, afternoon_crash, hunger_cravings, training_recovery, mood_stability, physical_changes, notes, submitted_at')
    .eq('enrollment_id', args.enrolmentId)
    .order('week_number', { ascending: false })
    .limit(4)

  const checkinsBlock = (checkins ?? []).length
    ? (checkins ?? []).reverse().map(c => (
        `Week ${c.week_number}: Energy ${c.energy_levels}/5, Morning ${c.morning_energy}/5, Sleep ${c.sleep_quality}/5, Afternoon Crash ${c.afternoon_crash}/5 (5=no crash), Hunger ${c.hunger_cravings}/5 (5=stable), Training Recovery ${c.training_recovery}/5, Mood ${c.mood_stability}/5, Physical Changes ${c.physical_changes}/5${c.notes ? `. Note: "${c.notes}"` : ''}`
      )).join('\n')
    : '(No weekly check-ins submitted yet - reason about the question from the pattern alone, and gently note that the response will sharpen once a few weeks of check-in data are in.)'

  const userPrompt = `You are responding to a Body Recode member's question.

Member: ${enrolment.first_name ?? 'there'}
Pattern: ${patternLabel}
Pattern driver in the Body Recode protocol: ${patternDriver}
Current position: Block ${blockLabel}, Week ${weekNumber}, Phase ${phase}

Their last ${checkins?.length ?? 0} weekly check-ins (markers are 1-5, higher is generally better except where noted):
${checkinsBlock}

Their question, in their own words:
"""
${question}
"""

Respond in the JSON shape specified in your instructions. No markdown, no preamble.`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4500,
    system: BODY_RECODE_VOICE_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
  if (content.type !== 'text') {
    throw new MemberQuestionGenerationError('Unexpected response from AI', 500)
  }
  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    throw new MemberQuestionGenerationError(`Could not parse response: ${content.text.slice(0, 120)}`, 500)
  }
  let parsed: Partial<MemberQuestionSections>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new MemberQuestionGenerationError(`JSON parse failed: ${jsonText.slice(0, 120)}`, 500)
  }

  const required: (keyof MemberQuestionSections)[] = [
    'mq_what_youre_asking',
    'mq_what_the_data_says',
    'mq_body_recode_reading',
    'mq_this_week',
  ]
  for (const key of required) {
    if (!parsed[key] || typeof parsed[key] !== 'string') {
      throw new MemberQuestionGenerationError(`Missing or invalid section: ${key}`, 500)
    }
  }

  // Final em-dash strip (defense in depth).
  const cleaned: MemberQuestionSections = {
    mq_what_youre_asking: parsed.mq_what_youre_asking!.replace(/—/g, ', '),
    mq_what_the_data_says: parsed.mq_what_the_data_says!.replace(/—/g, ', '),
    mq_body_recode_reading: parsed.mq_body_recode_reading!.replace(/—/g, ', '),
    mq_this_week: parsed.mq_this_week!.replace(/—/g, ', '),
  }

  return {
    sections: cleaned,
    memberName: enrolment.first_name ?? 'there',
    patternLabel,
    blockLabel,
    weekNumber,
    question,
    checkInsRead: checkins?.length ?? 0,
  }
}
