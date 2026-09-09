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
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'
import { type ImageMediaType } from '@/lib/image-media-type'
import { CFFS_MODEL } from '@/lib/ai-models'
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
}

export type CFFSReadResult =
  | { ok: true; cffs: Record<string, unknown>; photosUsed: number }
  | { ok: false; error: string }

const MAX_TOKENS = 12000
const ATTEMPTS = 3

/** Em dash stripper, applied to every string the model returns. */
function stripEmDashes(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.replace(/\s*—\s*/g, ', ')
  if (Array.isArray(obj)) return obj.map(stripEmDashes)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripEmDashes(v)]))
  }
  return obj
}

/**
 * Run the read.
 *
 * Never throws for a content-level failure: three attempts, then an honest
 * error string. The Anthropic SDK's own retries cover transient network and 5xx;
 * this loop covers truncation and unparseable output, which those cannot see.
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

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })
  let parsed: Record<string, unknown> | null = null
  let lastError = 'unknown error'

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: CFFS_MODEL,
        max_tokens: MAX_TOKENS,
        system: withTemporalContext(buildCFFSSystemPrompt(input.incomingPattern ?? undefined)),
        messages: [{ role: 'user', content: userContent }],
      })
    } catch (err) {
      lastError = `AI error: ${err instanceof Error ? err.message : String(err)}`
      console.error(`${tag} Anthropic API error (attempt ${attempt}/${ATTEMPTS}):`, lastError)
      continue
    }

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      lastError = `AI returned no text content (stop_reason=${message.stop_reason})`
      console.warn(`${tag} attempt ${attempt}/${ATTEMPTS}: ${lastError}`)
      continue
    }

    console.log(`${tag} attempt ${attempt}/${ATTEMPTS} raw (stop_reason=${message.stop_reason}):`, textBlock.text.slice(0, 200))

    // Truncated mid-object: the JSON never closed, so parsing is guaranteed to
    // fail. Retry rather than dumping a garbled half-object into extraction.
    if (message.stop_reason === 'max_tokens') {
      lastError = `AI output was truncated at the ${MAX_TOKENS}-token limit`
      console.warn(`${tag} attempt ${attempt}/${ATTEMPTS}: ${lastError}`)
      continue
    }

    const jsonText = extractFirstJsonObject(textBlock.text)
    if (!jsonText) {
      lastError = `Could not locate a JSON object in AI output: ${textBlock.text.slice(0, 200)}`
      console.warn(`${tag} attempt ${attempt}/${ATTEMPTS}: ${lastError}`)
      continue
    }

    let candidate: Record<string, unknown>
    try {
      candidate = JSON.parse(jsonText)
    } catch (err) {
      lastError = `JSON parse failed: ${(err as Error).message}`
      console.warn(`${tag} attempt ${attempt}/${ATTEMPTS}: ${lastError}`)
      continue
    }

    // Structurally valid but content-empty output (`{}`, or the core
    // classification dropped) must never be saved as a real read.
    if (typeof candidate.body_state_classification !== 'string' || !candidate.body_state_classification.trim()) {
      lastError = 'AI output missing body_state_classification'
      console.warn(`${tag} attempt ${attempt}/${ATTEMPTS}: ${lastError}`)
      continue
    }

    parsed = candidate
    break
  }

  if (!parsed) {
    console.error(`${tag} generation failed after ${ATTEMPTS} attempts:`, lastError)
    return { ok: false, error: `CFFS generation failed after ${ATTEMPTS} attempts (${lastError}).` }
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
