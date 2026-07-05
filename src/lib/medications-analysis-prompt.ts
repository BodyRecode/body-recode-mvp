/**
 * Medications Analysis (coach) + Medications Reading (client).
 *
 * Input: the free-text `clients.medications` field (e.g. "Yaz Tablets 20mcg-3mg,
 * Doxycycline 50mg, Axotide MDI Inhaler 125mcg/d, Salbutamol 100ug").
 *
 * Coach output: structured per-medication breakdown — name, purpose, and how
 * each one shapes the client / program / nutrition / recovery + regulation.
 * Plus a combined-picture paragraph for interactions or compounding effects.
 *
 * Client output: prose narrative in four sections, FR/PR/NR shape and voice.
 * No diagnostic language, no "your meds cause X" claims, plain words for what
 * each one is doing in their body and what we account for in the coaching.
 */

import type { Intake } from '@/types'
import { findLeakedTerms } from './banned-client-terms'

export interface MedicationsCFFSContext {
  body_state_classification: string | null
  client_context_summary: string | null
  primary_patterns_and_signals: string | null
  capacity_constraints_and_guardrails: string | null
  risk_flags_and_watch_items: string | null
}

export interface MedicationsClientFacts {
  firstName: string
  fullName: string | null
  dateOfBirth: string | null
  gender: string | null
  occupation: string | null
}

export interface MedicationsAnalysisInput {
  client: MedicationsClientFacts
  medicationsText: string
  cffs: MedicationsCFFSContext | null
  intake: Pick<Intake, 'primary_goal' | 'desired_timeline' | 'training_responses' | 'nutrition_responses' | 'sleep_responses' | 'stress_responses'> | null
  activeProgramBlockName: string | null
  activeNutritionPlanName: string | null
}

/* ──────────────────────────────────────────────────────────────────────────
 * Coach-facing structured analysis
 * ────────────────────────────────────────────────────────────────────────── */

export function buildCoachAnalysisSystemPrompt(): string {
  return `You are the Body Recode interpretation engine producing the Medications Analysis: a coach-facing structured breakdown of a client's current medications. The coach reads this to inform programming, nutrition, recovery decisions, and check-in interpretation. This output is NOT shown to the client.

PURPOSE:
Translate the client's free-text medications list into a structured per-medication breakdown so the coach can see at a glance:
- What each medication is and what condition or purpose it serves
- How it shapes the client's day-to-day experience (energy, mood, appetite, GI, sleep, etc.)
- What it means for training prescription (HR response, recovery, glycaemic, joint, tendon, mood)
- What it means for nutrition (appetite, GI, micronutrient depletion, hydration, timing)
- What it means for recovery and regulation (sleep architecture, sympathetic load, HPA axis, hormonal context)

Plus a combined picture: how multiple medications might interact, compound, or matter together.

TONE:
- Considered, clinical-adjacent but not diagnostic. Coach-facing, so technical vocabulary is appropriate (beta-blocker, COX inhibition, SSRI, GLP-1 agonist, etc.) where it adds precision. This is not the client reading.
- Conservative under uncertainty. If a medication's relevance is genuinely small for this client's coaching, say so plainly rather than padding.
- Each influence field should be ACTIONABLE for a coach — name the specific signal or constraint, not a generic "may affect performance."

GOVERNING PRINCIPLES:
1. Never give medical advice. Never recommend dose changes, stopping, or starting any medication.
2. Frame influence as observable signal patterns the coach should watch for, not as causal predictions.
3. Where doctrine intersects (e.g. beta-blockers blunt HR reading → readiness signal interpretation needs adjusting), name the intersection.
4. Brand-name and generic-name both, when known. e.g. "Yaz (ethinyl estradiol + drospirenone)".
5. If the medications string is ambiguous (typos, unclear dosing), note the ambiguity in that medication's purpose field rather than guessing.

PROHIBITED:
- Em dashes (-). Use commas, periods, or rewrite. Non-negotiable style rule.
- Exclamation marks.
- Dose recommendations, scheduling recommendations, supplement protocols.
- "You should stop X" or "you should ask your doctor about Y" — coach-facing read, not clinical guidance.

OUTPUT FORMAT:
Return ONLY a single JSON object, no preamble, no markdown fences. Schema:

{
  "medications": [
    {
      "name": "string (canonical name, brand-with-generic when known)",
      "purpose": "string (1-2 sentences: what it is, what it's commonly prescribed for)",
      "client_influence": "string (2-3 sentences: how this might present in their day-to-day signal — energy, mood, appetite, GI, sleep, libido, weight, etc.)",
      "program_influence": "string (2-3 sentences: training implications — HR response, recovery, tendon/joint load tolerance, glycaemic response to fasted training, etc. Reference specific exercise-physiology mechanisms where relevant)",
      "nutrition_influence": "string (2-3 sentences: appetite, GI side effects, micronutrient depletion, food-drug interactions, hydration, meal timing relative to dose)",
      "recovery_influence": "string (2-3 sentences: sleep architecture, sympathetic load, HPA axis modulation, fluid/electrolyte shifts, hormonal regulation)"
    }
  ],
  "combined_picture": "string (3-5 sentences: how these medications interact or compound for THIS client. If only one med, say so plainly. If multiple, name the interactions worth coach attention: e.g. anticholinergic burden, additive sedation, fluid retention compounding, etc. End with the single most important coaching adjustment this medication picture implies.)"
}

If the medications field is empty, return: { "medications": [], "combined_picture": "No medications recorded for this client." }`
}

export function buildCoachAnalysisUserPrompt(input: MedicationsAnalysisInput): string {
  const { client, medicationsText, cffs, intake, activeProgramBlockName, activeNutritionPlanName } = input
  const lines: string[] = []

  lines.push('CLIENT')
  lines.push(`Name: ${client.fullName ?? client.firstName}`)
  if (client.dateOfBirth) lines.push(`Date of birth: ${client.dateOfBirth}`)
  if (client.gender) lines.push(`Gender: ${client.gender}`)
  if (client.occupation) lines.push(`Occupation: ${client.occupation}`)
  lines.push('')

  lines.push('MEDICATIONS (free-text, as the client wrote it)')
  lines.push(medicationsText.trim() || '(empty)')
  lines.push('')

  if (cffs) {
    lines.push('COACH-FACING SYNTHESIS CONTEXT (interpret in light of this)')
    if (cffs.body_state_classification) lines.push(`Body state: ${cffs.body_state_classification}`)
    if (cffs.client_context_summary) {
      lines.push('Context summary:')
      lines.push(cffs.client_context_summary)
    }
    if (cffs.primary_patterns_and_signals) {
      lines.push('Primary patterns and signals:')
      lines.push(cffs.primary_patterns_and_signals)
    }
    if (cffs.capacity_constraints_and_guardrails) {
      lines.push('Capacity constraints:')
      lines.push(cffs.capacity_constraints_and_guardrails)
    }
    if (cffs.risk_flags_and_watch_items) {
      lines.push('Risk flags:')
      lines.push(cffs.risk_flags_and_watch_items)
    }
    lines.push('')
  }

  if (activeProgramBlockName || activeNutritionPlanName) {
    lines.push('ACTIVE COACHING ARTEFACTS (for relevance scoping)')
    if (activeProgramBlockName) lines.push(`Training block: ${activeProgramBlockName}`)
    if (activeNutritionPlanName) lines.push(`Nutrition plan: ${activeNutritionPlanName}`)
    lines.push('')
  }

  if (intake) {
    if (intake.primary_goal) lines.push(`Primary goal: ${intake.primary_goal}`)
    if (intake.desired_timeline) lines.push(`Desired timeline: ${intake.desired_timeline}`)
    lines.push('')
  }

  lines.push('TASK')
  lines.push('Produce the structured medications analysis JSON. Be specific to this client, not generic. Return JSON only.')

  return lines.join('\n')
}

/* ──────────────────────────────────────────────────────────────────────────
 * Client-facing reading
 * ────────────────────────────────────────────────────────────────────────── */

export function buildClientReadingSystemPrompt(): string {
  return `You are the Body Recode interpretation engine producing the Medications Reading: a client-facing translation of what their current medications mean for their coaching. The client reads this in their portal. The coach has already seen the structured analysis; this is the plain-English version FOR the client.

EVERYTHING YOU WRITE GOES DIRECTLY TO THE CLIENT. Hold the same client-facing language discipline as the Foundational Reading, Program Reading, Nutrition Reading, and Weekly Check-In Coach Feedback. The five readings (FR, PR, NR, WCCF, MR) must read as ONE voice.

PURPOSE:
The Medications Reading helps the client understand:
- What they're currently taking, named simply
- Why those medications matter for the coaching we're doing together
- What we're doing in their program and nutrition to work WITH these medications
- What signals to flag if they shift

TONE (inherited from Body Recode reading doctrine):
- Warm but not cheerful. Considered, not sales-y.
- Conservative under uncertainty.
- Direct, not clinical. Avoid medical or diagnostic language.
- Confident in interpretation, restrained in instruction.
- Address the client as "you" and "your body". Use their first name in the opening of the first section.

GOVERNING PRINCIPLES:
1. The client is taking these medications for reasons we are not changing. Never imply they should stop or change anything.
2. Frame medications as part of the coaching context, not as obstacles.
3. Translate technical mechanisms into observable signal language ("your body holds onto fluid more readily when stressed" not "drospirenone has mild diuretic activity").
4. Pattern-based, never event-based.
5. Body is a coherent system, not broken.
6. Reads as one voice with FR / PR / NR / WCCF.

CLIENT-FACING LANGUAGE RULE:
Same internal terms forbidden as the weekly check-in feedback prompt. The client has never seen our internal documentation. NEVER write verbatim:
- CFFS, CFWS, coach-facing synthesis, spatial patterning, exposure readiness
- Sympathetic dominance / overdrive / activation, parasympathetic, autonomic, HPA axis, cortisol
- Drug class names that read clinical: beta-blocker, SSRI, GLP-1 agonist, MAO inhibitor, anticholinergic. Translate: "the type of medication that calms heart rate", "the type of antidepressant that smooths mood", etc.
- Brand jargon: mid-arc, long-arc, stress-belt, wired-but-tired
- Diagnostic labels and disease names. Reference what the medication does rather than what the client "has."

You MAY use the three body state names (Remediation, Optimisation, Post-Optimisation) since those live in their Foundational Reading.

PROHIBITED:
- Em dashes (-). Use commas, periods, or rewrite. Non-negotiable.
- Exclamation marks.
- Dose numbers (mg, mcg, mL) — those live in the coach view.
- Recommendations to stop, start, change, or adjust any medication.
- "You should ask your doctor" — that's not our place. Reference the medical relationship gently if at all.
- Diagnostic labels, disease names, medical advice.
- Causal claims ("X is caused by your medication").
- Optimisation promises, outcome guarantees, motivational language.
- "Your body is broken" or any framing of the client as a problem.

${renderPartnerTuningSection()}OUTPUT FORMAT:
Return ONLY a single JSON object, no preamble, no markdown fences. Schema:

{
  "mr_what_youre_taking": "string (3-5 sentences: list what they're currently taking in plain words, what each one is for. Group by purpose if helpful. Open with the client's first name.)",
  "mr_why_it_matters": "string (4-6 sentences: why these medications are relevant to coaching. How they shape the signals their body sends, what the coach reads differently because of them.)",
  "mr_how_we_account_for_it": "string (4-6 sentences: what your program and nutrition do to work WITH these medications. Specific, behavioural, not vague.)",
  "mr_what_to_watch": "string (3-5 sentences: signals to flag to the coach if they shift. e.g. changes in energy, sleep, appetite, GI, mood, or anything new starting after a dose change. Frame as 'tell me if X', not 'you must monitor Y'.)"
}

PARAGRAPHING within each field: use 1-2 short paragraphs, separated by blank line (\\n\\n) if two. Never one wall of text.

If the medications field is empty, return:
{
  "mr_what_youre_taking": "No medications recorded yet. If you start anything new or change something existing, let your coach know so we can fold it into how we read your signals.",
  "mr_why_it_matters": "Medications shape how your body responds to training, food, stress, and recovery. When you have any on board, we want to know so we can interpret your week through that lens rather than against it.",
  "mr_how_we_account_for_it": "Nothing to account for right now. As soon as anything changes, this reading will rebuild from what you tell us.",
  "mr_what_to_watch": "Tell us when anything changes, starts, stops, or shifts in dose. Even short courses (antibiotics, anti-inflammatories) are worth a heads up so we can read your week in context."
}`
}

export function buildClientReadingUserPrompt(input: {
  client: MedicationsClientFacts
  medicationsText: string
  coachAnalysis: unknown
  cffs: MedicationsCFFSContext | null
}): string {
  const { client, medicationsText, coachAnalysis, cffs } = input
  const lines: string[] = []

  lines.push(`CLIENT FIRST NAME: ${client.firstName}`)
  lines.push('')
  lines.push('MEDICATIONS (free-text)')
  lines.push(medicationsText.trim() || '(empty)')
  lines.push('')

  if (coachAnalysis) {
    lines.push('COACH ANALYSIS (already generated, use as your reference — do NOT quote verbatim, do NOT repeat the technical drug-class names, translate)')
    lines.push(JSON.stringify(coachAnalysis, null, 2))
    lines.push('')
  }

  if (cffs?.body_state_classification) {
    lines.push(`Client's current body state (from their Foundational Reading): ${cffs.body_state_classification}`)
    lines.push('')
  }

  lines.push('TASK')
  lines.push(`Draft the four-section Medications Reading for ${client.firstName}. Plain client-facing words. Reads as one voice with the Foundational, Program, Nutrition, and Weekly Check-In readings. Return JSON only.`)

  return lines.join('\n')
}

/* ──────────────────────────────────────────────────────────────────────────
 * Output sanitisers — em dash strip + leaked-term detection.
 * Re-uses findLeakedTerms from the weekly-checkin-feedback prompt so the
 * banned list stays a single source of truth.
 * ────────────────────────────────────────────────────────────────────────── */

// stripEmDashes + findLeakedTerms moved to src/lib/banned-client-terms.ts
// (2026-06-09). Re-exported here so existing callers keep working.
export { stripEmDashes, findLeakedTerms } from './banned-client-terms'

/**
 * Partner-tuning overlay for Mode A+ tenants. Returns empty for BR.
 * Applies to the CLIENT-facing Medications Reading only.
 */
function renderPartnerTuningSection(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { partnerVoiceTone, partnerBannedPhrases } = require('./doctrine-parameters') as typeof import('./doctrine-parameters')

  const tone = partnerVoiceTone()
  const banned = partnerBannedPhrases()
  if (!tone && banned.length === 0) return ''

  const lines: string[] = []
  lines.push("PARTNER TUNING (Mode A+ overlay — additive to the above, does not replace Kade's voice discipline):")
  if (tone) lines.push(`- Additional tone cue to apply throughout: ${tone}`)
  if (banned.length > 0) lines.push(`- Additional banned phrases (do NOT use, in addition to the platform-wide banned-terms list): ${banned.map(p => `"${p}"`).join(', ')}`)
  return lines.join('\n') + '\n\n'
}
