'use client'

import { useState } from 'react'

type Enrollment = {
  id: string
  first_name: string
  email: string
  token: string
  pattern: string
  pattern_source: string
  purchase_date: string
  current_week: number
}

const PATTERN_CONFIG: Record<string, { label: string; colour: string; description: string }> = {
  'stress-stored': {
    label: 'Stress-Stored',
    colour: '#ef4444',
    description: 'Your programme is built around lowering cortisol load, supporting your stress hormone curve, and creating the biological conditions for your body to release stored fat.',
  },
  'metabolic-drift': {
    label: 'Metabolic-Drift',
    colour: '#f59e0b',
    description: 'Your programme is built around restoring insulin sensitivity, stabilising blood sugar across the day, and timing your nutrition to work with your metabolic rhythm.',
  },
  'hormonal-shift': {
    label: 'Hormonal-Shift',
    colour: '#8b5cf6',
    description: 'Your programme is built around supporting reproductive hormone balance, avoiding the restriction patterns that make this pattern worse, and prioritising recovery as a training variable.',
  },
  'system-overload': {
    label: 'System-Overload',
    colour: '#14b8a6',
    description: 'Your programme is built around reducing total neurological demand, keeping training intensity controlled, and creating the conditions for your nervous system to become responsive again.',
  },
}

const PHASES = [
  { number: 1, name: 'Regulate', weeks: '1-2', description: 'Re-establish structure and biological rhythm.' },
  { number: 2, name: 'Adapt', weeks: '3-4', description: 'Apply progressive load. Drive adaptation.' },
  { number: 3, name: 'Embed', weeks: '5-6', description: 'Lock in the new baseline. Prepare for Stage 3.' },
]

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'training', label: 'Training' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'education', label: 'Education' },
  { id: 'checkin', label: 'Check-In' },
]

type PatternAssessmentProps = {
  onComplete: (pattern: string) => void
  token: string
}

function PatternAssessment({ onComplete, token }: PatternAssessmentProps) {
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const q1Options = [
    { value: 'stress-stored', label: 'Stomach and waist - above and below the navel' },
    { value: 'metabolic-drift', label: 'Lower gut and abdomen - even when you have not eaten much' },
    { value: 'hormonal-shift', label: 'Hips, thighs, and lower body' },
    { value: 'system-overload', label: 'Upper back, chest, or arms' },
  ]

  const q2Options = [
    { value: 'stress-stored', label: 'Exhausted but wired - tired but cannot switch off at night' },
    { value: 'metabolic-drift', label: 'Heavy and sluggish - especially after meals or in the afternoon' },
    { value: 'hormonal-shift', label: 'Hormonally inconsistent - mood shifts, water retention, or cycle disruption' },
    { value: 'system-overload', label: 'Flat and stalled - not depleted, just not changing or responding' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!q1 || !q2) return
    setSubmitting(true)
    // Q2 is the primary determinant (same logic as Body Decode Check-In)
    const pattern = q2
    await fetch('/api/blueprint/set-pattern', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, pattern }),
    })
    onComplete(pattern)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width={110} alt="Body Recode" style={{ display: 'block', marginBottom: 40 }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 12px', fontFamily: 'system-ui, sans-serif' }}>
          One last step before your portal opens
        </h1>
        <p style={{ fontSize: 15, color: '#78716c', lineHeight: 1.75, margin: '0 0 36px', fontFamily: 'system-ui, sans-serif' }}>
          Two questions to identify your biological pattern. This determines how your programme is built.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#a8a29e', margin: '0 0 16px', fontFamily: 'system-ui, sans-serif' }}>
              Where do you most notice excess puffiness or softness in your body?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q1Options.map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '14px 16px', background: q1 === opt.value ? '#1c1917' : '#111110', border: `1px solid ${q1 === opt.value ? '#14b8a6' : '#292524'}`, borderRadius: 8 }}>
                  <input type="radio" name="q1" value={opt.value} checked={q1 === opt.value} onChange={() => setQ1(opt.value)} style={{ marginTop: 2, accentColor: '#14b8a6' }} />
                  <span style={{ fontSize: 14, color: '#d4d0cc', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#a8a29e', margin: '0 0 16px', fontFamily: 'system-ui, sans-serif' }}>
              Which of these fits most closely right now?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q2Options.map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '14px 16px', background: q2 === opt.value ? '#1c1917' : '#111110', border: `1px solid ${q2 === opt.value ? '#14b8a6' : '#292524'}`, borderRadius: 8 }}>
                  <input type="radio" name="q2" value={opt.value} checked={q2 === opt.value} onChange={() => setQ2(opt.value)} style={{ marginTop: 2, accentColor: '#14b8a6' }} />
                  <span style={{ fontSize: 14, color: '#d4d0cc', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!q1 || !q2 || submitting}
            style={{ padding: '15px', background: '#14b8a6', color: '#0c0a09', fontWeight: 700, fontSize: 15, borderRadius: 8, border: 'none', cursor: (!q1 || !q2 || submitting) ? 'not-allowed' : 'pointer', opacity: (!q1 || !q2 || submitting) ? 0.5 : 1, fontFamily: 'system-ui, sans-serif' }}
          >
            {submitting ? 'Opening your portal...' : 'Open my Blueprint'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function BlueprintPortalClient({ enrollment }: { enrollment: Enrollment }) {
  const [pattern, setPattern] = useState(enrollment.pattern)
  const [activeTab, setActiveTab] = useState('home')

  // Show pattern assessment gate for Type B buyers
  if (pattern === 'pending') {
    return (
      <PatternAssessment
        token={enrollment.token}
        onComplete={(p) => setPattern(p)}
      />
    )
  }

  const config = PATTERN_CONFIG[pattern] ?? PATTERN_CONFIG['stress-stored']
  const currentWeek = enrollment.current_week ?? 1
  const currentPhase = currentWeek <= 2 ? PHASES[0] : currentWeek <= 4 ? PHASES[1] : PHASES[2]

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Top bar */}
      <div style={{ borderBottom: '1px solid #1c1917', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width={100} alt="Body Recode" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: config.colour }} />
          <span style={{ fontSize: 13, color: '#78716c', fontWeight: 600 }}>{config.label}</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ borderBottom: '1px solid #1c1917', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: activeTab === item.id ? '#14b8a6' : '#57534e', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === item.id ? '#14b8a6' : 'transparent'}`, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

        {activeTab === 'home' && (
          <div>
            {/* Welcome */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
                Welcome, {enrollment.first_name}
              </h1>
              <p style={{ fontSize: 15, color: '#78716c', margin: 0, lineHeight: 1.75 }}>
                6-Week Body Rewire Blueprint
              </p>
            </div>

            {/* Pattern card */}
            <div style={{ background: '#111110', border: `1px solid #1c1917`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '24px', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Your Pattern
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{config.label}</div>
              <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.75, margin: 0 }}>{config.description}</p>
            </div>

            {/* Current phase */}
            <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '24px', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Current Phase
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Phase {currentPhase.number} — {currentPhase.name}</span>
                <span style={{ fontSize: 13, color: '#57534e' }}>Weeks {currentPhase.weeks}</span>
              </div>
              <p style={{ fontSize: 14, color: '#78716c', margin: '0 0 16px', lineHeight: 1.7 }}>{currentPhase.description}</p>
              <div style={{ fontSize: 13, color: '#57534e' }}>Week {currentWeek} of 6</div>
            </div>

            {/* Phase overview */}
            <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                Programme Phases
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {PHASES.map((phase, i) => {
                  const isActive = phase.number === currentPhase.number
                  const isPast = phase.number < currentPhase.number
                  return (
                    <div key={phase.number} style={{ display: 'flex', gap: 16, paddingBottom: i < 2 ? 20 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isActive ? '#14b8a6' : isPast ? '#292524' : '#1c1917', border: `2px solid ${isActive ? '#14b8a6' : '#292524'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#0c0a09' : '#57534e' }}>{phase.number}</span>
                        </div>
                        {i < 2 && <div style={{ width: 2, flex: 1, background: '#1c1917', marginTop: 4 }} />}
                      </div>
                      <div style={{ paddingTop: 4, paddingBottom: i < 2 ? 8 : 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? '#fff' : '#57534e', marginBottom: 2 }}>
                          {phase.name} <span style={{ fontWeight: 400, color: '#3d3935' }}>— Weeks {phase.weeks}</span>
                        </div>
                        <div style={{ fontSize: 13, color: isActive ? '#78716c' : '#3d3935', lineHeight: 1.6 }}>{phase.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🏋️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>Training Programme</h2>
            <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.75, margin: '0 0 8px' }}>
              6-week training blueprint — pattern-specific emphasis for the {config.label} pattern.
            </p>
            <p style={{ fontSize: 13, color: '#57534e' }}>Content coming soon.</p>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🥗</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>HABNS Nutrition Framework</h2>
            <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.75, margin: '0 0 8px' }}>
              Nutrition guide with {config.label} pattern emphasis.
            </p>
            <p style={{ fontSize: 13, color: '#57534e' }}>Content coming soon.</p>
          </div>
        )}

        {activeTab === 'education' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 24px' }}>Education Hub</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { title: 'Cortisol and the Stress Response', week: 'Week 1' },
                { title: 'Insulin and Blood Sugar Control', week: 'Week 2' },
                { title: 'Testosterone and Muscle Signal', week: 'Week 3' },
                { title: 'Thyroid and Metabolic Rate', week: 'Week 4' },
                { title: 'Sleep Hormones and Recovery', week: 'Week 5' },
              ].map((lesson, i) => (
                <div key={i} style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 10, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{lesson.title}</div>
                    <div style={{ fontSize: 12, color: '#57534e' }}>Unlocks {lesson.week}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#3d3935', background: '#1c1917', padding: '4px 10px', borderRadius: 6 }}>
                    Coming soon
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>Weekly Check-In</h2>
            <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.75, margin: '0 0 8px' }}>
              Weekly progress tracking across 8 biological markers.
            </p>
            <p style={{ fontSize: 13, color: '#57534e' }}>Content coming soon.</p>
          </div>
        )}

      </div>
    </div>
  )
}
