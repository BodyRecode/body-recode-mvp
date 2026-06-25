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

OUTPUT FORMAT
Return ONLY a JSON object, no preamble, in this exact shape:
{
  "practice_name": string,
  "intention": string,                // one sentence, the focus of this practice
  "segments": [
    {
      "key": string,                  // one of the arc segment keys provided
      "label": string,
      "poses": [
        {
          "name": string,             // EXACTLY a name from the available poses list
          "side": "left" | "right" | "both" | null,
          "hold_seconds": number | null,
          "breaths": number | null,
          "cue": string                // short, in the coach's warm voice
        }
      ]
    }
  ],
  "summary": string                   // 1-2 sentences the coach could read to the client
}

RULES
- Use ONLY poses from the available list, by their exact name. Do not invent poses.
- Follow the provided arc segments in order. Fill each from its allowed families.
- For any one-sided pose, sequence both sides (left then right).
- Keep within the client's intensity ceiling. Gentler is fine, stronger is not.`
}

export function buildYogaUserPrompt(
  clientName: string,
  ceiling: YogaIntensity,
  arc: PracticeSegment[],
  bodyStateContext: string | null,
  availablePoses: YogaMovementRow[],
  targetMinutes: number,
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

INTENSITY CEILING: ${ceiling} (do not exceed; gentler is allowed)
TARGET LENGTH: about ${targetMinutes} minutes

${bodyStateContext ? `BODY STATE (from the reading):\n${bodyStateContext}\n` : ''}${coachGuidance ? `\nCOACH GUIDANCE (authoritative for this client):\n${coachGuidance}\n` : ''}
PRACTICE ARC (use these segment keys, in this order):
${arcText}

AVAILABLE POSES (use only these, by exact name):
${poseText}

Sequence one coherent practice for ${clientName} now. Return the JSON object only.`
}
