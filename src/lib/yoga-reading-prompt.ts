/**
 * Yoga Program Reading prompt. Produces the 5-part client-facing reading for a
 * yoga block, parallel to the strength program reading. Grounded in the block's
 * own rationale / structure / progression (which were generated from the
 * client's state), so it needs no separate body-state fetch.
 *
 * Same client-facing doctrine as the strength reading: warm, second person,
 * no pose names, no prescriptions, no diagnoses, no medical claims, no em dashes.
 */

export interface YogaReadingInputs {
  clientName: string
  blockName: string
  rationale: string | null
  weeklyStructure: string | null
  progression: string | null
  coachGuidance?: string | null
}

export function buildYogaReadingSystemPrompt(): string {
  return `You write a client-facing reading for a yoga block, in the coach's warm, plain voice.
It frames WHY this block, so the client understands the intent before they practise.

Return ONLY a JSON object in this exact shape:
{
  "why_this_block": string,            // why this block, for where their body is now
  "what_this_is_doing": string,        // what the practice does for them over the weeks
  "how_well_know_its_working": string, // the signals they and the coach will watch for
  "what_were_not_doing_yet": string,   // the restraint, what is deliberately left out for now
  "coach_note": string                 // a short, personal closing note, addressed to them by name
}

RULES
- Second person ("you"), warm and specific. Address the client by name at least once, in the coach note.
- This is about state and intent, NOT instructions. Do NOT name poses, give cues, or prescribe.
- No diagnoses, no medical claims, no supplement or medication advice.
- No em dashes. Use full sentences. 2 to 4 sentences per section.`
}

export function buildYogaReadingUserPrompt(inputs: YogaReadingInputs): string {
  return `CLIENT: ${inputs.clientName}
BLOCK: ${inputs.blockName}

THE REASONING BEHIND THIS BLOCK (from the engine, for your reference only, do not quote pose detail):
${inputs.rationale ?? '(none)'}

THE WEEKLY SHAPE:
${inputs.weeklyStructure ?? '(none)'}

HOW IT PROGRESSES:
${inputs.progression ?? '(none)'}
${inputs.coachGuidance ? `\nCOACH GUIDANCE (authoritative, reflect this framing):\n${inputs.coachGuidance}\n` : ''}
Write the five-part reading for ${inputs.clientName} now, framing the intent of this block in their language. Return the JSON object only.`
}
