'use client'

import { useState, useEffect, useRef } from 'react'
import { INTAKE_SECTIONS, Question } from '@/lib/intake-questions'
import { useFormDraft } from '@/lib/use-form-draft'
import { logoUrl, brand } from '@/config/tenant'

type FormValue = string | number | boolean | string[]
type FormData = Record<string, FormValue>

interface Props {
  token: string
  clientName?: string
  portalToken?: string | null
  identity?: Record<string, string>
}

// Identity fields the client already provided in the Health Declaration. In the
// intake we show these back as a read-only confirmation card instead of asking
// the client to type them a second time. (Relationship is shown for context but
// is not an intake question, so it is not in this submittable set.)
const CARRIED_IDENTITY_FIELDS = [
  'full_name',
  'date_of_birth',
  'mobile_number',
  'emergency_contact_name',
  'emergency_contact_phone',
] as const

// Treat a question as required by default; only text fields are optional
// unless explicitly flagged required. `required: false` always wins.
function isRequired(q: Question): boolean {
  if (q.required === true) return true
  if (q.required === false) return false
  return q.type !== 'text'
}

// Human-friendly display of a carried identity value in the confirmation card.
// Date of birth is stored as yyyy-mm-dd; render it as a readable date.
function formatIdentityValue(id: string, value: FormValue | undefined): string {
  if (value === undefined || value === null || value === '') return ''
  if (id === 'date_of_birth' && typeof value === 'string') {
    const [y, m, d] = value.split('-').map(Number)
    if (y && m && d) {
      return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  }
  return String(value)
}

function isAnswered(q: Question, value: FormValue | undefined): boolean {
  if (value === undefined || value === null) return false
  if (q.type === 'scale') return typeof value === 'number'
  if (q.type === 'checkbox') return value === true
  if (q.type === 'multiselect') return Array.isArray(value) && value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

function ScaleInput({
  question,
  value,
  onChange,
  hasError,
}: {
  question: Question
  value: FormValue | undefined
  onChange: (val: number) => void
  hasError: boolean
}) {
  return (
    <div className="py-1">
      <p className={`text-[15px] font-medium mb-4 leading-snug ${hasError ? 'text-red-700' : 'text-[#1A1A1A]'}`}>{question.text}</p>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 ${
              value === n
                ? 'bg-[#1B6DFC] text-white shadow-sm'
                : hasError
                ? 'bg-stone-100 text-stone-400 border border-red-400'
                : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {question.scaleLabel && (
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-stone-500 font-medium">{question.scaleLabel.low}</span>
          <span className="text-[11px] text-stone-500 font-medium">{question.scaleLabel.high}</span>
        </div>
      )}
    </div>
  )
}

function QuestionInput({
  question,
  value,
  onChange,
  onToggle,
  hasError,
}: {
  question: Question
  value: FormValue | undefined
  onChange: (val: FormValue) => void
  onToggle: (opt: string) => void
  hasError: boolean
}) {
  const errorBorder = hasError ? 'border-red-400' : 'border-stone-200'
  const errorText = hasError ? 'text-red-700' : 'text-[#1A1A1A]'

  if (question.type === 'scale') {
    return (
      <ScaleInput
        question={question}
        value={value}
        onChange={(n) => onChange(n)}
        hasError={hasError}
      />
    )
  }

  if (question.type === 'text') {
    return (
      <div>
        <label className={`block text-[15px] font-medium mb-3 leading-snug ${errorText}`}>{question.text}</label>
        <textarea
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value)}
          rows={3}
          placeholder="Your answer..."
          className={`w-full bg-stone-100 rounded-2xl px-4 py-3.5 text-[15px] text-[#1A1A1A] placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]/30 resize-none transition-all border ${errorBorder}`}
        />
      </div>
    )
  }

  if (question.type === 'date') {
    return (
      <div>
        <label className={`block text-[15px] font-medium mb-3 leading-snug ${errorText}`}>{question.text}</label>
        <input
          type="date"
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value)}
          className={`w-full bg-stone-100 rounded-2xl px-4 py-3.5 text-[15px] text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]/30 transition-all border ${errorBorder}`}
        />
      </div>
    )
  }

  if (question.type === 'select') {
    return (
      <div>
        <label className={`block text-[15px] font-medium mb-3 leading-snug ${errorText}`}>{question.text}</label>
        <select
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value)}
          className={`w-full bg-stone-100 rounded-2xl px-4 py-3.5 text-[15px] text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]/30 transition-all appearance-none border ${errorBorder}`}
        >
          <option value="">Select an option</option>
          {question.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  if (question.type === 'multiselect') {
    const selected = (value as string[]) || []
    return (
      <div>
        <p className={`text-[15px] font-medium mb-3 leading-snug ${errorText}`}>{question.text}</p>
        <div className="flex flex-wrap gap-2">
          {question.options?.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`text-[13px] font-medium px-4 py-2.5 rounded-2xl transition-all duration-150 ${
                selected.includes(opt)
                  ? 'bg-[#1B6DFC] text-white'
                  : hasError
                  ? 'bg-stone-100 text-stone-400 border border-red-400'
                  : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === 'checkbox') {
    const checked = Boolean(value)
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex items-start gap-3 text-left w-full"
      >
        <span
          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-150 ${
            checked
              ? 'bg-[#1B6DFC]'
              : hasError
              ? 'bg-stone-100 border border-red-400'
              : 'bg-stone-100 border border-stone-600'
          }`}
        >
          {checked && (
            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        <span className={`text-[14px] leading-relaxed ${hasError ? 'text-red-700' : 'text-stone-700'}`}>{question.text}</span>
      </button>
    )
  }

  return null
}

type Draft = { sectionIndex: number; formData: FormData }

export default function IntakeForm({ token, clientName, portalToken, identity }: Props) {
  const [draft, setDraft, clearDraft, hydrated] = useFormDraft<Draft>(`intake:${token}`, { sectionIndex: 0, formData: {} })

  // True when the client already supplied identity in the Health Declaration,
  // so the intake can confirm those details instead of re-asking. Only the
  // submittable carried fields count toward this (relationship is context only).
  const hasPriorIdentity = Boolean(
    identity && CARRIED_IDENTITY_FIELDS.some(f => identity[f])
  )
  // Whether the read-only confirmation card is in edit mode.
  const [editingIdentity, setEditingIdentity] = useState(false)

  // Seed identity fields the client already entered earlier in onboarding.
  // Runs once after the local draft hydrates so a resumed draft wins; we only
  // fill fields that are still empty, so a returning client's edits are never
  // overwritten.
  const prefillApplied = useRef(false)
  useEffect(() => {
    if (!hydrated || prefillApplied.current || !identity) return
    prefillApplied.current = true
    setDraft(prev => {
      const merged = { ...prev.formData }
      let changed = false
      for (const [key, val] of Object.entries(identity)) {
        const existing = merged[key]
        if (val && (existing === undefined || existing === '')) {
          merged[key] = val
          changed = true
        }
      }
      return changed ? { ...prev, formData: merged } : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])
  const sectionIndex = draft.sectionIndex
  const formData = draft.formData
  const setSectionIndex = (next: number | ((p: number) => number)) =>
    setDraft(prev => ({ ...prev, sectionIndex: typeof next === 'function' ? next(prev.sectionIndex) : next }))
  const setFormData = (next: FormData | ((p: FormData) => FormData)) =>
    setDraft(prev => ({ ...prev, formData: typeof next === 'function' ? next(prev.formData) : next }))

  // Dev affordance: `?section=N` jumps straight to that section index. Lets
  // you verify form rendering without clicking through every prior section.
  // Read once on mount; ignored thereafter.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const param = new URLSearchParams(window.location.search).get('section')
    if (param === null) return
    const target = parseInt(param, 10)
    if (Number.isNaN(target) || target < 0 || target >= INTAKE_SECTIONS.length) return
    setSectionIndex(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [validationMessage, setValidationMessage] = useState('')

  const section = INTAKE_SECTIONS[sectionIndex]
  const isLast = sectionIndex === INTAKE_SECTIONS.length - 1
  const progressPct = Math.round(((sectionIndex + 1) / INTAKE_SECTIONS.length) * 100)

  // On the identity section, when the client already supplied these details in
  // their health declaration, render the carried fields inside a confirmation
  // card and drop them from the normal question list so they aren't asked twice.
  const showIdentityConfirm = section.id === 'identity' && hasPriorIdentity
  const carried = new Set<string>(CARRIED_IDENTITY_FIELDS)
  const carriedQuestions = showIdentityConfirm ? section.questions.filter(q => carried.has(q.id)) : []
  const visibleQuestions = showIdentityConfirm
    ? section.questions.filter(q => !carried.has(q.id))
    : section.questions

  function setValue(id: string, value: FormValue) {
    setFormData(prev => ({ ...prev, [id]: value }))
    // Clear error for this question as soon as it has a value
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

  function toggleMultiselect(id: string, option: string) {
    const current = (formData[id] as string[]) || []
    setValue(
      id,
      current.includes(option) ? current.filter(v => v !== option) : [...current, option]
    )
  }

  function findMissedInSection(idx: number): string[] {
    const s = INTAKE_SECTIONS[idx]
    return s.questions
      .filter(q => isRequired(q) && !isAnswered(q, formData[q.id]))
      .map(q => q.id)
  }

  function findMissedAcrossAll(): { sectionIdx: number; questionIds: string[] }[] {
    return INTAKE_SECTIONS
      .map((_, idx) => ({ sectionIdx: idx, questionIds: findMissedInSection(idx) }))
      .filter(s => s.questionIds.length > 0)
  }

  function scrollToFirstMissed(missedIds: string[]) {
    // If a missed field lives inside the collapsed identity confirmation card,
    // open the card to edit mode first so the input is actually reachable.
    if (showIdentityConfirm && !editingIdentity && missedIds.some(id => carried.has(id))) {
      setEditingIdentity(true)
    }
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
          ? '1 question still needs an answer. Scroll up to find it.'
          : `${total} questions still need an answer across the form. Scroll up to find them.`
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
      const res = await fetch('/api/submit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, formData }),
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
          <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-[#1B6DFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-4">Submitted</p>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3 tracking-tight">You&apos;re all done.</h1>
          <p className="text-stone-400 text-[15px] leading-relaxed mb-8">
            Your intake has been submitted. Your coach will review everything and be in touch shortly.
          </p>
          {portalToken && (
            <a
              href={`/portal/${portalToken}`}
              className="inline-block px-6 py-3 bg-[#1B6DFC] hover:bg-blue-300 text-white font-bold text-sm rounded-2xl transition-colors"
            >
              Back to your portal
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-stone-100 z-20">
        <div
          className="h-full bg-[#1B6DFC] transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-stone-200 px-5 py-3 flex items-center justify-between">
        <img src={logoUrl()} width="100" alt={brand().name} style={{ display: 'block' }} />
        <p className="text-[11px] font-medium text-stone-500">{sectionIndex + 1} / {INTAKE_SECTIONS.length}</p>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-8 pb-32">

        {/* Section header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-stone-100" />
            <p className="text-[10px] font-bold tracking-[0.15em] text-stone-600 uppercase">{progressPct}% complete</p>
            <div className="h-px flex-1 bg-stone-100" />
          </div>
          <h1 className="text-[22px] font-bold text-[#1A1A1A] tracking-tight mb-3">{section.title}</h1>
          {section.description && (
            <p className="text-[13px] text-stone-400 whitespace-pre-line leading-relaxed">
              {section.description}
            </p>
          )}
        </div>

        {/* Validation message */}
        {validationMessage && (
          <div className="mb-6 border-l-2 border-red-500 bg-red-50 rounded-r-2xl px-4 py-3">
            <p className="text-red-700 text-sm font-medium">{validationMessage}</p>
            <p className="text-red-700/70 text-xs mt-1">Missed questions are highlighted in red below.</p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-stone-100 mb-8" />

        {/* Confirmation card for identity details the client already entered in
            their Health Declaration. Shown read-only so they confirm rather than
            re-type. An Edit toggle reveals the underlying inputs for corrections,
            and any edit flows straight back to the submitted form data. */}
        {section.id === 'identity' && showIdentityConfirm && (
          <div className="mb-8 rounded-2xl border border-stone-200 bg-stone-50/60 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[13px] font-bold text-[#1A1A1A]">Confirm your details</p>
                <p className="text-[12px] text-stone-500 mt-0.5 leading-relaxed">
                  We&apos;ve carried these across from your health declaration so you don&apos;t have to enter them again. Tap edit if anything needs changing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingIdentity(v => !v)}
                className="shrink-0 text-[12px] font-semibold text-[#1B6DFC] hover:text-[#1056D6] transition-colors"
              >
                {editingIdentity ? 'Done' : 'Edit'}
              </button>
            </div>

            {editingIdentity ? (
              <div className="space-y-6">
                {carriedQuestions.map(q => {
                  const hasError = errors.has(q.id)
                  return (
                    <div key={q.id} id={`q-${q.id}`} className={hasError ? 'border-l-2 border-red-500 pl-4 -ml-4 scroll-mt-24' : 'scroll-mt-24'}>
                      <QuestionInput
                        question={q}
                        value={formData[q.id]}
                        onChange={(val) => setValue(q.id, val)}
                        onToggle={(opt) => toggleMultiselect(q.id, opt)}
                        hasError={hasError}
                      />
                      {hasError && <p className="text-red-700 text-xs mt-2 font-medium">Please answer this question.</p>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <dl className="divide-y divide-stone-200">
                {carriedQuestions.map(q => {
                  const hasError = errors.has(q.id)
                  return (
                    <div key={q.id} id={`q-${q.id}`} className="flex items-baseline justify-between gap-4 py-2.5 scroll-mt-24">
                      <dt className={`text-[13px] ${hasError ? 'text-red-700' : 'text-stone-500'}`}>{q.text}</dt>
                      <dd className={`text-[14px] font-medium text-right ${hasError ? 'text-red-700' : 'text-[#1A1A1A]'}`}>
                        {formatIdentityValue(q.id, formData[q.id] || identity?.[q.id]) || <span className="text-red-700 font-normal">Tap edit to add</span>}
                      </dd>
                    </div>
                  )
                })}
                {identity?.emergency_contact_relationship && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-[13px] text-stone-500">Emergency contact relationship</dt>
                    <dd className="text-[14px] font-medium text-right text-[#1A1A1A]">{identity.emergency_contact_relationship}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-8">
          {visibleQuestions.map(q => {
            const hasError = errors.has(q.id)
            return (
              <div
                key={q.id}
                id={`q-${q.id}`}
                className={hasError ? 'border-l-2 border-red-500 pl-4 -ml-4 scroll-mt-24' : 'scroll-mt-24'}
              >
                <QuestionInput
                  question={q}
                  value={formData[q.id]}
                  onChange={(val) => setValue(q.id, val)}
                  onToggle={(opt) => toggleMultiselect(q.id, opt)}
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
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
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
              className="flex-1 bg-[#1B6DFC] text-white text-[15px] font-bold py-4 rounded-2xl hover:bg-[#1056D6] transition-colors disabled:opacity-40 tracking-tight"
            >
              {submitting ? 'Submitting…' : 'Submit intake'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              className="flex-1 bg-[#1B6DFC] text-white text-[15px] font-bold py-4 rounded-2xl hover:bg-[#1056D6] transition-colors tracking-tight"
            >
              Continue
            </button>
          )}
        </div>

        {sectionIndex === 0 && clientName && (
          <p className="text-center text-[11px] text-stone-600 mt-2">Prepared for {clientName}</p>
        )}
      </div>

    </div>
  )
}
