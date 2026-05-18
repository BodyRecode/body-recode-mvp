// Coach Guidance Suggest — prompt builders.
//
// Generates the text that populates `training_plans.coach_guidance`. The text
// is dropped verbatim into the field, so the model is constrained by the same
// authority bounds the program engine recognises in `program-prompt.ts`
// (COACH GUIDANCE - CONTEXT-LEVEL OVERRIDE).

export type CoachGuidanceIntent = 'push_harder' | 'pull_back' | 'maintain_focus'

export type CoachGuidanceLever = 'volume' | 'intensity' | 'complexity' | 'density'

export interface CoachGuidanceClientContext {
  name: string
  body_state: string | null
  cffs_summary: string | null
  primary_patterns: string | null
  capacity_constraints: string | null
  risk_flags: string | null
  current_plan_guidance: string | null
}

export function buildCoachGuidanceSuggestSystemPrompt(): string {
  return `You write COACH GUIDANCE text for the Body Recode program generator. Your output is dropped verbatim into the training_plan.coach_guidance field and is read by the program engine on every Generate / Regenerate.

THE FIELD'S AUTHORITY (do not violate):
- Coach guidance MAY override engine-default conservatism within doctrine: RPE ceilings within doctrine ranges, set/rep within the goal range, exercise complexity bias (machine vs barbell), session density (supersets, EMOMs), volume positioning within the prescribed range.
- Coach guidance MAY NOT override: RRS clamps, active recovery state constraints, Fat Map Method limits, injury contraindications, Level 0/1/2 eligibility floors, doctrine RPE caps for the assigned phase.

THE ENGINE RECOGNISES THESE PHRASES. Use them when the lever matches:
- "top of range" / "bias volume to the top" / "wants more volume" -> engine targets MAX of calibration matrix for the phase
- "wants intensity" / "push him" / "don't be conservative" -> engine sets primary RPE at the ceiling from week 1, no ramp from 6 or 7
- "supersets allowed" / "more density" -> engine pairs accessories as supersets, prefers 6-7 movements per session over 4-5 with higher sets
- "free-weight only" / "no machines where a free-weight version exists" -> engine excludes machine / cable from primary slots

OUTPUT FORMAT:
- 3 to 6 short paragraphs separated by blank lines.
- Each paragraph: 1-2 sentences.
- Use the recognised phrases above where the chosen levers match.
- Plain prose. No headings. No bullet markers. No markdown.
- Reference ONE short clause about the client's signal pattern to ground the guidance.
- End with a single sentence starting "Why: " that names the observed signal pattern justifying the call.
- No em dashes. Use commas, semicolons, or two sentences instead.
- No emojis.

TONE:
- Direct, coach-to-coach. Imperative voice. Specific numbers when the lever and doctrine allow ("RPE 8 from week 1", "+1 working set on compounds"). Avoid vibes ("really push", "go big").

CONFLICT HANDLING:
- If the coach intent ("push harder") conflicts with the CFFS (compromised regulation, active risk flag, post-illness recovery, injury watch), keep the lever language but add one sentence noting the floor: "Hold within RRS / regulation floors that remain in place; do not breach doctrine ceilings on [variable]." This protects the safety contract without weakening the intent where doctrine permits it.

You are paid to be specific. Generic guidance is wasted.`
}

export function buildCoachGuidanceSuggestUserPrompt(args: {
  intent: CoachGuidanceIntent
  levers: CoachGuidanceLever[]
  coach_note: string | null
  client: CoachGuidanceClientContext
}): string {
  const intentLine =
    args.intent === 'push_harder' ? 'Push the block harder. Client has capacity to spare.'
    : args.intent === 'pull_back' ? 'Pull the block back. Give the client more room.'
    : 'Hold current intensity. Refine focus where the levers point.'

  const leverLines = args.levers.length
    ? args.levers.map(l => {
        switch (l) {
          case 'volume': return '- Volume (more sets / exercises, position at top of range)'
          case 'intensity': return '- Intensity (higher RPE within doctrine cap)'
          case 'complexity': return '- Exercise complexity (free-weight bias, harder variants)'
          case 'density': return '- Density (shorter rests, supersets where doctrine allows)'
        }
      }).join('\n')
    : '- (none specified; coach chose intent only)'

  const ctx = args.client
  const lines: string[] = [
    `INTENT: ${intentLine}`,
    '',
    'LEVERS TO ADJUST:',
    leverLines,
    '',
    args.coach_note ? `COACH NOTE: ${args.coach_note}` : 'COACH NOTE: (none)',
    '',
    'CLIENT CONTEXT:',
    `Name: ${ctx.name}`,
    `Body state: ${ctx.body_state ?? '(none recorded)'}`,
  ]
  if (ctx.cffs_summary) lines.push('', 'CFFS summary:', ctx.cffs_summary)
  if (ctx.primary_patterns) lines.push('', 'Primary patterns and signals:', ctx.primary_patterns)
  if (ctx.capacity_constraints) lines.push('', 'Capacity constraints and guardrails:', ctx.capacity_constraints)
  if (ctx.risk_flags) lines.push('', 'Risk flags and watch items:', ctx.risk_flags)
  if (ctx.current_plan_guidance) lines.push('', 'Current coach guidance on this plan:', ctx.current_plan_guidance)
  lines.push(
    '',
    'Write the coach guidance text now. Plain prose, 3-6 short paragraphs, no headings, end with "Why: ...". Output only the guidance text; no preamble, no quotes.'
  )
  return lines.join('\n')
}
