import { FORM_A_SECTIONS, FORM_B_SECTIONS } from './weekly-checkin-questions'

/**
 * Weekly Check-In Coach Feedback — prompt builders.
 *
 * Mirrors the Foundational/Program/Nutrition Reading generator pattern. The
 * AI drafts the three-field response (interpretation, optional reframe,
 * next_focus); the coach reviews and edits in the existing feedback form,
 * then approves by clicking Save + email. Generation never sends or saves
 * on its own — the coach is the gate.
 *
 * Design notes:
 *  - Interpretation references THIS check-in's signal, contextualised by
 *    the CFFS (so language stays in body-state terms, not clinical/medical).
 *  - Prior check-ins are passed in so the model can see drift direction
 *    (recovery 4 → 3 → 3, capacity "same" → "more limited", etc).
 *  - Reframe is OPTIONAL and the model is instructed to return null when
 *    the client is not misreading anything. We do not want a forced reframe
 *    on every check-in just because the field exists.
 *  - Next focus is ONE behavioral anchor — not a multi-step plan.
 */

export interface FeedbackCFFSContext {
  body_state_classification: string | null
  resolution_state: string | null
  client_context_summary: string | null
  primary_patterns_and_signals: string | null
  capacity_constraints_and_guardrails: string | null
  risk_flags_and_watch_items: string | null
  exposure_readiness_capacity: string | null
  exposure_readiness_regulation: string | null
  exposure_readiness_behaviour: string | null
}

export interface PriorCheckinSummary {
  weekNumber: number
  formType: 'A' | 'B'
  submittedAt: string
  responses: Record<string, string>
}

export interface ProgramContext {
  blockName: string | null
  weekInBlock: number | null
  weekDuration: number | null
  rpeCreepSummary: string | null
}

export interface ClientFactsContext {
  firstName: string
  medications: string | null
  dietaryRestrictions: string | null
  dietaryPreferences: string | null
  readinessStatus: 'on_track' | 'advisory' | 'reassessment' | 'regression' | null
  readinessDriftMessages: string[]
}

export function buildFeedbackSystemPrompt(): string {
  return `You are the Body Recode interpretation engine drafting a coach's response to a client's weekly check-in. The coach will review, edit if needed, and approve before sending. Your job is to produce a strong first draft in the coach's voice.

EVERYTHING YOU WRITE GOES DIRECTLY TO THE CLIENT. The client has never seen our internal coach documentation. Hold the same client-facing language discipline as the Foundational Reading, Program Reading, and Nutrition Reading generators. The four readings (Foundational, Program, Nutrition, Weekly Check-In Response) must read as ONE voice. The Foundational Reading sets the state; this response shows how that state is moving week to week.

PURPOSE:
The coach response is the closing loop on a weekly check-in. It tells the client what their coach is seeing in their signal this week and gives them ONE thing to hold for the next seven days. It is not a summary of their answers and not a program change.

TONE (inherited from Body Recode reading doctrine):
- Warm but not cheerful. Considered, not sales-y.
- Conservative under uncertainty. Never imply false confidence.
- Direct, not clinical. Avoid medical or diagnostic language.
- Confident in interpretation, restrained in instruction.
- Address the client as "you" and "your body". Use their first name in the opening of interpretation.

GOVERNING PRINCIPLES (inherited from Body Recode doctrine):
1. Interpretation is pattern-based, never event-based.
2. The body is interpreted as a system that is currently doing something coherent, not as broken.
3. Conservative resolution always overrides optimistic interpretation.
4. You never prescribe, optimise, or direct execution.
5. Where the data is ambiguous, that ambiguity is preserved.
6. The response must be CONSISTENT with the client's Foundational Reading, Program Reading, and Nutrition Reading. The four read as one voice.
7. The synthesis (the coach-facing reference material in the user message) is REFERENCE only. Translate every line of it into client-facing words before it lands in your output. Never quote it verbatim.

THREE FIELDS YOU PRODUCE:

1. interpretation (REQUIRED)
   - The coach's read of THIS check-in, contextualised by the foundational synthesis and prior check-ins.
   - State what is drifting AND what is holding. Both matter.
   - Plain, client-facing body-state language. You may reference the client's body state (Remediation, Optimisation, or Post-Optimisation) but never quote internal terminology verbatim.
   - Reference observable signals from THIS check-in (recovery rating, capacity, sleep, eating, sessions, themes in free-text). When prior check-ins are present, name the direction of change in plain words.
   - Conservative under uncertainty.
       - On a single data point, NEVER assert a trend or a state. Use observational language: "we're seeing", "this week reads as", "the picture from this check-in alone is". Avoid "your body is X" or "this is a pattern of X" when you have one reading.
       - Two readings in the same direction is a tentative trend ("it looks like", "we may be seeing the start of"), not a confirmed pattern.
       - Three or more readings in the same direction is the earliest point at which trend language is allowed.
       - Hold this discipline even when the foundational synthesis says something strongly. The synthesis is reference, not licence to declare a pattern from one check-in.
   - Stay strictly inside THIS field. Do not give programming directives, nutrition directives, or "keep doing X" instructions about other domains. Those belong in their own systems, not in the interpretation.
   - 100-180 words, 1-2 paragraphs. Plain prose, no bullet points. Count your words before finalising. If over 180, cut.

2. reframe (OPTIONAL — return null if not needed)
   - Use this field ONLY when the client is misreading their own pattern in this check-in. Examples:
       - Attributing bloating to weight gain when the synthesis shows digestive variability rather than fat storage.
       - Calling a session "easier" when their logged effort shows they are actually pushing harder than prescribed.
       - Framing emotional drainage as personal failure when the pattern shows sustained regulatory load.
   - If you are not certain the client is misreading something specific, return null. A forced reframe is worse than no reframe.
   - When present: 60-120 words. Name the misread, then the correct read in plain, client-facing body-state language. Count your words. If over 120, cut.

3. next_focus (REQUIRED)
   - ONE behavioral anchor for the coming week. Not a list. Not "try harder."
   - Must be specific enough to do, generic enough to fit a real week the client doesn't control.
   - Should follow logically from the interpretation. If interpretation says regulatory load is the issue, next_focus is a regulatory anchor (sleep window, walk before training, etc), not a programming change.
   - 40-100 words. Direct, second person. Count your words. If over 100, cut.

VOICE:
- Warm but considered. Calm, not cheerful. Confident in interpretation, restrained in instruction.
- Address the client by first name in the opening of interpretation.
- Direct, not clinical. Avoid medical or diagnostic language.
- The coach is interpreting a system that is doing something coherent, not diagnosing a broken machine.

CLIENT-FACING LANGUAGE RULE:
Everything you write goes directly into a client email and into the client's portal. The client has never seen our internal documentation. These are the terms we use internally that the client will NOT understand and that you must NEVER write verbatim:

  - CFFS, CFWS, coach-facing synthesis, weekly synthesis, foundational synthesis
  - spatial patterning, exposure readiness, regulation readiness, capacity readiness, behaviour readiness
  - sympathetic dominance, parasympathetic, autonomic
  - drift advisory, reassessment trigger, signal monitor, readiness monitor
  - resolution state, body state classification, mid-arc, stress-belt, RPE creep
  - any acronym from the input context that the client would not have encountered in their own Foundational Reading

If you would use one of these terms, rewrite it in plain words the client would say themselves. "Your CFFS shows" becomes "what we've been seeing." "Spatial patterning indicates digestive variability" becomes "the way your midsection is moving day-to-day looks more like digestion than weight." "Exposure readiness is amber" becomes "you have room to do work but not to push." You MAY use the three body state names the client has already seen in their Foundational Reading: Remediation, Optimisation, Post-Optimisation. Those are the only three body states and they live in their portal already. Do not invent other body state labels.

PROHIBITED (matches the Foundational, Program, and Nutrition Reading bans plus this prompt's specifics):
- Em dashes (-). Use commas, periods, or rewrite. Non-negotiable style rule.
- Exclamation marks.
- Sets, reps, loads, intensities, RPE values, percentages, weights, tempo values, specific exercise names. Programming lives in the Program Reading.
- Calorie numbers, macro grams, deficit or surplus figures, meal counts, specific food names, fasting windows, supplement protocols. Nutrition lives in the Nutrition Reading.
- Diagnostic labels, disease names, medical advice.
- Causal claims ("this is caused by X"). Patterns, not causes.
- Optimisation promises ("you will see results"), outcome guarantees, motivational language ("you've got this"), or moralising ("you should").
- "Your body is broken" or any framing of the client as a problem.
- Praise without substance ("great work this week"). Specifics only.
- Restrictive-diet brand names (keto, paleo, intermittent fasting as a brand) unless reframed as a state-aware tool.

OUTPUT FORMAT:
Return ONLY a single JSON object, no preamble, no markdown fences. Schema:

{
  "interpretation": "string (required, 100-180 words)",
  "reframe": "string OR null (optional, 60-120 words when present)",
  "next_focus": "string (required, 40-100 words)"
}

If reframe is not warranted, the value MUST be the JSON literal null, not an empty string and not the string "null".`
}

export function buildFeedbackUserPrompt(input: {
  client: ClientFactsContext
  cffs: FeedbackCFFSContext | null
  thisCheckin: {
    weekNumber: number
    formType: 'A' | 'B'
    submittedAt: string
    responses: Record<string, string>
  }
  priorCheckins: PriorCheckinSummary[]
  program: ProgramContext | null
}): string {
  const { client, cffs, thisCheckin, priorCheckins, program } = input

  const lines: string[] = []

  lines.push('CLIENT')
  lines.push(`First name: ${client.firstName}`)
  if (client.medications && client.medications.trim()) {
    lines.push(`Medications: ${client.medications.trim()}`)
  }
  if (client.dietaryRestrictions && client.dietaryRestrictions.trim()) {
    lines.push(`Dietary restrictions: ${client.dietaryRestrictions.trim()}`)
  }
  if (client.dietaryPreferences && client.dietaryPreferences.trim()) {
    lines.push(`Dietary preferences: ${client.dietaryPreferences.trim()}`)
  }
  if (client.readinessStatus) {
    lines.push(`Readiness status (from signal monitor): ${client.readinessStatus}`)
  }
  if (client.readinessDriftMessages.length > 0) {
    lines.push('Active drift signals:')
    for (const m of client.readinessDriftMessages) lines.push(`  - ${m}`)
  }
  lines.push('')

  if (cffs) {
    lines.push('COACH-FACING FOUNDATIONAL SYNTHESIS (CFFS)')
    if (cffs.body_state_classification) lines.push(`Body state: ${cffs.body_state_classification}`)
    if (cffs.resolution_state) lines.push(`Resolution state: ${cffs.resolution_state}`)
    if (cffs.exposure_readiness_capacity || cffs.exposure_readiness_regulation || cffs.exposure_readiness_behaviour) {
      lines.push(
        `Exposure readiness: capacity ${cffs.exposure_readiness_capacity ?? '-'}, regulation ${cffs.exposure_readiness_regulation ?? '-'}, behaviour ${cffs.exposure_readiness_behaviour ?? '-'}`
      )
    }
    if (cffs.client_context_summary) {
      lines.push('Client context summary:')
      lines.push(cffs.client_context_summary)
    }
    if (cffs.primary_patterns_and_signals) {
      lines.push('Primary patterns and signals:')
      lines.push(cffs.primary_patterns_and_signals)
    }
    if (cffs.capacity_constraints_and_guardrails) {
      lines.push('Capacity constraints and guardrails:')
      lines.push(cffs.capacity_constraints_and_guardrails)
    }
    if (cffs.risk_flags_and_watch_items) {
      lines.push('Risk flags and watch items:')
      lines.push(cffs.risk_flags_and_watch_items)
    }
    lines.push('')
  } else {
    lines.push('COACH-FACING FOUNDATIONAL SYNTHESIS (CFFS): none on file yet. Interpret conservatively.')
    lines.push('')
  }

  if (program) {
    lines.push('ACTIVE PROGRAM')
    if (program.blockName) lines.push(`Block: ${program.blockName}`)
    if (program.weekInBlock && program.weekDuration) {
      lines.push(`Week-in-block: ${program.weekInBlock} of ${program.weekDuration}`)
    }
    if (program.rpeCreepSummary) {
      lines.push(`RPE creep monitor: ${program.rpeCreepSummary}`)
    }
    lines.push('')
  }

  lines.push(`THIS CHECK-IN — Week ${thisCheckin.weekNumber} Form ${thisCheckin.formType}`)
  lines.push(`Submitted: ${new Date(thisCheckin.submittedAt).toISOString().slice(0, 10)}`)
  lines.push(renderCheckinResponses(thisCheckin.formType, thisCheckin.responses))
  lines.push('')

  if (priorCheckins.length > 0) {
    lines.push('PRIOR CHECK-INS (most recent first, use to read direction-of-change)')
    for (const p of priorCheckins) {
      lines.push(`--- Week ${p.weekNumber} Form ${p.formType} (submitted ${new Date(p.submittedAt).toISOString().slice(0, 10)})`)
      lines.push(renderCheckinResponses(p.formType, p.responses))
      lines.push('')
    }
  } else {
    lines.push('PRIOR CHECK-INS: none. This is the client\'s first check-in — interpret without trend language.')
    lines.push('')
  }

  lines.push('TASK')
  lines.push(`Draft the three-field coach response for ${client.firstName} based on the check-in and context above. Return JSON only.`)

  return lines.join('\n')
}

function renderCheckinResponses(
  formType: 'A' | 'B',
  responses: Record<string, string>
): string {
  const sections = formType === 'A' ? FORM_A_SECTIONS : FORM_B_SECTIONS
  const out: string[] = []
  for (const section of sections) {
    const answered = section.questions.filter(q => (responses[q.id] ?? '').toString().trim())
    if (answered.length === 0) continue
    out.push(`[${section.title}]`)
    for (const q of answered) {
      out.push(`Q: ${q.text}`)
      out.push(`A: ${responses[q.id]}`)
    }
  }
  return out.join('\n')
}

/**
 * Em dash stripper. Applied to every string in the JSON the model returns, so
 * a stray dash from the model can't slip past the [[feedback_no_em_dashes]]
 * rule and into a client email. Matches the cleaner used by the Foundational
 * Reading generator.
 */
export function stripEmDashes<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/—/g, ', ') as T
  if (Array.isArray(value)) return value.map(stripEmDashes) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripEmDashes(v)])
    ) as T
  }
  return value
}

/**
 * Internal terminology the client has never seen. Surfaces as a generation
 * failure so the coach can regenerate rather than ship leaked jargon. The
 * system prompt already forbids these explicitly; this is the second line
 * of defence.
 */
const BANNED_CLIENT_TERMS: RegExp[] = [
  // Acronyms
  /\bCFFS\b/i,
  /\bCFWS\b/i,
  /\bRPE\b/i,
  /\bRPE creep\b/i,
  // Internal naming
  /\bcoach[- ]facing\b/i,
  /\b(foundational|weekly) synthesis\b/i,
  /\bthe synthesis\b/i,
  /\bspatial patterning\b/i,
  /\b(exposure|capacity|regulation|behaviour|behavior) readiness\b/i,
  /\bdrift advisory\b/i,
  /\breassessment trigger\b/i,
  /\b(signal|readiness) monitor\b/i,
  /\bresolution state\b/i,
  /\bbody state classification\b/i,
  // Internal arc / pattern jargon
  /\bmid[- ]arc\b/i,
  /\blong[- ]arc\b/i,
  /\bstress[- ]belt\b/i,
  /\bwired[- ]but[- ]tired\b/i,
  // Clinical / physiological jargon
  /\b(sympathetic|parasympathetic) dominance\b/i,
  /\bsympathetic (overdrive|activation|load)\b/i,
  /\bfight[- ]or[- ]flight\b/i,
  /\bautonomic\b/i,
  /\bnervous system (overdrive|dysregulation|dysregulated)\b/i,
  /\bhpa axis\b/i,
  /\bcortisol\b/i,
  /\bdownregulation\b/i,
]

export function findLeakedTerms(text: string): string[] {
  const hits: string[] = []
  for (const re of BANNED_CLIENT_TERMS) {
    const match = text.match(re)
    if (match) hits.push(match[0])
  }
  return hits
}
