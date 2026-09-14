'use client'

/**
 * The intake's question inputs, shared so the Progress Check asks every question
 * exactly as the intake did (same buttons, same scale, same options). Moved out
 * of intake-form.tsx on 2026-09-14 without changing behaviour.
 */

import { Question } from '@/lib/intake-questions'

export type FormValue = string | number | boolean | string[]
export type FormData = Record<string, FormValue>

export function isAnswered(q: Question, value: FormValue | undefined): boolean {
  if (value === undefined || value === null) return false
  if (q.type === 'scale') return typeof value === 'number'
  if (q.type === 'checkbox') return value === true
  if (q.type === 'multiselect') return Array.isArray(value) && value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

export function ScaleInput({
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
      <p className={`text-[15px] font-medium mb-4 leading-snug ${hasError ? 'text-[#C82626]' : 'text-[#141821]'}`}>{question.text}</p>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map(n => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={`flex-1 min-h-[54px] py-3.5 rounded-2xl text-[16px] font-semibold transition-colors ${
              value === n
                ? 'bg-[#1B6DFC] text-white shadow-[0_1px_2px_rgba(27,109,252,0.4)]'
                : hasError
                ? 'bg-white text-[#43474F] border-2 border-[#EFAFAF]'
                : 'bg-white text-[#43474F] border-2 border-[#E8EAEE] hover:border-[#B9D0FD]'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {question.scaleLabel && (
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-[#666D7A] font-medium">{question.scaleLabel.low}</span>
          <span className="text-[11px] text-[#666D7A] font-medium">{question.scaleLabel.high}</span>
        </div>
      )}
    </div>
  )
}

export function QuestionInput({
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
  const errorBorder = hasError ? 'border-red-400' : 'border-[#EFF1F4]'
  const errorText = hasError ? 'text-[#C82626]' : 'text-[#141821]'

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
          className={`w-full bg-[#F4F6F9] rounded-2xl px-4 py-3.5 text-[15px] text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]/30 resize-none transition-all border ${errorBorder}`}
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
          className={`w-full bg-[#F4F6F9] rounded-2xl px-4 py-3.5 text-[15px] text-[#141821] focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]/30 transition-all border ${errorBorder}`}
        />
      </div>
    )
  }

  if (question.type === 'select') {
    // Options, not a dropdown. There is exactly one select in the 234 and it
    // has four options - a native picker on a phone is a wheel to spin and a
    // choice you cannot see until you open it, for no gain.
    return (
      <div>
        <p className={`text-[15px] font-medium mb-3 leading-snug ${errorText}`}>{question.text}</p>
        <div className="space-y-2.5">
          {question.options?.map(opt => {
            const on = value === opt
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(opt)}
                className={`w-full flex items-center gap-3 text-left text-[15px] leading-snug px-4 py-3.5 min-h-[54px] rounded-2xl border-2 transition-colors ${
                  on
                    ? 'bg-[rgba(27,109,252,0.07)] border-[#1B6DFC] text-[#141821] font-medium'
                    : hasError
                      ? 'bg-white border-[#EFAFAF] text-[#43474F]'
                      : 'bg-white border-[#E8EAEE] text-[#43474F] hover:border-[#B9D0FD]'
                }`}
              >
                <span
                  className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
                    on ? 'bg-[#1B6DFC] border-[#1B6DFC]' : 'border-[#CFD4DC]'
                  }`}
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
              aria-pressed={selected.includes(opt)}
              onClick={() => onToggle(opt)}
              className={`inline-flex items-center gap-2 text-[14.5px] font-medium px-4 py-3 min-h-[48px] rounded-2xl transition-colors ${
                selected.includes(opt)
                  ? 'bg-[#1B6DFC] text-white'
                  : hasError
                  ? 'bg-white text-[#43474F] border-2 border-[#EFAFAF]'
                  : 'bg-white text-[#43474F] border-2 border-[#E8EAEE] hover:border-[#B9D0FD]'
              }`}
            >
              {selected.includes(opt) && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
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
              ? 'bg-[#F4F6F9] border border-red-400'
              : 'bg-white border-2 border-[#CFD4DC]'
          }`}
        >
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        <span className={`text-[15px] leading-relaxed ${hasError ? 'text-[#C82626]' : 'text-[#43474F]'}`}>{question.text}</span>
      </button>
    )
  }

  return null
}
