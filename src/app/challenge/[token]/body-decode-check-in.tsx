'use client'

import { useState } from 'react'
import { legacyLetterToSlug } from '@/lib/pattern-mapping'
import { CHECKIN_PATTERNS } from '@/lib/checkin-patterns'

const PROGRESS_MARKERS = [
  { id: 'morning_energy',  label: 'Morning energy',            sub: 'How you feel when you wake up' },
  { id: 'afternoon_energy',label: 'Afternoon energy',          sub: 'The 2-4pm window' },
  { id: 'puffiness',       label: 'Puffiness and bloating',    sub: 'Through the day' },
  { id: 'sleep',           label: 'Sleep quality',             sub: 'How rested you feel' },
  { id: 'cravings',        label: 'Food cravings and hunger',  sub: 'Predictability and intensity' },
  { id: 'clarity',         label: 'Mental clarity and focus',  sub: 'Sharpness across the day' },
  { id: 'mood',            label: 'Mood stability',            sub: 'Consistency and evenness' },
  { id: 'digestion',       label: 'Digestion',                 sub: 'Comfort and regularity' },
]

const SIGNAL_QUESTIONS = [
  {
    id: 'sq1',
    question: 'Where do you most notice excess puffiness or softness in your body?',
    options: [
      { value: 'a', label: 'Stomach and waist, above and below the navel' },
      { value: 'b', label: 'Lower gut and abdomen, even when you have not eaten much' },
      { value: 'c', label: 'Hips, thighs, and lower body' },
      { value: 'd', label: 'Upper back, chest, or arms' },
    ],
  },
  {
    id: 'sq2',
    question: 'Which of these fits most closely right now?',
    options: [
      { value: 'a', label: 'Exhausted but wired. Tired but cannot switch off at night.' },
      { value: 'b', label: 'Heavy and sluggish, especially after meals or in the afternoon. Carbohydrate cravings persist.' },
      { value: 'c', label: 'Hormonally inconsistent. Mood shifts, water retention, or cycle disruption. Storage on hips and thighs.' },
      { value: 'd', label: 'Slipping despite the effort. Reduced drive, capacity declining, muscle no longer responding the way it used to.' },
    ],
  },
]

function CheckInResult({ resultKey, progressScore }: { resultKey: string; progressScore: number }) {
  const pattern = CHECKIN_PATTERNS[resultKey]
  if (!pattern) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Progress summary */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '20px 22px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#4A4A4A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Your 7-Day Progress
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
          <span style={{ fontSize: '32px', fontWeight: 900, color: '#1B6DFC', letterSpacing: '-0.02em' }}>{progressScore}</span>
          <span style={{ fontSize: '14px', color: '#4A4A4A' }}>of 8 markers improving</span>
        </div>
        <div style={{ height: '6px', background: '#E5E5E5', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#1B6DFC', borderRadius: '99px', width: `${(progressScore / 8) * 100}%`, transition: 'width 0.6s ease' }} />
        </div>
        <p style={{ fontSize: '13px', color: '#4A4A4A', marginTop: '10px', lineHeight: 1.6 }}>
          {progressScore >= 6
            ? 'Strong week. Your system is responding well to the structure.'
            : progressScore >= 4
            ? 'Solid progress. The markers that have not shifted yet will often follow in week two.'
            : 'Your body is still adjusting. Week two is typically where the clearer shifts happen. Stay consistent.'}
        </p>
      </div>

      {/* Pattern result */}
      <div style={{
        background: '#FFFFFF',
        border: `1px solid ${pattern.color}30`,
        borderLeft: `3px solid ${pattern.color}`,
        borderRadius: '12px', padding: '24px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: pattern.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Your Biological Pattern
        </p>
        <p style={{ fontSize: '21px', fontWeight: 800, color: '#1A1A1A', marginBottom: '14px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          {pattern.label}
        </p>
        <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
          {pattern.desc}
        </p>
      </div>

      {/* Actions */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '22px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
          What to focus on this week
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {pattern.actions.map((action, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: pattern.color, minWidth: '20px', paddingTop: '2px' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* No commercial CTA in-portal at Day 7.
          The participant has 7 days of Challenge work remaining; the
          in-portal result focuses on the pattern + actions for Week 2.
          The Day 7 result email handles the Blueprint commercial layer
          for those open to acting on it from outside the Challenge frame.
          The Day 14 ascension email is the formal next push.
          Decision logged 2026-05-30. */}
    </div>
  )
}

export default function BodyDecodeCheckIn({
  token,
  savedResult,
  currentDay,
}: {
  token: string
  savedResult: string | null
  currentDay: number
}) {
  // Day 14 reveal gate (locked 2026-05-30): the Check-In form unlocks at
  // Day 7 but the result is HELD until Day 14. So when there is a saved
  // result and currentDay < 14, show the locked-reveal state, not the result.
  const resultRevealUnlocked = currentDay >= 14

  // Translate any legacy letter quiz_result ('a'-'d') to canonical slug for rendering.
  const initialResultKey = savedResult ? legacyLetterToSlug(savedResult) : null

  // If a result is saved and the reveal is locked, the user has already
  // submitted - we show the locked state instead of putting them back into
  // the form. Otherwise, fresh form OR the actual result.
  const initialStep: 'progress' | 'signal' | 'result' | 'locked' =
    initialResultKey
      ? resultRevealUnlocked
        ? 'result'
        : 'locked'
      : 'progress'

  const [step, setStep] = useState<'progress' | 'signal' | 'result' | 'locked'>(initialStep)
  const [progress, setProgress] = useState<Record<string, string>>({})
  const [signals, setSignals] = useState<Record<string, string>>({})
  const [resultKey, setResultKey] = useState<string | null>(initialResultKey)
  const [submitting, setSubmitting] = useState(false)

  const allProgressDone = PROGRESS_MARKERS.every(m => progress[m.id])
  const allSignalsDone = SIGNAL_QUESTIONS.every(q => signals[q.id])
  const progressScore = Object.values(progress).filter(v => v === 'better').length

  async function handleSubmit() {
    if (!allSignalsDone || submitting) return
    setSubmitting(true)
    const result = signals['sq2']
    const answers = { ...progress, ...signals }
    let resolvedPattern = legacyLetterToSlug(result)
    let revealUnlocked = resultRevealUnlocked
    try {
      const res = await fetch('/api/challenge/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, result, answers }),
      })
      const data = await res.json().catch(() => null)
      if (data?.pattern) resolvedPattern = data.pattern
      if (typeof data?.resultRevealUnlocked === 'boolean') revealUnlocked = data.resultRevealUnlocked
    } catch {
      // still show locked acknowledgement even if save fails
    }
    setResultKey(resolvedPattern)
    setStep(revealUnlocked ? 'result' : 'locked')
    setSubmitting(false)
  }

  if (step === 'locked') {
    const daysToReveal = Math.max(14 - currentDay, 0)
    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderLeft: '3px solid #1B6DFC',
        borderRadius: '14px',
        padding: '28px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'rgba(27,109,252,0.08)',
          border: '1px solid rgba(27,109,252,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B6DFC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          Check-In complete
        </p>
        <p style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.25 }}>
          Your Body Decode result reveals on Day 14.
        </p>
        <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 8px' }}>
          You finished the Check-In. Your full pattern read, why fat loss has stalled in your specific case, and your three actions for what comes next will be sent on Day 14 and shown here.
        </p>
        <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, margin: '0 0 4px' }}>
          {daysToReveal > 0
            ? `${daysToReveal} day${daysToReveal === 1 ? '' : 's'} until reveal.`
            : 'Reveal opens shortly.'}
        </p>
        <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, margin: 0 }}>
          Stay consistent with your training, your nutrition, your morning reset, and your evening rhythm. The reveal is the reward.
        </p>
      </div>
    )
  }

  if (step === 'result' && resultKey) {
    return <CheckInResult resultKey={resultKey} progressScore={progressScore} />
  }

  const progressOptions = [
    { value: 'better',    label: 'Improving',         color: '#1B6DFC' },
    { value: 'same',      label: 'About the same',    color: '#4A4A4A' },
    { value: 'challenge', label: 'Still a challenge', color: '#6B6B6B' },
  ]

  if (step === 'progress') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, margin: 0 }}>
            Rate each marker honestly based on how it has changed since Day 1. There is no right answer. This is a reflection, not a test.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {PROGRESS_MARKERS.map(marker => (
            <div key={marker.id} style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '16px 18px' }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 2px' }}>{marker.label}</p>
                <p style={{ fontSize: '12px', color: '#4A4A4A', margin: 0 }}>{marker.sub}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {progressOptions.map(opt => {
                  const selected = progress[marker.id] === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setProgress(p => ({ ...p, [marker.id]: opt.value }))}
                      style={{
                        flex: 1, padding: '9px 6px', borderRadius: '8px',
                        border: selected ? '1px solid rgba(27, 109, 252,0.45)' : '1px solid #E5E5E5',
                        background: selected ? 'rgba(27, 109, 252,0.10)' : '#F7F7F7',
                        color: selected ? '#1056D6' : '#3A3A3A',
                        fontSize: '12px', fontWeight: selected ? 700 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease', lineHeight: 1.3, textAlign: 'center',
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setStep('signal')}
          disabled={!allProgressDone}
          style={{
            width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
            background: allProgressDone ? '#1B6DFC' : '#E5E5E5',
            color: allProgressDone ? '#FFFFFF' : '#4A4A4A',
            fontSize: '15px', fontWeight: 700,
            cursor: allProgressDone ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
          }}
        >
          Continue to Pattern Check
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, margin: 0 }}>
          Two more questions. These help identify the biological pattern most active in your body right now.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
        {SIGNAL_QUESTIONS.map((q, qi) => (
          <div key={q.id}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px', lineHeight: 1.5 }}>
              <span style={{ color: '#1B6DFC', marginRight: '8px' }}>{qi + 1}.</span>
              {q.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {q.options.map(opt => {
                const selected = signals[q.id] === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSignals(s => ({ ...s, [q.id]: opt.value }))}
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: '10px',
                      border: selected ? '1px solid rgba(27, 109, 252,0.45)' : '1px solid #E5E5E5',
                      background: selected ? 'rgba(27, 109, 252,0.10)' : '#FFFFFF',
                      color: selected ? '#1056D6' : '#3A3A3A',
                      fontSize: '14px', fontWeight: selected ? 600 : 500,
                      textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.15s ease', lineHeight: 1.5,
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setStep('progress')}
          style={{
            padding: '15px 20px', borderRadius: '10px', border: '1px solid #E5E5E5',
            background: 'transparent', color: '#4A4A4A',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!allSignalsDone || submitting}
          style={{
            flex: 1, padding: '15px', borderRadius: '10px', border: 'none',
            background: allSignalsDone ? '#1B6DFC' : '#E5E5E5',
            color: allSignalsDone ? '#FFFFFF' : '#4A4A4A',
            fontSize: '15px', fontWeight: 700,
            cursor: allSignalsDone && !submitting ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
          }}
        >
          {submitting ? 'Saving your result...' : 'Get My Pattern Result'}
        </button>
      </div>
    </div>
  )
}
