'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PROGRESS_CHECK_SECTIONS } from '@/lib/progress-check-questions'
import { brand } from '@/config/tenant'

export default function ProgressCheckForm({ token, firstName }: { token: string; firstName: string }) {
  const router = useRouter()
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (id: string, value: string) => setResponses(r => ({ ...r, [id]: value }))

  // Required = every scale + every select question (these drive the re-score).
  // Text fields are optional.
  const requiredIds = PROGRESS_CHECK_SECTIONS.flatMap(s =>
    s.questions.filter(q => q.type === 'scale' || q.type === 'select').map(q => q.id),
  )
  const answeredCount = requiredIds.filter(id => (responses[id] ?? '').trim() !== '').length
  const canSubmit = answeredCount === requiredIds.length && !submitting

  async function submit() {
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/submit-progress-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, responses }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok) { router.refresh(); return }
    setError(data.error ?? 'Something went wrong. Please try again.')
    setSubmitting(false)
  }

  const SCALE = [0, 1, 2, 3, 4]

  return (
    <div className="min-h-screen bg-[#F7F7F7] px-5 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-3">{brand().name}™ · Progress Check</p>
        <h1 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-3">
          {firstName ? `${firstName}, a quick read on where you are now.` : 'A quick read on where you are now.'}
        </h1>
        <p className="text-[#4A4A4A] leading-relaxed mb-10">
          A few minutes on how your body has been across the last few weeks. This is what lets me re-score your state and show you what has actually moved. Answer for your usual experience, not just today.
        </p>

        {PROGRESS_CHECK_SECTIONS.map(section => (
          <div key={section.id} className="bg-white border border-[#E5E5E5] rounded-2xl p-6 md:p-7 mb-5">
            <h2 className="text-lg font-extrabold text-[#1A1A1A] mb-1">{section.title}</h2>
            <p className="text-[13px] text-[#6B6B6B] leading-relaxed mb-6">{section.description}</p>

            <div className="space-y-7">
              {section.questions.map(q => (
                <div key={q.id}>
                  <p className="text-[15px] font-semibold text-[#1A1A1A] leading-snug mb-3">{q.text}</p>

                  {q.type === 'scale' && (
                    <div>
                      <div className="flex gap-2">
                        {SCALE.map(n => {
                          const active = responses[q.id] === String(n)
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => set(q.id, String(n))}
                              className={`flex-1 h-11 rounded-lg border text-sm font-bold transition-colors ${active ? 'bg-[#1B6DFC] border-[#1B6DFC] text-white' : 'bg-white border-[#D4D4D4] text-[#3A3A3A] hover:border-[#1B6DFC]'}`}
                            >
                              {n}
                            </button>
                          )
                        })}
                      </div>
                      {q.scaleLabel && (
                        <div className="flex justify-between mt-1.5 text-[11px] text-[#999999]">
                          <span>{q.scaleLabel.low}</span>
                          <span>{q.scaleLabel.high}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === 'select' && q.options && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      {q.options.map(opt => {
                        const active = responses[q.id] === opt
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => set(q.id, opt)}
                            className={`flex-1 px-4 py-3 rounded-lg border text-sm font-semibold text-left transition-colors ${active ? 'bg-[#1B6DFC]/5 border-[#1B6DFC] text-[#1A1A1A]' : 'bg-white border-[#D4D4D4] text-[#3A3A3A] hover:border-[#1B6DFC]'}`}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <textarea
                      value={responses[q.id] ?? ''}
                      onChange={e => set(q.id, e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-[#D4D4D4] p-3 text-sm text-[#1A1A1A] leading-relaxed focus:border-[#1B6DFC] focus:outline-none resize-y"
                      placeholder="Optional"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center bg-[#1B6DFC] text-white font-bold px-8 py-4 rounded-full text-base hover:bg-[#1056D6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending…' : 'Submit Progress Check'}
          </button>
          <span className="text-[13px] text-[#6B6B6B]">{answeredCount} / {requiredIds.length} answered</span>
        </div>
      </div>
    </div>
  )
}
