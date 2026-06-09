// Weekly Pattern Report - recurring (4-week) deep-dive generator.
//
// A 1-page personalised reading delivered weekly to a Member who subscribed.
// Reads their most recent weekly check-in + pattern + a 4-week trend and
// writes a short, prescriptive observation about what their signal is doing.
//
// Differs from member_question + member_custom_block:
//   - No pre-purchase input; the engine just reads their state
//   - Concise output (250-450 words) for a fast Friday afternoon read
//   - "Week N of 4" framing in the meta line (this is the Nth delivery in the
//     month-long pack)
//
// Reads: membership_enrollments + last 4 weekly check-ins.

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractFirstJsonObject } from '@/lib/extract-json'

export type WeeklyPatternSections = {
  wpr_this_week: string         // 80-140 words: read the most recent check-in
  wpr_trend: string             // 60-100 words: 4-week trend, direction held
  wpr_one_focus: string         // 50-90 words: ONE thing to hold this week
}

export type WeeklyPatternResult = {
  sections: WeeklyPatternSections
  memberName: string
  patternLabel: string
  blockLabel: string
  weekNumber: number
  deliveryNumber: number
  checkInsRead: number
  latestCheckinWeek: number | null
}

export class WeeklyPatternGenerationError extends Error {
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

const PATTERN_FOCUS_RULES: Record<string, string> = {
  'stress-stored': 'Cortisol is the constraint. Reading the system means watching sleep quality first, then training recovery, then mood stability. Hunger swings late in the day are a cortisol signal not a willpower signal. The interventions live in the evening anchor meal, the caffeine cutoff, and the magnesium-before-sleep ritual.',
  'metabolic-drift': 'Insulin sensitivity is the constraint. The marker to read first is afternoon crash + hunger/cravings. Walking after meals is doing more than they realise. The interventions live in carb cycling and meal timing, not in total calories.',
  'hormonal-shift': 'Cycle phase is the lens. Reading the same marker in week 1 vs week 3 of cycle gives opposite verdicts. Fat intake is the input; reduce fat and this pattern degrades. The interventions live in cycle-aware training intensity and fat-quality at every meal.',
  'system-overload': 'Recovery is the input. Sleep + training recovery are the primary markers. Conditioning beyond zone 2 suppresses the very system being rebuilt. The interventions live in protecting sleep, training shorter and heavier, and removing chronic intervals.',
}

const WEEKLY_PATTERN_SYSTEM_PROMPT = `You are Kade Dunstone writing a brief weekly read for a Body Recode member who subscribes to the Weekly Pattern Report. The format is intentionally short - they should be able to read it in 90 seconds on a Friday afternoon and walk into the weekend oriented.

Voice rules:
- No em dashes. Use commas, full stops, or restructure.
- No motivational padding ("great work", "you've got this", "trust the process", etc).
- No greeting at the start. Open with the observation.
- Plain functional language. Mechanism first, instruction second.
- Specific. Quote which marker moved which direction.
- Concise. This is the slimmest of the deep-dives. 250-450 words total across all three sections.
- Do not invent supplements outside the ones already in the Body Recode protocols for that pattern.

Three sections (output exactly this JSON, no markdown, no preamble):
{
  "wpr_this_week": "...",
  "wpr_trend": "...",
  "wpr_one_focus": "..."
}

Section guidance:
- wpr_this_week (80-140 words): Read THIS week's check-in markers. Name the dominant signal - which marker is leading, which is lagging. Tie to the pattern's interpretation lens. If they didn't submit a check-in this week, name that and read trend only.
- wpr_trend (60-100 words): Read the 4-week trend. Direction held is the signal; one bad week is not the verdict. Quote specific moves ("training recovery went from 2 to 4 across the last three weeks").
- wpr_one_focus (50-90 words): ONE thing to hold this week. Not three. Not a list. The single highest-leverage move given what the markers are saying. Tie it to mechanism.`

export async function generateWeeklyPattern(args: {
  enrolmentId: string
  deliveryNumber: number
}): Promise<WeeklyPatternResult> {
  const admin = createAdminClient()

  const { data: enrolment } = await admin
    .from('membership_enrollments')
    .select('id, first_name, email, pattern, current_block, current_week')
    .eq('id', args.enrolmentId)
    .maybeSingle()
  if (!enrolment) throw new WeeklyPatternGenerationError('Member enrolment not found', 404)

  const patternKey = (enrolment.pattern ?? 'stress-stored').toLowerCase()
  const patternLabel = PATTERN_LABELS[patternKey] ?? 'Stress-Stored'
  const focusRule = PATTERN_FOCUS_RULES[patternKey] ?? PATTERN_FOCUS_RULES['stress-stored']
  const blockLabel = enrolment.current_block ?? 'A'
  const weekNumber: number = enrolment.current_week ?? 1

  const { data: checkins } = await admin
    .from('membership_checkins')
    .select('week_number, energy_levels, morning_energy, sleep_quality, afternoon_crash, hunger_cravings, training_recovery, mood_stability, physical_changes, notes, submitted_at')
    .eq('enrollment_id', args.enrolmentId)
    .order('week_number', { ascending: false })
    .limit(4)

  const checkinsList = checkins ?? []
  const latestCheckinWeek = checkinsList[0]?.week_number ?? null

  const checkinsBlock = checkinsList.length
    ? checkinsList.reverse().map(c =>
        `Week ${c.week_number}: Energy ${c.energy_levels}/5, Morning ${c.morning_energy}/5, Sleep ${c.sleep_quality}/5, Afternoon Crash ${c.afternoon_crash}/5 (5=no crash), Hunger ${c.hunger_cravings}/5 (5=stable), Training Recovery ${c.training_recovery}/5, Mood ${c.mood_stability}/5, Physical Changes ${c.physical_changes}/5${c.notes ? `. Note: "${c.notes}"` : ''}`
      ).join('\n')
    : '(No weekly check-ins submitted yet - read the situation from the pattern alone and gently nudge them to submit so the next report sharpens.)'

  const userPrompt = `Member: ${enrolment.first_name ?? 'there'}
Pattern: ${patternLabel}
Pattern reading lens: ${focusRule}
Current position: Block ${blockLabel}, Week ${weekNumber}

This is delivery ${args.deliveryNumber} of 4 in their Weekly Pattern Report subscription cycle.

Their last ${checkinsList.length} weekly check-ins (markers are 1-5, higher is better except where noted; ordered oldest first):
${checkinsBlock}

Return the JSON shape specified in your instructions. No markdown, no preamble.`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2500,
    system: WEEKLY_PATTERN_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new WeeklyPatternGenerationError('Unexpected response from AI', 500)
  }
  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    throw new WeeklyPatternGenerationError(`Could not parse response: ${content.text.slice(0, 120)}`, 500)
  }
  let parsed: Partial<WeeklyPatternSections>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new WeeklyPatternGenerationError(`JSON parse failed: ${jsonText.slice(0, 120)}`, 500)
  }

  const required: (keyof WeeklyPatternSections)[] = ['wpr_this_week', 'wpr_trend', 'wpr_one_focus']
  for (const key of required) {
    if (!parsed[key] || typeof parsed[key] !== 'string') {
      throw new WeeklyPatternGenerationError(`Missing or invalid section: ${key}`, 500)
    }
  }

  const cleaned: WeeklyPatternSections = {
    wpr_this_week: parsed.wpr_this_week!.replace(/—/g, ', '),
    wpr_trend: parsed.wpr_trend!.replace(/—/g, ', '),
    wpr_one_focus: parsed.wpr_one_focus!.replace(/—/g, ', '),
  }

  return {
    sections: cleaned,
    memberName: enrolment.first_name ?? 'there',
    patternLabel,
    blockLabel,
    weekNumber,
    deliveryNumber: args.deliveryNumber,
    checkInsRead: checkinsList.length,
    latestCheckinWeek,
  }
}
