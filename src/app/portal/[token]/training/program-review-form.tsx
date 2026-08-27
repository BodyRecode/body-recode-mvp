'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDraftState, clearDraftsByPrefix } from '@/lib/use-form-draft'

const SIGNAL_OPTIONS = [
  { value: 'performance_up', label: 'Feeling stronger', desc: 'Sessions felt good, hitting targets or above' },
  { value: 'performance_down', label: 'Struggling with sessions', desc: 'Loads dropping, reps harder than expected' },
  { value: 'stalled', label: 'No change', desc: 'Feeling flat, sessions unchanged for a couple of weeks' },
  { value: 'recovery_constraint', label: 'Recovering poorly', desc: 'Sore, fatigued, sleep affecting training' },
  { value: 'neutral_stable', label: 'Ticking along', desc: 'Nothing notable - training felt normal' },
]

const directionColour: Record<string, string> = {
  progress: 'border-[#22A05A] bg-[#22A05A]/10 text-green-300',
  hold: 'border-[#B7791F] bg-[#FDF6E9] text-[#A96A12]',
  rebuild: 'border-[#DC2626] bg-[#FDEDED] text-[#C82626]',
}

export default function ProgramReviewForm({
  token,
  blockName,
  lastReviewAt,
}: {
  token: string
  blockName: string
  lastReviewAt: string | null
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const draftPrefix = `program-review:${token}:`

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

    const res = await fetch('/api/portal/program-review', {
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
      <div className="rounded-2xl border border-[#B5CFFC] bg-[#EFF5FE] p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#1B6DFC] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-[#1B6DFC] mb-1">Review submitted</p>
        <p className="text-[#666D7A] text-sm mb-6">Your coach will see this when they review your program.</p>
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
        <p className="text-xs text-[#98A0AD]">
          Last reviewed {new Date(lastReviewAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}

      <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-2xl px-4 py-3">
        <p className="text-xs text-[#98A0AD]">Current block</p>
        <p className="text-sm font-semibold text-[#141821] mt-0.5">{blockName}</p>
      </div>

      {/* Adherence */}
      <div>
        <p className="text-[12.5px] font-medium text-[#98A0AD] mb-3">Did you complete your sessions?</p>
        <button
          onClick={() => setAdherenceConfirmed(!adherenceConfirmed)}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border w-full text-left transition-colors ${
            adherenceConfirmed ? 'border-[#1B6DFC] bg-[#EFF5FE]' : 'border-[#E8EAEE] hover:border-[#CFD4DC]'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center ${
            adherenceConfirmed ? 'border-[#1B6DFC] bg-[#1B6DFC]' : 'border-[#CFD4DC]'
          }`}>
            {adherenceConfirmed && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className={`text-sm font-medium ${adherenceConfirmed ? 'text-[#5390FF]' : 'text-[#666D7A]'}`}>
            Yes - I completed my sessions as programmed
          </p>
        </button>
      </div>

      {/* Signal */}
      <div>
        <p className="text-[12.5px] font-medium text-[#98A0AD] mb-3">How did training feel?</p>
        <div className="space-y-2">
          {SIGNAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSignalCategories(prev => prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value])}
              className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-2xl border transition-colors ${
                signalCategories.includes(opt.value) ? 'border-[#1B6DFC] bg-[#EFF5FE]' : 'border-[#E8EAEE] hover:border-[#E8EAEE]'
              }`}
            >
              <div className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center ${
                signalCategories.includes(opt.value) ? 'border-[#1B6DFC] bg-[#1B6DFC]' : 'border-[#CFD4DC]'
              }`}>
                {signalCategories.includes(opt.value) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${signalCategories.includes(opt.value) ? 'text-[#5390FF]' : 'text-[#43474F]'}`}>{opt.label}</p>
                <p className="text-xs text-[#98A0AD] mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div id="f-direction" className="scroll-mt-24">
        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${missing.has('direction') ? 'text-[#C82626]' : 'text-[#98A0AD]'}`}>Overall - how is training going?</p>
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
                  ? 'border-red-400 text-[#98A0AD]'
                  : 'border-[#E8EAEE] text-[#98A0AD] hover:border-[#E8EAEE]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {missing.has('direction') && <p className="text-[#C82626] text-xs mt-2 font-medium">Please select an option.</p>}
      </div>

      {/* Notes */}
      <div>
        <p className="text-[12.5px] font-medium text-[#98A0AD] mb-2">Anything else to note? <span className="text-[#CFD4DC] normal-case font-normal">(optional)</span></p>
        <textarea
          value={signalsNoted}
          onChange={e => setSignalsNoted(e.target.value)}
          rows={3}
          placeholder="e.g. left knee was sore on squats, energy was low Thursday..."
          className="w-full bg-[#FFFFFF] border border-[#E8EAEE] rounded-2xl px-4 py-3 text-sm text-[#141821] placeholder-[#98A0AD] resize-none focus:outline-none focus:border-[#CFD4DC]"
        />
      </div>

      {error && (
        <div className="bg-[#FDEDED] border border-[#F5C9C9] rounded-xl px-4 py-3">
          <p className="text-sm text-[#C82626]">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3.5 bg-[#1B6DFC] hover:bg-[#1560E0] disabled:bg-[#E8EAEE] disabled:text-[#98A0AD] text-white font-bold text-sm rounded-2xl transition-colors"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}
