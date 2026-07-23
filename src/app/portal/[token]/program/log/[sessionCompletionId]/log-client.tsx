'use client'

/**
 * Live workout logging client component. Mobile-first.
 *
 * Per exercise:
 *   - Header: prescribed name, prescribed sets×reps @ RPE, rest, exercise notes
 *   - Substitution toggle (if expanded: input substitution name + reason)
 *   - Per-set rows: weight, reps, RPE inputs + a "✓" button to commit the set
 *   - Per-exercise notes textarea (saves on blur)
 *
 * Bottom of page: session-level notes textarea + big "Mark session complete" button.
 *
 * Saves are debounced or commit-on-action depending on input type:
 *   - Set values save on the explicit "✓" button (or on blur of the row)
 *   - Notes / substitution save on blur (350ms debounce)
 */

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import RestTimer, { RestTimerHandle } from './rest-timer'
import { estimate1RM } from '@/lib/workout-logging'

/**
 * Turn a prescribed-rest string into seconds for the rest timer.
 * Handles "90s", "90 sec", "2 min", "1:30", "60-90s" (takes the first number).
 * Returns null when nothing parseable is found.
 */
function parseRestToSeconds(rest: string | null): number | null {
  if (!rest) return null
  const str = rest.toLowerCase().trim()
  const clock = str.match(/(\d+):(\d{1,2})/)
  if (clock) return parseInt(clock[1], 10) * 60 + parseInt(clock[2], 10)
  const num = str.match(/\d+(\.\d+)?/)
  if (!num) return null
  let val = parseFloat(num[0])
  if (str.includes('min') || /\d\s*m(?![a-z])/.test(str)) val *= 60
  return Math.round(val)
}

interface ExerciseRow {
  id: string
  block_label: string | null
  prescribed_exercise_name: string
  prescribed_sets: number | null
  prescribed_reps: string | null
  prescribed_rpe: number | null
  prescribed_rest: string | null
  prescribed_notes: string | null
  substituted: boolean
  substituted_exercise_name: string | null
  substitution_reason: string | null
  exercise_notes: string | null
}

interface SetLog {
  id: string
  session_exercise_completion_id: string
  set_number: number
  weight_kg: number | null
  reps_completed: number | null
  rpe: number | null
}

interface Props {
  token: string
  clientId: string
  sessionCompletionId: string
  sessionStatus: string
  initialSessionNotes: string
  exercises: ExerciseRow[]
  initialSetLogs: SetLog[]
  /** Per-exercise-name: last session's sets + when, for the "last time" line. */
  lastTime?: Record<string, { sets: Array<{ weight: number | null; reps: number | null }>; when: string | null }>
  /** Per-exercise-name: best prior estimated 1RM, for personal-record detection. */
  priorBest?: Record<string, number>
}

/** "60 × 8, 60 × 8, 57.5 × 7" from a set list. */
function formatSets(sets: Array<{ weight: number | null; reps: number | null }>): string {
  return sets
    .filter(s => s.weight != null || s.reps != null)
    .map(s => `${s.weight ?? '–'} × ${s.reps ?? '–'}`)
    .join(', ')
}

/** "today" / "yesterday" / "last Tue" / "3 Jun" — a light relative label. */
function relativeWhen(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso)
  const days = Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return then.toLocaleDateString('en-AU', { weekday: 'long' })
  return then.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

type SetState = {
  weight: string
  reps: string
  rpe: string
  saved: boolean
  saving: boolean
  error: string | null
}

const ROW_KEY = (exerciseId: string, setNumber: number) => `${exerciseId}:${setNumber}`

export default function LogClient(props: Props) {
  const router = useRouter()
  const isCompleted = props.sessionStatus === 'completed'
  const restRef = useRef<RestTimerHandle>(null)

  // Personal-record tracking. Seed the running best per exercise from the
  // client's prior best (estimated 1RM). When a committed set beats it AND the
  // client had prior history for that lift, we show a quiet "new best" badge.
  const bestByExerciseRef = useRef<Record<string, number>>({ ...(props.priorBest ?? {}) })
  const hadPriorRef = useRef<Record<string, boolean>>(
    Object.fromEntries(Object.entries(props.priorBest ?? {}).map(([k, v]) => [k, v > 0])),
  )
  const [prBadges, setPrBadges] = useState<Record<string, string>>({})

  // Per-set state, keyed by exerciseId:setNumber
  const initialSets: Record<string, SetState> = {}
  for (const ex of props.exercises) {
    const setCount = ex.prescribed_sets ?? 0
    for (let n = 1; n <= setCount; n++) {
      const existing = props.initialSetLogs.find(
        s => s.session_exercise_completion_id === ex.id && s.set_number === n,
      )
      initialSets[ROW_KEY(ex.id, n)] = {
        weight: existing?.weight_kg != null ? String(existing.weight_kg) : '',
        reps: existing?.reps_completed != null ? String(existing.reps_completed) : '',
        rpe: existing?.rpe != null ? String(existing.rpe) : '',
        saved: existing != null,
        saving: false,
        error: null,
      }
    }
  }
  const [setStates, setSetStates] = useState<Record<string, SetState>>(initialSets)

  // Per-exercise state for notes + substitution
  type ExerciseState = {
    notes: string
    substituted: boolean
    subName: string
    subReason: string
    saving: boolean
    error: string | null
  }
  const initialEx: Record<string, ExerciseState> = {}
  for (const ex of props.exercises) {
    initialEx[ex.id] = {
      notes: ex.exercise_notes ?? '',
      substituted: ex.substituted,
      subName: ex.substituted_exercise_name ?? '',
      subReason: ex.substitution_reason ?? '',
      saving: false,
      error: null,
    }
  }
  const [exStates, setExStates] = useState<Record<string, ExerciseState>>(initialEx)

  const [sessionNotes, setSessionNotes] = useState(props.initialSessionNotes)
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState('')

  /* ===========================================================
   * Set save
   * =========================================================== */

  const saveSet = useCallback(
    async (exerciseId: string, setNumber: number) => {
      const key = ROW_KEY(exerciseId, setNumber)
      const s = setStates[key]
      if (!s) return

      // Require at least weight or reps to save
      if (s.weight.trim() === '' && s.reps.trim() === '') {
        setSetStates(prev => ({ ...prev, [key]: { ...prev[key], error: 'Enter weight or reps first' } }))
        return
      }

      setSetStates(prev => ({ ...prev, [key]: { ...prev[key], saving: true, error: null } }))

      try {
        const res = await fetch('/api/portal/log/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: props.token,
            clientId: props.clientId,
            sessionExerciseCompletionId: exerciseId,
            setNumber,
            weightKg: s.weight === '' ? null : parseFloat(s.weight),
            repsCompleted: s.reps === '' ? null : parseInt(s.reps, 10),
            rpe: s.rpe === '' ? null : parseFloat(s.rpe),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setSetStates(prev => ({ ...prev, [key]: { ...prev[key], saving: false, error: data.error ?? 'Failed' } }))
          return
        }
        setSetStates(prev => ({ ...prev, [key]: { ...prev[key], saving: false, saved: true, error: null } }))
        // Committing a set kicks off the rest timer with this exercise's
        // prescribed rest, so the client doesn't have to start it manually.
        const ex = props.exercises.find(e => e.id === exerciseId)
        const restSec = parseRestToSeconds(ex?.prescribed_rest ?? null)
        if (restSec) restRef.current?.start(restSec)

        // Personal-record check: did this set beat their prior best on this
        // lift? Only celebrate when they have history (no PR on a first-ever
        // log) and the set has both weight + reps.
        if (ex) {
          const name = ex.prescribed_exercise_name
          const w = s.weight === '' ? null : parseFloat(s.weight)
          const r = s.reps === '' ? null : parseInt(s.reps, 10)
          if (w != null && w > 0 && r != null && r > 0) {
            const e1rm = estimate1RM(w, r)
            const prevBest = bestByExerciseRef.current[name] ?? 0
            if (hadPriorRef.current[name] && e1rm > prevBest) {
              bestByExerciseRef.current[name] = e1rm
              setPrBadges(prev => ({ ...prev, [name]: `${w}kg × ${r}` }))
            } else if (e1rm > prevBest) {
              // Update the running best silently so the first log becomes the
              // baseline to beat later this session.
              bestByExerciseRef.current[name] = e1rm
            }
          }
        }
      } catch (err) {
        setSetStates(prev => ({
          ...prev,
          [key]: { ...prev[key], saving: false, error: err instanceof Error ? err.message : 'Network error' },
        }))
      }
    },
    [setStates, props.token, props.clientId, props.exercises],
  )

  /* ===========================================================
   * Exercise meta save (notes + substitution)
   * =========================================================== */

  const saveExerciseMeta = useCallback(
    async (exerciseId: string) => {
      const e = exStates[exerciseId]
      if (!e) return
      setExStates(prev => ({ ...prev, [exerciseId]: { ...prev[exerciseId], saving: true, error: null } }))
      try {
        const res = await fetch('/api/portal/log/exercise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: props.token,
            clientId: props.clientId,
            sessionExerciseCompletionId: exerciseId,
            substituted: e.substituted,
            substitutedExerciseName: e.substituted ? e.subName : null,
            substitutionReason: e.substituted ? e.subReason : null,
            exerciseNotes: e.notes,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setExStates(prev => ({ ...prev, [exerciseId]: { ...prev[exerciseId], saving: false, error: data.error ?? 'Failed' } }))
          return
        }
        setExStates(prev => ({ ...prev, [exerciseId]: { ...prev[exerciseId], saving: false, error: null } }))
      } catch (err) {
        setExStates(prev => ({
          ...prev,
          [exerciseId]: { ...prev[exerciseId], saving: false, error: err instanceof Error ? err.message : 'Network error' },
        }))
      }
    },
    [exStates, props.token, props.clientId],
  )

  /* ===========================================================
   * Mark session complete
   * =========================================================== */

  async function handleComplete() {
    setCompleting(true)
    setCompleteError('')
    try {
      const res = await fetch('/api/portal/log/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: props.token,
          clientId: props.clientId,
          sessionCompletionId: props.sessionCompletionId,
          sessionNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCompleteError(data.error ?? 'Failed to complete')
        setCompleting(false)
        return
      }
      router.push(`/portal/${props.token}/program/log`)
      router.refresh()
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : 'Network error')
      setCompleting(false)
    }
  }

  /* ===========================================================
   * Render
   * =========================================================== */

  return (
    <div className="space-y-5">
      {props.exercises.map(ex => {
        const exState = exStates[ex.id]
        const setCount = ex.prescribed_sets ?? 0
        const completedSets = Array.from({ length: setCount }, (_, i) => i + 1).filter(
          n => setStates[ROW_KEY(ex.id, n)]?.saved,
        ).length
        const allSetsSaved = setCount > 0 && completedSets === setCount

        return (
          <div
            key={ex.id}
            className={`bg-[#FFFFFF] border rounded-2xl p-4 ${allSetsSaved ? 'border-blue-200' : 'border-[#E5E5E5]'}`}
          >
            {/* Exercise header */}
            <div className="mb-3">
              {ex.block_label && <p className="text-[10px] text-[#999999] uppercase tracking-widest mb-1">{ex.block_label}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#1A1A1A]">{ex.prescribed_exercise_name}</h3>
                {prBadges[ex.prescribed_exercise_name] && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#1B6DFC] bg-blue-50 border border-[#1B6DFC]/30 rounded-full px-2 py-0.5">
                    ▲ New best · {prBadges[ex.prescribed_exercise_name]}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                {ex.prescribed_sets ?? '?'} × {ex.prescribed_reps ?? '?'}
                {ex.prescribed_rpe != null ? ` @ RPE ${ex.prescribed_rpe}` : ''}
                {ex.prescribed_rest ? ` · ${ex.prescribed_rest}` : ''}
              </p>
              {(() => {
                const lt = props.lastTime?.[ex.prescribed_exercise_name]
                if (!lt || lt.sets.length === 0) return null
                return (
                  <p className="text-xs text-[#1B6DFC] mt-1.5 leading-relaxed">
                    <span className="font-semibold">Last time:</span> {formatSets(lt.sets)}
                    {lt.when ? <span className="text-[#999999]"> · {relativeWhen(lt.when)}</span> : null}
                  </p>
                )
              })()}
              {ex.prescribed_notes && <p className="text-xs text-[#6B6B6B] mt-1.5 leading-relaxed">{ex.prescribed_notes}</p>}
            </div>

            {/* Substitution toggle */}
            <div className="mb-3 text-xs">
              <label className="flex items-center gap-2 text-[#6B6B6B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={exState?.substituted ?? false}
                  disabled={isCompleted}
                  onChange={e => setExStates(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], substituted: e.target.checked } }))}
                  onBlur={() => saveExerciseMeta(ex.id)}
                  className="accent-blue-500"
                />
                Substituted with a different exercise
              </label>
              {exState?.substituted && (
                <div className="mt-2 space-y-1.5 pl-5">
                  <input
                    type="text"
                    placeholder="What did you do instead?"
                    value={exState.subName}
                    disabled={isCompleted}
                    onChange={e => setExStates(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], subName: e.target.value } }))}
                    onBlur={() => saveExerciseMeta(ex.id)}
                    className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:border-[#D4D4D4]"
                  />
                  <input
                    type="text"
                    placeholder="Why? (optional)"
                    value={exState.subReason}
                    disabled={isCompleted}
                    onChange={e => setExStates(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], subReason: e.target.value } }))}
                    onBlur={() => saveExerciseMeta(ex.id)}
                    className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:border-[#D4D4D4]"
                  />
                </div>
              )}
            </div>

            {/* Set rows */}
            <div className="space-y-1.5 mb-3">
              {Array.from({ length: setCount }, (_, i) => i + 1).map(n => {
                const key = ROW_KEY(ex.id, n)
                const s = setStates[key]
                if (!s) return null
                return (
                  <div key={n} className="grid grid-cols-[28px_1fr_1fr_1fr_36px] gap-1.5 items-center">
                    <span className="text-xs text-[#999999] tabular-nums text-center">{n}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="kg"
                      value={s.weight}
                      disabled={isCompleted}
                      onChange={e => setSetStates(prev => ({ ...prev, [key]: { ...prev[key], weight: e.target.value, saved: false } }))}
                      className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-2 py-2.5 text-sm text-[#1A1A1A] text-center placeholder-[#999999] focus:outline-none focus:border-[#D4D4D4] tabular-nums"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="reps"
                      value={s.reps}
                      disabled={isCompleted}
                      onChange={e => setSetStates(prev => ({ ...prev, [key]: { ...prev[key], reps: e.target.value, saved: false } }))}
                      className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-2 py-2.5 text-sm text-[#1A1A1A] text-center placeholder-[#999999] focus:outline-none focus:border-[#D4D4D4] tabular-nums"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="RPE"
                      value={s.rpe}
                      disabled={isCompleted}
                      onChange={e => setSetStates(prev => ({ ...prev, [key]: { ...prev[key], rpe: e.target.value, saved: false } }))}
                      className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-2 py-2.5 text-sm text-[#1A1A1A] text-center placeholder-[#999999] focus:outline-none focus:border-[#D4D4D4] tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => saveSet(ex.id, n)}
                      disabled={isCompleted || s.saving}
                      className={`h-9 rounded-lg text-xs font-bold transition-colors ${
                        s.saved
                          ? 'bg-blue-100 text-blue-500 border border-blue-200'
                          : 'bg-[#E5E5E5] text-[#6B6B6B] hover:bg-[#262421] border border-[#E5E5E5]'
                      }`}
                      aria-label={`Save set ${n}`}
                    >
                      {s.saving ? '…' : s.saved ? '✓' : '✓'}
                    </button>
                  </div>
                )
              })}
              {/* Errors below the set rows */}
              {Array.from({ length: setCount }, (_, i) => i + 1).map(n => {
                const s = setStates[ROW_KEY(ex.id, n)]
                if (!s?.error) return null
                return <p key={`err-${n}`} className="text-[11px] text-red-700 pl-9">Set {n}: {s.error}</p>
              })}
            </div>

            {/* Per-exercise notes */}
            <textarea
              placeholder="Notes for this exercise (optional)"
              value={exState?.notes ?? ''}
              disabled={isCompleted}
              onChange={e => setExStates(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], notes: e.target.value } }))}
              onBlur={() => saveExerciseMeta(ex.id)}
              rows={2}
              className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:border-[#D4D4D4] resize-none"
            />
            {exState?.error && <p className="mt-1 text-[11px] text-red-700">{exState.error}</p>}
          </div>
        )
      })}

      {/* Session-level notes + complete button */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-4">
        <p className="text-[10px] text-[#999999] uppercase tracking-widest mb-2">Session notes (optional)</p>
        <textarea
          placeholder="Anything you want Kade to know about this session as a whole?"
          value={sessionNotes}
          disabled={isCompleted}
          onChange={e => setSessionNotes(e.target.value)}
          rows={3}
          className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:border-[#D4D4D4] resize-none"
        />
      </div>

      {!isCompleted && (
        <button
          type="button"
          onClick={handleComplete}
          disabled={completing}
          className="w-full py-4 bg-[#1B6DFC] hover:bg-[#5390FF] text-white font-bold text-sm rounded-2xl transition-colors disabled:opacity-50"
        >
          {completing ? 'Saving…' : 'Mark session complete'}
        </button>
      )}
      {completeError && <p className="text-xs text-red-700 text-center">{completeError}</p>}

      {/* Rest timer: fixed bar at the bottom. Only on a live session. The
          spacer keeps the last button clear of the fixed bar. */}
      {!isCompleted && (
        <>
          <div className="h-24" aria-hidden />
          <RestTimer ref={restRef} />
        </>
      )}
    </div>
  )
}
