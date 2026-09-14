/**
 * THE READ, standing on its own.
 *
 * Answers in, CFFS out. No database, no login, no client id, no knowledge that
 * a coaching application exists on the other side of it.
 *
 * WHY THIS EXISTS (2026-09-09)
 *
 * The interpretation was never tangled up in the coaching app — cffs-prompt.ts
 * imports the doctrine, the plausibility check and the intake questions, and
 * nothing from programs, nutrition or the portal. What it WAS tangled in was
 * Kade's own client records and his own session: generate-cffs demanded an
 * intake_id and a client_id, read five tables, and gated on his coach login. So
 * the read could not be handed a person it had never met.
 *
 * That is what stops anyone who is not Kade running it, and it is the same
 * blocker whichever way the product eventually sells — a coach on Body Recode's
 * own screens, or another company's software calling in. This function is the
 * separation. `/api/generate-cffs` is now a thin wrapper that loads from the
 * database, builds this input and calls it, so nothing changes for Kade or his
 * clients today.
 *
 * WHAT LIVES HERE AND WHAT DOES NOT
 *
 * Here: assembling the prompt, calling the model, the retry loop, parsing, and
 * the three things that are properties of the READ rather than of storage —
 * stripping em dashes, recording how many photos were actually used, and
 * forcing reassessment_flagged false.
 *
 * Not here: fetching anything, signing or downloading photos, resolving height,
 * archiving the previous read, saving, or writing the pattern back onto a
 * client. All of that is the caller's business, and a caller that is not Kade's
 * dashboard will do it completely differently.
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  buildCFFSSystemPrompt,
  buildCFFSUserPrompt,
  type CFFSBaselineContext,
} from '@/lib/cffs-prompt'
import { buildBloodMarkerCFFSSection, type CFFSBloodContext } from '@/lib/blood-panel-prompt'
import {
  deriveReadinessCarryForward,
  formatReadinessEvidenceForPrompt,
  type WeeklyReadinessRow,
  type FoundationalReadiness,
} from '@/lib/readiness-carry-forward'
import { withTemporalContext } from '@/lib/temporal-context'
import { type ImageMediaType } from '@/lib/image-media-type'
import { CFFS_MODEL } from '@/lib/ai-models'
import { generateGovernedJson, stripEmDashes } from '@/lib/governed-generation'
export { READ_TIME_BUDGET_MS } from '@/lib/governed-generation'
import { isCanonicalPattern, isReadPattern } from '@/lib/pattern-doctrine'
import { Intake } from '@/types'

/** A baseline photo, already fetched and encoded. Fetching is the caller's job:
 *  the bucket is private here and would be an HTTP call somewhere else. */
export interface ReadPhoto {
  label: 'front' | 'side' | 'back'
  base64: string
  media_type: ImageMediaType
}

/**
 * Everything the read is given. Only `intake` is required — every other field
 * sharpens the read, and its absence is handled by the prompt's own rules
 * rather than by refusing to run. That is deliberate and it is the same
 * principle as the measurement inputs: enrichment, never a precondition.
 */
export interface CFFSReadInput {
  /** Her answers. The one thing the read cannot do without. */
  intake: Intake
  /** Free text. Critical for interpretation: HR-blunting drugs, mood-flattening
   *  drugs and hormonal support all change what a signal means. */
  medications?: string | null
  /** Measurements. `has_photos` is set from `photos` below, not from here. */
  baseline?: Omit<CFFSBaselineContext, 'has_photos'> | null
  /** Front, side, back. Any subset, including none. */
  photos?: ReadPhoto[]
  /** A coach-approved panel. Structured, not a pre-built string, so a caller
   *  that is not the dashboard passes markers rather than prose. */
  bloodPanel?: CFFSBloodContext | null
  /** Recent weekly syntheses, as EVIDENCE the read must reconcile — never as a
   *  substituted value. The weekly rates itself against this read, so writing
   *  the weeklies back into it would have the two reading each other. */
  weeklyReadiness?: WeeklyReadinessRow[]
  /** The previous read's four readiness ratings, if there is one. */
  priorReadiness?: FoundationalReadiness | null
  /** What the funnel already concluded, so the read can agree with it or depart
   *  from it deliberately rather than never knowing it existed. */
  incomingPattern?: {
    pattern: string | null
    source: string | null
    confidence: string | null
  } | null
  /** Log prefix only. Never reaches the model. */
  label?: string
  /** Total time the read may take across every attempt, in ms. A host with a
   *  hard platform limit (a serverless function) passes what it has left, so
   *  the read ends with an honest error instead of being killed mid-attempt.
   *  Defaults to READ_TIME_BUDGET_MS. */
  timeBudgetMs?: number
}

export type CFFSReadResult =
  | { ok: true; cffs: Record<string, unknown>; photosUsed: number }
  | { ok: false; error: string }

/**
 * The Foundational Read's own content checks, run on every attempt. Exported so
 * the Progress Read, which must return every read field too, applies the same.
 */
export function validateReadOutput(candidate: Record<string, unknown>): string | null {
  // Structurally valid but content-empty output (`{}`, or the core
  // classification dropped) must never be saved as a real read.
  if (typeof candidate.body_state_classification !== 'string' || !candidate.body_state_classification.trim()) {
    return 'AI output missing body_state_classification'
  }

  // The database accepts only these values, and a refused save used to cost
  // the whole read. An unrecognised pattern is a content failure: retry.
  if (candidate.pattern_classification != null && !isReadPattern(candidate.pattern_classification)) {
    return `AI returned an unrecognised pattern (${String(candidate.pattern_classification).slice(0, 40)})`
  }
  // "No clear pattern" is never a competitor, and the competing read only
  // accepts the four or None.
  if (candidate.pattern_competing_read != null && !isCanonicalPattern(candidate.pattern_competing_read)) {
    candidate.pattern_competing_read = 'None'
  }

  return null
}

/**
 * Run the read.
 *
 * Never throws: up to three attempts inside a time budget, then an honest error
 * string. The SDK's retries cover a failed connection; this loop covers a stalled
 * stream, truncation and unparseable output, which those cannot see.
 */
export async function runRead(input: CFFSReadInput): Promise<CFFSReadResult> {
  const tag = input.label ? `[CFFS ${input.label}]` : '[CFFS]'
  const photos = input.photos ?? []

  const baselineContext: CFFSBaselineContext | null = input.baseline
    ? { ...input.baseline, has_photos: photos.length > 0 }
    : null

  // Photos first: Anthropic recommends image blocks before the text that refers
  // to them. Each is labelled so the model knows which view it is looking at.
  const labelMap = {
    front: 'BASELINE PHOTOS - 1 of 3 - Front view (relaxed stance):',
    side: 'BASELINE PHOTOS - 2 of 3 - Side view (natural posture):',
    back: 'BASELINE PHOTOS - 3 of 3 - Back view (relaxed arms):',
  } as const

  const userContent: Anthropic.Messages.ContentBlockParam[] = []
  for (const p of photos) {
    userContent.push({ type: 'text', text: labelMap[p.label] })
    userContent.push({
      type: 'image',
      source: { type: 'base64', media_type: p.media_type, data: p.base64 },
    })
  }

  const bloodMarkerSection = buildBloodMarkerCFFSSection(input.bloodPanel ?? null)
  const readinessEvidenceSection = formatReadinessEvidenceForPrompt(
    deriveReadinessCarryForward(input.weeklyReadiness ?? [], input.priorReadiness ?? null)
  )

  console.log(
    `${tag} baseline=${!!baselineContext} photos=${photos.length}/3 ` +
    `bloods=${bloodMarkerSection ? 'yes' : 'no'} readiness_weeks=${(input.weeklyReadiness ?? []).length}`
  )

  userContent.push({
    type: 'text',
    text: buildCFFSUserPrompt(
      input.intake,
      input.medications ?? null,
      baselineContext,
      bloodMarkerSection,
      readinessEvidenceSection
    ),
  })

  const result = await generateGovernedJson({
    tag,
    model: CFFS_MODEL,
    system: withTemporalContext(buildCFFSSystemPrompt(input.incomingPattern ?? undefined)),
    userContent,
    timeBudgetMs: input.timeBudgetMs,
    validate: validateReadOutput,
  })
  const parsed = result.ok ? result.value : null
  const attemptsMade = result.attempts
  const lastError = result.ok ? '' : result.error

  if (!parsed) {
    console.error(`${tag} generation failed after ${attemptsMade} attempt(s):`, lastError)
    return { ok: false, error: `CFFS generation failed after ${attemptsMade} attempt${attemptsMade === 1 ? '' : 's'} (${lastError}).` }
  }

  const cffs = stripEmDashes(parsed) as Record<string, unknown>

  // How many photos actually reached the model. Surfaces to the coach as
  // "Photos: 3/3"; null on rows from code paths predating 2026-05-13.
  cffs.photos_used = photos.length

  // Doctrinal guard: reassessment is a TEMPORAL construct per Signal Monitoring
  // v1.0, and can only be true once longitudinal data exists. At read time
  // there is no trajectory to evaluate, so it is false regardless of what the
  // model produced — it used to default this true on any "Partially Resolved"
  // classification, which is most clients in Remediation.
  cffs.reassessment_flagged = false

  return { ok: true, cffs, photosUsed: photos.length }
}
