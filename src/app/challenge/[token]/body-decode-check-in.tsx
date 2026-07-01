'use client'

import { useState } from 'react'
import { legacyLetterToSlug } from '@/lib/pattern-mapping'
import { CHECKIN_PATTERNS } from '@/lib/checkin-patterns'
import { PROGRESS_MARKERS, MARKER_RATING_META, type MarkerRating } from '@/lib/checkin-markers'
import { brand } from "@/config/tenant";

const SIGNAL_QUESTIONS = [
  {
    id: 'sq1',
    question: 'Where do you most notice excess puffiness or softness in your body?',
    // Q1 is informational/self-identification only — pattern assignment runs
    // off sq2 + gender via pickPatternSlug() in pattern-mapping.ts. Letter
    // values a-d preserved exactly to keep any legacy quiz_answers JSONB
    // historically interpretable. New posterior option appended as 'e' (mirrors
    // the scorecard storage taxonomy added 2026-06-24); option 'a' reworded
    // from "Stomach and waist" → "Belly and front of the stomach" to
    // disambiguate from posterior — same anterior semantic, clearer wording.
    options: [
      { value: 'a', label: 'Belly and front of the stomach' },
      { value: 'b', label: 'Lower gut and abdomen, even when you have not eaten much' },
      { value: 'c', label: 'Hips, thighs, and lower body' },
      { value: 'd', label: 'Upper back, chest, or arms' },
      { value: 'e', label: 'Lower back, love handles and upper back' },
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

// In-portal Day 14 view (shown when result exists AND currentDay >= 14).
// Mirrors the Day 14 Body Decode Report email structure exactly: pattern
// hero + what this pattern means + where this shows up + what this is NOT
// (anti-shame misreads) + three pattern actions + Blueprint CTA. Progress
// recap intentionally omitted; bridge callback line at top references the
// Day 7 score.
function CheckInResult({ resultKey, progressScore }: { resultKey: string; progressScore: number }) {
  const pattern = CHECKIN_PATTERNS[resultKey]
  if (!pattern) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Bridge callback line — references Day 7 score without repeating the card */}
      <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
        You finished the 14 days. On Day 7 you logged <strong style={{ color: '#1A1A1A' }}>{progressScore} of 8 markers improving</strong>. That signal is what made this reading possible.
      </p>

      {/* Pattern hero — dark, big, branded */}
      <div style={{
        background: '#1A1A1A',
        border: `1px solid ${pattern.color}40`,
        borderLeft: `4px solid ${pattern.color}`,
        borderRadius: '16px',
        padding: '28px 26px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: pattern.color, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          Your Biological Pattern
        </p>
        <p style={{ fontSize: '28px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          {pattern.label}
        </p>
        <div style={{ width: '40px', height: '3px', background: pattern.color, borderRadius: '2px', marginBottom: '16px' }} />
        <p style={{ fontSize: '14px', color: '#D5D5D5', lineHeight: 1.75, margin: 0 }}>
          {pattern.desc}
        </p>
      </div>

      {/* What this pattern means — doctrinal interpretation */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px 26px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: pattern.color, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>
          What this pattern means
        </p>
        {pattern.whatItMeans.map((para, i) => (
          <p key={i} style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.75, margin: i === 0 ? '0' : '14px 0 0' }}>
            {para}
          </p>
        ))}
      </div>

      {/* Where this shows up — lived expression */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px 26px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: pattern.color, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>
          Where this shows up
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pattern.whereItShows.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', background: pattern.color, borderRadius: '99px', marginTop: '9px', flexShrink: 0 }} />
              <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What this is NOT — anti-shame misread defusal */}
      <div style={{ background: '#F7F7F5', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px 26px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px' }}>
          What this is NOT
        </p>
        <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, margin: '0 0 14px', fontStyle: 'italic' }}>
          Read these. The way this pattern is usually framed is part of the reason it stays unsolved.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pattern.whatItIsNot.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#6B6B6B', minWidth: '16px' }}>×</span>
              <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Three pattern-specific actions */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px 26px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          Your three pattern-specific actions
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {pattern.actions.map((action, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: pattern.color, minWidth: '20px', paddingTop: '2px', fontFamily: 'monospace' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What comes next — Blueprint ascension */}
      <div style={{
        background: '#1A1A1A',
        border: '1px solid rgba(27,109,252,0.3)',
        borderRadius: '14px',
        padding: '28px 26px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#B5CFFC', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          What comes next
        </p>
        <p style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.25 }}>
          The 6-Week Body Rewire Blueprint.
        </p>
        <p style={{ fontSize: '14px', color: '#D5D5D5', lineHeight: 1.75, margin: '0 0 18px' }}>
          You have read your pattern. The next dose is correction. The Blueprint takes the pattern you have just had read and runs six weeks of focused, pattern-specific corrective work.
        </p>
        <a
          href={`${brand().marketingDomain}/blueprint?source=challenge_day14_report`}
          style={{
            display: 'inline-block',
            padding: '14px 24px',
            borderRadius: '10px',
            background: '#1B6DFC',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          Start the 6-Week Blueprint · $97
        </a>
      </div>
    </div>
  )
}

// Day 7 in-portal view: shown between submission (Day 7+) and Day 14 reveal.
// Renders progress score + per-marker breakdown + brief interpretation +
// universal Week 2 guidance + Day 14 Body Decode Report teaser. No pattern.
// Mirrors the structure of the Day 7 progress-feedback email.
function Day7InPortalView({
  markerRatings,
  progressScore,
}: {
  markerRatings: Record<string, string>
  progressScore: number
}) {
  const progressPercent = Math.round((progressScore / 8) * 100)
  const interpretation = progressScore >= 6
    ? 'Most of your markers are improving. Your system has responded well to the first week of structure. The markers that have not shifted yet usually follow as the rhythm carries into Week 2.'
    : progressScore >= 4
    ? 'A solid first week. Some markers are clearly shifting, others are still settling. That mix is exactly what Day 7 looks like for most participants. The patterns of the second week typically bring the rest into line.'
    : 'Your body is still finding its baseline. That happens for some people. The shifts often appear later in Week 2 once the system has had more time with the new structure. Stay consistent.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Progress score card */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderLeft: '3px solid #1B6DFC',
        borderRadius: '14px',
        padding: '24px 26px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          Your 7-Day Progress
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '16px' }}>
          <span style={{ fontSize: '48px', fontWeight: 900, color: '#1B6DFC', letterSpacing: '-0.04em', lineHeight: 1 }}>{progressScore}</span>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#4A4A4A' }}>of 8 markers improving</span>
        </div>
        <div style={{ height: '8px', background: '#E5E5E5', borderRadius: '99px', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: '#1B6DFC', borderRadius: '99px', transition: 'width 0.6s ease' }} />
        </div>
        <p style={{ fontSize: '14px', color: '#4A4A4A', margin: 0, lineHeight: 1.65 }}>
          {interpretation}
        </p>
      </div>

      {/* Per-marker breakdown */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px 26px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          Marker-by-marker
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {PROGRESS_MARKERS.map((m, i) => {
            const ratingKey = (markerRatings[m.id] ?? 'same') as keyof typeof MARKER_RATING_META
            const meta = MARKER_RATING_META[ratingKey]
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '14px',
                padding: '12px 0',
                borderBottom: i < PROGRESS_MARKERS.length - 1 ? '1px solid #F0F0F0' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 2px' }}>{m.label}</p>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.5 }}>{m.sub}</p>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: meta.color, background: meta.background, border: `1px solid ${meta.border}`,
                  padding: '5px 11px', borderRadius: '99px', letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}>
                  {meta.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Universal Week 2 guidance */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px 26px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          What to focus on in Week 2
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            'Protect sleep above all else. Most of the biological work this Challenge is doing happens overnight. Cortisol resets, hormones recalibrate, inflammation lowers.',
            'Keep training intensity moderate. The reset only works if the system feels safe. Hard sessions spike cortisol and slow the regulation.',
            'Eat breakfast within 60 minutes of waking. This anchors the cortisol curve and sets the rhythm for the rest of the day.',
            'Walk after your evening meal. 15-20 minutes is enough. It lowers post-meal blood sugar and supports the overnight insulin recovery.',
          ].map((principle, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span style={{
                fontSize: '11px', fontWeight: 800, color: '#1B6DFC',
                fontFamily: '"Courier New",Consolas,monospace',
                minWidth: '24px', paddingTop: '3px',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ fontSize: '14px', color: '#4A4A4A', margin: 0, lineHeight: 1.7 }}>{principle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Day 14 teaser */}
      <div style={{
        background: '#1A1A1A',
        border: '1px solid rgba(27,109,252,0.3)',
        borderRadius: '14px',
        padding: '24px 26px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-60%', right: '-30%',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <p style={{ position: 'relative', fontSize: '11px', fontWeight: 700, color: '#B5CFFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          On Day 14
        </p>
        <p style={{ position: 'relative', fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.25 }}>
          Your full Body Decode Report.
        </p>
        <p style={{ position: 'relative', fontSize: '14px', color: '#B5CFFC', margin: 0, lineHeight: 1.7 }}>
          On Day 14 you receive the full read. Which of four patterns your body is currently working through, why fat loss has stalled in your specific case, and the three pattern-specific actions for what comes next. Stay consistent until then. The reveal is the reward for the work you put in across the full 14 days.
        </p>
      </div>
    </div>
  )
}

export default function BodyDecodeCheckIn({
  token,
  savedResult,
  savedAnswers,
  currentDay,
}: {
  token: string
  savedResult: string | null
  savedAnswers: Record<string, string> | null
  currentDay: number
}) {
  // Day 14 reveal gate (locked 2026-05-30): the Check-In submits on Day 7+
  // but the PATTERN reveal is held until Day 14. Between Day 7 and Day 14
  // the participant sees a "Day 7 in-portal view" showing their progress
  // score, per-marker breakdown, brief interpretation, Week 2 guidance,
  // and a Day 14 teaser. No pattern. On Day 14+ the full result renders.
  const resultRevealUnlocked = currentDay >= 14

  // Translate any legacy letter quiz_result ('a'-'d') to canonical slug for rendering.
  const initialResultKey = savedResult ? legacyLetterToSlug(savedResult) : null

  // Seed `progress` state with the saved marker ratings for return visits,
  // so the Day 7 in-portal view has data to render without re-fetching.
  // Filters out the sq (signal question) keys; only the 8 marker ratings.
  const initialMarkerRatings: Record<string, string> = savedAnswers
    ? Object.fromEntries(Object.entries(savedAnswers).filter(([k]) => !k.startsWith('sq')))
    : {}

  const initialStep: 'progress' | 'signal' | 'result' | 'day7-view' =
    initialResultKey
      ? resultRevealUnlocked
        ? 'result'
        : 'day7-view'
      : 'progress'

  const [step, setStep] = useState<'progress' | 'signal' | 'result' | 'day7-view'>(initialStep)
  const [progress, setProgress] = useState<Record<string, string>>(initialMarkerRatings)
  const [signals, setSignals] = useState<Record<string, string>>({})
  const [resultKey, setResultKey] = useState<string | null>(initialResultKey)
  const [submitting, setSubmitting] = useState(false)

  const allProgressDone = PROGRESS_MARKERS.every(m => progress[m.id])
  const allSignalsDone = SIGNAL_QUESTIONS.every(q => signals[q.id])
  const progressScore = Object.entries(progress)
    .filter(([k]) => !k.startsWith('sq'))
    .filter(([, v]) => v === 'better')
    .length

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
      // still show day 7 view even if save fails
    }
    setResultKey(resolvedPattern)
    setStep(revealUnlocked ? 'result' : 'day7-view')
    setSubmitting(false)
  }

  if (step === 'day7-view') {
    return <Day7InPortalView markerRatings={progress} progressScore={progressScore} />
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
