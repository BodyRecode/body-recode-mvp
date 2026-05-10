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

/**
 * Compute which week of the block we're currently in (1-indexed).
 *
 * The block starts at programs.generated_at; this is the same timestamp
 * the rest of the system uses for block-end detection. If now < generated_at
 * (clock drift), returns 1.
 */
export function currentBlockWeek(programGeneratedAt: string): number {
  const start = new Date(programGeneratedAt)
  const now = new Date()
  const ms = now.getTime() - start.getTime()
  if (ms < 0) return 1
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 7)) + 1
}

/**
 * Compute days remaining until block end.
 *   weeks remaining = week_duration - (current week - 1) - 1
 *   days remaining  = weeks remaining * 7 - days into current week
 *
 * Returns negative numbers if block has already ended.
 */
export function daysUntilBlockEnd(programGeneratedAt: string, weekDuration: number): number {
  const start = new Date(programGeneratedAt).getTime()
  const blockEnd = start + weekDuration * 7 * 24 * 60 * 60 * 1000
  const ms = blockEnd - Date.now()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
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
