'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SIGNAL_OPTIONS = [
  { value: 'under_fuelling', label: 'Under-fuelled', desc: 'Persistent hunger, low energy, poor recovery' },
  { value: 'over_fuelling', label: 'Over-fuelled', desc: 'Low hunger, sluggishness, feeling heavy' },
  { value: 'recovery_constraint', label: 'Recovery issues', desc: 'Fatigue, poor sleep, feeling run down' },
  { value: 'adherence_constraint', label: 'Hard to stick to', desc: 'Missed meals, inconsistent eating' },
  { value: 'neutral_stable', label: 'Feeling good', desc: 'No major issues — things feel on track' },
]

const directionColour: Record<string, string> = {
  progress: 'border-green-500 bg-green-500/10 text-green-300',
  hold: 'border-amber-500 bg-amber-500/10 text-amber-300',
  rebuild: 'border-red-500 bg-red-500/10 text-red-300',
}

export default function NutritionReviewForm({
  token,
  planName,
  lastReviewAt,
}: {
  token: string
  planName: string
  lastReviewAt: string | null
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [adherenceConfirmed, setAdherenceConfirmed] = useState(false)
  const [signalCategory, setSignalCategory] = useState('')
  const [direction, setDirection] = useState<'progress' | 'hold' | 'rebuild' | ''>('')
  const [signalsNoted, setSignalsNoted] = useState('')

  async function handleSubmit() {
    if (!direction) { setError('Please select how things are going'); return }
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/portal/nutrition-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        adherence_confirmed: adherenceConfirmed,
        signal_category: signalCategory || null,
        signals_noted: signalsNoted || null,
        direction,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setError(data.error || 'Something went wrong'); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-teal-400/20 bg-teal-400/5 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-teal-400 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-teal-400 mb-1">Review submitted</p>
        <p className="text-stone-400 text-sm mb-6">Your coach will see this when they review your plan.</p>
        <button
          onClick={() => router.push(`/portal/${token}`)}
          className="text-sm font-semibold text-black bg-teal-400 px-6 py-2.5 rounded-xl hover:bg-teal-300 transition-colors"
        >
          Back to portal
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {lastReviewAt && (
        <p className="text-xs text-stone-600">
          Last reviewed {new Date(lastReviewAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}

      <div className="bg-stone-900 border border-stone-800 rounded-2xl px-4 py-3">
        <p className="text-xs text-stone-500">Current plan</p>
        <p className="text-sm font-semibold text-white mt-0.5">{planName}</p>
      </div>

      {/* Adherence */}
      <div>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Did you follow your plan?</p>
        <button
          onClick={() => setAdherenceConfirmed(!adherenceConfirmed)}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border w-full text-left transition-colors ${
            adherenceConfirmed ? 'border-teal-500 bg-teal-500/10' : 'border-stone-700 hover:border-stone-600'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center ${
            adherenceConfirmed ? 'border-teal-500 bg-teal-500' : 'border-stone-600'
          }`}>
            {adherenceConfirmed && (
              <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className={`text-sm font-medium ${adherenceConfirmed ? 'text-teal-300' : 'text-stone-400'}`}>
            Yes — I followed my nutrition plan this week
          </p>
        </button>
      </div>

      {/* What did you notice */}
      <div>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">What did you notice?</p>
        <div className="space-y-2">
          {SIGNAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSignalCategory(signalCategory === opt.value ? '' : opt.value)}
              className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-2xl border transition-colors ${
                signalCategory === opt.value ? 'border-teal-500 bg-teal-500/10' : 'border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className={`w-3 h-3 rounded-full border shrink-0 mt-1 ${
                signalCategory === opt.value ? 'border-teal-500 bg-teal-500' : 'border-stone-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${signalCategory === opt.value ? 'text-teal-300' : 'text-stone-300'}`}>{opt.label}</p>
                <p className="text-xs text-stone-600 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* How are things going */}
      <div>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Overall — how are things going?</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'progress', label: 'Making progress' },
            { value: 'hold', label: 'Staying steady' },
            { value: 'rebuild', label: 'Struggling' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setDirection(opt.value)}
              className={`px-3 py-3 rounded-2xl border text-sm font-semibold transition-colors ${
                direction === opt.value
                  ? directionColour[opt.value]
                  : 'border-stone-800 text-stone-500 hover:border-stone-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Anything else to note? <span className="text-stone-700 normal-case font-normal">(optional)</span></p>
        <textarea
          value={signalsNoted}
          onChange={e => setSignalsNoted(e.target.value)}
          rows={3}
          placeholder="e.g. energy was low mid-week, struggled with meal 3..."
          className="w-full bg-stone-900 border border-stone-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-stone-600 resize-none focus:outline-none focus:border-stone-600"
        />
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !direction}
        className="w-full py-3.5 bg-teal-400 hover:bg-teal-300 disabled:bg-stone-800 disabled:text-stone-600 text-black font-bold text-sm rounded-2xl transition-colors"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}
