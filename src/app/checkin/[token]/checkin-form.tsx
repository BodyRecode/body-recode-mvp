'use client'

import { useState } from 'react'
import { FORM_A_SECTIONS, FORM_B_SECTIONS, CheckInSection } from '@/lib/weekly-checkin-questions'
import { useFormDraft } from '@/lib/use-form-draft'
import { logoUrl } from '@/config/tenant'

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
  hasError,
}: {
  question: { id: string; type: 'text' | 'choice'; text: string; helper?: string; options?: string[] }
  value: string | undefined
  onChange: (val: string) => void
  hasError: boolean
}) {
  if (question.type === 'text') {
    return (
      <div>
        <label className={`block text-[15px] font-medium mb-2 leading-snug ${hasError ? 'text-red-700' : 'text-[#1A1A1A]'}`}>{question.text}</label>
        {question.helper && (
          <p className="text-[13px] text-stone-500 mb-3 leading-relaxed">{question.helper}</p>
        )}
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={4}
          placeholder="Your response..."
          className={`w-full bg-stone-50 rounded-xl px-4 py-3 text-[15px] text-[#1A1A1A] placeholder-stone-600 focus:outline-none focus:border-stone-600 resize-none transition-colors border ${hasError ? 'border-red-400' : 'border-stone-200'}`}
        />
      </div>
    )
  }

  if (question.type === 'choice') {
    return (
      <div>
        <p className={`text-[15px] font-medium mb-3 leading-snug ${hasError ? 'text-red-700' : 'text-[#1A1A1A]'}`}>{question.text}</p>
        <div className="space-y-2">
          {question.options?.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`w-full text-left text-[14px] px-4 py-3 rounded-xl border transition-all duration-150 ${
                value === opt
                  ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                  : hasError
                  ? 'bg-stone-50 border-red-400 text-stone-700'
                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-600'
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

type CheckinDraft = { sectionIndex: number; responses: Responses }

export default function CheckInForm({ clientId, clientName, weekNumber, formType }: Props) {
  const sections: CheckInSection[] = formType === 'A' ? FORM_A_SECTIONS : FORM_B_SECTIONS
  const [draft, setDraft, clearDraft] = useFormDraft<CheckinDraft>(
    `checkin:${clientId}:w${weekNumber}:${formType}`,
    { sectionIndex: 0, responses: {} }
  )
  const sectionIndex = draft.sectionIndex
  const responses = draft.responses
  const setSectionIndex = (next: number | ((p: number) => number)) =>
    setDraft(prev => ({ ...prev, sectionIndex: typeof next === 'function' ? next(prev.sectionIndex) : next }))
  const setResponses = (next: Responses | ((p: Responses) => Responses)) =>
    setDraft(prev => ({ ...prev, responses: typeof next === 'function' ? next(prev.responses) : next }))
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [validationMessage, setValidationMessage] = useState('')

  const section = sections[sectionIndex]
  const isLast = sectionIndex === sections.length - 1
  const progressPct = Math.round(((sectionIndex + 1) / sections.length) * 100)
  const firstName = clientName.trim().split(' ')[0]

  function setValue(id: string, value: string) {
    setResponses(prev => ({ ...prev, [id]: value }))
    if (errors.has(id)) {
      setErrors(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  function goToSection(index: number) {
    setSectionIndex(index)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }), 0)
  }

  function findMissedInSection(idx: number): string[] {
    return sections[idx].questions
      .filter(q => !(responses[q.id] && responses[q.id].trim().length > 0))
      .map(q => q.id)
  }

  function findMissedAcrossAll(): { sectionIdx: number; questionIds: string[] }[] {
    return sections
      .map((_, idx) => ({ sectionIdx: idx, questionIds: findMissedInSection(idx) }))
      .filter(s => s.questionIds.length > 0)
  }

  function scrollToFirstMissed(missedIds: string[]) {
    setTimeout(() => {
      const first = missedIds[0]
      const el = document.getElementById(`q-${first}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }

  function handleContinue() {
    const missed = findMissedInSection(sectionIndex)
    if (missed.length > 0) {
      setErrors(prev => {
        const next = new Set(prev)
        missed.forEach(id => next.add(id))
        return next
      })
      setValidationMessage(
        missed.length === 1
          ? '1 question still needs an answer.'
          : `${missed.length} questions still need an answer.`
      )
      scrollToFirstMissed(missed)
      return
    }
    setValidationMessage('')
    goToSection(sectionIndex + 1)
  }

  async function handleSubmit() {
    const missedSections = findMissedAcrossAll()
    if (missedSections.length > 0) {
      const allMissed = new Set<string>()
      for (const s of missedSections) for (const id of s.questionIds) allMissed.add(id)
      setErrors(allMissed)

      const total = allMissed.size
      setValidationMessage(
        total === 1
          ? '1 question still needs an answer.'
          : `${total} questions still need an answer.`
      )

      const firstMissed = missedSections[0]
      if (firstMissed.sectionIdx !== sectionIndex) {
        goToSection(firstMissed.sectionIdx)
      }
      scrollToFirstMissed(firstMissed.questionIds)
      return
    }

    setValidationMessage('')
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
      clearDraft()
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <img src={logoUrl()} width="120" alt="Body Recode" style={{ display: 'block', margin: '0 auto 24px' }} />
          <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3 tracking-tight">Received, {firstName}.</h1>
          <p className="text-stone-500 text-[15px] leading-relaxed">
            Your check-in has been submitted. Your coach will review it and be in touch.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-stone-50 z-20">
        <div
          className="h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-stone-200 px-5 py-3 flex items-center justify-between">
        <img src={logoUrl()} width="100" alt="Body Recode" style={{ display: 'block' }} />
        <p className="text-[11px] font-medium text-stone-600">{sectionIndex + 1} / {sections.length}</p>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-8 pb-32">

        {/* Section header */}
        <div className="mb-8">
          <p className="text-[10px] font-bold tracking-[0.15em] text-stone-600 uppercase mb-3">
            Week {weekNumber} · Form {formType} · {progressPct}% complete
          </p>
          <h1 className="text-[22px] font-bold text-[#1A1A1A] tracking-tight">{section.title}</h1>
        </div>

        {/* Validation message */}
        {validationMessage && (
          <div className="mb-6 border-l-2 border-red-500 bg-red-50 rounded-r-2xl px-4 py-3">
            <p className="text-red-700 text-sm font-medium">{validationMessage}</p>
            <p className="text-red-700/70 text-xs mt-1">Missed questions are highlighted in red below.</p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-stone-50 mb-8" />

        {/* Questions */}
        <div className="space-y-8">
          {section.questions.map(q => {
            const hasError = errors.has(q.id)
            return (
              <div
                key={q.id}
                id={`q-${q.id}`}
                className={hasError ? 'border-l-2 border-red-500 pl-4 -ml-4 scroll-mt-24' : 'scroll-mt-24'}
              >
                <QuestionInput
                  question={q}
                  value={responses[q.id]}
                  onChange={(val) => setValue(q.id, val)}
                  hasError={hasError}
                />
                {hasError && (
                  <p className="text-red-700 text-xs mt-2 font-medium">Please answer this question.</p>
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-stone-200 px-5 py-4 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => goToSection(sectionIndex - 1)}
            className={`text-[13px] font-semibold text-stone-500 py-2 px-1 transition-colors hover:text-stone-700 ${
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
              className="flex-1 bg-blue-500 text-black text-[15px] font-bold py-4 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-40 tracking-tight"
            >
              {submitting ? 'Submitting…' : 'Submit check-in'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
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
