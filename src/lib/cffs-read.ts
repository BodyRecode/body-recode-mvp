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
 * Output budget, measured 13 Sep 2026 on four reads: 7,828 to 10,963 output
 * tokens (thinking + JSON) against the old 12,000. One read used 91%, and the
 * reads that came back EMPTY with stop_reason=max_tokens were the ones that
 * tipped over. Doubled for headroom. A budget is a ceiling, not a target: an
 * unused allowance costs nothing and does not lengthen the read.
 *
 * Above ~21k the SDK refuses a non-streaming call, which is one more reason the
 * call below streams.
 */
const MAX_TOKENS = 24000
const ATTEMPTS = 3

/**
 * TIME, and why the read streams (13 Sep 2026).
 *
 * The call used to be a single request that waited for the whole answer. A
 * dropped connection looked identical to a model still thinking, so a read could
 * hang for the SDK's 10-minute timeout, times five SDK retries, times three
 * attempts. In production the 5-minute function limit cut it off first with a
 * generic error; anywhere else (a host embedding the read) nothing did.
 *
 * Measured on a live read: with thinking display left at its hidden default the
 * API sends nothing but a ping every ~30s (and the SDK hides pings), so the
 * stream looked silent for 120s while the model was working perfectly. With
 * display 'summarized' it streams thinking deltas continuously; the longest gap
 * observed was 6.7s. So the read asks for summaries purely as a heartbeat. The
 * summary text is never stored, never shown, never parsed.
 *
 *   IDLE_TIMEOUT_MS      no event at all for this long = the connection is dead.
 *                        ~13x the longest healthy gap observed.
 *   READ_TIME_BUDGET_MS  all attempts together. Normal reads took 87 to 235s.
 *   MIN_ATTEMPT_MS       do not start an attempt that cannot plausibly finish.
 */
const IDLE_TIMEOUT_MS = 90_000
export const READ_TIME_BUDGET_MS = 12 * 60_000
const MIN_ATTEMPT_MS = 2 * 60_000

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

  // SDK retries cover a failed CONNECT only; a stall mid-stream is ours to catch.
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 2 })
  let parsed: Record<string, unknown> | null = null
  let lastError = 'unknown error'
  const readStartedAt = Date.now()
  const budgetMs = input.timeBudgetMs ?? READ_TIME_BUDGET_MS
  let attemptsMade = 0

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const remainingMs = budgetMs - (Date.now() - readStartedAt)
    if (remainingMs < MIN_ATTEMPT_MS) {
      lastError = `${lastError}; not enough time left for another attempt`
      console.warn(`${tag} stopping before attempt ${attempt}: ${Math.round(remainingMs / 1000)}s left`)
      break
    }
    attemptsMade = attempt

    let message
    const attemptStartedAt = Date.now()
    const stream = anthropic.messages.stream({
      model: CFFS_MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'adaptive', display: 'summarized' },
      system: withTemporalContext(buildCFFSSystemPrompt(input.incomingPattern ?? undefined)),
      messages: [{ role: 'user', content: userContent }],
    })
    let stalled: 'idle' | 'deadline' | null = null
    let idleTimer: ReturnType<typeof setTimeout> | undefined
    const armIdle = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => { stalled = 'idle'; stream.abort() }, IDLE_TIMEOUT_MS)
    }
    const deadlineTimer = setTimeout(() => { stalled = 'deadline'; stream.abort() }, remainingMs)
    try {
      armIdle()
      for await (const _event of stream) armIdle() // eslint-disable-line @typescript-eslint/no-unused-vars
      message = await stream.finalMessage()
    } catch (err) {
      lastError = stalled === 'idle'
        ? `the AI stopped responding for ${IDLE_TIMEOUT_MS / 1000}s (connection lost)`
        : stalled === 'deadline'
          ? `the read ran out of time after ${Math.round((Date.now() - readStartedAt) / 1000)}s`
          : `AI error: ${err instanceof Error ? err.message : String(err)}`
      console.error(`${tag} attempt ${attempt}/${ATTEMPTS} failed after ${Math.round((Date.now() - attemptStartedAt) / 1000)}s: ${lastError}`)
      if (stalled === 'deadline') break
      continue
    } finally {
      clearTimeout(idleTimer)
      clearTimeout(deadlineTimer)
    }

    // Measured, not guessed: time, where the output budget went, and why it stopped.
    console.log(`${tag} attempt ${attempt}/${ATTEMPTS} timing: ${Math.round((Date.now() - attemptStartedAt) / 1000)}s stop=${message.stop_reason} output_tokens=${message.usage?.output_tokens} input_tokens=${message.usage?.input_tokens} max_tokens=${MAX_TOKENS}`)

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
