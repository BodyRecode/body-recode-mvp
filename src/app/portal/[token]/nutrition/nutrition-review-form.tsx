'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDraftState, clearDraftsByPrefix } from '@/lib/use-form-draft'

const SIGNAL_OPTIONS = [
  { value: 'under_fuelling', label: 'Under-fuelled', desc: 'Persistent hunger, low energy, poor recovery' },
  { value: 'over_fuelling', label: 'Over-fuelled', desc: 'Low hunger, sluggishness, feeling heavy' },
  { value: 'recovery_constraint', label: 'Recovery issues', desc: 'Fatigue, poor sleep, feeling run down' },
  { value: 'adherence_constraint', label: 'Hard to stick to', desc: 'Missed meals, inconsistent eating' },
  { value: 'neutral_stable', label: 'Feeling good', desc: 'No major issues - things feel on track' },
]

const directionColour: Record<string, string> = {
  progress: 'border-green-500 bg-green-500/10 text-green-300',
  hold: 'border-amber-500 bg-amber-50 text-amber-700',
  rebuild: 'border-red-500 bg-red-50 text-red-700',
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
  const draftPrefix = `nutrition-review:${token}:`

  const [adherenceConfirmed, setAdherenceConfirmed] = useDraftState(`${draftPrefix}adherence`, false)
  const [signalCategories, setSignalCategories] = useDraftState<string[]>(`${draftPrefix}signals`, [])
  const [direction, setDirection] = useDraftState<'progress' | 'hold' | 'rebuild' | ''>(`${draftPrefix}direction`, '')
  const [signalsNoted, setSignalsNoted] = useDraftState(`${draftPrefix}notes`, '')

  const [missing, setMissing] = useState<Set<string>>(new Set())

  async function handleSubmit() {
    if (!direction) {
      setMissing(new Set(['direction']))
      setError('Please answer the highlighted question below.')
      setTimeout(() => {
        const el = document.getElementById('f-direction')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 80)
      return
    }
    setMissing(new Set())
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/portal/nutrition-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        adherence_confirmed: adherenceConfirmed,
        signal_category: signalCategories.length > 0 ? signalCategories.join(',') : null,
        signals_noted: signalsNoted || null,
        direction,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setError(data.error || 'Something went wrong'); return }
    clearDraftsByPrefix(draftPrefix)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#1B6DFC] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-[#1B6DFC] mb-1">Review submitted</p>
        <p className="text-[#6B6B6B] text-sm mb-6">Your coach will see this when they review your plan.</p>
        <button
          onClick={() => router.push(`/portal/${token}`)}
          className="text-sm font-semibold text-white bg-[#1B6DFC] px-6 py-2.5 rounded-xl hover:bg-[#1056D6] transition-colors"
        >
          Back to portal
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {lastReviewAt && (
        <p className="text-xs text-[#999999]">
          Last reviewed {new Date(lastReviewAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}

      <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl px-4 py-3">
        <p className="text-xs text-[#999999]">Current plan</p>
        <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{planName}</p>
      </div>

      {/* Adherence */}
      <div>
        <p className="text-xs font-bold text-[#999999] uppercase tracking-widest mb-3">Did you follow your plan?</p>
        <button
          onClick={() => setAdherenceConfirmed(!adherenceConfirmed)}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border w-full text-left transition-colors ${
            adherenceConfirmed ? 'border-blue-500 bg-blue-50' : 'border-[#E5E5E5] hover:border-[#D4D4D4]'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center ${
            adherenceConfirmed ? 'border-blue-500 bg-[#1B6DFC]' : 'border-[#D4D4D4]'
          }`}>
            {adherenceConfirmed && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className={`text-sm font-medium ${adherenceConfirmed ? 'text-[#5390FF]' : 'text-[#6B6B6B]'}`}>
            Yes - I followed my nutrition plan this week
          </p>
        </button>
      </div>

      {/* What did you notice */}
      <div>
        <p className="text-xs font-bold text-[#999999] uppercase tracking-widest mb-3">What did you notice?</p>
        <div className="space-y-2">
          {SIGNAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSignalCategories(prev => prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value])}
              className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-2xl border transition-colors ${
                signalCategories.includes(opt.value) ? 'border-blue-500 bg-blue-50' : 'border-[#E5E5E5] hover:border-[#E5E5E5]'
              }`}
            >
              <div className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center ${
                signalCategories.includes(opt.value) ? 'border-blue-500 bg-[#1B6DFC]' : 'border-[#D4D4D4]'
              }`}>
                {signalCategories.includes(opt.value) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${signalCategories.includes(opt.value) ? 'text-[#5390FF]' : 'text-[#3A3A3A]'}`}>{opt.label}</p>
                <p className="text-xs text-[#999999] mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* How are things going */}
      <div id="f-direction" className="scroll-mt-24">
        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${missing.has('direction') ? 'text-red-700' : 'text-[#999999]'}`}>Overall - how are things going?</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'progress', label: 'Making progress' },
            { value: 'hold', label: 'Staying steady' },
            { value: 'rebuild', label: 'Struggling' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                setDirection(opt.value)
                if (missing.has('direction')) setMissing(prev => { const n = new Set(prev); n.delete('direction'); return n })
              }}
              className={`px-3 py-3 rounded-2xl border text-sm font-semibold transition-colors ${
                direction === opt.value
                  ? directionColour[opt.value]
                  : missing.has('direction')
                  ? 'border-red-400 text-[#999999]'
                  : 'border-[#E5E5E5] text-[#999999] hover:border-[#E5E5E5]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {missing.has('direction') && <p className="text-red-700 text-xs mt-2 font-medium">Please select an option.</p>}
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-bold text-[#999999] uppercase tracking-widest mb-2">Anything else to note? <span className="text-[#D4D4D4] normal-case font-normal">(optional)</span></p>
        <textarea
          value={signalsNoted}
          onChange={e => setSignalsNoted(e.target.value)}
          rows={3}
          placeholder="e.g. energy was low mid-week, struggled with meal 3..."
          className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#999999] resize-none focus:outline-none focus:border-[#D4D4D4]"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3.5 bg-[#1B6DFC] hover:bg-[#5390FF] disabled:bg-[#E5E5E5] disabled:text-[#999999] text-white font-bold text-sm rounded-2xl transition-colors"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}
