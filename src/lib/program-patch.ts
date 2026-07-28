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

// Phase 7 — structural ops. A new exercise the model fully specifies.
export type ExerciseShape = {
  exercise_name: string
  sets?: number | string
  reps?: number | string
  rpe?: number | string
  rest?: string
  notes?: string
}
export type AddExerciseOp = {
  kind: 'add_exercise'
  day_index: number
  block_index: number
  position?: number // insert index within the block; omitted = append
  exercise: ExerciseShape
}
export type RemoveExerciseOp = {
  kind: 'remove_exercise'
  day_index: number
  block_index: number
  exercise_index: number
}
export type ReorderExerciseOp = {
  kind: 'reorder_exercise'
  day_index: number
  block_index: number
  from_index: number
  to_index: number
}
export type RemoveDayOp = {
  kind: 'remove_day'
  day_index: number
}
export type AddDayOp = {
  kind: 'add_day'
  session: {
    day_label?: string
    skeleton?: string
    movement_prep?: string[]
    blocks?: { block_label?: string; exercises?: ExerciseShape[] }[]
  }
}

export type EditOp =
  | UpdateExerciseOp
  | EditClientNoteOp
  | AddExerciseOp
  | RemoveExerciseOp
  | ReorderExerciseOp
  | RemoveDayOp
  | AddDayOp

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

// Coerce a model-supplied exercise object; null if it has no name.
function coerceExercise(raw: any): ExerciseShape | null {
  if (!raw || typeof raw !== 'object') return null
  const name = typeof raw.exercise_name === 'string' ? raw.exercise_name.trim() : ''
  if (!name) return null
  const ex: ExerciseShape = { exercise_name: name }
  if (raw.sets != null && (typeof raw.sets === 'number' || typeof raw.sets === 'string')) ex.sets = raw.sets
  if (raw.reps != null && (typeof raw.reps === 'number' || typeof raw.reps === 'string')) ex.reps = raw.reps
  if (raw.rpe != null && (typeof raw.rpe === 'number' || typeof raw.rpe === 'string')) ex.rpe = raw.rpe
  if (typeof raw.rest === 'string') ex.rest = raw.rest
  if (typeof raw.notes === 'string') ex.notes = raw.notes
  return ex
}

const isIdx = (n: any) => Number.isInteger(Number(n)) && Number(n) >= 0

// Validate + coerce raw operations parsed from the model. Anything malformed is
// dropped (never applied).
export function validateEditOps(raw: any): EditOp[] {
  if (!Array.isArray(raw)) return []
  const ops: EditOp[] = []
  for (const o of raw) {
    if (!o || typeof o !== 'object') continue
    if (o.kind === 'edit_client_note') {
      if (typeof o.note_text === 'string' && o.note_text.trim()) ops.push({ kind: 'edit_client_note', note_text: o.note_text })
      continue
    }
    if (o.kind === 'update_exercise') {
      if (!isIdx(o.day_index) || !isIdx(o.block_index) || !isIdx(o.exercise_index)) continue
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
      ops.push({ kind: 'update_exercise', day_index: Number(o.day_index), block_index: Number(o.block_index), exercise_index: Number(o.exercise_index), changes })
      continue
    }
    if (o.kind === 'add_exercise') {
      if (!isIdx(o.day_index) || !isIdx(o.block_index)) continue
      const ex = coerceExercise(o.exercise)
      if (!ex) continue
      const op: AddExerciseOp = { kind: 'add_exercise', day_index: Number(o.day_index), block_index: Number(o.block_index), exercise: ex }
      if (isIdx(o.position)) op.position = Number(o.position)
      ops.push(op)
      continue
    }
    if (o.kind === 'remove_exercise') {
      if (!isIdx(o.day_index) || !isIdx(o.block_index) || !isIdx(o.exercise_index)) continue
      ops.push({ kind: 'remove_exercise', day_index: Number(o.day_index), block_index: Number(o.block_index), exercise_index: Number(o.exercise_index) })
      continue
    }
    if (o.kind === 'reorder_exercise') {
      if (!isIdx(o.day_index) || !isIdx(o.block_index) || !isIdx(o.from_index) || !isIdx(o.to_index)) continue
      ops.push({ kind: 'reorder_exercise', day_index: Number(o.day_index), block_index: Number(o.block_index), from_index: Number(o.from_index), to_index: Number(o.to_index) })
      continue
    }
    if (o.kind === 'remove_day') {
      if (!isIdx(o.day_index)) continue
      ops.push({ kind: 'remove_day', day_index: Number(o.day_index) })
      continue
    }
    if (o.kind === 'add_day') {
      const s = o.session
      if (!s || typeof s !== 'object') continue
      const blocks = Array.isArray(s.blocks) ? s.blocks.map((b: any) => ({
        block_label: typeof b?.block_label === 'string' ? b.block_label : 'Block',
        exercises: Array.isArray(b?.exercises) ? b.exercises.map(coerceExercise).filter(Boolean) : [],
      })) : []
      if (blocks.length === 0) continue
      ops.push({ kind: 'add_day', session: {
        day_label: typeof s.day_label === 'string' ? s.day_label : 'New Session',
        skeleton: typeof s.skeleton === 'string' ? s.skeleton : undefined,
        movement_prep: Array.isArray(s.movement_prep) ? s.movement_prep.filter((x: any) => typeof x === 'string') : undefined,
        blocks,
      } })
      continue
    }
  }
  return ops
}

// Apply ops to a DEEP COPY of sessions. Ops reference ORIGINAL indices, so they
// are applied in an order that keeps those indices valid: in-place edits first,
// then reorders, then inserts, then removals in DESCENDING index order, then
// day-level removals/additions. (Proposals are almost always one coherent
// change, so cross-op index shifts are rare; the coach reviews the result.)
export function applyProgramEdits(sessions: any, ops: EditOp[]): {
  sessions: any[]
  clientNoteOverride: string | null
  applied: string[]
  missed: string[]
} {
  const next: any[] = Array.isArray(sessions) ? JSON.parse(JSON.stringify(sessions)) : []
  const applied: string[] = []
  const missed: string[] = []
  let clientNoteOverride: string | null = null

  const byKind = <K extends EditOp['kind']>(k: K) => ops.filter(o => o.kind === k) as Extract<EditOp, { kind: K }>[]
  const blockOf = (d: number, b: number) => next?.[d]?.blocks?.[b]

  // 1. note override
  for (const op of byKind('edit_client_note')) { clientNoteOverride = op.note_text; applied.push('Updated the client-facing note.') }

  // 2. update_exercise (in place)
  for (const op of byKind('update_exercise')) {
    const ex = blockOf(op.day_index, op.block_index)?.exercises?.[op.exercise_index]
    if (!ex || typeof ex !== 'object') { missed.push(`Could not find an exercise at day ${op.day_index}, block ${op.block_index}, position ${op.exercise_index}.`); continue }
    const before = ex.exercise_name ?? 'exercise'
    const c = op.changes
    if (c.exercise_name != null) ex.exercise_name = c.exercise_name
    if (c.sets != null) ex.sets = c.sets
    if (c.reps != null) ex.reps = c.reps
    if (c.rpe != null) ex.rpe = c.rpe
    if (c.rest != null) ex.rest = c.rest
    if (c.notes != null) ex.notes = c.notes
    applied.push(`Updated "${before}"${c.exercise_name && c.exercise_name !== before ? ` → "${c.exercise_name}"` : ''}.`)
  }

  // 3. reorder_exercise (in place within a block)
  for (const op of byKind('reorder_exercise')) {
    const block = blockOf(op.day_index, op.block_index)
    const arr = block?.exercises
    if (!Array.isArray(arr) || op.from_index >= arr.length) { missed.push(`Could not reorder: no exercise at day ${op.day_index}, block ${op.block_index}, position ${op.from_index}.`); continue }
    const [moved] = arr.splice(op.from_index, 1)
    arr.splice(Math.min(op.to_index, arr.length), 0, moved)
    applied.push(`Moved "${moved?.exercise_name ?? 'exercise'}" within its block.`)
  }

  // 4. add_exercise (insert or append)
  for (const op of byKind('add_exercise')) {
    const block = blockOf(op.day_index, op.block_index)
    if (!block) { missed.push(`Could not add: no block at day ${op.day_index}, block ${op.block_index}.`); continue }
    if (!Array.isArray(block.exercises)) block.exercises = []
    const pos = op.position != null ? Math.min(op.position, block.exercises.length) : block.exercises.length
    block.exercises.splice(pos, 0, op.exercise)
    applied.push(`Added "${op.exercise.exercise_name}".`)
  }

  // 5. remove_exercise — group by day+block, remove DESCENDING exercise_index
  const exRemovals = byKind('remove_exercise').sort((a, b) => b.exercise_index - a.exercise_index)
  for (const op of exRemovals) {
    const arr = blockOf(op.day_index, op.block_index)?.exercises
    if (!Array.isArray(arr) || op.exercise_index >= arr.length) { missed.push(`Could not remove: no exercise at day ${op.day_index}, block ${op.block_index}, position ${op.exercise_index}.`); continue }
    const [removed] = arr.splice(op.exercise_index, 1)
    applied.push(`Removed "${removed?.exercise_name ?? 'exercise'}".`)
  }

  // 6. remove_day — DESCENDING day_index
  const dayRemovals = byKind('remove_day').sort((a, b) => b.day_index - a.day_index)
  for (const op of dayRemovals) {
    if (op.day_index >= next.length) { missed.push(`Could not remove: no day at index ${op.day_index}.`); continue }
    const [removed] = next.splice(op.day_index, 1)
    applied.push(`Removed the day "${removed?.day_label ?? 'session'}".`)
  }

  // 7. add_day — append
  for (const op of byKind('add_day')) {
    next.push(op.session)
    applied.push(`Added a new day "${op.session.day_label ?? 'session'}".`)
  }

  return { sessions: next, clientNoteOverride, applied, missed }
}
