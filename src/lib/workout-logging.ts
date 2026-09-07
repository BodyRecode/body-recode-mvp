/**
 * Workout logging helpers.
 *
 * The production database stores program prescriptions as JSON inside
 * programs.sessions (NOT in the program_sessions / session_exercises tables,
 * which are empty). These helpers parse that JSON shape and produce typed
 * structures the logging UI and APIs work with.
 *
 * Block week math: a block starts when the program is generated and runs
 * for week_duration weeks. Within the block, program.sessions[] repeats
 * weekly. week_number_in_block goes 1 → week_duration.
 */

export interface PrescribedExercise {
  exercise_name: string
  sets: number | null
  reps: string | null
  rpe: number | null
  rest: string | null
  notes: string | null
}

export interface PrescribedBlock {
  block_label: string
  exercises: PrescribedExercise[]
}

export interface PrescribedSession {
  day_label: string
  skeleton: string | null
  movement_prep: string[] | null
  blocks: PrescribedBlock[]
  /** Convenience flat list of exercises with their block label. */
  flatExercises: Array<{ block_label: string; exercise: PrescribedExercise; sort_order: number }>
}

/**
 * Parse the program.sessions JSONB into typed sessions, with defensive
 * defaults for missing fields. Adds a flatExercises convenience array per
 * session so the logging UI can iterate without re-traversing blocks.
 */
export function parsePrescribedSessions(raw: unknown): PrescribedSession[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s, idx) => {
    const session = s as Record<string, unknown>
    const blocks: PrescribedBlock[] = Array.isArray(session.blocks)
      ? (session.blocks as Array<Record<string, unknown>>).map(b => ({
          block_label: typeof b.block_label === 'string' ? b.block_label : '',
          exercises: Array.isArray(b.exercises)
            ? (b.exercises as Array<Record<string, unknown>>).map(e => ({
                exercise_name: typeof e.exercise_name === 'string' ? e.exercise_name : '(unnamed)',
                sets: typeof e.sets === 'number' ? e.sets : null,
                reps: typeof e.reps === 'string' ? e.reps : e.reps != null ? String(e.reps) : null,
                rpe: typeof e.rpe === 'number' ? e.rpe : null,
                rest: typeof e.rest === 'string' ? e.rest : null,
                notes: typeof e.notes === 'string' ? e.notes : null,
              }))
            : [],
        }))
      : []

    const flatExercises: PrescribedSession['flatExercises'] = []
    let sortOrder = 0
    for (const b of blocks) {
      for (const e of b.exercises) {
        flatExercises.push({ block_label: b.block_label, exercise: e, sort_order: sortOrder++ })
      }
    }

    void idx
    return {
      day_label: typeof session.day_label === 'string' ? session.day_label : '',
      skeleton: typeof session.skeleton === 'string' ? session.skeleton : null,
      movement_prep: Array.isArray(session.movement_prep) ? session.movement_prep as string[] : null,
      blocks,
      flatExercises,
    }
  })
}

/** Brisbane is UTC+10 year round, no daylight saving. */
const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Midnight Brisbane on the calendar day of the given timestamp, as epoch ms.
 *
 * Block weeks have to roll over at a day boundary, not at whatever time of day
 * the coach happened to hit Activate. See currentBlockWeek.
 */
function brisbaneStartOfDay(iso: string): number {
  const t = new Date(iso).getTime()
  return Math.floor((t + BRISBANE_OFFSET_MS) / DAY_MS) * DAY_MS - BRISBANE_OFFSET_MS
}

/**
 * Compute which week of the block we're currently in (1-indexed).
 *
 * Anchored to MIDNIGHT BRISBANE on the block's start date, not the exact
 * activation timestamp. Anchoring to the raw timestamp meant the block week
 * rolled over at whatever time of day the program was activated, so a client
 * could be mid-training-day in one week and in the next by lunchtime.
 *
 * Cristobal, 2026-09-07: Block 3 was activated 31 Aug at 12:20pm Brisbane. At
 * 8am on Monday 7 Sep the log page still reported block week 1, whose three
 * sessions were all logged, so there was no session left to start and no way
 * to log the session Kade was actually running with him. It would have flipped
 * to week 2 at 12:20pm, after the session finished. If now < start, returns 1.
 */
export function currentBlockWeek(programGeneratedAt: string): number {
  const start = brisbaneStartOfDay(programGeneratedAt)
  const ms = Date.now() - start
  if (ms < 0) return 1
  return Math.floor(ms / (7 * DAY_MS)) + 1
}

const WEEKDAY_NAMES = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const

/**
 * Pull the weekday out of a prescribed session's day_label, or null when it
 * does not name one.
 *
 * Labels are compound in practice: "Monday — Full Body A (Squat / Push / Pull)".
 * Callers used to compare the WHOLE label against todayBrisbaneDayName() with
 * ===, which never matched, so today's session was never highlighted, the Start
 * button never appeared on the day it was due, and the evening log nudge never
 * fired. Found 2026-09-07 on Cristobal.
 *
 * Word-boundary matched on purpose. "Day 1" and "Session A" return null rather
 * than matching something, and an empty label returns null rather than matching
 * every day, which a substring check would do.
 */
export function sessionDayName(dayLabel: string): string | null {
  const label = dayLabel.toLowerCase()
  for (const day of WEEKDAY_NAMES) {
    if (new RegExp(`\\b${day}\\b`).test(label)) return day
  }
  return null
}

/** Does this prescribed session fall on the given weekday name? */
export function sessionMatchesDay(dayLabel: string, dayName: string): boolean {
  const day = sessionDayName(dayLabel)
  return day !== null && day === dayName.toLowerCase()
}

/**
 * Compute days remaining until block end.
 *   weeks remaining = week_duration - (current week - 1) - 1
 *   days remaining  = weeks remaining * 7 - days into current week
 *
 * Returns negative numbers if block has already ended.
 */
export function daysUntilBlockEnd(
  /** activated_at when present (the block's true start), else generated_at. */
  programStartedAt: string,
  weekDuration: number,
): number {
  // Same midnight-Brisbane anchor as currentBlockWeek, so "week N of M" and
  // "block ends in D days" cannot disagree about when the block started.
  const start = brisbaneStartOfDay(programStartedAt)
  const blockEnd = start + weekDuration * 7 * DAY_MS
  const ms = blockEnd - Date.now()
  return Math.floor(ms / DAY_MS)
}

/**
 * Epley estimated 1-rep-max — used to rank sets so a personal-record check
 * accounts for reps, not just raw weight (62.5kg × 8 beats 60kg × 8, and
 * 60kg × 10 beats 60kg × 8). Returns 0 for non-positive weight so it never
 * flags a bodyweight/blank row as a record.
 */
export function estimate1RM(weightKg: number | null, reps: number | null): number {
  if (!weightKg || weightKg <= 0) return 0
  const r = reps && reps > 0 ? reps : 1
  return weightKg * (1 + r / 30)
}

/**
 * Consistency momentum for the client-facing log index: how much of the block
 * has been logged, and the trailing run of fully-logged weeks.
 *
 * A week counts as "fully logged" when completed sessions >= prescribed per
 * week. The streak counts backward from the current week; an in-progress
 * current week never breaks it (we start from currentWeek-1 when the current
 * week isn't full yet), so the streak only ever reflects finished weeks.
 */
export function computeLoggingMomentum(opts: {
  completedByWeek: Map<number, number>
  prescribedPerWeek: number
  currentWeek: number
  weekDuration: number
}): { streakWeeks: number; loggedThisBlock: number; blockTotal: number } {
  const { completedByWeek, prescribedPerWeek, currentWeek, weekDuration } = opts
  const blockTotal = Math.max(0, prescribedPerWeek * weekDuration)
  let loggedThisBlock = 0
  for (const c of completedByWeek.values()) loggedThisBlock += c
  const isFull = (w: number) => prescribedPerWeek > 0 && (completedByWeek.get(w) ?? 0) >= prescribedPerWeek
  let streakWeeks = 0
  let w = isFull(currentWeek) ? currentWeek : currentWeek - 1
  while (w >= 1 && isFull(w)) {
    streakWeeks++
    w--
  }
  return { streakWeeks, loggedThisBlock, blockTotal }
}

/**
 * For UI: which day of the week is "today" in Brisbane (the operational tz)?
 * Returns "Monday" / "Tuesday" / ... so the logging index can match against
 * session.day_label.
 */
export function todayBrisbaneDayName(): string {
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long',
  })
  return formatter.format(new Date())
}
