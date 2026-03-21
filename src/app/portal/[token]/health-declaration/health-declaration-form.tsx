'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PARQ_QUESTIONS = [
  { id: 'q1', text: 'Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?' },
  { id: 'q2', text: 'Do you feel pain in your chest when you do physical activity?' },
  { id: 'q3', text: 'In the past month, have you had chest pain when you were not doing physical activity?' },
  { id: 'q4', text: 'Do you lose your balance because of dizziness or do you ever lose consciousness?' },
  { id: 'q5', text: 'Do you have a bone or joint problem that could be made worse by a change in your physical activity?' },
  { id: 'q6', text: 'Is your doctor currently prescribing drugs (for example, water pills) for your blood pressure or heart condition?' },
  { id: 'q7', text: 'Do you know of any other reason why you should not do physical activity?' },
]

const CONDITIONS = [
  'Cardiovascular disease',
  'High blood pressure',
  'Diabetes (Type 1 or 2)',
  'Asthma or respiratory condition',
  'Musculoskeletal injury or surgery (past 12 months)',
  'Thyroid condition',
  'Hormonal condition (e.g. PCOS, menopause)',
  'Mental health condition currently managed by a professional',
  'Pregnancy or recent post-partum (within 12 months)',
  'Other diagnosed medical condition',
]

export default function HealthDeclarationForm({
  clientId,
  clientName,
  portalToken,
}: {
  clientId: string
  clientName: string
  portalToken: string
}) {
  const router = useRouter()
  const [parq, setParq] = useState<Record<string, boolean>>({})
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [otherCondition, setOtherCondition] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const anyParqYes = Object.values(parq).some(v => v === true)
  const requiresClearance = anyParqYes || selectedConditions.includes('Cardiovascular disease') || selectedConditions.includes('High blood pressure')

  const allAnswered = PARQ_QUESTIONS.every(q => parq[q.id] !== undefined)

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allAnswered || !acknowledged) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/portal/submit-health-declaration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        requiresClearance,
        parqAnswers: parq,
        conditions: selectedConditions,
        otherCondition,
      }),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    router.push(`/portal/${portalToken}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-3">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white mb-1">Health Declaration</h1>
          <p className="text-stone-400 text-sm">This screening ensures coaching is structured appropriately for you. Answer honestly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* PAR-Q */}
          <div>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Physical Activity Readiness</p>
            <div className="space-y-4">
              {PARQ_QUESTIONS.map((q) => (
                <div key={q.id} className="bg-stone-900 rounded-xl p-4 border border-stone-800">
                  <p className="text-sm text-stone-300 mb-3">{q.text}</p>
                  <div className="flex gap-3">
                    {(['Yes', 'No'] as const).map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setParq(prev => ({ ...prev, [q.id]: option === 'Yes' }))}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                          parq[q.id] === (option === 'Yes')
                            ? option === 'Yes'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'bg-teal-400/20 text-teal-400 border border-teal-400/40'
                            : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Current or Recent Health Conditions</p>
            <p className="text-sm text-stone-400 mb-4">Select any that apply to you:</p>
            <div className="space-y-2">
              {CONDITIONS.map(condition => (
                <label key={condition} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedConditions.includes(condition)}
                    onChange={() => toggleCondition(condition)}
                    className="w-4 h-4 rounded accent-teal-400"
                  />
                  <span className="text-sm text-stone-300">{condition}</span>
                </label>
              ))}
            </div>
            {selectedConditions.includes('Other diagnosed medical condition') && (
              <textarea
                value={otherCondition}
                onChange={e => setOtherCondition(e.target.value)}
                placeholder="Please describe..."
                className="mt-3 w-full bg-stone-900 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 border border-stone-700 resize-none"
                rows={3}
              />
            )}
          </div>

          {/* Medical clearance notice */}
          {requiresClearance && (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4">
              <p className="text-sm text-amber-400 font-semibold mb-1">Medical clearance required</p>
              <p className="text-xs text-amber-400/70">Based on your answers, your coach will request a medical clearance letter from your GP before training begins.</p>
            </div>
          )}

          {/* Acknowledgement */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={e => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-teal-400"
            />
            <span className="text-sm text-stone-300">I confirm that all information provided is accurate and complete. I understand that withholding relevant health information may affect the safety and quality of my coaching program.</span>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!allAnswered || !acknowledged || submitting}
            className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Submit and continue →'}
          </button>
        </form>
      </div>
    </div>
  )
}
