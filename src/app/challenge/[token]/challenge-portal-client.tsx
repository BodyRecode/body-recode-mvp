'use client'

import { useState } from 'react'
import { legacyLetterToSlug } from '@/lib/pattern-mapping'

const DAILY_NOTES: Record<number, { focus: string; note: string }> = {
  1: {
    focus: 'Orientation day',
    note: 'No training today. Day 1 is for getting set up. Read your training plan and nutrition guide in full. Do the morning reset sequence. Eat clean. Go for a walk. Your first training session is tomorrow. Starting with one calm, structured day before the work begins is part of the design.',
  },
  2: {
    focus: 'First training session',
    note: 'Session A today. Notice how your body feels when you wake up - puffy, heavy, tired? That is your baseline. Write it down mentally. Over the next 14 days you will have something to compare it to. Do the morning reset before you train. Keep the session controlled. RIR is your guide, not max effort.',
  },
  3: {
    focus: 'Digestion and inflammation',
    note: 'By day 3, some people start to notice digestion settling. Less bloating, more predictable hunger. This is your system responding to meal timing and food quality. Stay consistent with the nutrition guide today. Simple works.',
  },
  4: {
    focus: 'Energy patterns',
    note: 'Pay attention to your afternoon energy today. Do you crash at the same time? That pattern has a biological cause. The structure you are building right now is directly targeting it. Stay the course.',
  },
  5: {
    focus: 'Week One Progress Session',
    note: 'Today is a rest day from training - walk 30 to 60 minutes as usual. Your Week One Progress Session is now available below. Watch it today while you are in the middle of the reset. It will help you understand what your body has been doing this week and make Week 2 feel much clearer.',
  },
  6: {
    focus: 'Recovery and sleep',
    note: 'Focus on the evening rhythm tonight. Sleep quality is one of the biggest drivers of every symptom you felt at the start. Cortisol, appetite, inflammation, energy. They all trace back to overnight recovery. Give the wind-down sequence your full attention.',
  },
  7: {
    focus: 'Halfway point - Body Decode Check-In',
    note: 'You have reached Day 7. Today the Body Decode Check-In unlocks below. Rate how 8 biological markers have changed since Day 1, then answer 2 pattern questions. Do it now while your body is mid-reset - your answers will reflect what is actually happening in your biology right now.',
  },
  8: {
    focus: 'Your second week begins',
    note: 'Week two is where the changes start becoming visible. The inflammation is settling. The rhythm is forming. Stay disciplined with the training and nutrition today. You are building on a foundation that is already shifting.',
  },
  9: {
    focus: 'Appetite signals',
    note: 'By now your hunger should feel more predictable. Less spiking, less craving. That is your blood sugar stabilising. If you are still getting strong cravings, look at meal spacing. Are you eating at consistent times? Consistency matters more than perfection.',
  },
  10: {
    focus: 'Training response',
    note: 'Notice how your body feels during training compared to Day 1. Less tightness? More energy mid-session? Your nervous system is adapting to the rhythm. This is not fitness progress. This is biological stabilisation. It is the foundation everything else is built on.',
  },
  11: {
    focus: 'Mental clarity',
    note: 'Energy stability and mental clarity are connected. When your cortisol pattern settles and your blood sugar stabilises, your head clears. If you are feeling sharper this week, that is why. It is not a coincidence.',
  },
  12: {
    focus: 'Consistency compounds',
    note: 'Twelve days of structure. Most people have never given their body twelve consecutive days of consistent rhythm. Your biology is responding to something it has not experienced in a long time: predictability. Keep it simple today.',
  },
  13: {
    focus: 'The last push',
    note: 'One more day after today. Do not ease off. The final two days are where the pattern gets locked in. Complete the training, follow the nutrition guide, do both sequences. Finish the way you started.',
  },
  14: {
    focus: 'Day 14 - You finished',
    note: 'Fourteen days. You did it. Take a moment to compare how you feel right now to Day 1. Less puffiness? More stable energy? Clearer head? That is what structure does to biology. This is the baseline your body needs. The next step is understanding your patterns at a deeper level - and building on what you have started.',
  },
}

const RESOURCES_STATIC = [
  {
    id: 'training',
    title: '14-Day Training Plan',
    desc: 'Your session-by-session training structure for all 14 days.',
    icon: '🏋️',
    href: '__training__',
  },
  {
    id: 'nutrition',
    title: 'Nutrition Guide',
    desc: 'Simple whole foods, meal timing, and digestion-friendly choices.',
    icon: '🥗',
    href: '__nutrition__',
  },
  {
    id: 'morning',
    title: 'Morning Reset Sequence',
    desc: '5 minutes every morning. Do this before caffeine.',
    icon: '☀️',
    href: null,
    steps: [
      '2 minutes of slow nasal breathing before getting out of bed',
      '500ml of water immediately on waking',
      '5 minutes of light movement or walking outside',
      'No phone for the first 20 minutes',
      'Eat breakfast within 60 minutes of waking',
    ],
  },
  {
    id: 'evening',
    title: 'Evening Rhythm Sequence',
    desc: 'Wind down your nervous system before sleep.',
    icon: '🌙',
    href: null,
    steps: [
      'Dim lights and reduce screen brightness after 8pm',
      'No eating within 2 hours of sleep',
      '5 minutes of slow breathing or light stretching',
      'Set a consistent sleep time and stick to it',
      'Phone out of the bedroom or on silent',
    ],
  },
]

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
      { value: 'a', label: 'Stomach and waist — above and below the navel' },
      { value: 'b', label: 'Lower gut and abdomen — even when you have not eaten much' },
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

const CHECKIN_PATTERNS: Record<string, { label: string; color: string; desc: string; actions: string[] }> = {
  'stress-stored': {
    label: 'Stress-Stored Pattern',
    color: '#ef4444',
    desc: 'Your body is storing and retaining in response to a chronic stress load. Cortisol and adrenaline are keeping your system in a state of low-grade alert, which signals your body to hold fat around the midsection as an energy reserve. The reset you have done this week is directly targeting this. The full picture requires understanding exactly how your stress hormones are behaving across the day.',
    actions: [
      'Sleep is your highest leverage point. Cortisol resets overnight. Prioritise sleep quality above everything else this week.',
      'Keep training intensity moderate. Hard sessions spike cortisol further and can slow progress in this pattern.',
      'Eat breakfast within 60 minutes of waking. This supports your morning cortisol curve and begins the process of hormonal regulation for the day.',
    ],
  },
  'metabolic-drift': {
    label: 'Insulin-Drift Pattern',
    color: '#f59e0b',
    desc: 'Your body\'s ability to manage blood sugar has drifted. Insulin is staying elevated longer than it should, which drives energy crashes, persistent cravings, and the heaviness you feel after meals. Common in former athletes whose training response has changed but whose fuelling strategy has not adjusted. The nutrition structure you have been following this week is designed specifically for this. Restricting starchy carbohydrates to the post-training window forces your body to rebuild insulin sensitivity over time.',
    actions: [
      'Never skip breakfast. Blood sugar stability starts with your first meal. Skipping it creates a deficit that drives cravings throughout the rest of the day.',
      'Walk after your evening meal. Even 15-20 minutes significantly lowers post-meal blood sugar.',
      'Keep starchy carbohydrates strictly to the post-training window. Fruit is fine throughout the day. It metabolises differently to refined carbohydrates.',
    ],
  },
  'hormonal-shift': {
    label: 'Estrogen-Shift Pattern',
    color: '#8b5cf6',
    desc: 'Your body is in an oestrogen-driven conservation state. Storing and retaining as a protective mechanism driven by reproductive hormone signalling. Commonly associated with perimenopause, post-hormonal contraceptive adjustment, and states of chronic under-eating. One of the most common patterns and one of the most mismanaged. Typically treated with more restriction, which makes it worse.',
    actions: [
      'Avoid under-eating. This pattern responds poorly to caloric restriction. The body conserves harder when it perceives scarcity.',
      'Prioritise sleep and recovery. Oestrogen balance is deeply tied to overnight restoration.',
      'Be consistent with meal timing. Irregular eating disrupts the hormonal signals your body uses to decide whether to conserve or release stored energy.',
    ],
  },
  'system-overload': {
    label: 'Androgen-Decline Pattern',
    color: '#14b8a6',
    desc: 'Your body is in a state of declining androgen function. Testosterone is no longer signalling muscle maintenance and recovery the way it once did. The result is reduced drive, slower recovery, and a sense that capacity is slipping despite consistent effort. Commonly presenting in men from their mid-thirties onward, and frequently missed or attributed to ageing as a fixed variable rather than a manageable hormonal state. Progress requires reducing total system demand and rebuilding the inputs that support testosterone signalling.',
    actions: [
      'Protect deep sleep. Testosterone synthesis happens during deep sleep. It is non-negotiable. Prioritise it above everything.',
      'Eat enough protein and fat. Low-fat diets actively suppress testosterone production. Build meals around protein and do not fear dietary fat.',
      'Train hard but rest harder. Strength stimulus is what signals testosterone synthesis. Recovery is what realises it. Do not chase volume.',
    ],
  },
}

function ExpandableResource({ resource }: { resource: typeof RESOURCES_STATIC[0] & { locked?: boolean } }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: '#111110', border: '1px solid #1c1917',
      borderRadius: '12px', overflow: 'hidden',
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '18px 20px', cursor: 'pointer',
        }}
        onClick={() => resource.steps ? setOpen(o => !o) : undefined}
      >
        <div style={{
          width: '42px', height: '42px', borderRadius: '10px',
          background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: '20px',
        }}>
          {resource.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: '0 0 3px' }}>{resource.title}</p>
          <p style={{ fontSize: '13px', color: '#78716c', margin: 0, lineHeight: 1.4 }}>{resource.desc}</p>
        </div>
        {resource.locked ? (
          <span style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: '8px',
            background: '#1c1917', color: '#44403c',
            fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            🔒 Locked
          </span>
        ) : resource.href ? (
          <a
            href={resource.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              flexShrink: 0, padding: '8px 16px', borderRadius: '8px',
              background: '#14b8a6', color: '#0c0a09',
              fontSize: '12px', fontWeight: 700, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            View
          </a>
        ) : (
          <span style={{ fontSize: '13px', color: '#57534e', flexShrink: 0 }}>
            {open ? '▲' : '▼'}
          </span>
        )}
      </div>
      {resource.steps && open && (
        <div style={{ borderTop: '1px solid #1c1917', padding: '16px 20px' }}>
          {resource.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < resource.steps!.length - 1 ? '12px' : 0 }}>
              <span style={{
                fontSize: '11px', fontWeight: 800, color: '#14b8a6',
                width: '20px', flexShrink: 0, paddingTop: '2px',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ fontSize: '14px', color: '#a8a29e', margin: 0, lineHeight: 1.6 }}>{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckInResult({ resultKey, progressScore }: { resultKey: string; progressScore: number }) {
  const pattern = CHECKIN_PATTERNS[resultKey]
  if (!pattern) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Progress summary */}
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '20px 22px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Your 7-Day Progress
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
          <span style={{ fontSize: '32px', fontWeight: 900, color: '#14b8a6', letterSpacing: '-0.02em' }}>{progressScore}</span>
          <span style={{ fontSize: '14px', color: '#57534e' }}>of 8 markers improving</span>
        </div>
        <div style={{ height: '6px', background: '#1c1917', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#14b8a6', borderRadius: '99px', width: `${(progressScore / 8) * 100}%`, transition: 'width 0.6s ease' }} />
        </div>
        <p style={{ fontSize: '13px', color: '#57534e', marginTop: '10px', lineHeight: 1.6 }}>
          {progressScore >= 6
            ? 'Strong week. Your system is responding well to the structure.'
            : progressScore >= 4
            ? 'Solid progress. The markers that have not shifted yet will often follow in week two.'
            : 'Your body is still adjusting. Week two is typically where the clearer shifts happen — stay consistent.'}
        </p>
      </div>

      {/* Pattern result */}
      <div style={{
        background: '#111110',
        border: `1px solid ${pattern.color}30`,
        borderLeft: `3px solid ${pattern.color}`,
        borderRadius: '12px', padding: '24px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: pattern.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Your Biological Pattern
        </p>
        <p style={{ fontSize: '21px', fontWeight: 800, color: '#ffffff', marginBottom: '14px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          {pattern.label}
        </p>
        <p style={{ fontSize: '14px', color: '#a8a29e', lineHeight: 1.75, margin: 0 }}>
          {pattern.desc}
        </p>
      </div>

      {/* Actions */}
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '22px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
          What to focus on this week
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {pattern.actions.map((action, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: pattern.color, minWidth: '20px', paddingTop: '2px' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ fontSize: '14px', color: '#a8a29e', lineHeight: 1.7, margin: 0 }}>{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#0d2d29', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '12px', padding: '22px' }}>
        <p style={{ fontSize: '14px', color: '#99d6d0', lineHeight: 1.7, margin: '0 0 16px' }}>
          This is the beginning. The full picture — your complete biological map, your specific hormone drivers, and what is structurally driving your pattern — comes through the Body State Scorecard.
        </p>
        <a
          href="https://bodyrecode.au/scorecard"
          style={{
            display: 'inline-block', padding: '12px 22px', borderRadius: '8px',
            background: '#14b8a6', color: '#0c0a09',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none',
          }}
        >
          Take the Full Body State Scorecard
        </a>
      </div>
    </div>
  )
}

function BodyDecodeCheckIn({ token, savedResult }: { token: string; savedResult: string | null }) {
  // Translate any legacy letter quiz_result ('a'-'d') to canonical slug for rendering.
  const initialResultKey = savedResult ? legacyLetterToSlug(savedResult) : null
  const [step, setStep] = useState<'progress' | 'signal' | 'result'>(initialResultKey ? 'result' : 'progress')
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
    const result = signals['sq2'] // Q2 letter, gender-keyed by API
    const answers = { ...progress, ...signals }
    // Optimistic: fall back to letter mapping if the API doesn't return a slug.
    let resolvedPattern = legacyLetterToSlug(result)
    try {
      const res = await fetch('/api/challenge/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, result, answers }),
      })
      const data = await res.json().catch(() => null)
      if (data?.pattern) resolvedPattern = data.pattern
    } catch {
      // still show result even if save fails
    }
    setResultKey(resolvedPattern)
    setStep('result')
    setSubmitting(false)
  }

  if (step === 'result' && resultKey) {
    return <CheckInResult resultKey={resultKey} progressScore={progressScore} />
  }

  const progressOptions = [
    { value: 'better',    label: 'Improving',         color: '#14b8a6' },
    { value: 'same',      label: 'About the same',    color: '#57534e' },
    { value: 'challenge', label: 'Still a challenge', color: '#78716c' },
  ]

  if (step === 'progress') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: '#78716c', lineHeight: 1.7, margin: 0 }}>
            Rate each marker honestly based on how it has changed since Day 1. There is no right answer — this is a reflection, not a test.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {PROGRESS_MARKERS.map(marker => (
            <div key={marker.id} style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '16px 18px' }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: '0 0 2px' }}>{marker.label}</p>
                <p style={{ fontSize: '12px', color: '#57534e', margin: 0 }}>{marker.sub}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {progressOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setProgress(p => ({ ...p, [marker.id]: opt.value }))}
                    style={{
                      flex: 1, padding: '8px 6px', borderRadius: '8px', border: 'none',
                      background: progress[marker.id] === opt.value
                        ? opt.value === 'better' ? 'rgba(20,184,166,0.12)' : '#222220'
                        : '#1c1917',
                      color: progress[marker.id] === opt.value
                        ? opt.value === 'better' ? '#14b8a6' : '#ffffff'
                        : '#57534e',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      outline: progress[marker.id] === opt.value
                        ? opt.value === 'better' ? '1px solid rgba(20,184,166,0.3)' : '1px solid #44403c'
                        : 'none',
                      transition: 'all 0.12s ease', lineHeight: 1.3, textAlign: 'center',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setStep('signal')}
          disabled={!allProgressDone}
          style={{
            width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
            background: allProgressDone ? '#14b8a6' : '#1c1917',
            color: allProgressDone ? '#0c0a09' : '#57534e',
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
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#78716c', lineHeight: 1.7, margin: 0 }}>
          Two more questions. These help identify the biological pattern most active in your body right now.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
        {SIGNAL_QUESTIONS.map((q, qi) => (
          <div key={q.id}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '12px', lineHeight: 1.5 }}>
              <span style={{ color: '#14b8a6', marginRight: '8px' }}>{qi + 1}.</span>
              {q.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {q.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSignals(s => ({ ...s, [q.id]: opt.value }))}
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: '10px',
                    border: signals[q.id] === opt.value ? '1px solid rgba(20,184,166,0.4)' : '1px solid #1c1917',
                    background: signals[q.id] === opt.value ? 'rgba(20,184,166,0.07)' : '#111110',
                    color: signals[q.id] === opt.value ? '#ffffff' : '#78716c',
                    fontSize: '14px', textAlign: 'left', cursor: 'pointer',
                    transition: 'all 0.15s ease', lineHeight: 1.5,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setStep('progress')}
          style={{
            padding: '15px 20px', borderRadius: '10px', border: '1px solid #1c1917',
            background: 'transparent', color: '#57534e',
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
            background: allSignalsDone ? '#14b8a6' : '#1c1917',
            color: allSignalsDone ? '#0c0a09' : '#57534e',
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

const PARQ_QUESTIONS = [
  {
    id: 'q1',
    text: 'Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?',
  },
  {
    id: 'q2',
    text: 'Do you feel pain in your chest when you do physical activity?',
  },
  {
    id: 'q3',
    text: 'In the past month, have you had chest pain when you were not doing physical activity?',
  },
  {
    id: 'q4',
    text: 'Do you lose your balance because of dizziness, or do you ever lose consciousness?',
  },
  {
    id: 'q5',
    text: 'Do you have a bone or joint problem (for example, back, knee or hip) that could be made worse by a change in your physical activity?',
  },
  {
    id: 'q6',
    text: 'Is your doctor currently prescribing medication for your blood pressure or a heart condition?',
  },
  {
    id: 'q7',
    text: 'Do you know of any other reason why you should not participate in physical activity?',
  },
]

function ParqForm({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const allAnswered = PARQ_QUESTIONS.every(q => answers[q.id])
  const anyYes = Object.values(answers).some(v => v === 'yes')

  async function handleSubmit() {
    if (!allAnswered || anyYes) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/challenge/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, formType: 'parq', responses: answers }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      onComplete()
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '20px' }}>
        <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.7, margin: 0 }}>
          The PAR-Q is a standard physical activity readiness questionnaire. Please answer all questions honestly. If you answer YES to any question, you must consult a doctor before beginning the training component of this challenge.
        </p>
      </div>

      {PARQ_QUESTIONS.map((q, i) => (
        <div key={q.id}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#d4cfc9', lineHeight: 1.6, marginBottom: '12px' }}>
            <span style={{ color: '#14b8a6', marginRight: '8px', fontWeight: 800 }}>{i + 1}.</span>
            {q.text}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['no', 'yes'] as const).map(val => (
              <button
                key={val}
                onClick={() => setAnswers(a => ({ ...a, [q.id]: val }))}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: answers[q.id] === val
                    ? val === 'no' ? 'rgba(20,184,166,0.12)' : 'rgba(239,68,68,0.12)'
                    : '#1c1917',
                  color: answers[q.id] === val
                    ? val === 'no' ? '#14b8a6' : '#ef4444'
                    : '#57534e',
                  fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  outline: answers[q.id] === val
                    ? val === 'no' ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(239,68,68,0.3)'
                    : '1px solid transparent',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  transition: 'all 0.15s ease',
                }}
              >
                {val === 'yes' ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>
      ))}

      {anyYes && allAnswered && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '12px', padding: '20px',
        }}>
          <p style={{ fontSize: '14px', color: '#ef4444', fontWeight: 700, marginBottom: '8px' }}>
            Medical clearance required
          </p>
          <p style={{ fontSize: '13px', color: '#a8a29e', lineHeight: 1.7, margin: 0 }}>
            You have answered YES to one or more questions. Please consult your doctor before beginning the physical training component of this challenge. You can still access all other challenge resources. If your doctor clears you, please contact us at kade@bodyrecode.au.
          </p>
        </div>
      )}

      {error && (
        <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || anyYes || submitting}
        style={{
          width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
          background: allAnswered && !anyYes ? '#14b8a6' : '#1c1917',
          color: allAnswered && !anyYes ? '#0c0a09' : '#57534e',
          fontSize: '15px', fontWeight: 700,
          cursor: allAnswered && !anyYes && !submitting ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
        }}
      >
        {submitting ? 'Saving...' : 'I confirm all answers are NO - continue'}
      </button>
    </div>
  )
}

function HealthDecForm({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [checks, setChecks] = useState<Record<string, boolean>>({
    age: false,
    notPregnant: false,
    notMedical: false,
    responsibility: false,
    doctorConsult: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const declarations = [
    { id: 'age', text: 'I am 18 years of age or older.' },
    { id: 'notPregnant', text: 'I am not currently pregnant or in the first 6 weeks post-partum.' },
    { id: 'notMedical', text: 'I understand that the Body Recode challenge is not a medical program and does not constitute medical advice, diagnosis, or treatment.' },
    { id: 'responsibility', text: 'I accept personal responsibility for my participation in this challenge and any physical activity I undertake as part of it.' },
    { id: 'doctorConsult', text: 'I agree to consult a qualified medical professional if I experience any pain, discomfort, or symptoms during the challenge.' },
  ]

  const allChecked = declarations.every(d => checks[d.id])

  async function handleSubmit() {
    if (!allChecked) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/challenge/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, formType: 'health_dec' }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      onComplete()
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '20px' }}>
        <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.7, margin: 0 }}>
          Please read and confirm each declaration below. By submitting this form you acknowledge and agree to the following statements.
        </p>
      </div>

      {declarations.map(d => (
        <div
          key={d.id}
          onClick={() => setChecks(c => ({ ...c, [d.id]: !c[d.id] }))}
          style={{
            display: 'flex', gap: '14px', alignItems: 'flex-start',
            background: checks[d.id] ? 'rgba(20,184,166,0.06)' : '#111110',
            border: checks[d.id] ? '1px solid rgba(20,184,166,0.25)' : '1px solid #1c1917',
            borderRadius: '10px', padding: '16px', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{
            width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, marginTop: '1px',
            background: checks[d.id] ? '#14b8a6' : '#1c1917',
            border: checks[d.id] ? 'none' : '1px solid #44403c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}>
            {checks[d.id] && (
              <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                <path d="M1 4L4.5 7.5L11 1" stroke="#0c0a09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p style={{ fontSize: '14px', color: checks[d.id] ? '#d4cfc9' : '#78716c', lineHeight: 1.6, margin: 0, transition: 'color 0.15s ease' }}>
            {d.text}
          </p>
        </div>
      ))}

      {error && (
        <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allChecked || submitting}
        style={{
          width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
          background: allChecked ? '#14b8a6' : '#1c1917',
          color: allChecked ? '#0c0a09' : '#57534e',
          fontSize: '15px', fontWeight: 700,
          cursor: allChecked && !submitting ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
        }}
      >
        {submitting ? 'Saving...' : 'Submit Health Declaration'}
      </button>
    </div>
  )
}

export default function ChallengePortalClient({
  token, firstName, currentDay, enrolledAt, parqCompleted, healthDecCompleted, savedQuizResult,
}: {
  token: string
  firstName: string
  currentDay: number
  enrolledAt: string
  parqCompleted: boolean
  healthDecCompleted: boolean
  savedQuizResult: string | null
}) {
  const [parqDone, setParqDone] = useState(parqCompleted)
  const [healthDecDone, setHealthDecDone] = useState(healthDecCompleted)
  const [activeForm, setActiveForm] = useState<'parq' | 'health_dec' | null>(
    !parqCompleted ? 'parq' : !healthDecCompleted ? 'health_dec' : null
  )

  const formsComplete = parqDone && healthDecDone
  const todayNote = DAILY_NOTES[currentDay]
  const progress = Math.round((currentDay / 14) * 100)
  const quizUnlocked = currentDay >= 7

  const RESOURCES = RESOURCES_STATIC.map(r =>
    r.id === 'training' ? { ...r, href: formsComplete ? `/challenge/${token}/training` : null, locked: !formsComplete }
    : r.id === 'nutrition' ? { ...r, href: formsComplete ? `/challenge/${token}/nutrition` : null, locked: !formsComplete }
    : r
  ) as (typeof RESOURCES_STATIC[0] & { locked?: boolean })[]

  return (
    <div style={{
      minHeight: '100vh', background: '#0c0a09', color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #1c1917', padding: '18px 24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
          <div style={{
            background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)',
            borderRadius: '99px', padding: '5px 14px',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#14b8a6' }}>
              Day {currentDay} of 14
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Welcome back, {firstName}.
          </h1>
          <p style={{ fontSize: '15px', color: '#57534e', margin: 0 }}>
            14-Day Body Decode Challenge
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#14b8a6' }}>{progress}%</span>
          </div>
          <div style={{ height: '6px', background: '#1c1917', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#14b8a6', borderRadius: '99px',
              width: `${progress}%`, transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '11px', color: '#2a2826' }}>Day 1</span>
            <span style={{ fontSize: '11px', color: '#2a2826' }}>Day 14</span>
          </div>
        </div>

        {/* Required Forms */}
        {!formsComplete && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
                  Required before training
                </p>
                <p style={{ fontSize: '13px', color: '#a8a29e', lineHeight: 1.6, margin: 0 }}>
                  Complete your PAR-Q and Health Declaration to unlock the training and nutrition resources. This takes 2 minutes.
                </p>
              </div>
            </div>

            {/* Form tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[
                { key: 'parq' as const, label: 'PAR-Q', done: parqDone },
                { key: 'health_dec' as const, label: 'Health Declaration', done: healthDecDone },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => !tab.done && setActiveForm(tab.key)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '8px', border: 'none',
                    background: tab.done
                      ? 'rgba(20,184,166,0.1)'
                      : activeForm === tab.key ? '#1c1917' : '#111110',
                    color: tab.done ? '#14b8a6' : activeForm === tab.key ? '#ffffff' : '#57534e',
                    fontSize: '13px', fontWeight: 700,
                    cursor: tab.done ? 'default' : 'pointer',
                    outline: activeForm === tab.key && !tab.done ? '1px solid #44403c' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.done ? '✓ ' : ''}{tab.label}
                </button>
              ))}
            </div>

            {activeForm === 'parq' && !parqDone && (
              <ParqForm
                token={token}
                onComplete={() => {
                  setParqDone(true)
                  setActiveForm('health_dec')
                }}
              />
            )}
            {(activeForm === 'health_dec' || (parqDone && !healthDecDone && activeForm !== 'parq')) && !healthDecDone && (
              <HealthDecForm
                token={token}
                onComplete={() => {
                  setHealthDecDone(true)
                  setActiveForm(null)
                }}
              />
            )}
          </div>
        )}

        {formsComplete && (
          <div style={{
            background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.2)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '32px',
            display: 'flex', gap: '10px', alignItems: 'center',
          }}>
            <span style={{ fontSize: '16px' }}>✓</span>
            <p style={{ fontSize: '13px', color: '#14b8a6', fontWeight: 600, margin: 0 }}>
              You are cleared for training. All resources are unlocked.
            </p>
          </div>
        )}

        {/* Today's note */}
        {todayNote && (
          <div style={{ marginBottom: '48px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Today — Day {currentDay}
            </p>
            <div style={{
              background: '#111110', border: '1px solid #1c1917',
              borderLeft: '3px solid #14b8a6',
              borderRadius: '12px', padding: '22px 22px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                {todayNote.focus}
              </p>
              <p style={{ fontSize: '15px', color: '#d4cfc9', lineHeight: 1.75, margin: 0 }}>
                {todayNote.note}
              </p>
            </div>
          </div>
        )}

        {/* Resources */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Your Resources
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {RESOURCES.map(r => (
              <ExpandableResource key={r.id} resource={r} />
            ))}
          </div>
        </div>

        {/* Day 5 Live Session */}
        {currentDay >= 5 && (
          <div style={{ marginBottom: '48px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Live Session
            </p>
            <div style={{
              background: 'linear-gradient(135deg, #0d2d29 0%, #0a2320 100%)',
              border: '1px solid rgba(20,184,166,0.25)',
              borderRadius: '16px', padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#14b8a6', boxShadow: '0 0 0 3px rgba(20,184,166,0.25)',
                }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Week One Progress Session
                </span>
              </div>
              <p style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', margin: '0 0 10px', lineHeight: 1.3 }}>
                Decode what your body has been doing this week.
              </p>
              <p style={{ fontSize: '14px', color: '#99d6d0', lineHeight: 1.7, margin: '0 0 20px' }}>
                Your Week One Progress Session is now available. Watch this 30-minute session to understand exactly what has been happening in your biology, what the signals mean, and what Week 2 is building toward.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {[
                  'What your body has been doing this week',
                  'How to decode your biological signals',
                  'Why rhythm beats restriction every time',
                  'The shift from reset to results',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#14b8a6', flexShrink: 0, marginTop: '7px' }} />
                    <p style={{ fontSize: '13px', color: '#99d6d0', margin: 0, lineHeight: 1.55 }}>{item}</p>
                  </div>
                ))}
              </div>
              <a
                href={process.env.NEXT_PUBLIC_CHALLENGE_SESSION_VIDEO_URL ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block', padding: '13px 24px', borderRadius: '10px',
                  background: '#14b8a6', color: '#0c0a09',
                  fontSize: '14px', fontWeight: 800, textDecoration: 'none',
                }}
              >
                Watch the session
              </a>
            </div>
          </div>
        )}

        {/* Day 7 Body Decode Check-In */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Body Decode Check-In
          </p>
          {quizUnlocked ? (
            <div>
              {!savedQuizResult && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                    How has your body responded this week?
                  </p>
                  <p style={{ fontSize: '14px', color: '#78716c', lineHeight: 1.6, margin: 0 }}>
                    Rate 8 biological markers, then answer 2 signal questions. Your result identifies the pattern most active in your body right now — and what to do about it.
                  </p>
                </div>
              )}
              <BodyDecodeCheckIn token={token} savedResult={savedQuizResult} />
            </div>
          ) : (
            <div style={{
              background: '#111110', border: '1px solid #1c1917',
              borderRadius: '12px', padding: '24px', textAlign: 'center',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#1c1917', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 14px', fontSize: '22px',
              }}>
                🔒
              </div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#57534e', marginBottom: '6px' }}>
                Unlocks on Day 7
              </p>
              <p style={{ fontSize: '13px', color: '#2a2826', margin: 0 }}>
                {7 - currentDay} day{7 - currentDay === 1 ? '' : 's'} to go
              </p>
            </div>
          )}
        </div>

        {/* Day 14 ascension CTA */}
        {currentDay >= 14 && (
          <div style={{
            background: 'linear-gradient(135deg, #0d2d29 0%, #0a2320 100%)',
            border: '1px solid rgba(20,184,166,0.25)',
            borderRadius: '16px', padding: '28px 24px', marginBottom: '48px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
              What comes next
            </p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '12px', lineHeight: 1.3 }}>
              You have built the foundation. Now build on it.
            </p>
            <p style={{ fontSize: '14px', color: '#99d6d0', lineHeight: 1.7, marginBottom: '20px' }}>
              The 6-Week Body Recode Blueprint takes everything you have started here and adds structure, pattern recognition, and education to help you understand exactly why your body responds the way it does.
            </p>
            <a
              href="https://bodyrecode.au"
              style={{
                display: 'inline-block', padding: '14px 24px', borderRadius: '10px',
                background: '#14b8a6', color: '#0c0a09',
                fontSize: '14px', fontWeight: 800, textDecoration: 'none',
              }}
            >
              See the 6-Week Blueprint
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
