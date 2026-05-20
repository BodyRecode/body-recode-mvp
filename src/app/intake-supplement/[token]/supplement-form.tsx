'use client'

import { useState } from 'react'
import { useFormDraft } from '@/lib/use-form-draft'

interface Initial {
  medications: string
  dietary_restrictions: string
  dietary_preferences: string
  typical_day_eating: string
  eating_context: string
}

interface Props {
  token: string
  clientName: string
  initial: Initial
}

const QUESTIONS: Array<{
  id: keyof Initial
  label: string
  hint?: string
  required: boolean
}> = [
  {
    id: 'medications',
    label: 'List any medications you take regularly. Include prescribed medications (hormonal support like TRT or GLP-1, cardiovascular medications, antidepressants, ADHD medications, contraceptives, etc.) and any chronic over-the-counter use (daily anti-inflammatories, painkillers). Include dose where known.',
    hint: 'Write "None" if you take no medications.',
    required: true,
  },
  {
    id: 'dietary_restrictions',
    label: 'List any food allergies, intolerances, or medical dietary restrictions you have.',
    hint: 'Include severity if relevant (e.g. "Peanut allergy, anaphylactic" vs "Lactose intolerant, mild bloating"). Write "None" if none.',
    required: true,
  },
  {
    id: 'dietary_preferences',
    label: 'List any foods you avoid for personal, cultural, or religious reasons, or any dietary framework you follow.',
    hint: 'E.g. vegetarian, vegan, halal, kosher, pescatarian, no pork, no red meat, no seafood. Write "None" if you eat everything.',
    required: true,
  },
  {
    id: 'typical_day_eating',
    label: 'Walk us through what you typically eat on an average day. Include breakfast, lunch, dinner, and any snacks.',
    hint: 'Be honest — this is what we design from, not what you think we want to hear. If your days vary a lot, describe a common pattern and a common variant.',
    required: true,
  },
  {
    id: 'eating_context',
    label: 'Anything we should know about your eating environment?',
    hint: 'Examples: who cooks at home, family meals, work-week meals (eat out, bring lunch, skip), frequent travel, takeaway habits, shared meals with a partner who eats differently. Optional but useful for designing a plan you can actually stick to.',
    required: false,
  },
]

type Draft = { formData: Initial }

export default function SupplementForm({ token, clientName, initial }: Props) {
  const [draft, setDraft, clearDraft] = useFormDraft<Draft>(`intake-supplement:${token}`, { formData: initial })
  const formData = draft.formData
  const setFormData = (next: Initial | ((p: Initial) => Initial)) =>
    setDraft(prev => ({ ...prev, formData: typeof next === 'function' ? next(prev.formData) : next }))

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Set<string>>(new Set())

  function setValue(id: keyof Initial, value: string) {
    setFormData(prev => ({ ...prev, [id]: value }))
    if (errors.has(id)) {
      setErrors(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  function validate(): boolean {
    const missing = QUESTIONS.filter(q => q.required && !formData[q.id].trim()).map(q => q.id)
    setErrors(new Set(missing))
    return missing.length === 0
  }

  async function submit() {
    setError('')
    if (!validate()) {
      setError('Please answer all required questions.')
      // Scroll to first missing question
      const first = QUESTIONS.find(q => q.required && !formData[q.id].trim())
      if (first) {
        document.getElementById(`q-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/submit-supplementary-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, formData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      clearDraft()
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-800 flex items-center justify-center px-6 py-12">
        <div className="max-w-md text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt="Body Recode" className="h-20 w-auto mx-auto mb-8" />
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-3">Thanks, that&apos;s in.</h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            Your follow-up answers have been saved to your file. Kade will weave them into the next program and nutrition cycle.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt="Body Recode" className="h-20 w-auto mb-8" />
          <p className="text-[11px] font-bold text-[#1B6DFC] uppercase tracking-[0.2em] mb-2">Follow-up Intake</p>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-3">Hi {clientName.split(' ')[0]}, just a few more questions.</h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            We have added a few questions to the intake since you completed yours, covering medications and dietary context. They feed directly into how your program and nutrition plan are built. About 3 minutes. As with the original intake, there are no right or wrong answers, just answer honestly.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {QUESTIONS.map(q => {
            const hasError = errors.has(q.id)
            return (
              <div key={q.id} id={`q-${q.id}`}>
                <label
                  className={`block text-[15px] font-medium mb-2 leading-snug ${hasError ? 'text-red-700' : 'text-[#1A1A1A]'}`}
                >
                  {q.label}
                  {q.required && <span className="text-[#1B6DFC] ml-1">*</span>}
                </label>
                {q.hint && (
                  <p className="text-[13px] text-stone-500 leading-relaxed mb-3">{q.hint}</p>
                )}
                <textarea
                  value={formData[q.id]}
                  onChange={e => setValue(q.id, e.target.value)}
                  rows={4}
                  placeholder="Your answer..."
                  className={`w-full bg-stone-200 rounded-2xl px-4 py-3.5 text-[15px] text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]/30 resize-none transition-all border ${hasError ? 'border-red-500/50' : 'border-stone-200'}`}
                />
              </div>
            )
          })}
        </div>

        {/* Errors */}
        {error && (
          <div className="mt-6 px-4 py-3 rounded-xl border border-red-200 bg-red-500/5 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={submit}
            disabled={submitting}
            className="px-8 py-3.5 bg-[#1B6DFC] hover:bg-[#5390FF] text-[#1A1A1A] font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit follow-up'}
          </button>
        </div>
      </div>
    </div>
  )
}
