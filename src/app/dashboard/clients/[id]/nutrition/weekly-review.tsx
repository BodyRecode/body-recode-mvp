'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SIGNAL_CATEGORIES = [
  { value: 'under_fuelling', label: 'Under-fuelling', desc: 'Persistent hunger, low energy, poor recovery' },
  { value: 'over_fuelling', label: 'Over-fuelling', desc: 'Low hunger, sluggishness, rapid weight increase' },
  { value: 'recovery_constraint', label: 'Recovery constraint', desc: 'Fatigue, poor sleep, reduced performance' },
  { value: 'adherence_constraint', label: 'Adherence constraint', desc: 'Missed meals, inconsistent eating' },
  { value: 'neutral_stable', label: 'Neutral / Stable', desc: 'No meaningful issue' },
]

const ADJUSTMENT_LEVELS = [
  { value: 'behavioural', label: 'Behavioural', desc: 'Fix adherence before touching nutrition', minDays: 0 },
  { value: 'structural', label: 'Structural', desc: 'Meal timing, distribution, complexity', minDays: 5 },
  { value: 'nutritional', label: 'Nutritional', desc: 'Carbs, energy, composition', minDays: 7 },
  { value: 'advanced', label: 'Advanced', desc: 'Precise carb manipulation, advanced timing', minDays: 10 },
]

const directionColour: Record<string, string> = {
  progress: 'text-green-400 bg-green-400/10 border-green-400/30',
  hold: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  rebuild: 'text-red-400 bg-red-400/10 border-red-400/30',
}

export default function NutritionWeeklyReview({
  planId,
  currentDirection,
  lastReviewAt,
}: {
  planId: string
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
  const [direction, setDirection] = useState<'progress' | 'hold' | 'rebuild'>('hold')
  const [adjustmentLevel, setAdjustmentLevel] = useState('')
  const [adjustmentApplied, setAdjustmentApplied] = useState('')
  const [variableChanged, setVariableChanged] = useState('')
  const [deloadTriggered, setDeloadTriggered] = useState(false)
  const [resetTriggered, setResetTriggered] = useState(false)
  const [recoveryModeTriggered, setRecoveryModeTriggered] = useState(false)
  const [coachNotes, setCoachNotes] = useState('')

  async function handleSubmit() {
    setSubmitting(true)
    setDoctrineError(null)

    const res = await fetch(`/api/nutrition/${planId}/review`, {
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
        reset_triggered: resetTriggered,
        recovery_mode_triggered: recoveryModeTriggered,
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
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${directionColour[currentDirection]}`}>
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

          {/* Doctrine gate: adherence */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Step 1 — Adherence Gate</p>
            <button
              onClick={() => setAdherenceConfirmed(!adherenceConfirmed)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border w-full text-left transition-colors ${
                adherenceConfirmed
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-stone-700 hover:border-stone-600'
              }`}
            >
              <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                adherenceConfirmed ? 'border-teal-500 bg-teal-500' : 'border-stone-600'
              }`}>
                {adherenceConfirmed && <span className="text-black text-xs font-bold">✓</span>}
              </div>
              <div>
                <p className={`text-sm font-medium ${adherenceConfirmed ? 'text-teal-300' : 'text-stone-400'}`}>
                  Client followed the plan this week
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  Doctrine: if adherence not confirmed, no nutritional adjustment is permitted. Behavioural adjustment only.
                </p>
              </div>
            </button>
          </div>

          {/* Signal category */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Signal Category</p>
            <div className="space-y-2">
              {SIGNAL_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSignalCategory(cat.value)}
                  className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    signalCategory === cat.value
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-stone-800 hover:border-stone-700'
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
              <p className="text-[10px] text-stone-600 mt-2">4+ observations = strong. 2–3 = moderate. 1 = weak.</p>
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
                  max={21}
                />
                <span className="text-xs text-stone-600">days</span>
              </div>
              <p className="text-[10px] text-stone-600 mt-2">Min 5–7 days for any adjustment. 10–14 days = high confidence.</p>
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
            <p className="text-[10px] text-stone-600 mb-3">Rebuild → Hold → Progress. If rebuild conditions exist, rebuild regardless of other factors.</p>
            <div className="grid grid-cols-3 gap-2">
              {(['progress', 'hold', 'rebuild'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold capitalize transition-colors ${
                    direction === d
                      ? directionColour[d] + ' border-current'
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
                    adjustmentLevel === level.value
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border shrink-0 mt-0.5 ${
                    adjustmentLevel === level.value ? 'border-teal-500 bg-teal-500' : 'border-stone-600'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${adjustmentLevel === level.value ? 'text-teal-300' : 'text-stone-300'}`}>{level.label}</p>
                      <span className="text-[10px] text-stone-600">min {level.minDays} days</span>
                    </div>
                    <p className="text-xs text-stone-600">{level.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {adjustmentLevel && (
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
                  placeholder="e.g. carbohydrate amount at meal 3"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600"
                />
                <p className="text-[10px] text-stone-600 mt-1">Doctrine: only ONE variable may be changed per review cycle.</p>
              </div>
            </div>
          )}

          {/* Recovery routing */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Recovery Routing (if applicable)</p>
            <div className="space-y-2">
              {[
                { key: 'deload', label: 'Deload', desc: 'Temporary load reduction, structure maintained', state: deloadTriggered, setter: setDeloadTriggered },
                { key: 'reset', label: 'Reset', desc: 'Significant simplification of the plan', state: resetTriggered, setter: setResetTriggered },
                { key: 'recovery', label: 'Recovery Mode', desc: 'Prioritised recovery phase — no forward progression', state: recoveryModeTriggered, setter: setRecoveryModeTriggered },
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

          {/* Doctrine error */}
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
