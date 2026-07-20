/**
 * Canonical Body Recode daily anchor sequences.
 *
 * Names, taglines, and steps match the Challenge product
 * (`src/app/challenge/[token]/challenge-portal-client.tsx`) so a client
 * moving Challenge → Coaching hears the same brand language throughout.
 *
 * Every coaching client gets these as their starting Morning Reset Sequence
 * + Evening Rhythm Sequence. Coach personalises per client via the editor
 * at `/dashboard/clients/[id]/routine`, which writes overrides into
 * `clients.daily_routine` (JSONB). A NULL column value means "use these
 * canonical defaults" — the client portal falls back here.
 *
 * Doctrine behind each step lives in the coach template file at
 * `~/Dropbox/01_BODY_RECODE/10_CLIENT_RECORDS/_templates/Reset_Rhythm_Sequences.md`.
 * Client portal shows steps + optional coach note only; the doctrinal
 * reasoning stays coach-side.
 */

export interface DailySequence {
  title: string
  tagline: string
  steps: string[]
  /** Optional per-client coach note. Rendered under the steps on the portal. */
  coach_note?: string | null
}

export interface DailyRoutine {
  morning: DailySequence
  evening: DailySequence
}

export const CANONICAL_MORNING_RESET: DailySequence = {
  title: 'Morning Reset Sequence',
  tagline: '5 minutes every morning. Do this before caffeine.',
  steps: [
    '2 minutes of slow nasal breathing before getting out of bed',
    '500ml of water immediately on waking',
    '5 minutes of light movement or walking outside',
    'No phone for the first 20 minutes',
    'Eat breakfast within 60 minutes of waking',
  ],
  coach_note: null,
}

export const CANONICAL_EVENING_RHYTHM: DailySequence = {
  title: 'Evening Rhythm Sequence',
  tagline: 'Wind down your nervous system before sleep.',
  steps: [
    'Dim lights and reduce screen brightness after 8pm',
    'No eating within 2 hours of sleep',
    '5 minutes of slow breathing or light stretching',
    'Set a consistent sleep time and stick to it',
    'Phone out of the bedroom or on silent',
  ],
  coach_note: null,
}

export const CANONICAL_DAILY_ROUTINE: DailyRoutine = {
  morning: CANONICAL_MORNING_RESET,
  evening: CANONICAL_EVENING_RHYTHM,
}

/**
 * Resolves the effective routine for a client. Missing fields fall back
 * to the canonical defaults so the coach can override just one sequence
 * (or just one step) and the rest inherits.
 */
export function resolveDailyRoutine(stored: unknown): DailyRoutine {
  if (!stored || typeof stored !== 'object') {
    return CANONICAL_DAILY_ROUTINE
  }
  const s = stored as Partial<DailyRoutine>
  return {
    morning: mergeSequence(s.morning, CANONICAL_MORNING_RESET),
    evening: mergeSequence(s.evening, CANONICAL_EVENING_RHYTHM),
  }
}

function mergeSequence(
  override: Partial<DailySequence> | undefined,
  fallback: DailySequence
): DailySequence {
  if (!override || typeof override !== 'object') return fallback
  return {
    title: typeof override.title === 'string' && override.title.trim() ? override.title : fallback.title,
    tagline: typeof override.tagline === 'string' && override.tagline.trim() ? override.tagline : fallback.tagline,
    steps: Array.isArray(override.steps) && override.steps.length > 0
      ? override.steps.filter(s => typeof s === 'string' && s.trim().length > 0)
      : fallback.steps,
    coach_note: typeof override.coach_note === 'string' ? override.coach_note : null,
  }
}
