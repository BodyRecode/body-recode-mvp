/**
 * Yoga macro plan (arc) suggestion. Parallel to the strength suggest-plan.
 * Proposes a sequence of yoga blocks that progress the client over months,
 * each with an intensity ceiling and a focus. Stored as training_plans +
 * plan_blocks (yoga semantics: intensity in phase_category, focus in
 * phase_objective; strength enum columns get neutral placeholders).
 */

export interface YogaPlanInputs {
  clientName: string
  bodyStateContext?: string | null
  coachGuidance?: string | null
}

export function buildYogaPlanSystemPrompt(): string {
  return `You design a multi-block yoga arc (a macro plan) for one client. It is a sequence of
blocks that move the client forward over months, each block a few weeks long, each
with an intensity ceiling and a clear focus. The arc starts where the client's body is
now and progresses only as their state allows.

INTENSITY CEILINGS (in order): restorative < gentle < moderate < strong.
- Start at or below the client's current capacity. A depleted client begins restorative or gentle.
- Progress one step at a time across blocks, never skip ahead.
- It is fine for an arc to stay gentle if that is what the body needs.

Return ONLY a JSON object in this exact shape:
{
  "plan_name": string,                 // short, e.g. "Restore to Strength"
  "macro_objective": string,           // one sentence direction for the whole arc
  "blocks": [
    {
      "block_name": string,            // e.g. "Block 1: Settle & Breathe"
      "intensity": "restorative" | "gentle" | "moderate" | "strong",
      "week_duration": 4 | 6 | 8,
      "focus": string,                 // the theme of this block, a few words
      "rationale": string              // why this block in this position, 1-2 sentences, plain
    }
  ]
}

RULES
- 3 to 4 blocks. Coherent progression. No diagnoses, no medical claims, no em dashes.`
}

export function buildYogaPlanUserPrompt(inputs: YogaPlanInputs): string {
  return `CLIENT: ${inputs.clientName}
${inputs.bodyStateContext ? `\nBODY STATE (from the reading):\n${inputs.bodyStateContext}\n` : ''}${inputs.coachGuidance ? `\nCOACH GUIDANCE (authoritative):\n${inputs.coachGuidance}\n` : ''}
Design the yoga arc for ${inputs.clientName} now. Return the JSON object only.`
}
