/**
 * Yoga practice generation prompts. Modality pack: yoga.
 * Parallel to program-prompt.ts. Trust the model for the sequence prose;
 * enforcement lives in yoga-doctrine.ts (clampYogaSequence + filters).
 */

import {
  YOGA_GENERATION_DOCTRINE,
  PracticeSegment,
  YogaIntensity,
} from './yoga-doctrine'

export interface YogaMovementRow {
  name: string
  sanskrit_name: string | null
  family: string
  intensity: string
  level: string
  target_regions: string[]
  weight_bearing: string
  props: string[]
  contraindications: string[]
  hold_style: string
  default_hold_seconds: number | null
  default_breaths: number | null
  breath_cue: string | null
  cue: string | null
}

export function buildYogaSystemPrompt(): string {
  return `${YOGA_GENERATION_DOCTRINE}

YOU ARE PROGRAMMING A MULTI-WEEK BLOCK, not a single class. A block is a
weekly template of practices that repeats across the block, deepening over the
weeks. You write the weekly template (the practices), plus the reasoning, the
weekly structure, and how it progresses week to week.

OUTPUT FORMAT
Return ONLY a JSON object, no preamble, in this exact shape:
{
  "block_name": string,               // e.g. "Block 1: Grounding & Breath"
  "rationale": string,                // why this block for this client, given their state. 2-4 sentences, plain, no diagnoses.
  "weekly_structure": string,         // the weekly shape: which practices on which days, their theme and length.
  "progression": string,              // how the block evolves week to week (e.g. longer holds, more depth), staying within the ceiling.
  "practices": [                      // the weekly template, one entry per practice/week
    {
      "day_label": string,            // e.g. "Practice 1 — Grounding"
      "intention": string,            // one sentence focus
      "segments": [
        {
          "key": string,              // one of the arc segment keys provided
          "label": string,
          "poses": [
            {
              "name": string,         // EXACTLY a name from the available poses list
              "side": "left" | "right" | "both" | null,
              "hold_seconds": number | null,
              "breaths": number | null,
              "cue": string            // short, in the coach's warm voice
            }
          ]
        }
      ]
    }
  ]
}

RULES
- Use ONLY poses from the available list, by their exact name. Do not invent poses.
- Each practice follows the provided arc segments in order, filled from allowed families.
- For any one-sided pose, sequence both sides (left then right).
- Keep every practice within the client's intensity ceiling. Gentler is fine, stronger is not.
- Make the practices distinct from each other (vary the focus across the week), but coherent as one block.`
}

export function buildYogaUserPrompt(
  clientName: string,
  ceiling: YogaIntensity,
  arc: PracticeSegment[],
  bodyStateContext: string | null,
  availablePoses: YogaMovementRow[],
  targetMinutes: number,
  practicesPerWeek: number,
  weekDuration: number,
  coachGuidance?: string | null,
): string {
  const arcText = arc
    .map(
      (s) =>
        `- ${s.key} (${s.label}, ~${Math.round(s.share * 100)}% of practice): families [${s.families.join(', ')}]`,
    )
    .join('\n')

  const poseText = availablePoses
    .map((p) => {
      const hold = p.hold_style === 'static'
        ? (p.default_hold_seconds ? `${p.default_hold_seconds}s` : 'hold')
        : (p.default_breaths ? `${p.default_breaths} breaths` : 'flow')
      const props = p.props.length ? ` props:[${p.props.join(',')}]` : ''
      return `- ${p.name} | ${p.family} | ${p.intensity} | regions:[${p.target_regions.join(',')}] | ${hold}${props}${p.breath_cue ? ` | breath: ${p.breath_cue}` : ''}`
    })
    .join('\n')

  return `CLIENT: ${clientName}

BLOCK: ${weekDuration} weeks, ${practicesPerWeek} practices per week.
INTENSITY CEILING: ${ceiling} (do not exceed; gentler is allowed)
TARGET LENGTH per practice: about ${targetMinutes} minutes

${bodyStateContext ? `BODY STATE (from the reading):\n${bodyStateContext}\n` : ''}${coachGuidance ? `\nCOACH GUIDANCE (authoritative for this client):\n${coachGuidance}\n` : ''}
PRACTICE ARC (each practice uses these segment keys, in this order):
${arcText}

AVAILABLE POSES (use only these, by exact name):
${poseText}

Program a ${weekDuration}-week block for ${clientName} now: write the block_name, rationale, weekly_structure, progression, and exactly ${practicesPerWeek} distinct practices (the weekly template). Return the JSON object only.`
}
