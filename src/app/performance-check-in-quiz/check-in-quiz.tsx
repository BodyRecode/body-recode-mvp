'use client'

import { useState, useEffect } from 'react'

type Answer = 0 | 1 | 2 | 3

interface Question {
  id: string
  text: string
  options: [string, string, string, string]
}

const QUESTIONS: Question[] = [
  {
    id: 'effort_vs_result',
    text: 'How often does the effort you put into training feel higher than the result you get back?',
    options: ['Rarely — effort and response feel aligned', 'Occasionally — some sessions require more than expected', 'Often — effort feels higher relative to the result', 'Frequently — it regularly feels harder than it seems it should'],
  },
  {
    id: 'consistency',
    text: 'How would you describe your consistency with training over the past few months?',
    options: ['Largely consistent with minor interruptions', 'Mostly consistent, with some start–stop periods', 'Variable, with frequent changes in routine', 'Difficult to maintain a steady pattern'],
  },
  {
    id: 'training_response',
    text: 'After a training session, how does your body typically feel for the rest of the day?',
    options: ['Settled and able to return to the day without much disruption', 'Noticeably worked, but manageable with some recovery', 'Variable — sometimes fine, sometimes harder to bounce back', 'Often carrying fatigue that lingers longer than expected'],
  },
  {
    id: 'recovery_predictability',
    text: 'How predictable is your recovery between sessions?',
    options: ['Fairly predictable from week to week', 'Predictable most of the time, with occasional fluctuations', 'Inconsistent — recovery can vary without a clear pattern', 'Hard to predict — recovery often feels different session to session'],
  },
  {
    id: 'planning_vs_reality',
    text: 'When you plan your week of training, how closely does reality match the plan?',
    options: ['Usually matches closely', 'Mostly matches, with some adjustments', 'Often requires changes as the week unfolds', 'Rarely matches as planned'],
  },
  {
    id: 'week_variability',
    text: 'How similar are your weeks to each other in terms of energy, load, and how training feels?',
    options: ['Fairly similar from one week to the next', 'Mostly similar, with occasional changes', 'Often different, depending on the week', 'Rarely similar — weeks tend to look quite different'],
  },
  {
    id: 'body_signals',
    text: 'How often do physical signals — soreness, tightness, heaviness, or low motivation — shape how you approach a session?',
    options: ['Occasionally, without affecting training much', 'Regularly, but usually manageable', 'Frequently, requiring adjustments more often than not', 'Very frequently, shaping how sessions are approached'],
  },
  {
    id: 'external_load',
    text: 'How would you describe the demands outside of training — work, sleep, stress, life?',
    options: ['Generally steady and manageable', 'Manageable, with some periods of higher demand', 'Often busy or demanding, requiring ongoing adjustment', 'Frequently demanding, with little consistency week to week'],
  },
  {
    id: 'adjustments',
    text: 'When something feels off — a session isn\'t working, your body isn\'t responding — how comfortable are you making adjustments in the moment?',
    options: ['Comfortable making adjustments when needed', 'Somewhat comfortable, but not always sure', 'Often uncertain about how to adjust', 'Rarely confident making changes on my own'],
  },
  {
    id: 'support',
    text: 'When it comes to navigating training, recovery, and how your body responds — what best describes where you\'re at?',
    options: ['I mostly prefer to manage things independently', 'I occasionally look for guidance or input', 'I often benefit from having someone to sense-check decisions', 'I rely on external support to help navigate training'],
  },
]

type Stage = 'quiz' | 'contact' | 'done'

export default function CheckInQuiz() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [current, setCurrent] = useState(0)
  const [stage, setStage] = useState<Stage>('quiz')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState('website')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = params.get('source')
    if (s) setSource(s)
  }, [])

  const question = QUESTIONS[current]
  const progress = stage === 'contact'
    ? 100
    : Math.round(((current + 1) / QUESTIONS.length) * 100)
  const answered = answers[question?.id] !== undefined

  function selectAnswer(val: Answer) {
    setAnswers(prev => ({ ...prev, [question.id]: val }))
  }

  function next() {
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    } else {
      setStage('contact')
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
  }

  function back() {
    if (stage === 'contact') {
      setStage('quiz')
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      return
    }
    if (current > 0) {
      setCurrent(c => c - 1)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/submit-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), answers, source }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Submission failed')
      }
      setStage('done')
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (stage === 'done') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-5">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-[#10E1C2]/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-[#10E1C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-4">Received</p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-4">Thank you for taking the time.</h1>
          <p className="text-white/50 text-base leading-relaxed">
            Your submission is being reviewed. Your report will be sent to your email within one business day. There is nothing further required.
          </p>
        </div>
      </div>
    )
  }

  if (stage === 'contact') {
    const canSubmit = name.trim().length > 0 && email.trim().length > 0
    return (
      <div className="min-h-screen bg-black">
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/10 z-20">
          <div className="h-full bg-[#10E1C2] w-full" />
        </div>

        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-white/5 px-5 py-3 flex items-center justify-between">
          <a href="https://bodyrecode.au" className="text-[11px] font-bold tracking-[0.15em] text-white uppercase hover:text-white/70 transition-colors">Body Recode™</a>
          <p className="text-[11px] font-medium text-white/40">Last step</p>
        </div>

        <div className="max-w-2xl mx-auto px-5 pt-12 pb-32">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-white/10" />
              <p className="text-[10px] font-bold tracking-[0.15em] text-white/30 uppercase">100% complete</p>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug mb-2">
              Where should we send your results?
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Kade will review your answers and be in touch within 24 hours.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-white/60 mb-2 uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-[#10E1C2]/50 focus:bg-white/8 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-white/60 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-[#10E1C2]/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-white/60 mb-2 uppercase tracking-wider">Mobile <span className="text-white/20 font-normal normal-case tracking-normal">(optional)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="04xx xxx xxx"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-[#10E1C2]/50 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-950/40 border border-red-800/40 rounded-2xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-5 py-4 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={back}
              className="text-[13px] font-semibold text-white/40 py-2 px-1 transition-colors hover:text-white/70"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex-1 bg-[#10E1C2] text-black text-[15px] font-bold py-4 rounded-2xl hover:bg-[#0ecfb2] transition-colors disabled:opacity-30 disabled:cursor-not-allowed tracking-tight"
            >
              {submitting ? 'Sending…' : 'Submit check-in'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/10 z-20">
        <div
          className="h-full bg-[#10E1C2] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-white/5 px-5 py-3 flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Body Recode™</p>
        <p className="text-[11px] font-medium text-white/40">{current + 1} / {QUESTIONS.length}</p>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-12 pb-32">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <p className="text-[10px] font-bold tracking-[0.15em] text-white/30 uppercase">{progress}% complete</p>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          {current === 0 && (
            <p className="text-sm text-white/40 leading-relaxed mb-5">
              This short performance check-in is designed to help you notice patterns in how training, recovery, and day-to-day demands currently fit together for you. There are no right or wrong answers and you may stop at any point.
            </p>
          )}
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
            {question.text}
          </h2>
        </div>

        <div className="space-y-3">
          {question.options.map((opt, i) => {
            const val = i as Answer
            const selected = answers[question.id] === val
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectAnswer(val)}
                className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-150 ${
                  selected
                    ? 'border-[#10E1C2] bg-[#10E1C2]/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80'
                }`}
              >
                <span className="text-[15px] leading-relaxed">{opt}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-5 py-4 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={back}
            className={`text-[13px] font-semibold text-white/40 py-2 px-1 transition-colors hover:text-white/70 ${
              current === 0 ? 'invisible' : ''
            }`}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!answered}
            className="flex-1 bg-[#10E1C2] text-black text-[15px] font-bold py-4 rounded-2xl hover:bg-[#0ecfb2] transition-colors disabled:opacity-30 disabled:cursor-not-allowed tracking-tight"
          >
            {current === QUESTIONS.length - 1 ? 'Next' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
