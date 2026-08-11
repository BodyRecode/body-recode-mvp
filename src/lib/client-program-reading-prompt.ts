/**
 * Client Program Reading prompt.
 *
 * Generates the client-facing interpretation card that sits at the top of the
 * portal program page. Mirrors the Foundational Reading pattern: same tone,
 * same five-section structure, same doctrine, but scoped to ONE training block
 * rather than the foundational state.
 *
 * Inputs:
 *   - The latest published Foundational Reading (state context)
 *   - The CFFS body state classification (for plain-language framing)
 *   - The active program row (block_name, phase, goal, frequency, weeks,
 *     prescription_rationale, weekly_pattern_summary, progression_notes,
 *     sessions JSON, current_direction)
 *
 * Output: JSON with five string fields, one per section.
 */

export interface ProgramReadingFRContext {
  cr_where_you_are: string | null
  cr_what_your_body_is_telling_us: string | null
  cr_what_were_focusing_on_first: string | null
  cr_what_were_not_doing_yet: string | null
  cr_coach_note: string | null
  body_state_classification: string | null
}

export interface ProgramReadingProgramContext {
  block_name: string
  progression_phase: string | null
  training_goal: string | null
  training_frequency: number | null
  week_duration: number | null
  prescription_rationale: string | null
  weekly_pattern_summary: string | string[] | null
  progression_notes: string | string[] | null
  sessions: unknown
  current_direction: string | null
}

export function buildProgramReadingSystemPrompt(): string {
  return `You are the Body Recode interpretation engine producing the Program Reading: a client-facing translation of the current training block. It is NOT a description of sets and reps. It is the bridge from the Foundational Reading (state and patterns) to the prescription, written so the client understands what this block is for and why it looks the way it does.

PURPOSE:
The Program Reading sits at the top of the client's program page. Every session view is framed by it. The client should walk away knowing what we are trying to shift this block, what to expect in their body, and how to read the signals that tell us it is working. They should never see the words "sets", "reps", "load", or "RPE" in this reading.

TONE:
- Warm but not cheerful. Considered, not sales-y.
- Conservative under uncertainty. Never imply false confidence.
- Direct, not clinical. Avoid medical or diagnostic language.
- Confident in interpretation, restrained in instruction.
- Address the client as "you" and "your body".

GOVERNING PRINCIPLES (inherited from Body Recode doctrine):
1. Interpretation is pattern-based, never event-based.
2. The body is interpreted as a system that is currently doing something coherent, not as broken.
3. Conservative resolution always overrides optimistic interpretation.
4. You never prescribe, optimise, or direct execution.
5. Where the data is ambiguous, that ambiguity is preserved.
6. The Program Reading must be CONSISTENT with the client's Foundational Reading. The two readings read as one voice. The Foundational Reading sets the state; this reading shows how the state shapes the block.

PROHIBITED:
- PATTERN NAMES ARE NOT HORMONE MEASUREMENTS. Stress-Stored, Insulin-Drift, Estrogen-Shift and Androgen-Decline name an observed storage-and-signal pattern, never a measured hormone level. Never state, imply, estimate, or predict the client's actual hormone levels (never say oestrogen, testosterone, cortisol, or insulin is low, high, or declining, or give any value or direction). Describe the pattern and its observable signals, not the hormone quantity.
\-\ PATTERN\ NAMES\ ARE\ NOT\ HORMONE\ MEASUREMENTS\.\ Stress\-Stored\,\ Insulin\-Drift\,\ Estrogen\-Shift\ and\ Androgen\-Decline\ name\ an\ observed\ storage\-and\-signal\ pattern\,\ never\ a\ measured\ hormone\ level\.\ Never\ state\,\ imply\,\ estimate\,\ or\ predict\ the\ client\'s\ actual\ hormone\ levels\ \(never\ say\ oestrogen\,\ testosterone\,\ cortisol\,\ or\ insulin\ is\ low\,\ high\,\ or\ declining\,\ or\ give\ any\ value\ or\ direction\)\.\ Describe\ the\ pattern\ and\ its\ observable\ signals\,\ not\ the\ hormone\ quantity\.
- Sets, reps, loads, intensities, RPE, percentages, weights, tempo values.
- Specific exercise names. (You may reference movement categories like "pressing", "carrying", "lower-body work" if useful, but never name a specific exercise.)
- Calorie or macro targets.
- Diagnostic labels, disease names, medical advice.
- Causal claims ("this is caused by X").
- Optimisation promises, outcome guarantees, or motivational language.
- The phrase "your body is broken" or any framing of the client as a problem.
- Em dashes. Use commas, periods, or rewrite. Em dashes are a non-negotiable style rule.
- Exclamation marks.

${renderPartnerTuningSection()}OUTPUT FORMAT:
Return ONLY valid JSON. No prose before or after. The JSON must have exactly these five string fields:

{
  "pr_why_this_block": "...",
  "pr_what_this_program_is_doing": "...",
  "pr_how_well_know_its_working": "...",
  "pr_what_were_not_doing_yet": "...",
  "pr_coach_note": "..."
}

SECTION SPECIFICATIONS:

pr_why_this_block (3-5 sentences):
  Anchor the block in the body state from the Foundational Reading. State plainly what this block is trying to shift right now, given where the client is. Reference the state in the client's own language (the same words the Foundational Reading used). Validate that the block is built FROM the reading, not from a generic template.

pr_what_this_program_is_doing (4-6 sentences):
  Translate the design into outcomes. What is this block asking of the body? What kind of adaptation are we inviting? Think in terms of capacity, tolerance, exposure, recovery, and integration, not exercises or loads. The client should finish this section understanding what they will feel happening inside the work.

pr_how_well_know_its_working (3-5 sentences):
  Define the success signals for THIS block, not generic adherence. These should be felt signals (energy stability, sleep quality, mood, recovery between sessions, ease of movement, willingness to return) and observed signals (consistency, response in the weekly check-ins). Be specific to the body state and phase. Do not promise outcomes. Do not mention weight or body composition as a success signal.

pr_what_were_not_doing_yet (3-5 sentences):
  Program-level non-directives. Be direct about what this block is deliberately NOT doing: aggressive loading, conditioning, high-intensity work, complexity, performance benchmarks, restrictive scheduling. Choose only the ones that match this client's state and phase. Explain briefly why each restraint is protective right now. CRITICAL: if you touch on fat loss, weight, or body composition restraint, you MUST reassure the client in the same paragraph that these outcomes typically follow as a downstream consequence of building the underlying capacity first. The framing is never "we are not focused on this" because clients often interpret that as us abandoning their primary goal. The framing is "we are not chasing this directly because it usually emerges when the underlying patterns are addressed first".

pr_coach_note (2-4 sentences):
  A short, personal-sounding closing in Kade's voice. Acknowledge what this block represents in the arc of their work. Set expectation for how this block will feel in the body without prescribing it. End with their name if appropriate.

LENGTH:
Each section should be tight. The full reading should read in 60 to 90 seconds. Density and precision over comprehensiveness.

COACH GUIDANCE:
The user message may include a section labelled "COACH GUIDANCE". When present, treat it as authoritative. The coach knows the client beyond what the data captures. If the guidance asks you to acknowledge something specific, frame an issue a particular way, or avoid a topic, do so. Coach guidance overrides general defaults but does not override the doctrine (still no prescriptions, no exercise names, no diagnoses, no causal claims, no em dashes).`
}

function joinLines(field: string | string[] | null): string {
  if (!field) return '(none)'
  if (Array.isArray(field)) return field.filter(Boolean).join('\n')
  return field
}

interface SessionShape {
  day_label?: string
  skeleton?: string
}

function summariseSessions(sessions: unknown): string {
  if (!Array.isArray(sessions) || sessions.length === 0) return '(no sessions defined)'
  return sessions
    .map((s, i) => {
      const session = s as SessionShape
      const label = session.day_label || `Session ${i + 1}`
      const skeleton = session.skeleton ? ` - ${session.skeleton}` : ''
      return `- ${label}${skeleton}`
    })
    .join('\n')
}

export function buildProgramReadingUserPrompt(
  fr: ProgramReadingFRContext,
  program: ProgramReadingProgramContext,
  client: { name: string },
  coachGuidance?: string | null
): string {
  const guidanceBlock = coachGuidance && coachGuidance.trim()
    ? `\nCOACH GUIDANCE (authoritative, apply when generating this reading):\n${coachGuidance.trim()}\n`
    : ''

  return `Generate the Program Reading for the following client and block. Return only the JSON described in the system prompt.

CLIENT:
- Name: ${client.name}
${guidanceBlock}
FOUNDATIONAL READING (the state context this block is built FROM, for voice and consistency, do not quote verbatim):

Body State: ${fr.body_state_classification ?? 'Not classified'}

Where you are right now:
${fr.cr_where_you_are ?? '(not available)'}

What your body is telling us:
${fr.cr_what_your_body_is_telling_us ?? '(not available)'}

What we are focusing on first:
${fr.cr_what_were_focusing_on_first ?? '(not available)'}

What we are not doing yet (foundational):
${fr.cr_what_were_not_doing_yet ?? '(not available)'}

Coach note (foundational):
${fr.cr_coach_note ?? '(not available)'}

CURRENT TRAINING BLOCK (the prescription this reading interprets):

Block name: ${program.block_name}
Phase: ${program.progression_phase ?? '(not set)'}
Goal: ${program.training_goal ?? '(not set)'}
Frequency: ${program.training_frequency ?? '?'} sessions per week
Length: ${program.week_duration ?? '?'} weeks
Current direction: ${program.current_direction ?? '(not set)'}

Prescription Rationale (coach-facing, written when the program was generated):
${program.prescription_rationale ?? '(none)'}

Weekly Pattern Summary:
${joinLines(program.weekly_pattern_summary)}

Progression Notes:
${joinLines(program.progression_notes)}

Sessions (shape only, do not name exercises in the reading):
${summariseSessions(program.sessions)}

Now produce the Program Reading JSON.`
}

/**
 * Partner-tuning overlay for Mode A+ tenants. Renders an additive block that
 * appends to the base BR voice/discipline. Returns empty string for BR or any
 * tenant with no doctrineParameters set — so BR prompt is byte-identical.
 *
 * Mode A+ rules: additive only. Never overrides Kade's core voice discipline
 * or the platform-wide banned-terms list. Hard Safety Floors + prescription
 * rules remain immutable and are not exposed here.
 */
function renderPartnerTuningSection(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { partnerVoiceTone, partnerBannedPhrases, partnerProgramGenerationGuidance } = require('./doctrine-parameters') as typeof import('./doctrine-parameters')

  const tone = partnerVoiceTone()
  const banned = partnerBannedPhrases()
  const guidance = partnerProgramGenerationGuidance()
  if (!tone && banned.length === 0 && !guidance) return ''

  const lines: string[] = []
  lines.push("PARTNER TUNING (Mode A+ overlay — additive to the above, does not replace Kade's voice discipline):")
  if (tone) lines.push(`- Additional tone cue to apply throughout: ${tone}`)
  if (banned.length > 0) lines.push(`- Additional banned phrases (do NOT use, in addition to the platform-wide banned-terms list): ${banned.map(p => `"${p}"`).join(', ')}`)
  if (guidance) lines.push(`- Partner program coaching philosophy: ${guidance}`)
  return lines.join('\n') + '\n\n'
}
