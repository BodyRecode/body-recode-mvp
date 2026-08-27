'use client'

import { useState } from 'react'
import { getCheckinSections, CheckInSection, MULTI_SELECT_DELIM } from '@/lib/weekly-checkin-questions'
import { useFormDraft } from '@/lib/use-form-draft'
import { logoUrl, brand } from '@/config/tenant'

interface Props {
  clientId: string
  clientName: string
  weekNumber: number
  formType: 'A' | 'B'
  includeNutrition: boolean
}

type Responses = Record<string, string>

function QuestionInput({
  question,
  value,
  onChange,
  hasError,
}: {
  question: { id: string; type: 'text' | 'choice'; text: string; helper?: string; options?: string[]; multi?: boolean }
  value: string | undefined
  onChange: (val: string) => void
  hasError: boolean
}) {
  if (question.type === 'text') {
    return (
      <div>
        <label className={`block text-[15px] font-medium mb-2 leading-snug ${hasError ? 'text-[#C82626]' : 'text-[#141821]'}`}>{question.text}</label>
        {question.helper && (
          <p className="text-[13px] text-[#666D7A] mb-3 leading-relaxed">{question.helper}</p>
        )}
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={4}
          placeholder="Your response..."
          className={`w-full bg-white rounded-xl px-4 py-3.5 text-[15px] text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#B9D0FD] focus:ring-[3px] focus:ring-[rgba(27,109,252,0.13)] resize-none transition-colors border-2 ${hasError ? 'border-[#EFAFAF]' : 'border-[#E8EAEE]'}`}
        />
      </div>
    )
  }

  if (question.type === 'choice') {
    const selected = question.multi ? (value ? value.split(MULTI_SELECT_DELIM) : []) : []
    const isSelected = (opt: string) => (question.multi ? selected.includes(opt) : value === opt)
    const handleClick = (opt: string) => {
      if (!question.multi) return onChange(opt)
      const next = selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt]
      onChange(next.join(MULTI_SELECT_DELIM))
    }
    return (
      <div>
        <p className={`text-[15px] font-medium mb-3 leading-snug ${hasError ? 'text-[#C82626]' : 'text-[#141821]'}`}>{question.text}</p>
        <div className="space-y-2.5">
          {question.options?.map(opt => {
            const on = isSelected(opt)
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={on}
                onClick={() => handleClick(opt)}
                className={`w-full flex items-center gap-3 text-left text-[15px] leading-snug px-4 py-3.5 min-h-[54px] rounded-xl border-2 transition-colors ${
                  on
                    ? 'bg-[rgba(27,109,252,0.07)] border-[#1B6DFC] text-[#141821] font-medium'
                    : hasError
                      ? 'bg-white border-[#EFAFAF] text-[#43474F]'
                      : 'bg-white border-[#E8EAEE] text-[#43474F] hover:border-[#B9D0FD]'
                }`}
              >
                {/* The mark carries the state as well as the colour. On a phone,
                    in daylight, a pale tint alone is not enough to tell her which
                    one she picked - and the old selected state was pale blue text
                    on a pale blue tint, which told her nothing at all. */}
                <span
                  className={`w-5 h-5 shrink-0 flex items-center justify-center border-2 transition-colors ${
                    question.multi ? 'rounded-[6px]' : 'rounded-full'
                  } ${on ? 'bg-[#1B6DFC] border-[#1B6DFC]' : 'border-[#CFD4DC]'}`}
                  aria-hidden
                >
                  {on && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0">{opt}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}

type CheckinDraft = { sectionIndex: number; responses: Responses }

export default function CheckInForm({ clientId, clientName, weekNumber, formType, includeNutrition }: Props) {
  const sections: CheckInSection[] = getCheckinSections(formType, { includeNutrition })
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
      .filter(q => !q.optional && !(responses[q.id] && responses[q.id].trim().length > 0))
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
          <img src={logoUrl()} width="120" alt={brand().name} style={{ display: 'block', margin: '0 auto 24px' }} />
          <div className="w-14 h-14 bg-[#1B6DFC]/10 border border-[#1B6DFC]/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-[#1B6DFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#141821] mb-3 tracking-tight">Received, {firstName}.</h1>
          <p className="text-[#666D7A] text-[15px] leading-relaxed">
            Your check-in has been submitted. Your coach will review it and be in touch.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-[#FBFCFD] z-20">
        <div
          className="h-full bg-[#1B6DFC] transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#EFF1F4] px-5 py-3 flex items-center justify-between">
        <img src={logoUrl()} width="100" alt={brand().name} style={{ display: 'block' }} />
        <p className="text-[11px] font-medium text-[#666D7A]">{sectionIndex + 1} / {sections.length}</p>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-8 pb-32">

        {/* Section header */}
        <div className="mb-8">
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#666D7A] uppercase mb-3">
            Week {weekNumber} · Form {formType} · {progressPct}% complete
          </p>
          <h1 className="text-[22px] font-bold text-[#141821] tracking-tight">{section.title}</h1>
        </div>

        {/* Validation message */}
        {validationMessage && (
          <div className="mb-6 border-l-2 border-[#DC2626] bg-[#FDEDED] rounded-r-2xl px-4 py-3">
            <p className="text-[#C82626] text-sm font-medium">{validationMessage}</p>
            <p className="text-[#C82626]/70 text-xs mt-1">Missed questions are highlighted in red below.</p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-[#FBFCFD] mb-8" />

        {/* Questions */}
        <div className="space-y-8">
          {section.questions.map(q => {
            const hasError = errors.has(q.id)
            return (
              <div
                key={q.id}
                id={`q-${q.id}`}
                className={hasError ? 'border-l-2 border-[#DC2626] pl-4 -ml-4 scroll-mt-24' : 'scroll-mt-24'}
              >
                <QuestionInput
                  question={q}
                  value={responses[q.id]}
                  onChange={(val) => setValue(q.id, val)}
                  hasError={hasError}
                />
                {hasError && (
                  <p className="text-[#C82626] text-xs mt-2 font-medium">Please answer this question.</p>
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mt-6 bg-[#FDEDED] border border-[#F5C9C9] rounded-xl px-4 py-3">
            <p className="text-[#C82626] text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#EFF1F4] px-5 py-4 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => goToSection(sectionIndex - 1)}
            className={`text-[13px] font-semibold text-[#666D7A] py-2 px-1 transition-colors hover:text-[#43474F] ${
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
              className="flex-1 bg-[#1B6DFC] text-black text-[15px] font-bold py-4 rounded-xl hover:bg-[#1B6DFC] transition-colors disabled:opacity-40 tracking-tight"
            >
              {submitting ? 'Submitting…' : 'Submit check-in'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              className="flex-1 bg-white text-black text-[15px] font-bold py-4 rounded-xl hover:bg-[#F4F6F9] transition-colors tracking-tight"
            >
              Continue
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
