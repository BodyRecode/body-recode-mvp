/**
 * THE PROGRESS READ: the read re-derived every twelve weeks.
 *
 * Spec: 02_FEATURE_SPECS/2026-09-10_Progress_Read_v2_Spec.md. v1 re-scored body
 * state and held everything else. v2 re-derives the read: body state, pattern,
 * the four readiness ratings, constraints and flags, plus what changed.
 *
 * HOW IT IS BUILT, deliberately
 *
 * It is the Foundational Read run again on everything held NOW (her answers with
 * the Progress Check laid over the intake, the new measurements and photos, the
 * weekly syntheses since, any new bloods), with the same system prompt and the
 * same content checks, PLUS her previous read, the computed comparison, her own
 * account of what changed, and the rules below. One doctrine, not two.
 *
 * It generates ONCE for both readers (spec 4): every read field for the coach,
 * and `for_her`, the shared sections written to her. Her version is never a
 * separate translation, so the two cannot contradict each other.
 *
 * WHAT CODE ENFORCES, not the prompt (the licensing blocker is doctrine that
 * lives only in instructions):
 *   - body state moves at most one step from the previous read
 *   - the sex gate on the two hormone-linked patterns
 *   - a pattern change must name its evidence
 *   - her sections carry no internal vocabulary
 *
 * Like cffs-read.ts: answers in, read out. No database, no login.
 */

import Anthropic from '@anthropic-ai/sdk'
import { buildCFFSSystemPrompt, buildCFFSEvidence, CFFS_OUTPUT_SCHEMA, type CFFSBaselineContext } from '@/lib/cffs-prompt'
import { buildBloodMarkerCFFSSection, type CFFSBloodContext } from '@/lib/blood-panel-prompt'
import { deriveReadinessCarryForward, formatReadinessEvidenceForPrompt, type WeeklyReadinessRow } from '@/lib/readiness-carry-forward'
import { withTemporalContext } from '@/lib/temporal-context'
import { CFFS_MODEL } from '@/lib/ai-models'
import { generateGovernedJson, stripEmDashes } from '@/lib/governed-generation'
import { validateReadOutput, type ReadPhoto } from '@/lib/cffs-read'
import { PATTERN_HORMONE_GUARDRAIL } from '@/lib/fat-map-profile'
import { INTAKE_SECTIONS } from '@/lib/intake-questions'
import { INTAKE_COLUMN_FOR, WHAT_CHANGED_ID } from '@/lib/progress-check-v2'
import type { Answers } from '@/lib/answer-comparison'
import type { Intake } from '@/types'

export const BODY_STATES = ['Remediation', 'Optimisation', 'Post-Optimisation'] as const

export interface PreviousRead {
  kind: 'foundational' | 'progress'
  id: string
  generatedAt: string | null
  body_state_classification: string | null
  pattern_classification: string | null
  pattern_confidence: string | null
  exposure_readiness_capacity: string | null
  exposure_readiness_schedule: string | null
  exposure_readiness_regulation: string | null
  exposure_readiness_behaviour: string | null
  primary_patterns_and_signals: string | null
  capacity_constraints_and_guardrails: string | null
  risk_flags_and_watch_items: string | null
  visual_signal_summary: string | null
}

export interface MeasurementSet {
  bodyweight_kg: number | null
  waist_cm: number | null
  hips_cm: number | null
  chest_cm: number | null
  captured_at: string | null
}

export interface ProgressReadInput {
  /** The intake with her Progress Check answers laid over it (mergeProgressCheckIntoIntake). */
  currentIntake: Partial<Intake>
  medications?: string | null
  /** The capture taken with the Progress Check. */
  baseline?: Omit<CFFSBaselineContext, 'has_photos'> | null
  /** The capture before it, for measurement change. */
  previousMeasurements?: MeasurementSet | null
  photos?: ReadPhoto[]
  bloodPanel?: CFFSBloodContext | null
  /** Weekly syntheses since the previous read. */
  weeklyReadiness?: WeeklyReadinessRow[]
  previousRead: PreviousRead
  /** formatComparisonForPrompt output. */
  comparisonText: string
  whatChanged: string | null
  label?: string
  timeBudgetMs?: number
}

export type ProgressReadResult =
  | { ok: true; read: Record<string, unknown>; stateClamped: boolean; photosUsed: number }
  | { ok: false; error: string }

/**
 * Her answers now: the intake row with every Progress Check answer laid over it,
 * in the intake's own storage shape, so the Foundational Read's evidence builder
 * can read it unchanged. A question not re-asked keeps its intake answer.
 */
export function mergeProgressCheckIntoIntake(intake: Record<string, unknown>, answers: Answers): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...intake }
  const sectionColumn: Record<string, string> = {
    fat_map: 'fat_map_responses', injury: 'injury_responses', training: 'training_responses',
    nutrition: 'nutrition_responses', schedule: 'schedule_responses', sleep: 'sleep_responses',
    stress: 'stress_responses', supplement: 'supplement_responses',
  }
  for (const section of INTAKE_SECTIONS) {
    const column = sectionColumn[section.id]
    if (column) {
      const json: Record<string, unknown> = { ...((intake[column] as Record<string, unknown>) ?? {}) }
      for (const q of section.questions) if (q.type === 'scale' && typeof answers[q.id] === 'number') json[q.id] = answers[q.id]
      merged[column] = json
    }
    if (section.id === 'hormonal') {
      for (const q of section.questions) if (q.id !== 'sex_at_birth' && typeof answers[q.id] === 'string') merged[q.id] = answers[q.id]
    }
  }
  for (const [id, column] of Object.entries(INTAKE_COLUMN_FOR)) {
    const v = answers[id]
    if ((typeof v === 'string' && v.trim() !== '') || Array.isArray(v)) merged[column] = v
  }
  return merged
}

const PROGRESS_READ_DOCTRINE = `
THIS IS A PROGRESS READ, NOT A FIRST READ (Progress Read spec v2.4). Everything above governs it. These rules are added, and where they differ from anything above about a first read, these win.

1. RE-DERIVE, DO NOT COPY. Produce every read field fresh from all the evidence now held. The previous read is context, not an anchor. At twelve weeks the evidence is comparable to or greater than the intake alone, so you are entitled to change the read where the evidence has moved. Holding everything because a previous read exists is the failure this read exists to fix.

2. BODY STATE MOVES AT MOST ONE STEP from the previous read (Remediation, Optimisation, Post-Optimisation). Code enforces this. Say where she was and where she is now.

3. THE PATTERN IS RE-TYPED ON EVIDENCE, NOT ON ONE ANSWER. A change needs converging support from at least two independent sources: the measurements, the photos, the comparison's cluster verdicts, the weekly syntheses, bloods. Self-reported change in where fat sits has never been validated against imaging (03_ESTROGEN_SHIFT evidence), so her answers may corroborate a redistribution but never drive it. Where the evidence does not converge, hold the previous pattern, set pattern_change.changed to false, and say so. Indeterminate remains available under its own rules.

4. WHAT CHANGED COMES ONLY FROM: the cluster verdicts in WHAT CHANGED SINCE THE LAST READ, the measurement change, the photos, the weekly syntheses and bloods. Individual moved items are never a change on their own. HELD is a finding: twelve weeks of stability in someone who arrived unstable is a result, and you must say it plainly rather than reach for movement. No causation, ever: say what moved, never why.

5. FOR_HER IS WRITTEN TO HER. Second person, plain words, the voice of a coach who knows her. It holds only findings: headline, where she is now, what changed, what held, her pattern and why, what the photos and measurements show, what is holding things back, tensions and trade-offs. NEVER in for_her: confidence levels, competing reads, what to watch for, risk flags, capacity constraints, non-directives, operating rules, or any suspicion about her reporting. The test: if getting it wrong in the other direction would hurt her, it is coach-only.

6. HER VOCABULARY. Never use in for_her: Green, Amber or Red as rating words, nor their coach-facing names Not limiting, Limiting or Main limit, CFFS, Remediation, Optimisation, Post-Optimisation, Indeterminate, cluster, convergence, competing read, Fat Map zone codes. Say readiness rather than body state; her readiness words are Depleted, Transitioning and Ready. For no clear pattern, say no single pattern stands out yet and what would show it. ${PATTERN_HORMONE_GUARDRAIL}

7. A CHANGED PATTERN IS THE READ LEARNING, NOT THE FIRST READ BEING WRONG. With twelve more weeks of evidence the picture is clearer; say that. Never say or imply the earlier read was a mistake.

8. NO DIAGNOSIS, NO PRESCRIPTION, in either voice, exactly as for a first read. No em dashes.
`

const PROGRESS_OUTPUT_ADDITIONS = `Return ONE JSON object containing EVERY field of the read schema below, PLUS these additional top-level fields:

  "previous_body_state": "the previous read's body state, exactly as given above",
  "state_direction": "improved" | "held" | "declined",
  "pattern_change": {
    "changed": true | false (false when the previous read named no pattern: that is a first pattern, not a change),
    "from": "the previous pattern, or null",
    "evidence": "REQUIRED when changed is true: the converging evidence, naming at least two independent sources. Empty string when false."
  },
  "what_changed_coach": "3-5 sentences to the coach. What moved and what held, drawn only from the sources in rule 4. Name where a change rests on her corrected answers.",
  "for_her": {
    "headline": "1-2 sentences to her. Where she is now and the one thing that matters most.",
    "where_you_are_now": "2-4 sentences. Her readiness then and now, in her words (Depleted, Transitioning, Ready).",
    "what_has_changed": "3-5 sentences. Only what genuinely moved.",
    "what_has_held": "2-3 sentences. What stayed steady, said as a finding.",
    "your_pattern": "2-4 sentences. Her pattern and what points to it, or that no single pattern stands out yet. If it changed, rule 7.",
    "what_the_photos_and_measurements_show": "2-3 sentences. OMIT this field when there are no new measurements and no photos.",
    "what_is_holding_things_back": "1-2 sentences naming the single biggest limiter plainly.",
    "tensions_and_tradeoffs": "2-3 sentences.",
    "readiness_in_plain_words": {
      "capacity": "1 sentence to her on how much work her body can take and recover from right now. Name whether it is holding things back, without the word Green, Amber or Red.",
      "schedule": "1 sentence on how reliably her week lets training and eating happen. About the shape of her week, never her willingness.",
      "regulation": "1 sentence on sleep and stress load, how settled her system is.",
      "behaviour": "1 sentence on how consistently the plan has happened when the week allowed it. Never a judgement of her character; if it is the limiter, say what would help, not what she failed at."
    }
  }

The read schema:
`

/**
 * Output ceiling. Measured 14 Sep 2026 on Samantha's real data: the first attempt
 * used all 24,000 (thinking included) and returned nothing; the second used
 * 18,479. A Progress Read carries every read field plus her sections plus the
 * comparison to reason over, so it needs more room than a Foundational Read.
 */
const PROGRESS_READ_MAX_TOKENS = 40_000

const FOR_HER_REQUIRED = ['headline', 'where_you_are_now', 'what_has_changed', 'what_has_held', 'your_pattern', 'what_is_holding_things_back', 'tensions_and_tradeoffs'] as const

/** Words that must never reach her. Checked in code; a hit is retried. */
const INTERNAL_VOCABULARY = /\b(CFFS|Remediation|Post-Optimisation|Optimisation|Indeterminate|cluster verdict|convergence|converging|competing read|pattern_confidence|MZ[1-4])\b/i

function measurementChangeSection(prev: MeasurementSet | null | undefined, now: Omit<CFFSBaselineContext, 'has_photos'> | null | undefined): string {
  if (!now) return 'MEASUREMENT CHANGE: no new measurements were taken with this Progress Check.'
  if (!prev) return 'MEASUREMENT CHANGE: no earlier measurements on file to compare with; the new ones are above.'
  const row = (label: string, a: number | null, b: number | null, unit: string) =>
    a != null && b != null ? `${label}: ${a} ${unit} then, ${b} ${unit} now (${b - a >= 0 ? '+' : ''}${Math.round((b - a) * 10) / 10} ${unit})` : null
  const lines = [
    row('Bodyweight', prev.bodyweight_kg, now.bodyweight_kg, 'kg'),
    row('Waist', prev.waist_cm, now.waist_cm, 'cm'),
    row('Hips', prev.hips_cm, now.hips_cm, 'cm'),
    row('Chest', prev.chest_cm, now.chest_cm, 'cm'),
  ].filter(Boolean)
  return `MEASUREMENT CHANGE (${prev.captured_at?.slice(0, 10) ?? 'earlier'} to ${now.captured_at?.slice(0, 10) ?? 'now'}; a tape measure outranks self-report, subject to the plausibility check above):\n${lines.join('\n') || 'Not comparable.'}`
}

function previousReadSection(p: PreviousRead): string {
  const r = (k: keyof PreviousRead) => p[k] ?? 'not recorded'
  return `PREVIOUS READ (the ${p.kind === 'foundational' ? 'Foundational Read' : 'last Progress Read'}, ${p.generatedAt?.slice(0, 10) ?? 'date unknown'}). Context, not an anchor:
Body state: ${r('body_state_classification')}
Pattern: ${r('pattern_classification')} (confidence ${r('pattern_confidence')})
Readiness: capacity ${r('exposure_readiness_capacity')}, schedule ${r('exposure_readiness_schedule')}, regulation ${r('exposure_readiness_regulation')}, behaviour ${r('exposure_readiness_behaviour')}
Primary patterns and signals then: ${r('primary_patterns_and_signals')}
Capacity constraints then: ${r('capacity_constraints_and_guardrails')}
Risk flags then: ${r('risk_flags_and_watch_items')}
What the photos showed then: ${r('visual_signal_summary')}`
}

export async function runProgressRead(input: ProgressReadInput): Promise<ProgressReadResult> {
  const tag = input.label ? `[PROGRESS READ ${input.label}]` : '[PROGRESS READ]'
  const photos = input.photos ?? []
  const baselineContext: CFFSBaselineContext | null = input.baseline ? { ...input.baseline, has_photos: photos.length > 0 } : null
  const prev = input.previousRead
  const sexAtBirth = typeof input.currentIntake.sex_at_birth === 'string' ? input.currentIntake.sex_at_birth : null

  const labelMap = {
    front: 'PROGRESS CHECK PHOTOS - 1 of 3 - Front view (relaxed stance):',
    side: 'PROGRESS CHECK PHOTOS - 2 of 3 - Side view (natural posture):',
    back: 'PROGRESS CHECK PHOTOS - 3 of 3 - Back view (relaxed arms):',
  } as const
  const userContent: Anthropic.Messages.ContentBlockParam[] = []
  for (const p of photos) {
    userContent.push({ type: 'text', text: labelMap[p.label] })
    userContent.push({ type: 'image', source: { type: 'base64', media_type: p.media_type, data: p.base64 } })
  }

  const evidence = buildCFFSEvidence(
    input.currentIntake,
    input.medications ?? null,
    baselineContext,
    buildBloodMarkerCFFSSection(input.bloodPanel ?? null),
    formatReadinessEvidenceForPrompt(deriveReadinessCarryForward(input.weeklyReadiness ?? [], {
      exposure_readiness_capacity: prev.exposure_readiness_capacity,
      exposure_readiness_schedule: prev.exposure_readiness_schedule,
      exposure_readiness_regulation: prev.exposure_readiness_regulation,
      exposure_readiness_behaviour: prev.exposure_readiness_behaviour,
    })),
  )

  userContent.push({
    type: 'text',
    text: `Generate a PROGRESS READ for the following client: the read re-derived from everything held now.

EVIDENCE NOW (her answers are the intake with her Progress Check laid over it):
${evidence}

${previousReadSection(prev)}

${measurementChangeSection(input.previousMeasurements, input.baseline)}

${input.whatChanged?.trim() ? `WHAT HAS CHANGED, in her own words: ${input.whatChanged.trim()}` : 'WHAT HAS CHANGED, in her own words: nothing written.'}

${input.comparisonText}

---

${PROGRESS_OUTPUT_ADDITIONS}${CFFS_OUTPUT_SCHEMA}`,
  })

  const system = withTemporalContext(
    buildCFFSSystemPrompt({ pattern: prev.pattern_classification, source: 'previous_read', confidence: prev.pattern_confidence }) + '\n' + PROGRESS_READ_DOCTRINE,
  )

  const validate = (c: Record<string, unknown>): string | null => {
    const base = validateReadOutput(c)
    if (base) return base
    if (!(BODY_STATES as readonly string[]).includes(String(c.body_state_classification))) return `unrecognised body state (${String(c.body_state_classification).slice(0, 30)})`
    if (!['improved', 'held', 'declined'].includes(String(c.state_direction))) return 'missing or invalid state_direction'
    if (typeof c.what_changed_coach !== 'string' || c.what_changed_coach.trim().length < 40) return 'missing what_changed_coach'
    const her = c.for_her as Record<string, unknown> | undefined
    if (!her || typeof her !== 'object') return 'missing for_her'
    for (const k of FOR_HER_REQUIRED) if (typeof her[k] !== 'string' || !(her[k] as string).trim()) return `for_her.${k} missing`
    const flat = (v: unknown): string => typeof v === 'string' ? v : v && typeof v === 'object' ? Object.values(v).map(flat).join(' ') : ''
    const plain = her.readiness_in_plain_words as Record<string, unknown> | undefined
    if (!plain || typeof plain !== 'object' || !['capacity', 'schedule', 'regulation', 'behaviour'].every(k => typeof plain[k] === 'string' && (plain[k] as string).trim())) return 'for_her.readiness_in_plain_words missing a rating'
    const leak = flat(her).match(INTERNAL_VOCABULARY) ?? flat(her).match(/\b(Green|Amber|Red|Limiting|Main limit)\b/)
    if (leak) return `for_her uses internal vocabulary ("${leak[0]}")`
    // The sex gate, in code.
    if (sexAtBirth === 'Male' && c.pattern_classification === 'Estrogen-Shift') return 'Estrogen-Shift returned for a client recorded male at birth'
    if (sexAtBirth === 'Female' && c.pattern_classification === 'Androgen-Decline') return 'Androgen-Decline returned for a client recorded female at birth'
    // A pattern change must name its evidence.
    const change = c.pattern_change as Record<string, unknown> | undefined
    if (!change || typeof change !== 'object') return 'missing pattern_change'
    const differs = !!prev.pattern_classification && !!c.pattern_classification && prev.pattern_classification !== c.pattern_classification
    if (differs && (change.changed !== true || typeof change.evidence !== 'string' || change.evidence.trim().length < 40)) {
      return `pattern moved from ${prev.pattern_classification} to ${String(c.pattern_classification)} without naming its evidence`
    }
    // No previous pattern (a first read that named none, or older reads) is a
    // FIRST pattern, not a change, and needs no change evidence.
    if (!differs) { change.changed = false; change.evidence = '' }
    change.from = prev.pattern_classification ?? null
    return null
  }

  console.log(`${tag} previous=${prev.kind}:${prev.body_state_classification}/${prev.pattern_classification} baseline=${!!baselineContext} photos=${photos.length}/3 weeks=${(input.weeklyReadiness ?? []).length}`)

  const result = await generateGovernedJson({ tag, model: CFFS_MODEL, system, userContent, timeBudgetMs: input.timeBudgetMs, maxTokens: PROGRESS_READ_MAX_TOKENS, validate })
  if (!result.ok) return { ok: false, error: `Progress Read failed after ${result.attempts} attempt${result.attempts === 1 ? '' : 's'} (${result.error}).` }

  const read = stripEmDashes(result.value) as Record<string, unknown>

  // Body state at most one step from the previous read, enforced here whatever the model said.
  let stateClamped = false
  const pi = (BODY_STATES as readonly string[]).indexOf(prev.body_state_classification ?? '')
  const ni = (BODY_STATES as readonly string[]).indexOf(String(read.body_state_classification))
  if (pi >= 0 && ni >= 0 && Math.abs(ni - pi) > 1) {
    const clamped = BODY_STATES[pi + Math.sign(ni - pi)]
    console.warn(`${tag} body state ${read.body_state_classification} is more than one step from ${prev.body_state_classification}; clamped to ${clamped}`)
    read.body_state_classification = clamped
    stateClamped = true
  }
  if (pi >= 0) {
    const fi = (BODY_STATES as readonly string[]).indexOf(String(read.body_state_classification))
    read.state_direction = fi > pi ? 'improved' : fi < pi ? 'declined' : 'held'
    read.previous_body_state = prev.body_state_classification
  }
  read.photos_used = photos.length
  read.reassessment_flagged = false
  delete read[WHAT_CHANGED_ID]

  return { ok: true, read, stateClamped, photosUsed: photos.length }
}
