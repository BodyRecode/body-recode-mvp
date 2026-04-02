'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SIGNAL_CATEGORIES = [
  { value: 'performance_up', label: 'Performance up', desc: 'Sets, reps, or loads improving week on week' },
  { value: 'performance_down', label: 'Performance down', desc: 'Loads dropping, reps failing, output declining' },
  { value: 'stalled', label: 'Stalled', desc: 'No change in performance for 2+ weeks' },
  { value: 'recovery_constraint', label: 'Recovery constraint', desc: 'Fatigue, soreness, sleep impairment affecting output' },
  { value: 'neutral_stable', label: 'Neutral / Stable', desc: 'No meaningful signal this week' },
]

const ADJUSTMENT_LEVELS = [
  { value: 'execution', label: 'Execution', desc: 'RPE, rest periods, tempo — within session feel', minDays: 3 },
  { value: 'structural', label: 'Structural', desc: 'Exercise swap, set/rep scheme, block reorder', minDays: 7 },
  { value: 'phase_advance', label: 'Phase Advance', desc: 'Move to next meso block — significant change', minDays: 14 },
  { value: 'regenerate', label: 'Regenerate', desc: 'Generate a new program from scratch', minDays: 0 },
]

const directionColour: Record<string, string> = {
  progress: 'text-green-400 bg-green-400/10 border-green-400/30',
  hold: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  rebuild: 'text-red-400 bg-red-400/10 border-red-400/30',
  deload: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
}

export default function ProgramWeeklyReview({
  programId,
  currentDirection,
  lastReviewAt,
}: {
  programId: string
  currentDirection: string | null
  lastReviewAt: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [doctrineError, setDoctrineError] = useState<string | null>(null)

  const [adherenceConfirmed, setAdherenceConfirmed] = useState(false)
  const [signalCategory, setSignalCategory] = useState('')
  const [signalStrength, setSignalStrength] = useState('moderate')
  const [daysObservation, setDaysObservation] = useState(7)
  const [signalsNoted, setSignalsNoted] = useState('')
  const [direction, setDirection] = useState<'progress' | 'hold' | 'rebuild' | 'deload'>('hold')
  const [adjustmentLevel, setAdjustmentLevel] = useState('')
  const [adjustmentApplied, setAdjustmentApplied] = useState('')
  const [variableChanged, setVariableChanged] = useState('')
  const [deloadTriggered, setDeloadTriggered] = useState(false)
  const [blockExtended, setBlockExtended] = useState(false)
  const [newBlockRequired, setNewBlockRequired] = useState(false)
  const [coachNotes, setCoachNotes] = useState('')

  async function handleSubmit() {
    setSubmitting(true)
    setDoctrineError(null)

    const res = await fetch(`/api/programs/${programId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adherence_confirmed: adherenceConfirmed,
        signal_category: signalCategory || null,
        signal_strength: signalStrength,
        days_under_observation: daysObservation,
        signals_noted: signalsNoted || null,
        direction,
        adjustment_level: adjustmentLevel || null,
        adjustment_applied: adjustmentApplied || null,
        variable_changed: variableChanged || null,
        deload_triggered: deloadTriggered,
        block_extended: blockExtended,
        new_block_required: newBlockRequired,
        coach_notes: coachNotes || null,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setDoctrineError(data.error)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-300">Weekly Review</p>
          <div className="flex items-center gap-2 mt-1">
            {currentDirection ? (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${directionColour[currentDirection] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
                {currentDirection}
              </span>
            ) : (
              <span className="text-xs text-stone-600">No review yet</span>
            )}
            {lastReviewAt && (
              <span className="text-xs text-stone-600">
                Last reviewed {new Date(lastReviewAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs px-3 py-1.5 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-stone-200 transition-colors"
        >
          {open ? 'Cancel' : 'Record Review'}
        </button>
      </div>

      {open && (
        <div className="border-t border-stone-800 px-5 py-5 space-y-5">

          {/* Step 1 - Adherence */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Step 1 — Session Adherence</p>
            <button
              onClick={() => setAdherenceConfirmed(!adherenceConfirmed)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border w-full text-left transition-colors ${
                adherenceConfirmed ? 'border-teal-500 bg-teal-500/10' : 'border-stone-700 hover:border-stone-600'
              }`}
            >
              <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                adherenceConfirmed ? 'border-teal-500 bg-teal-500' : 'border-stone-600'
              }`}>
                {adherenceConfirmed && <span className="text-black text-xs font-bold">✓</span>}
              </div>
              <div>
                <p className={`text-sm font-medium ${adherenceConfirmed ? 'text-teal-300' : 'text-stone-400'}`}>
                  Client completed sessions as prescribed
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  Doctrine: structural or phase adjustment requires confirmed session adherence.
                </p>
              </div>
            </button>
          </div>

          {/* Signal category */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Performance Signal</p>
            <div className="space-y-2">
              {SIGNAL_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSignalCategory(cat.value)}
                  className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    signalCategory === cat.value ? 'border-teal-500 bg-teal-500/10' : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border shrink-0 mt-0.5 ${
                    signalCategory === cat.value ? 'border-teal-500 bg-teal-500' : 'border-stone-600'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${signalCategory === cat.value ? 'text-teal-300' : 'text-stone-300'}`}>{cat.label}</p>
                    <p className="text-xs text-stone-600">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Signal strength + days */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Signal Strength</p>
              <div className="flex gap-2">
                {['weak', 'moderate', 'strong'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSignalStrength(s)}
                    className={`px-3 py-1.5 rounded-lg border text-xs capitalize transition-colors ${
                      signalStrength === s
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-stone-700 text-stone-400 hover:border-stone-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-stone-600 mt-2">4+ sessions = strong. 2–3 = moderate. 1 = weak.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Days Under Observation</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={daysObservation}
                  onChange={e => setDaysObservation(Number(e.target.value))}
                  className="w-20 bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-sm text-white"
                  min={1}
                  max={28}
                />
                <span className="text-xs text-stone-600">days</span>
              </div>
              <p className="text-[10px] text-stone-600 mt-2">Min 7 days for structural change. 14 days for phase advance.</p>
            </div>
          </div>

          {/* Signals noted */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Signals Noted</p>
            <textarea
              value={signalsNoted}
              onChange={e => setSignalsNoted(e.target.value)}
              rows={2}
              placeholder="What specifically was observed this week..."
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 resize-none"
            />
          </div>

          {/* Direction */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Direction</p>
            <div className="grid grid-cols-4 gap-2">
              {(['progress', 'hold', 'deload', 'rebuild'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-semibold capitalize transition-colors ${
                    direction === d
                      ? (directionColour[d] || '') + ' border-current'
                      : 'border-stone-800 text-stone-500 hover:border-stone-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Adjustment level */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Adjustment Level (if any)</p>
            <div className="space-y-2">
              {ADJUSTMENT_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => setAdjustmentLevel(adjustmentLevel === level.value ? '' : level.value)}
                  className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    adjustmentLevel === level.value ? 'border-teal-500 bg-teal-500/10' : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border shrink-0 mt-0.5 ${
                    adjustmentLevel === level.value ? 'border-teal-500 bg-teal-500' : 'border-stone-600'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${adjustmentLevel === level.value ? 'text-teal-300' : 'text-stone-300'}`}>{level.label}</p>
                      {level.minDays > 0 && <span className="text-[10px] text-stone-600">min {level.minDays} days</span>}
                    </div>
                    <p className="text-xs text-stone-600">{level.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {adjustmentLevel && adjustmentLevel !== 'regenerate' && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Adjustment Applied</p>
                <input
                  value={adjustmentApplied}
                  onChange={e => setAdjustmentApplied(e.target.value)}
                  placeholder="What specifically was changed..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Variable Changed (single variable only)</p>
                <input
                  value={variableChanged}
                  onChange={e => setVariableChanged(e.target.value)}
                  placeholder="e.g. rest period on Block A compounds"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600"
                />
                <p className="text-[10px] text-stone-600 mt-1">Only ONE variable may be changed per review cycle.</p>
              </div>
            </div>
          )}

          {/* Recovery routing */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Recovery Routing (if applicable)</p>
            <div className="space-y-2">
              {[
                { key: 'deload', label: 'Deload triggered', desc: 'Scheduled or responsive load reduction this week', state: deloadTriggered, setter: setDeloadTriggered },
                { key: 'extend', label: 'Block extended', desc: 'Current block extended — not yet ready to advance', state: blockExtended, setter: setBlockExtended },
                { key: 'new_block', label: 'New block required', desc: 'Phase complete or rebuild needed — new block to be generated', state: newBlockRequired, setter: setNewBlockRequired },
              ].map(({ key, label, desc, state, setter }) => (
                <button
                  key={key}
                  onClick={() => setter(!state)}
                  className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    state ? 'border-red-700 bg-red-950/20' : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center ${
                    state ? 'border-red-500 bg-red-500' : 'border-stone-600'
                  }`}>
                    {state && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${state ? 'text-red-300' : 'text-stone-400'}`}>{label}</p>
                    <p className="text-xs text-stone-600">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Coach notes */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Coach Notes</p>
            <textarea
              value={coachNotes}
              onChange={e => setCoachNotes(e.target.value)}
              rows={3}
              placeholder="Any additional context for this review..."
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 resize-none"
            />
          </div>

          {doctrineError && (
            <div className="bg-red-950/30 border border-red-800 rounded-lg px-4 py-3">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Doctrine Gate</p>
              <p className="text-sm text-red-300">{doctrineError}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !direction}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:bg-stone-700 disabled:text-stone-500 text-black font-semibold text-sm rounded-lg transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
