'use client'

import { useState } from 'react'
import { useFormDraft } from '@/lib/use-form-draft'
import { brand } from "@/config/tenant";
import { INTAKE_SECTIONS, isQuestionVisible, type Question } from '@/lib/intake-questions'
import type { SupplementaryBlocks } from '@/lib/supplementary-blocks'

// The intake's own Hormonal Status questions, so the follow-up can never ask
// them differently from the intake.
const HORMONAL_QUESTIONS: Question[] = INTAKE_SECTIONS.find(sec => sec.id === 'hormonal')?.questions ?? []

interface Initial {
  medications: string
  dietary_restrictions: string
  dietary_preferences: string
  typical_day_eating: string
  meals_per_day: string
  fluid_intake: string
  caffeine_intake: string
  alcohol_intake: string
  eating_context: string
}

interface Props {
  token: string
  clientName: string
  blocks: SupplementaryBlocks
  initial: Initial
}

// Initial (meds + diet) plus the hormonal answers, keyed by intake question id.
type FormState = Initial & Record<string, string>

const QUESTIONS: Array<{
  id: keyof Initial
  label: string
  hint?: string
  required: boolean
}> = [
  {
    id: 'medications',
    label: 'List anything you are currently taking that may affect your hormones, recovery, training response, or body composition. Include prescribed medications (hormonal support like TRT, HRT, or GLP-1; cardiovascular, antidepressants, ADHD medications, contraceptives, beta-blockers, corticosteroids), chronic over-the-counter use (daily anti-inflammatories, painkillers, antihistamines), performance and recovery peptides, SARMs, anabolic compounds, or any hormone-modulating compound, and hormone-affecting supplements at therapeutic dose (DIM, ashwagandha cycles, melatonin, etc.). Include dose, frequency, and how long you have been on each where known.',
    hint: 'Asked in confidence and without judgement. Disclosure produces a better read, missing context produces a worse one. Write "None" if none apply.',
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
    hint: 'Be honest, this is what we design from, not what you think we want to hear. If your days vary a lot, describe a common pattern and a common variant.',
    required: true,
  },
  {
    id: 'meals_per_day',
    label: 'On a typical day, how many times do you eat? Count main meals and snacks separately.',
    hint: 'E.g. "3 meals plus 2 snacks". If it varies, give your most common number.',
    required: true,
  },
  {
    id: 'fluid_intake',
    label: 'What do you drink across a typical day, and roughly how much?',
    hint: 'Include water, tea, soft drink, juice, cordial, milk, and so on. A rough estimate is fine (e.g. "2 litres of water, 1 can of soft drink").',
    required: true,
  },
  {
    id: 'caffeine_intake',
    label: 'What is your daily caffeine intake?',
    hint: 'Include coffee, tea, energy drinks, and pre-workout. Give the number of serves and roughly when you have them (e.g. "2 coffees, both before midday"). Write "None" if you have no caffeine.',
    required: true,
  },
  {
    id: 'alcohol_intake',
    label: 'What is your typical alcohol intake?',
    hint: 'Include what you drink, how many standard drinks, and how many days per week (e.g. "2 glasses of wine, 3 nights a week"). Write "None" if you do not drink.',
    required: true,
  },
  {
    id: 'eating_context',
    label: 'Anything we should know about your eating environment?',
    hint: 'Examples: who cooks at home, family meals, work-week meals (eat out, bring lunch, skip), frequent travel, takeaway habits, shared meals with a partner who eats differently. Optional but useful for designing a plan you can actually stick to.',
    required: false,
  },
]

type Draft = { formData: FormState }

export default function SupplementForm({ token, clientName, blocks, initial }: Props) {
  const [draft, setDraft, clearDraft] = useFormDraft<Draft>(`intake-supplement:${token}`, { formData: initial as FormState })
  const formData = draft.formData
  const value = (id: string) => (typeof formData[id] === 'string' ? formData[id] : '')
  const medsDietQuestions = blocks.medsDiet ? QUESTIONS : []
  const hormonalVisible = blocks.hormonal ? HORMONAL_QUESTIONS.filter(q => isQuestionVisible(q, formData)) : []
  const setFormData = (next: FormState | ((p: FormState) => FormState)) =>
    setDraft(prev => ({ ...prev, formData: typeof next === 'function' ? next(prev.formData) : next }))

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Set<string>>(new Set())

  function setValue(id: string, value: string) {
    setFormData(prev => ({ ...prev, [id]: value }))
    if (errors.has(id)) {
      setErrors(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  function missingIds(): string[] {
    return [
      ...hormonalVisible.filter(q => q.required && !value(q.id).trim()).map(q => q.id),
      ...medsDietQuestions.filter(q => q.required && !value(q.id).trim()).map(q => q.id),
    ]
  }

  function validate(): boolean {
    const missing = missingIds()
    setErrors(new Set(missing))
    return missing.length === 0
  }

  async function submit() {
    setError('')
    if (!validate()) {
      setError('Please answer all required questions.')
      // Scroll to first missing question
      const first = missingIds()[0]
      if (first) {
        document.getElementById(`q-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      <div className="min-h-screen bg-[#FBFCFD] text-[#141821] flex items-center justify-center px-6 py-12">
        <div className="max-w-md text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt={brand().name} className="h-20 w-auto mx-auto mb-8" />
          <h1 className="text-2xl font-semibold text-[#141821] mb-3">Thanks, that&apos;s in.</h1>
          <p className="text-[#666D7A] text-sm leading-relaxed">
            Your follow-up answers have been saved to your file. Kade will weave them into the next program and nutrition cycle.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBFCFD] text-[#141821]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt={brand().name} className="h-20 w-auto mb-8" />
          <p className="text-[11px] font-bold text-[#1B6DFC] uppercase tracking-[0.2em] mb-2">Follow-up Intake</p>
          <h1 className="text-2xl font-semibold text-[#141821] mb-3">Hi {clientName.split(' ')[0]}, just a few more questions.</h1>
          <p className="text-[#666D7A] text-sm leading-relaxed">
            We have added a few questions to the intake since you completed yours{blocks.hormonal && !blocks.medsDiet ? ', about your hormonal status' : blocks.hormonal ? ', about your hormonal status, medications and diet' : ', about medications and diet'}. They help us read your body properly. {blocks.medsDiet ? 'About 3 minutes.' : 'About a minute.'} As with the original intake, there are no right or wrong answers, just answer honestly.
          </p>
        </div>

        {/* Hormonal status: the intake's own questions, conditional exactly as there */}
        {hormonalVisible.length > 0 && (
          <div className="space-y-8 mb-8">
            <p className="text-[13px] text-[#666D7A] leading-relaxed">Some of how the body stores fat depends on hormones, and these help us read that properly. Some questions only appear when they apply to you.</p>
            {hormonalVisible.map(q => {
              const hasError = errors.has(q.id)
              return (
                <div key={q.id} id={`q-${q.id}`}>
                  <p className={`text-[15px] font-medium mb-3 leading-snug ${hasError ? 'text-[#C82626]' : 'text-[#141821]'}`}>
                    {q.text}
                    {q.required && <span className="text-[#1B6DFC] ml-1">*</span>}
                  </p>
                  {q.type === 'select' ? (
                    <div className="space-y-2.5">
                      {q.options?.map(opt => {
                        const on = value(q.id) === opt
                        return (
                          <button
                            key={opt}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setValue(q.id, opt)}
                            className={`w-full text-left text-[15px] leading-snug px-4 py-3.5 min-h-[54px] rounded-2xl border-2 transition-colors ${
                              on
                                ? 'bg-[rgba(27,109,252,0.07)] border-[#1B6DFC] text-[#141821] font-medium'
                                : hasError
                                  ? 'bg-white border-[#EFAFAF] text-[#43474F]'
                                  : 'bg-white border-[#E8EAEE] text-[#43474F] hover:border-[#B9D0FD]'
                            }`}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <textarea
                      value={value(q.id)}
                      onChange={e => setValue(q.id, e.target.value)}
                      rows={3}
                      placeholder="Your answer..."
                      className={`w-full bg-[#EFF1F4] rounded-2xl px-4 py-3.5 text-[15px] text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]/30 resize-none transition-all border ${hasError ? 'border-[#DC2626]/50' : 'border-[#EFF1F4]'}`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Medications and diet */}
        <div className="space-y-8">
          {medsDietQuestions.map(q => {
            const hasError = errors.has(q.id)
            return (
              <div key={q.id} id={`q-${q.id}`}>
                <label
                  className={`block text-[15px] font-medium mb-2 leading-snug ${hasError ? 'text-[#C82626]' : 'text-[#141821]'}`}
                >
                  {q.label}
                  {q.required && <span className="text-[#1B6DFC] ml-1">*</span>}
                </label>
                {q.hint && (
                  <p className="text-[13px] text-[#666D7A] leading-relaxed mb-3">{q.hint}</p>
                )}
                <textarea
                  value={value(q.id)}
                  onChange={e => setValue(q.id, e.target.value)}
                  rows={4}
                  placeholder="Your answer..."
                  className={`w-full bg-[#EFF1F4] rounded-2xl px-4 py-3.5 text-[15px] text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]/30 resize-none transition-all border ${hasError ? 'border-[#DC2626]/50' : 'border-[#EFF1F4]'}`}
                />
              </div>
            )
          })}
        </div>

        {/* Errors */}
        {error && (
          <div className="mt-6 px-4 py-3 rounded-xl border border-[#F5C9C9] bg-[#DC2626]/5 text-[#C82626] text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={submit}
            disabled={submitting}
            className="px-8 py-3.5 bg-[#1B6DFC] hover:bg-[#1560E0] text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit follow-up'}
          </button>
        </div>
      </div>
    </div>
  )
}
