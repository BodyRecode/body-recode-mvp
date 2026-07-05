'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { H, LADDER } from './tokens'
import { QUESTIONS, STATE_META, stateFromScore, type PracticeState } from './assessment-data'

const BASE = '/dashboard/preview/harmony'
const TOTAL_QS = QUESTIONS.length

type Phase = 'intro' | 'section-break' | 'question' | 'email' | 'writing' | 'result'

/**
 * Practice Readiness Assessment - the interactive experience Melisa's
 * leads will actually walk through. Client-side only for this mock:
 * scores are computed in memory and shown as a state typing plus a
 * hand-written Practice Read preview per state. No email actually
 * sends. Nothing persists.
 *
 * When Harmony's real tenant provisions, the same shape is wired to
 * the real /api/scorecard endpoint + Body Decode Report equivalent.
 */
export function Assessment() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')

  const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0)
  const state: PracticeState = stateFromScore(totalScore)

  function choose(score: number) {
    setAnswers((prev) => ({ ...prev, [qIdx]: score }))
    // Check for section break after q3 (index 3) and q7 (index 7)
    if (qIdx === 3 || qIdx === 7) {
      setPhase('section-break')
    } else if (qIdx === TOTAL_QS - 1) {
      setPhase('email')
    } else {
      setQIdx((i) => i + 1)
    }
  }

  function continueFromSectionBreak() {
    setQIdx((i) => i + 1)
    setPhase('question')
  }

  function goBack() {
    if (phase === 'section-break') {
      setPhase('question')
      return
    }
    if (phase === 'email') {
      setPhase('question')
      setQIdx(TOTAL_QS - 1)
      return
    }
    if (qIdx > 0) {
      setQIdx((i) => i - 1)
    } else {
      setPhase('intro')
    }
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !email.trim()) return
    setPhase('writing')
    setTimeout(() => setPhase('result'), 2400)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: H.cream }}>
      {phase === 'intro' && <IntroScreen onBegin={() => setPhase('question')} />}
      {phase === 'question' && (
        <QuestionScreen
          index={qIdx}
          selected={answers[qIdx]}
          onChoose={choose}
          onBack={goBack}
        />
      )}
      {phase === 'section-break' && (
        <SectionBreakScreen
          nextDomain={QUESTIONS[qIdx + 1]?.domain}
          onContinue={continueFromSectionBreak}
        />
      )}
      {phase === 'email' && (
        <EmailScreen
          firstName={firstName}
          email={email}
          onFirstName={setFirstName}
          onEmail={setEmail}
          onSubmit={submitEmail}
          onBack={goBack}
        />
      )}
      {phase === 'writing' && <WritingScreen firstName={firstName} />}
      {phase === 'result' && <ResultScreen firstName={firstName} state={state} score={totalScore} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * Intro
 * ═══════════════════════════════════════════════════════════════ */
function IntroScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-8 py-24">
      <div className="max-w-[720px] text-center">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase mb-10" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}>
          <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracottaDeep }} />
          The Practice Readiness Assessment
          <span className="w-6 h-[1px]" style={{ backgroundColor: H.terracottaDeep }} />
        </div>
        <h1 className="text-[56px] leading-[1.1] mb-8 -tracking-[0.01em]" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
          Twelve questions. One Practice Read. Nothing else on your calendar.
        </h1>
        <p className="text-[16px] leading-[1.75] mb-12 max-w-[54ch] mx-auto" style={{ color: H.inkSoft }}>
          You will move through three short domains - your body, your week, your history. Melisa reads your answers personally and writes your Practice Read the same evening or the next morning. It lands in your inbox within 24 hours.
        </p>
        <button
          onClick={onBegin}
          className="inline-flex items-center gap-2 px-8 py-5 rounded-full text-[13px] font-semibold uppercase transition-transform hover:scale-[1.02]"
          style={{ background: H.terracotta, color: H.cream, fontFamily: H.mono, letterSpacing: '0.16em' }}
        >
          Begin
          <ArrowRight size={14} />
        </button>
        <div className="mt-8 text-[11px]" style={{ color: H.inkLight, fontFamily: H.mono, letterSpacing: '0.14em' }}>
          FREE · 2 MINUTES · NO CARD REQUIRED
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * Question
 * ═══════════════════════════════════════════════════════════════ */
function QuestionScreen({
  index,
  selected,
  onChoose,
  onBack,
}: {
  index: number
  selected: number | undefined
  onChoose: (score: number) => void
  onBack: () => void
}) {
  const q = QUESTIONS[index]
  const progress = ((index + 1) / TOTAL_QS) * 100
  const domainLabel = q.domain === 'body' ? 'The Body' : q.domain === 'week' ? 'The Week' : 'The History'

  return (
    <>
      <ProgressBar progress={progress} step={index + 1} total={TOTAL_QS} />
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-[720px] w-full">
          <div className="text-[10px] uppercase mb-6" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}>
            {domainLabel} · Question {index + 1} of {TOTAL_QS}
          </div>
          <h2 className="text-[36px] leading-[1.2] mb-10 -tracking-[0.005em] max-w-[24ch]" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
            {q.text}
          </h2>
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const isSelected = selected !== undefined && q.options[selected]?.label === opt.label
              return (
                <button
                  key={i}
                  onClick={() => onChoose(i)}
                  className="w-full text-left p-5 rounded-sm border transition-colors group"
                  style={{
                    backgroundColor: isSelected ? H.terracottaSoft : '#FFFFFF',
                    borderColor: isSelected ? H.terracotta : H.border,
                    borderWidth: isSelected ? '2px' : '1px',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="w-5 h-5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center transition"
                      style={{
                        borderColor: isSelected ? H.terracotta : H.inkLight,
                        backgroundColor: isSelected ? H.terracotta : 'transparent',
                      }}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} style={{ color: H.cream }} />}
                    </span>
                    <span className="text-[15px] leading-relaxed flex-1" style={{ color: H.ink }}>{opt.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
          {index > 0 && (
            <button
              onClick={onBack}
              className="mt-10 inline-flex items-center gap-2 text-[11px] uppercase"
              style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.16em' }}
            >
              <ArrowLeft size={12} /> Previous
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * Section break
 * ═══════════════════════════════════════════════════════════════ */
function SectionBreakScreen({
  nextDomain,
  onContinue,
}: {
  nextDomain?: 'body' | 'week' | 'history'
  onContinue: () => void
}) {
  const meta = nextDomain === 'week'
    ? { eyebrow: 'Domain 02', title: 'Now let\'s look at your week.', sub: 'Four questions about the shape of your work, your practice cadence, and what has been settling.' }
    : { eyebrow: 'Domain 03', title: 'Finally, your history.', sub: 'Four questions about how you found the practice, and where you are in relationship to it now.' }
  return (
    <div className="flex-1 flex items-center justify-center px-8 py-24">
      <div className="max-w-[620px] text-center">
        <div className="text-[10px] uppercase mb-8" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}>
          {meta.eyebrow}
        </div>
        <h2 className="text-[42px] leading-[1.15] mb-6 -tracking-[0.01em]" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
          {meta.title}
        </h2>
        <p className="text-[15px] leading-[1.7] mb-12 max-w-[48ch] mx-auto" style={{ color: H.inkSoft }}>
          {meta.sub}
        </p>
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-[12px] font-semibold uppercase"
          style={{ background: H.ink, color: H.cream, fontFamily: H.mono, letterSpacing: '0.16em' }}
        >
          Continue <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * Email capture
 * ═══════════════════════════════════════════════════════════════ */
function EmailScreen({
  firstName,
  email,
  onFirstName,
  onEmail,
  onSubmit,
  onBack,
}: {
  firstName: string
  email: string
  onFirstName: (v: string) => void
  onEmail: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
}) {
  return (
    <>
      <ProgressBar progress={100} step={12} total={12} />
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-[560px] w-full">
          <div className="text-[10px] uppercase mb-6" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}>
            Where should Melisa send it?
          </div>
          <h2 className="text-[38px] leading-[1.2] mb-4 -tracking-[0.005em]" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
            Your Practice Read is ready to write.
          </h2>
          <p className="text-[14px] leading-relaxed mb-10" style={{ color: H.inkSoft }}>
            It lands in your inbox within 24 hours, signed by Melisa. No sales sequence follows.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase mb-2" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.16em' }}>
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => onFirstName(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 rounded-sm border text-[15px] bg-white"
                style={{ borderColor: H.border, color: H.ink, fontFamily: H.sans }}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase mb-2" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.16em' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => onEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-sm border text-[15px] bg-white"
                style={{ borderColor: H.border, color: H.ink, fontFamily: H.sans }}
              />
            </div>
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-[11px] uppercase"
                style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.16em' }}
              >
                <ArrowLeft size={12} /> Previous
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[12px] font-semibold uppercase disabled:opacity-40"
                style={{ background: H.terracotta, color: H.cream, fontFamily: H.mono, letterSpacing: '0.16em' }}
                disabled={!firstName.trim() || !email.trim()}
              >
                Send my Practice Read <ArrowRight size={12} />
              </button>
            </div>
            <p className="text-[10px] text-center pt-2" style={{ color: H.inkLight, fontStyle: 'italic' }}>
              We never share your address. One follow-up email from Melisa; unsubscribe any time.
            </p>
          </form>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * Writing (loading)
 * ═══════════════════════════════════════════════════════════════ */
function WritingScreen({ firstName }: { firstName: string }) {
  return (
    <div className="flex-1 flex items-center justify-center px-8 py-24">
      <div className="max-w-[560px] text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full inline-block"
              style={{
                backgroundColor: H.terracotta,
                animation: `writing 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <div className="text-[10px] uppercase mb-4" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}>
          Reading your answers
        </div>
        <h2 className="text-[32px] leading-[1.2] -tracking-[0.005em]" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
          Writing {firstName}&apos;s Practice Read.
        </h2>
        <style>{`
          @keyframes writing {
            0%, 100% { opacity: 0.25; transform: translateY(0); }
            40% { opacity: 1; transform: translateY(-4px); }
          }
        `}</style>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * Result
 * ═══════════════════════════════════════════════════════════════ */
function ResultScreen({ firstName, state, score }: { firstName: string; state: PracticeState; score: number }) {
  const meta = STATE_META[state]
  return (
    <div className="flex-1 py-16 px-8">
      <div className="max-w-[820px] mx-auto">
        {/* Success confirmation */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ backgroundColor: H.terracottaSoft, border: `1px solid ${H.terracotta}` }}
          >
            <Check size={12} style={{ color: H.terracottaDeep }} strokeWidth={2.5} />
            <span className="text-[10px] uppercase" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.14em' }}>
              Your Practice Read is on its way to your inbox
            </span>
          </div>
          <h1 className="text-[46px] leading-[1.1] mb-4 -tracking-[0.01em]" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
            Thank you, {firstName}.
          </h1>
          <p className="text-[15px] max-w-[52ch] mx-auto leading-[1.7]" style={{ color: H.inkSoft }}>
            While it lands, this is what we already know about where you are today.
          </p>
        </div>

        {/* State typing */}
        <div className="rounded-sm border overflow-hidden mb-8" style={{ borderColor: H.border, backgroundColor: '#FFFFFF' }}>
          <div className="p-10 md:p-14 border-b" style={{ borderColor: H.border, backgroundColor: H.creamDeep }}>
            <div className="text-[10px] uppercase mb-6" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}>
              {meta.eyebrow}
            </div>
            <div className="grid md:grid-cols-[2fr_1fr] gap-8 items-baseline">
              <h2 className="text-[42px] leading-[1.1] -tracking-[0.01em]" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
                {meta.headline}
              </h2>
              <div className="text-right">
                <div className="text-[10px] uppercase mb-1" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.18em' }}>
                  Practice State
                </div>
                <div className="text-[38px] leading-none" style={{ fontFamily: H.serif, color: H.terracotta, fontWeight: 500 }}>
                  {meta.label}
                </div>
                <div className="text-[11px] mt-2" style={{ color: H.inkLight, fontFamily: H.mono }}>
                  Signal · {score} / 24
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 md:p-14">
            <p className="text-[16px] leading-[1.8] mb-10" style={{ color: H.ink }}>
              {meta.intro}
            </p>

            <div
              className="p-6 rounded-sm mb-10"
              style={{ backgroundColor: H.terracottaSoft, borderLeft: `3px solid ${H.terracotta}` }}
            >
              <div className="text-[10px] uppercase mb-2" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.18em' }}>
                What the practice looks like from here
              </div>
              <p className="text-[14px] leading-[1.7]" style={{ color: H.ink }}>
                {meta.bodySignal}
              </p>
            </div>

            <div className="mb-10">
              <div className="text-[10px] uppercase mb-4" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.18em' }}>
                From your Practice Read
              </div>
              <div className="space-y-4">
                {meta.practiceReadPreview.map((para, i) => (
                  <p key={i} className="text-[14px] leading-[1.75]" style={{ color: H.inkSoft, fontFamily: H.serif, fontStyle: 'italic' }}>
                    &ldquo;{para}&rdquo;
                  </p>
                ))}
              </div>
            </div>

            <p className="text-[13px] italic" style={{ color: H.inkLight }}>
              {meta.callToAction}
            </p>
          </div>
        </div>

        {/* Next step: Foundation Call */}
        <div className="rounded-sm border p-10" style={{ borderColor: H.terracotta, borderWidth: '2px', backgroundColor: H.cream }}>
          <div className="text-[10px] uppercase mb-4" style={{ fontFamily: H.mono, color: H.terracottaDeep, letterSpacing: '0.24em' }}>
            The Next Step, if you want it
          </div>
          <h3 className="text-[30px] leading-tight mb-4 -tracking-[0.005em]" style={{ fontFamily: H.serif, color: H.ink, fontWeight: 500 }}>
            {LADDER.call.label}
          </h3>
          <p className="text-[14px] leading-[1.7] mb-8" style={{ color: H.inkSoft }}>
            After you have sat with your Read for a day or two, book a 30-minute conversation with Melisa. It is a one-time free call for practitioners who feel the studio might be their next place. No sales pitch; if the fit isn&apos;t there, she will tell you so.
          </p>
          <button
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[12px] font-semibold uppercase"
            style={{ background: H.ink, color: H.cream, fontFamily: H.mono, letterSpacing: '0.16em' }}
          >
            Book the Foundation Call <ArrowRight size={12} />
          </button>
        </div>

        <div className="mt-16 text-center">
          <Link
            href={BASE}
            className="text-[11px] uppercase"
            style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.2em' }}
          >
            ← Back to Harmony
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * Progress bar
 * ═══════════════════════════════════════════════════════════════ */
function ProgressBar({ progress, step, total }: { progress: number; step: number; total: number }) {
  return (
    <div className="sticky top-[22px] z-40 backdrop-blur-md py-4 px-8 border-b" style={{ backgroundColor: 'rgba(250,246,239,0.85)', borderColor: H.border }}>
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.16em' }}>
            The Assessment
          </div>
          <div className="text-[10px]" style={{ fontFamily: H.mono, color: H.inkLight, letterSpacing: '0.1em' }}>
            {step} / {total}
          </div>
        </div>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: H.border }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: H.terracotta }}
          />
        </div>
      </div>
    </div>
  )
}
