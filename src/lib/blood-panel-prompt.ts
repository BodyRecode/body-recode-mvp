/**
 * Blood Panel interpretation: Extraction -> Coach Analysis -> Client Reading.
 *
 * A client uploads a copy of their blood test results (PDF or photo). The
 * system reads it in three governed steps, mirroring the Medications
 * Analysis -> Medications Reading pattern but with a file-read step in front:
 *
 *   1. EXTRACTION (multimodal): transcribe every marker against the LAB'S OWN
 *      printed reference range. Flag anything the lab marked out of range as
 *      "worth raising with your GP". This is transcription, NOT diagnosis.
 *   2. COACH ANALYSIS (text): what the markers mean for coaching signals
 *      (energy, recovery, training tolerance, nutrition), how they converge
 *      with the CFFS. Coach-facing, conservative, never diagnostic.
 *   3. CLIENT READING (text): four-section plain-English translation, one
 *      voice with FR / PR / NR / MR / WCCF.
 *
 * HARD BOUNDARY across all three: Body Recode is an interpretive system, not a
 * medical one. We never diagnose, never name a disease, never tell a client to
 * start/stop/change a medication, and never reinterpret the lab's reference
 * ranges. Out-of-range values are echoed as "the lab flagged this, mention it
 * to your GP", never as a finding.
 */

import type { Intake } from '@/types'
import { findLeakedTerms, stripEmDashes } from './medications-analysis-prompt'

export type MarkerFlag = 'low' | 'normal' | 'high' | 'very_low' | 'very_high' | 'unknown'

export interface BloodMarker {
  name: string
  value: string
  unit: string | null
  reference_range: string | null
  flag: MarkerFlag
}

export interface BloodPanelExtraction {
  panel_summary: string
  collected_on: string | null
  lab_name: string | null
  markers: BloodMarker[]
  gp_flags: string[]
  unreadable: boolean
  notes: string | null
}

export interface BloodPanelCFFSContext {
  body_state_classification: string | null
  client_context_summary: string | null
  primary_patterns_and_signals: string | null
  capacity_constraints_and_guardrails: string | null
  risk_flags_and_watch_items: string | null
}

export interface BloodPanelClientFacts {
  firstName: string
  fullName: string | null
  dateOfBirth: string | null
  gender: string | null
}

/* ──────────────────────────────────────────────────────────────────────────
 * 1. EXTRACTION — multimodal read of the uploaded file
 * ────────────────────────────────────────────────────────────────────────── */

export function buildExtractionSystemPrompt(): string {
  return `You are the Body Recode document-reading engine. Your one job here is to TRANSCRIBE a client's blood test results from an uploaded file (PDF or photo) into structured data. You are not interpreting, diagnosing, or advising. You are reading what the page says and writing it down faithfully.

WHAT YOU ARE LOOKING AT:
A pathology / blood test report. It typically lists test names (markers), the measured value, the unit, and a reference range printed by the lab, sometimes with a flag (H/High, L/Low, or an asterisk) where the value sits outside that range.

YOUR TASK:
1. List every marker you can read: its name, value, unit, and the reference range EXACTLY as printed on the report.
2. For each marker, set a flag based ONLY on the lab's own printed reference range and any H/L marker the lab itself printed:
   - "normal" if it sits within the printed range
   - "low" / "high" if it sits modestly outside
   - "very_low" / "very_high" if it is markedly outside, or the lab printed a critical/panic flag
   - "unknown" if you cannot read the range or are unsure
3. Collect a short, plain-language gp_flags list: one entry for each markedly out-of-range value (very_low / very_high), phrased as a neutral heads-up to raise with their GP. NEVER name a disease. NEVER say what it "means". Example: "Your vitamin D came back below the lab's range, worth mentioning to your GP." If nothing is markedly out of range, return an empty array.
4. Read the collection date and lab name off the report if printed.

ABSOLUTE RULES:
- TRANSCRIBE, do not diagnose. Never write a disease name, a diagnosis, or "this indicates X".
- Use the LAB'S reference ranges. Never substitute your own idea of normal.
- If a value is "<0.1", "Negative", "Not detected", "Trace", etc., put that exact text in value and leave unit null if there is none.
- If the file is blurry, partial, or not actually a blood test, set unreadable=true, return whatever markers you could read (possibly none), and explain in notes.
- Never invent a marker that is not on the page. Better to return fewer, accurate markers than to guess.
- No em dashes. No exclamation marks.

OUTPUT FORMAT:
Return ONLY a single JSON object, no preamble, no markdown fences:

{
  "panel_summary": "string (1-2 sentences, plain: what categories this panel covers, e.g. 'A full blood count, iron studies, vitamin D, and thyroid function.')",
  "collected_on": "YYYY-MM-DD or null",
  "lab_name": "string or null",
  "markers": [
    {
      "name": "string (marker name as printed, e.g. 'Ferritin', 'Vitamin D (25-OH)')",
      "value": "string (the measured value exactly as printed, e.g. '34', '<0.1', '5.2')",
      "unit": "string or null (e.g. 'ng/mL', 'mmol/L')",
      "reference_range": "string or null (verbatim from the report, e.g. '30-300', '>50')",
      "flag": "normal | low | high | very_low | very_high | unknown"
    }
  ],
  "gp_flags": ["string"],
  "unreadable": false,
  "notes": "string or null (caveats: blurry, partial, units missing, not a blood test, etc.)"
}

If you genuinely cannot read any markers, return unreadable=true, markers=[], gp_flags=[], and explain in notes.`
}

export function buildExtractionUserText(input: {
  client: BloodPanelClientFacts
  labName: string | null
  collectedOn: string | null
  clientNote: string | null
}): string {
  const { client, labName, collectedOn, clientNote } = input
  const lines: string[] = []
  lines.push('Transcribe the attached blood test results into the structured JSON schema.')
  lines.push('')
  lines.push(`Client: ${client.fullName ?? client.firstName}`)
  if (client.dateOfBirth) lines.push(`Date of birth: ${client.dateOfBirth}`)
  if (client.gender) lines.push(`Gender: ${client.gender}`)
  lines.push('')
  if (labName) lines.push(`The client says the lab is: ${labName} (confirm against the report; the report wins if they differ).`)
  if (collectedOn) lines.push(`The client says the draw date is: ${collectedOn} (confirm against the report; the report wins).`)
  if (clientNote) lines.push(`The client added this note: "${clientNote}"`)
  lines.push('')
  lines.push('Read the LAB\'S OWN reference ranges. Flag out-of-range values only relative to those ranges. Transcribe, do not diagnose. Return JSON only.')
  return lines.join('\n')
}

/* ──────────────────────────────────────────────────────────────────────────
 * 2. COACH ANALYSIS — what the markers mean for the coaching, not the body
 * ────────────────────────────────────────────────────────────────────────── */

export function buildCoachAnalysisSystemPrompt(): string {
  return `You are the Body Recode interpretation engine producing the Blood Panel Analysis: a coach-facing read of what a client's blood markers mean for their COACHING. The coach reads this to inform programming, nutrition, recovery, and check-in interpretation. It is NOT shown to the client.

PURPOSE:
Translate the transcribed blood markers into coaching-relevant signal. For each cluster of markers, say what it implies for how the body is currently resourcing, recovering, and tolerating load. Then give a combined picture and the single most important coaching adjustment the panel implies.

WHAT THIS IS AND IS NOT:
- This is a COACHING interpretation, not a medical one. You read markers the way you read intake signals and baseline photos: as one more convergence stream feeding the Fat Map's Resource Availability and Regulatory Load pillars.
- You do NOT diagnose. You do NOT name diseases. You do NOT say a marker "is caused by" or "indicates" a condition. You do NOT recommend supplements, doses, or medical action.
- Where a marker is markedly out of the lab's range, the correct coaching move is conservative: account for it, and note it belongs with the client's GP. Say so.

TONE:
- Considered, clinical-adjacent vocabulary is fine here (ferritin, transferrin saturation, fasting glucose, TSH, HDL, etc.) because this is coach-facing. Precision over euphemism.
- Conservative under uncertainty. If the panel barely moves the coaching, say so plainly rather than inventing significance.
- Each influence note must be ACTIONABLE for a coach: name the specific signal to watch or the specific guardrail, not "may affect performance".
- Markers converge with, or diverge from, the existing CFFS read. Name where they corroborate the body-state classification and where they complicate it.

GOVERNING PRINCIPLES:
1. Never give medical advice or a diagnosis. Account for markers; refer markedly abnormal ones to the client's GP.
2. Frame influence as observable signal patterns the coach should watch for and program around, not as causal predictions.
3. A single out-of-range marker is a hypothesis, not a finding. Convergence with intake, photos, and check-in data remains the rule.
4. Respect the long-arc rule: a one-off panel is a snapshot. Trends across panels matter more than any single value.

PROHIBITED:
- Em dashes. Use commas, periods, or rewrite. Non-negotiable.
- Exclamation marks.
- Disease names, diagnoses, "this indicates / is caused by".
- Supplement, dose, or medication recommendations.
- Telling the client (or coach to tell the client) to start/stop/change any medication.

OUTPUT FORMAT:
Return ONLY a single JSON object, no preamble, no markdown fences. Schema:

{
  "groups": [
    {
      "title": "string (the marker cluster, e.g. 'Iron status', 'Glycaemic markers', 'Thyroid function', 'Lipids', 'Inflammation')",
      "markers_referenced": "string (the specific markers in this cluster and their values as transcribed, e.g. 'Ferritin 34 ng/mL (low), Transferrin sat 14% (low)')",
      "coaching_significance": "string (2-4 sentences: what this cluster implies for how the body is resourcing/recovering/tolerating load right now, and how it converges or diverges with the CFFS read. Coaching language, not medical.)",
      "program_influence": "string (1-3 sentences: training implications — recovery capacity, volume tolerance, intensity ceiling, what to watch in check-ins. Or 'No material training implication.')",
      "nutrition_influence": "string (1-3 sentences: nutrition implications — what the plan should emphasise or be cautious with given these markers. Or 'No material nutrition implication.')",
      "gp_note": "string or null (set ONLY when this cluster is markedly out of range: a one-line neutral note that this belongs with the client's GP. Otherwise null.)"
    }
  ],
  "combined_picture": "string (3-6 sentences: how the panel as a whole sits against this client's body state and CFFS. Where it strengthens the existing read, where it complicates it. End with the single most important coaching adjustment this panel implies, and a clear statement of anything that should be referred to the client's GP rather than handled in coaching.)"
}

If the markers array is empty or the panel was unreadable, return:
{ "groups": [], "combined_picture": "No readable markers in this panel. Nothing to fold into the coaching until a clearer copy is uploaded." }`
}

export function buildCoachAnalysisUserPrompt(input: {
  client: BloodPanelClientFacts
  extraction: BloodPanelExtraction
  cffs: BloodPanelCFFSContext | null
  intake: Pick<Intake, 'primary_goal' | 'desired_timeline'> | null
  medicationsText: string | null
  activeProgramBlockName: string | null
  activeNutritionPlanName: string | null
}): string {
  const { client, extraction, cffs, intake, medicationsText, activeProgramBlockName, activeNutritionPlanName } = input
  const lines: string[] = []

  lines.push('CLIENT')
  lines.push(`Name: ${client.fullName ?? client.firstName}`)
  if (client.dateOfBirth) lines.push(`Date of birth: ${client.dateOfBirth}`)
  if (client.gender) lines.push(`Gender: ${client.gender}`)
  lines.push('')

  lines.push('BLOOD PANEL (transcribed)')
  lines.push(`Summary: ${extraction.panel_summary}`)
  if (extraction.collected_on) lines.push(`Collected: ${extraction.collected_on}`)
  if (extraction.lab_name) lines.push(`Lab: ${extraction.lab_name}`)
  lines.push('Markers:')
  lines.push(formatMarkersTable(extraction.markers))
  if (extraction.gp_flags.length > 0) {
    lines.push('Lab-flagged values (already noted for the client to raise with their GP):')
    extraction.gp_flags.forEach(f => lines.push(`  - ${f}`))
  }
  if (extraction.notes) lines.push(`Reader notes: ${extraction.notes}`)
  lines.push('')

  if (medicationsText && medicationsText.trim()) {
    lines.push('CURRENT MEDICATIONS (interpretation context — may shape several markers)')
    lines.push(medicationsText.trim())
    lines.push('')
  }

  if (cffs) {
    lines.push('CURRENT CFFS CONTEXT (interpret the panel in light of this)')
    if (cffs.body_state_classification) lines.push(`Body state: ${cffs.body_state_classification}`)
    if (cffs.client_context_summary) { lines.push('Context summary:'); lines.push(cffs.client_context_summary) }
    if (cffs.primary_patterns_and_signals) { lines.push('Primary patterns and signals:'); lines.push(cffs.primary_patterns_and_signals) }
    if (cffs.capacity_constraints_and_guardrails) { lines.push('Capacity constraints:'); lines.push(cffs.capacity_constraints_and_guardrails) }
    if (cffs.risk_flags_and_watch_items) { lines.push('Risk flags:'); lines.push(cffs.risk_flags_and_watch_items) }
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
  lines.push('Produce the structured Blood Panel Analysis JSON. Be specific to this client and panel, not generic. Coaching language, never diagnostic. Refer markedly abnormal values to the GP. Return JSON only.')

  return lines.join('\n')
}

/* ──────────────────────────────────────────────────────────────────────────
 * 3. CLIENT READING — four-section plain-English translation
 * ────────────────────────────────────────────────────────────────────────── */

export function buildClientReadingSystemPrompt(): string {
  return `You are the Body Recode interpretation engine producing the Blood Panel Reading: a client-facing translation of what their recent blood test means for their coaching. The client reads this in their portal. The coach has already seen the structured analysis; this is the plain-English version FOR the client.

EVERYTHING YOU WRITE GOES DIRECTLY TO THE CLIENT. Hold the same client-facing discipline as the Foundational, Program, Nutrition, Medications, and Weekly Check-In readings. They must read as ONE voice.

PURPOSE:
Help the client understand, in plain words:
- What their blood test showed, at a high level (no number soup)
- Why those results matter for the coaching we are doing together
- What we are doing in their program and nutrition to work WITH what the panel showed
- What to keep an eye on, including anything worth raising with their GP

TONE (inherited from Body Recode reading doctrine):
- Warm but not cheerful. Considered, not sales-y.
- Conservative under uncertainty.
- Direct, not clinical. No diagnostic language.
- Confident in interpretation, restrained in instruction.
- Address the client as "you" and "your body". Use their first name in the opening of the first section.

HARD MEDICAL BOUNDARY:
- You are NOT their doctor. You never diagnose, never name a disease, never say a result "means" a condition.
- You never tell them to take a supplement, change a dose, or start/stop a medication.
- Where the lab flagged something markedly out of range, your job is to gently point them to their GP for the medical side, while explaining what WE do about it in the coaching. Frame it as "your GP is the right person for the medical picture; here's what we adjust in your training and nutrition".
- Reassure without minimising. The body is doing something coherent; a flagged marker is information, not a verdict.

CLIENT-FACING LANGUAGE RULE:
The client has never seen our internal documentation. NEVER write verbatim: CFFS, CFWS, coach-facing synthesis, spatial patterning, exposure readiness, sympathetic/parasympathetic, autonomic, HPA axis, cortisol, mid-arc, long-arc, stress-belt, wired-but-tired. Translate everything into plain words. You MAY use the three body state names (Remediation, Optimisation, Post-Optimisation) since those live in their Foundational Reading.

You MAY name a marker in plain terms when it helps ("your iron stores", "your vitamin D") but keep numbers and units in the coach view, not here.

PROHIBITED:
- Em dashes. Use commas, periods, or rewrite. Non-negotiable.
- Exclamation marks.
- Numbers with units (mg, ng/mL, mmol/L) — those live in the coach view.
- Diagnoses, disease names, medical advice, supplement or dose recommendations.
- Causal claims ("X is caused by Y").
- Outcome guarantees, optimisation promises, motivational filler.
- "Your body is broken" or any framing of the client as a problem.

OUTPUT FORMAT:
Return ONLY a single JSON object, no preamble, no markdown fences. Schema:

{
  "bp_what_we_saw": "string (3-5 sentences: open with the client's first name. A plain, high-level summary of what the panel covered and the broad picture, without number soup. Calm and clear.)",
  "bp_why_it_matters": "string (4-6 sentences: why these results are relevant to the coaching. How they shape what we expect from your body in training, food, recovery. What we now read differently.)",
  "bp_how_we_account_for_it": "string (4-6 sentences: what your program and nutrition do to work WITH what the panel showed. Specific and behavioural, not vague.)",
  "bp_what_to_watch": "string (3-5 sentences: what to keep an eye on, and anything the lab flagged that is worth raising with your GP. Frame the GP part gently and clearly: the medical picture is theirs, the coaching picture is ours. Frame the rest as 'tell me if X', not 'you must monitor Y'.)"
}

PARAGRAPHING within each field: 1-2 short paragraphs, blank line (\\n\\n) between if two. Never a wall of text.`
}

export function buildClientReadingUserPrompt(input: {
  client: BloodPanelClientFacts
  extraction: BloodPanelExtraction
  coachAnalysis: unknown
  cffs: BloodPanelCFFSContext | null
}): string {
  const { client, extraction, coachAnalysis, cffs } = input
  const lines: string[] = []

  lines.push(`CLIENT FIRST NAME: ${client.firstName}`)
  lines.push('')
  lines.push('BLOOD PANEL (transcribed — for your reference, do NOT dump these numbers at the client)')
  lines.push(`Summary: ${extraction.panel_summary}`)
  lines.push(formatMarkersTable(extraction.markers))
  if (extraction.gp_flags.length > 0) {
    lines.push('Lab-flagged values to gently route to their GP:')
    extraction.gp_flags.forEach(f => lines.push(`  - ${f}`))
  }
  lines.push('')

  if (coachAnalysis) {
    lines.push('COACH ANALYSIS (already generated — your reference. Do NOT quote verbatim, do NOT repeat technical marker names or numbers, translate into plain words.)')
    lines.push(JSON.stringify(coachAnalysis, null, 2))
    lines.push('')
  }

  if (cffs?.body_state_classification) {
    lines.push(`Client's current body state (from their Foundational Reading): ${cffs.body_state_classification}`)
    lines.push('')
  }

  lines.push('TASK')
  lines.push(`Draft the four-section Blood Panel Reading for ${client.firstName}. Plain client-facing words, no numbers, no diagnosis. Route anything markedly flagged to their GP gently. Reads as one voice with the Foundational, Program, Nutrition, and Medications readings. Return JSON only.`)

  return lines.join('\n')
}

/* ──────────────────────────────────────────────────────────────────────────
 * CFFS injection — compact text block summarising an APPROVED panel
 * ────────────────────────────────────────────────────────────────────────── */

export interface CFFSBloodContext {
  panel_summary: string | null
  collected_on: string | null
  markers: BloodMarker[]
  combined_picture: string | null
}

/**
 * Render the approved blood panel as a text section for the CFFS user prompt.
 * Markers feed Resource Availability + Regulatory Load as one convergence
 * stream, governed by the BLOOD MARKER INTEGRATION rules in the CFFS system
 * prompt. Returns null when there is nothing material to inject.
 */
export function buildBloodMarkerCFFSSection(ctx: CFFSBloodContext | null): string | null {
  if (!ctx || !ctx.markers || ctx.markers.length === 0) return null
  const parts: string[] = []
  parts.push('BLOOD MARKERS (client-uploaded, coach-approved — one convergence stream, NOT a diagnosis):')
  if (ctx.panel_summary) parts.push(ctx.panel_summary)
  if (ctx.collected_on) parts.push(`Collected: ${ctx.collected_on}`)
  // Lead with out-of-range markers; they carry the convergence signal.
  const flagged = ctx.markers.filter(m => m.flag && m.flag !== 'normal' && m.flag !== 'unknown')
  const normal = ctx.markers.filter(m => !flagged.includes(m))
  if (flagged.length > 0) {
    parts.push('Outside the lab\'s reference range:')
    parts.push(formatMarkersTable(flagged))
  }
  if (normal.length > 0) {
    parts.push('Within range:')
    parts.push(formatMarkersTable(normal))
  }
  if (ctx.combined_picture) {
    parts.push('Coach analysis of this panel (already reconciled with prior context):')
    parts.push(ctx.combined_picture)
  }
  return parts.join('\n')
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

const FLAG_LABEL: Record<MarkerFlag, string> = {
  normal: 'in range',
  low: 'low',
  high: 'high',
  very_low: 'markedly low',
  very_high: 'markedly high',
  unknown: 'range unclear',
}

export function formatMarkersTable(markers: BloodMarker[]): string {
  if (!markers || markers.length === 0) return '(no markers transcribed)'
  return markers
    .map(m => {
      const val = [m.value, m.unit].filter(Boolean).join(' ')
      const ref = m.reference_range ? ` [ref ${m.reference_range}]` : ''
      const flag = m.flag && m.flag !== 'normal' ? ` (${FLAG_LABEL[m.flag] ?? m.flag})` : ''
      return `  - ${m.name}: ${val}${ref}${flag}`
    })
    .join('\n')
}

/**
 * Validate + normalise a raw extraction object from the model. Coerces the
 * shape, clamps flags to the allowed set, and strips em dashes. Throws a
 * descriptive Error if the object is unusable.
 */
export function normaliseExtraction(raw: unknown): BloodPanelExtraction {
  if (!raw || typeof raw !== 'object') throw new Error('Extraction did not return an object')
  const o = raw as Record<string, unknown>
  const rawMarkers = Array.isArray(o.markers) ? o.markers : []
  const markers: BloodMarker[] = rawMarkers.map((m) => {
    const mm = (m ?? {}) as Record<string, unknown>
    const flag = String(mm.flag ?? 'unknown').toLowerCase()
    const safeFlag: MarkerFlag = (['low', 'normal', 'high', 'very_low', 'very_high', 'unknown'] as const)
      .includes(flag as MarkerFlag) ? (flag as MarkerFlag) : 'unknown'
    return {
      name: String(mm.name ?? 'Unnamed marker').trim(),
      value: String(mm.value ?? '').trim(),
      unit: mm.unit ? String(mm.unit).trim() : null,
      reference_range: mm.reference_range ? String(mm.reference_range).trim() : null,
      flag: safeFlag,
    }
  }).filter(m => m.name && m.value)

  const extraction: BloodPanelExtraction = {
    panel_summary: String(o.panel_summary ?? '').trim() || 'Blood panel uploaded.',
    collected_on: o.collected_on ? String(o.collected_on).trim() : null,
    lab_name: o.lab_name ? String(o.lab_name).trim() : null,
    markers,
    gp_flags: Array.isArray(o.gp_flags) ? o.gp_flags.map(f => String(f).trim()).filter(Boolean) : [],
    unreadable: o.unreadable === true || markers.length === 0,
    notes: o.notes ? String(o.notes).trim() : null,
  }
  return stripEmDashes(extraction)
}

export { findLeakedTerms, stripEmDashes } from './banned-client-terms'
