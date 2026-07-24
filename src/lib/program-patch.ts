// Coach Co-Pilot — Phase 3 surgical draft edits.
//
// The co-pilot proposes a MINIMAL, structured patch (which exercise, by index,
// and exactly which fields change) and this module applies it DETERMINISTICALLY
// to the draft program's `sessions` JSON. The model never rewrites the whole
// plan, so everything the coach did not name stays byte-identical by
// construction. This is what makes conversational refinement trustworthy: a
// full regeneration on every tweak would silently change the rest.

/* eslint-disable @typescript-eslint/no-explicit-any */

export type UpdateExerciseOp = {
  kind: 'update_exercise'
  day_index: number
  block_index: number
  exercise_index: number
  changes: {
    exercise_name?: string
    sets?: number | string
    reps?: number | string
    rpe?: number | string
    rest?: string
    notes?: string
  }
}

export type EditClientNoteOp = {
  kind: 'edit_client_note'
  note_text: string
}

export type EditOp = UpdateExerciseOp | EditClientNoteOp

// Render the sessions with explicit Day/Block/Exercise indices so the model can
// target an exact exercise. The indices it returns map 1:1 to the arrays here.
export function renderSessionsIndexed(sessions: any): string {
  if (!Array.isArray(sessions) || sessions.length === 0) return '(no sessions)'
  const out: string[] = []
  sessions.forEach((s: any, di: number) => {
    out.push(`Day ${di} "${s?.day_label ?? 'Session'}"${s?.skeleton ? ` — ${s.skeleton}` : ''}`)
    ;(s?.blocks ?? []).forEach((b: any, bi: number) => {
      out.push(`  Block ${bi} "${b?.block_label ?? 'Block'}"`)
      ;(b?.exercises ?? []).forEach((ex: any, ei: number) => {
        const parts = [
          ex?.sets != null ? `${ex.sets}x` : null,
          ex?.reps != null ? `${ex.reps}` : null,
          ex?.rpe != null ? `@RPE ${ex.rpe}` : null,
          ex?.rest ? `rest ${ex.rest}` : null,
        ].filter(Boolean).join(' ')
        out.push(`    Exercise ${ei}: ${ex?.exercise_name ?? 'exercise'}${parts ? ` — ${parts}` : ''}${ex?.notes ? ` (${ex.notes})` : ''}`)
      })
    })
  })
  return out.join('\n')
}

// Validate + coerce raw operations parsed from the model. Anything malformed is
// dropped (never applied). Only the two supported op kinds survive.
export function validateEditOps(raw: any): EditOp[] {
  if (!Array.isArray(raw)) return []
  const ops: EditOp[] = []
  for (const o of raw) {
    if (!o || typeof o !== 'object') continue
    if (o.kind === 'edit_client_note') {
      if (typeof o.note_text === 'string' && o.note_text.trim()) {
        ops.push({ kind: 'edit_client_note', note_text: o.note_text })
      }
      continue
    }
    if (o.kind === 'update_exercise') {
      const di = Number(o.day_index), bi = Number(o.block_index), ei = Number(o.exercise_index)
      if (!Number.isInteger(di) || !Number.isInteger(bi) || !Number.isInteger(ei)) continue
      if (di < 0 || bi < 0 || ei < 0) continue
      const c = o.changes
      if (!c || typeof c !== 'object') continue
      const changes: UpdateExerciseOp['changes'] = {}
      if (typeof c.exercise_name === 'string' && c.exercise_name.trim()) changes.exercise_name = c.exercise_name
      if (c.sets != null && (typeof c.sets === 'number' || typeof c.sets === 'string')) changes.sets = c.sets
      if (c.reps != null && (typeof c.reps === 'number' || typeof c.reps === 'string')) changes.reps = c.reps
      if (c.rpe != null && (typeof c.rpe === 'number' || typeof c.rpe === 'string')) changes.rpe = c.rpe
      if (typeof c.rest === 'string') changes.rest = c.rest
      if (typeof c.notes === 'string') changes.notes = c.notes
      if (Object.keys(changes).length === 0) continue
      ops.push({ kind: 'update_exercise', day_index: di, block_index: bi, exercise_index: ei, changes })
      continue
    }
  }
  return ops
}

// Apply the ops to a DEEP COPY of sessions. Returns the new sessions, an
// optional client-note override (stored on the program row, not in sessions),
// and human-readable logs of what applied vs what could not be located.
export function applyProgramEdits(sessions: any, ops: EditOp[]): {
  sessions: any[]
  clientNoteOverride: string | null
  applied: string[]
  missed: string[]
} {
  const next = Array.isArray(sessions) ? JSON.parse(JSON.stringify(sessions)) : []
  const applied: string[] = []
  const missed: string[] = []
  let clientNoteOverride: string | null = null

  for (const op of ops) {
    if (op.kind === 'edit_client_note') {
      clientNoteOverride = op.note_text
      applied.push('Updated the client-facing note.')
      continue
    }
    // update_exercise
    const ex = next?.[op.day_index]?.blocks?.[op.block_index]?.exercises?.[op.exercise_index]
    if (!ex || typeof ex !== 'object') {
      missed.push(`Could not find an exercise at day ${op.day_index}, block ${op.block_index}, position ${op.exercise_index}.`)
      continue
    }
    const before = ex.exercise_name ?? 'exercise'
    const c = op.changes
    if (c.exercise_name != null) ex.exercise_name = c.exercise_name
    if (c.sets != null) ex.sets = c.sets
    if (c.reps != null) ex.reps = c.reps
    if (c.rpe != null) ex.rpe = c.rpe
    if (c.rest != null) ex.rest = c.rest
    if (c.notes != null) ex.notes = c.notes
    const renamed = c.exercise_name && c.exercise_name !== before
    applied.push(`Updated "${before}"${renamed ? ` → "${c.exercise_name}"` : ''}.`)
  }

  return { sessions: next, clientNoteOverride, applied, missed }
}
