/**
 * One governed JSON generation: streamed, with a dead-connection watchdog, a time
 * budget across attempts, retries on truncation and unparseable output, and a
 * caller-supplied content check.
 *
 * Moved out of cffs-read.ts on 2026-09-14 without changing behaviour, so the
 * Progress Read gets exactly the hardening the Foundational Read has instead of
 * a second copy of it that drifts.
 */

import Anthropic from '@anthropic-ai/sdk'
import { extractFirstJsonObject } from '@/lib/extract-json'

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
export const MAX_TOKENS = 24000
export const ATTEMPTS = 3

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
export function stripEmDashes(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.replace(/\s*—\s*/g, ', ')
  if (Array.isArray(obj)) return obj.map(stripEmDashes)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripEmDashes(v)]))
  }
  return obj
}

export interface GovernedJsonRequest {
  tag: string
  model: string
  system: string
  userContent: Anthropic.Messages.ContentBlockParam[]
  timeBudgetMs?: number
  /** Output ceiling for this generation. Defaults to MAX_TOKENS. */
  maxTokens?: number
  /**
   * Content check on the parsed object. Return null to accept, or a reason to
   * reject and retry. May normalise the object in place.
   */
  validate: (candidate: Record<string, unknown>) => string | null
}

export type GovernedJsonResult =
  | { ok: true; value: Record<string, unknown>; attempts: number }
  | { ok: false; error: string; attempts: number }

export async function generateGovernedJson(req: GovernedJsonRequest): Promise<GovernedJsonResult> {
  const { tag, userContent } = req
  // SDK retries cover a failed CONNECT only; a stall mid-stream is ours to catch.
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 2 })
  let parsed: Record<string, unknown> | null = null
  let lastError = 'unknown error'
  const readStartedAt = Date.now()
  const budgetMs = req.timeBudgetMs ?? READ_TIME_BUDGET_MS
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
      model: req.model,
      max_tokens: req.maxTokens ?? MAX_TOKENS,
      thinking: { type: 'adaptive', display: 'summarized' },
      system: req.system,
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
    console.log(`${tag} attempt ${attempt}/${ATTEMPTS} timing: ${Math.round((Date.now() - attemptStartedAt) / 1000)}s stop=${message.stop_reason} output_tokens=${message.usage?.output_tokens} input_tokens=${message.usage?.input_tokens} max_tokens=${req.maxTokens ?? MAX_TOKENS}`)

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
      lastError = `AI output was truncated at the ${req.maxTokens ?? MAX_TOKENS}-token limit`
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

    const rejection = req.validate(candidate)
    if (rejection) {
      lastError = rejection
      console.warn(`${tag} attempt ${attempt}/${ATTEMPTS}: ${lastError}`)
      continue
    }

    parsed = candidate
    break
  }

  if (!parsed) return { ok: false, error: lastError, attempts: attemptsMade }
  return { ok: true, value: parsed, attempts: attemptsMade }
}
