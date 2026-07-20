/**
 * Daily Routine LLM output validator.
 *
 * Gates:
 * - Structural: correct shape, step counts within 4-6, non-empty strings.
 * - Safety: no S4/S8 substances, no unsafe cold exposure durations,
 *   no unsupervised advanced breathwork protocols.
 * - Cardiac / age gating: strip cold-immersion steps if the client has a
 *   cardiac flag or is 60+.
 *
 * Runs server-side after the LLM returns. Invalid outputs are either
 * corrected (safe stripping) or rejected with a validation issue list
 * that feeds back into a single retry.
 */

import type { DailyRoutine, DailySequence } from './daily-routine-defaults'

export interface DailyRoutineValidationInput {
  routine: unknown
  client_age: number | null
  client_has_cardiac_flag: boolean
  client_body_state: 'remediation' | 'optimisation' | 'post_optimisation' | null
}

export interface DailyRoutineValidationIssue {
  code: string
  message: string
  severity: 'reject' | 'strip'
  path?: string
}

export interface DailyRoutineValidationResult {
  ok: boolean
  routine: DailyRoutine | null
  rationale: string | null
  issues: DailyRoutineValidationIssue[]
}

const BANNED_SUBSTANCE_PATTERNS: RegExp[] = [
  /\btestosterone\b/i,
  /\btrt\b/i,
  /\bpeptide[s]?\b/i,
  /\bhcg\b/i,
  /\banastrozole\b/i,
  /\bclomid\b/i,
  /\benclomiphene\b/i,
  /\bnandrolone\b/i,
  /\btrenbolone\b/i,
  /\banavar\b/i,
  /\bdianabol\b/i,
  /\bipamorelin\b/i,
  /\btb[- ]?500\b/i,
  /\bbpc[- ]?157\b/i,
  /\bmodafinil\b/i,
  /\badderall\b/i,
  /\bxanax\b/i,
  /\bketamine\b/i,
  /\bschedule\s*[48]\b/i,
]

const BANNED_PROTOCOL_PATTERNS: RegExp[] = [
  /\bwim\s*hof\b/i,
  /\bhyperventilat/i,
  /\bcold\s+plunge\b/i,
  /\bice\s+bath\b/i,
  /\bsauna\b/i,
  /\bcontrast\s+(?:shower|therapy|training)\b/i,
  /\bred\s+light\s+therapy\b/i,
  /\bpemf\b/i,
]

const UNSAFE_CLINICAL_PATTERNS: RegExp[] = [
  /\bdiagnos[ei]/i,
  /\btreat\s+(?:your|the)\s+(?:disease|condition|illness)/i,
  /\bcure\b/i,
  /\bprescrib(?:e|ed|ing)\s+medication/i,
]

const COLD_STEP_PATTERNS: RegExp[] = [
  /\bcold\s+shower\b/i,
  /\bface\s+immersion\b/i,
  /\bice\s+water\s+face\b/i,
  /\bcold\s+water\s+face\b/i,
  /\bcold\s+exposure\b/i,
]

const MIN_STEPS = 4
const MAX_STEPS = 6

function issue(code: string, message: string, severity: 'reject' | 'strip', path?: string): DailyRoutineValidationIssue {
  return { code, message, severity, path }
}

function validateSequence(
  raw: unknown,
  name: 'morning' | 'evening',
  strictCold: boolean,
  issues: DailyRoutineValidationIssue[]
): DailySequence | null {
  if (!raw || typeof raw !== 'object') {
    issues.push(issue('SEQUENCE_MISSING', `${name} sequence is missing or not an object`, 'reject', name))
    return null
  }
  const s = raw as Record<string, unknown>

  const title = typeof s.title === 'string' ? s.title.trim() : ''
  const tagline = typeof s.tagline === 'string' ? s.tagline.trim() : ''
  const stepsRaw = Array.isArray(s.steps) ? s.steps : []
  const coach_note = typeof s.coach_note === 'string' ? s.coach_note.trim() : null

  if (!title) issues.push(issue('TITLE_MISSING', `${name}.title is empty`, 'reject', `${name}.title`))
  if (!tagline) issues.push(issue('TAGLINE_MISSING', `${name}.tagline is empty`, 'reject', `${name}.tagline`))

  const cleanSteps: string[] = []
  for (let i = 0; i < stepsRaw.length; i++) {
    const step = stepsRaw[i]
    if (typeof step !== 'string') continue
    const trimmed = step.trim()
    if (!trimmed) continue

    for (const p of BANNED_SUBSTANCE_PATTERNS) {
      if (p.test(trimmed)) {
        issues.push(issue('BANNED_SUBSTANCE', `${name} step ${i + 1} mentions an out-of-scope substance: "${trimmed}"`, 'reject', `${name}.steps[${i}]`))
      }
    }
    for (const p of BANNED_PROTOCOL_PATTERNS) {
      if (p.test(trimmed)) {
        issues.push(issue('BANNED_PROTOCOL', `${name} step ${i + 1} references a Recovery/Regulation protocol that does not belong in daily sequences: "${trimmed}"`, 'reject', `${name}.steps[${i}]`))
      }
    }
    for (const p of UNSAFE_CLINICAL_PATTERNS) {
      if (p.test(trimmed)) {
        issues.push(issue('UNSAFE_CLINICAL_LANGUAGE', `${name} step ${i + 1} uses clinical language outside scope: "${trimmed}"`, 'reject', `${name}.steps[${i}]`))
      }
    }

    if (strictCold) {
      for (const p of COLD_STEP_PATTERNS) {
        if (p.test(trimmed)) {
          issues.push(issue('COLD_STRIPPED', `${name} step ${i + 1} contained cold exposure (${trimmed}) — stripped for cardiac/age/body_state safety.`, 'strip', `${name}.steps[${i}]`))
          continue
        }
      }
      const skip = COLD_STEP_PATTERNS.some(p => p.test(trimmed))
      if (skip) continue
    }

    const durationMatch = trimmed.match(/(\d+)\s*(?:second|sec|s\b|minute|min|m\b)/gi)
    if (durationMatch) {
      for (const m of durationMatch) {
        const numMatch = m.match(/(\d+)/)
        if (!numMatch) continue
        const n = parseInt(numMatch[1], 10)
        const unit = /minute|min|m\b/i.test(m) ? 'min' : 'sec'
        if (COLD_STEP_PATTERNS.some(p => p.test(trimmed))) {
          if (unit === 'sec' && n > 30) {
            issues.push(issue('COLD_DURATION_UNSAFE', `${name} step ${i + 1} prescribes ${n}s of face/cold exposure — cap is 20s per round. "${trimmed}"`, 'reject', `${name}.steps[${i}]`))
          }
          if (unit === 'min' && n > 3) {
            issues.push(issue('COLD_DURATION_UNSAFE', `${name} step ${i + 1} prescribes ${n}min of cold — cap is 3min. "${trimmed}"`, 'reject', `${name}.steps[${i}]`))
          }
        }
      }
    }

    cleanSteps.push(trimmed)
  }

  if (cleanSteps.length < MIN_STEPS) {
    issues.push(issue('STEPS_TOO_FEW', `${name} has ${cleanSteps.length} steps after safety filtering — minimum ${MIN_STEPS}`, 'reject', `${name}.steps`))
  }
  if (cleanSteps.length > MAX_STEPS) {
    issues.push(issue('STEPS_TOO_MANY', `${name} has ${cleanSteps.length} steps — maximum ${MAX_STEPS}`, 'reject', `${name}.steps`))
  }

  if (!title || !tagline || cleanSteps.length < MIN_STEPS) return null

  return { title, tagline, steps: cleanSteps.slice(0, MAX_STEPS), coach_note }
}

export function validateDailyRoutine(input: DailyRoutineValidationInput): DailyRoutineValidationResult {
  const issues: DailyRoutineValidationIssue[] = []

  if (!input.routine || typeof input.routine !== 'object') {
    return { ok: false, routine: null, rationale: null, issues: [issue('ROUTINE_MISSING', 'Top-level routine object is missing', 'reject')] }
  }
  const r = input.routine as Record<string, unknown>

  const rationale = typeof r.rationale === 'string' ? r.rationale.trim() : null

  const strictCold =
    input.client_has_cardiac_flag ||
    (input.client_age !== null && input.client_age >= 60) ||
    input.client_body_state === 'remediation'

  const morning = validateSequence(r.morning, 'morning', strictCold, issues)
  const evening = validateSequence(r.evening, 'evening', strictCold, issues)

  const hasRejectIssue = issues.some(i => i.severity === 'reject')
  if (hasRejectIssue || !morning || !evening) {
    return { ok: false, routine: null, rationale, issues }
  }

  return { ok: true, routine: { morning, evening }, rationale, issues }
}

export function summariseIssuesForRetry(issues: DailyRoutineValidationIssue[]): string {
  return issues.map(i => `- [${i.code}] ${i.message}`).join('\n')
}
