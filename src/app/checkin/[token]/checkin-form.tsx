'use client'

import { useState } from 'react'
import { FORM_A_SECTIONS, FORM_B_SECTIONS, CheckInSection } from '@/lib/weekly-checkin-questions'

interface Props {
  clientId: string
  clientName: string
  weekNumber: number
  formType: 'A' | 'B'
}

type Responses = Record<string, string>

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: { id: string; type: 'text' | 'choice'; text: string; helper?: string; options?: string[] }
  value: string | undefined
  onChange: (val: string) => void
}) {
  if (question.type === 'text') {
    return (
      <div>
        <label className="block text-[15px] font-medium text-white mb-2 leading-snug">{question.text}</label>
        {question.helper && (
          <p className="text-[13px] text-stone-500 mb-3 leading-relaxed">{question.helper}</p>
        )}
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={4}
          placeholder="Your response..."
          className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-[15px] text-white placeholder-stone-600 focus:outline-none focus:border-stone-600 resize-none transition-colors"
        />
      </div>
    )
  }

  if (question.type === 'choice') {
    return (
      <div>
        <p className="text-[15px] font-medium text-white mb-3 leading-snug">{question.text}</p>
        <div className="space-y-2">
          {question.options?.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`w-full text-left text-[14px] px-4 py-3 rounded-xl border transition-all duration-150 ${
                value === opt
                  ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-600'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return null
}

export default function CheckInForm({ clientId, clientName, weekNumber, formType }: Props) {
  const sections: CheckInSection[] = formType === 'A' ? FORM_A_SECTIONS : FORM_B_SECTIONS
  const [sectionIndex, setSectionIndex] = useState(0)
  const [responses, setResponses] = useState<Responses>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const section = sections[sectionIndex]
  const isLast = sectionIndex === sections.length - 1
  const progressPct = Math.round(((sectionIndex + 1) / sections.length) * 100)
  const firstName = clientName.trim().split(' ')[0]

  function setValue(id: string, value: string) {
    setResponses(prev => ({ ...prev, [id]: value }))
  }

  function goToSection(index: number) {
    setSectionIndex(index)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }), 0)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/submit-weekly-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, weekNumber, formType, responses }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Submission failed. Please try again.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <img src="https://bodyrecode.au/logo-teal.png" width="120" alt="Body Recode" style={{ display: 'block', margin: '0 auto 24px' }} />
          <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Received, {firstName}.</h1>
          <p className="text-stone-500 text-[15px] leading-relaxed">
            Your check-in has been submitted. Your coach will review it and be in touch.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-stone-900 z-20">
        <div
          className="h-full bg-teal-400 transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-stone-900 px-5 py-3 flex items-center justify-between">
        <img src="https://bodyrecode.au/logo-teal.png" width="100" alt="Body Recode" style={{ display: 'block' }} />
        <p className="text-[11px] font-medium text-stone-600">{sectionIndex + 1} / {sections.length}</p>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-8 pb-32">

        {/* Section header */}
        <div className="mb-8">
          <p className="text-[10px] font-bold tracking-[0.15em] text-stone-600 uppercase mb-3">
            Week {weekNumber} · Form {formType} · {progressPct}% complete
          </p>
          <h1 className="text-[22px] font-bold text-white tracking-tight">{section.title}</h1>
        </div>

        {/* Divider */}
        <div className="h-px bg-stone-900 mb-8" />

        {/* Questions */}
        <div className="space-y-8">
          {section.questions.map(q => (
            <QuestionInput
              key={q.id}
              question={q}
              value={responses[q.id]}
              onChange={(val) => setValue(q.id, val)}
            />
          ))}
        </div>

        {error && (
          <div className="mt-6 bg-red-950/50 border border-red-900 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-stone-900 px-5 py-4 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => goToSection(sectionIndex - 1)}
            className={`text-[13px] font-semibold text-stone-500 py-2 px-1 transition-colors hover:text-stone-300 ${
              sectionIndex === 0 ? 'invisible' : ''
            }`}
          >
            ← Back
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-teal-500 text-black text-[15px] font-bold py-4 rounded-xl hover:bg-teal-400 transition-colors disabled:opacity-40 tracking-tight"
            >
              {submitting ? 'Submitting…' : 'Submit check-in'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goToSection(sectionIndex + 1)}
              className="flex-1 bg-white text-black text-[15px] font-bold py-4 rounded-xl hover:bg-stone-100 transition-colors tracking-tight"
            >
              Continue
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
