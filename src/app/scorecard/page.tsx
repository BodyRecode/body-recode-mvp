'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

const SECTIONS = [
  {
    number: '01',
    title: 'Energy',
    rows: [
      { score: 1, desc: 'Tired most of the day. Relying on caffeine. Crashes after lunch or training.' },
      { score: 2, desc: 'Inconsistent. Some good days, some bad. Not reliable.' },
      { score: 3, desc: 'Steady energy through the day. No need for caffeine to function.' },
    ],
  },
  {
    number: '02',
    title: 'Sleep',
    rows: [
      { score: 1, desc: 'Poor quality. Waking through the night. Not rested in the morning.' },
      { score: 2, desc: 'Okay most nights but not consistently recovering.' },
      { score: 3, desc: 'Sleeping well. Waking rested. Recovery feels solid.' },
    ],
  },
  {
    number: '03',
    title: 'Stress Load',
    rows: [
      { score: 1, desc: 'High stress. Work, life, or emotional load is significant and ongoing.' },
      { score: 2, desc: 'Moderate. Manageable most of the time but not low.' },
      { score: 3, desc: 'Low to moderate. Not carrying a heavy chronic stress load right now.' },
    ],
  },
  {
    number: '04',
    title: 'Training Response',
    rows: [
      { score: 1, desc: 'Not progressing. Performance is flat or declining. Body feels beaten up.' },
      { score: 2, desc: 'Some progress but inconsistent. Hard to build momentum.' },
      { score: 3, desc: 'Responding well. Getting stronger, fitter, recovering between sessions.' },
    ],
  },
  {
    number: '05',
    title: 'Fat Loss Response',
    rows: [
      { score: 1, desc: 'Nothing is moving despite effort. Diet is clean, training is consistent. No result.' },
      { score: 2, desc: 'Slow or stalled. Some movement but not matching the input.' },
      { score: 3, desc: 'Body is responding. Composition is shifting in the right direction.' },
    ],
  },
]

const RESULTS = [
  {
    range: '5 to 8',
    label: 'Depleted State',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.2)',
    desc: 'Your body is in protection mode. Cortisol is elevated, metabolism is suppressed, and your biology is actively resisting fat loss and performance gains. Pushing harder with more training and less food will make this worse. Your body needs to be brought out of this state first. Prescription without interpretation is the reason you\'re stuck.',
  },
  {
    range: '9 to 11',
    label: 'Transitioning State',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    desc: 'Mixed signals. Your body has capacity but it\'s not consistent. Something is limiting your response: sleep, stress, recovery, or a mismatch between your training load and your current biological state. You\'re close, but you need to identify the specific bottleneck before adding more input.',
  },
  {
    range: '12 to 15',
    label: 'Ready State',
    color: '#14b8a6',
    bg: 'rgba(20,184,166,0.06)',
    border: 'rgba(20,184,166,0.2)',
    desc: 'Your biology is in a position to respond. If fat loss or performance isn\'t happening at this score, the issue is in the prescription. Training, nutrition, or both need to be adjusted. You have the foundation. Now it needs to be optimised.',
  },
]

function getResult(total: number) {
  if (total <= 8) return RESULTS[0]
  if (total <= 11) return RESULTS[1]
  return RESULTS[2]
}

type Step = 'scoring' | 'email' | 'result'

export default function ScorecardPage() {
  const searchParams = useSearchParams()
  const source = searchParams.get('source') ?? 'other'

  const [scores, setScores] = useState<Record<string, number>>({})
  const [step, setStep] = useState<Step>('scoring')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const totalSelected = Object.keys(scores).length
  const allSelected = totalSelected === SECTIONS.length
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const result = getResult(total)

  function selectScore(sectionNumber: string, score: number) {
    setScores(s => ({ ...s, [sectionNumber]: score }))
  }

  async function submitEmail() {
    if (!firstName.trim() || !email.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/scorecard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, email, score: total, body_state: result.label, source }),
      })
      if (res.ok) {
        setStep('result')
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #1c1917', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/logo-teal.png" alt="Body Recode" style={{ height: '44px' }} />
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ─── SCORING STEP ─── */}
        {step === 'scoring' && (
          <>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ width: '32px', height: '3px', background: '#14b8a6', marginBottom: '20px' }} />
              <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '12px' }}>
                The Body State Scorecard
              </h1>
              <p style={{ fontSize: '15px', color: '#a8a29e', lineHeight: 1.6 }}>
                Find out why your body is not responding. Takes 2 minutes. Select one score per section.
              </p>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#d4cfc9' }}>{totalSelected} of {SECTIONS.length} sections complete</span>
                <span style={{ fontSize: '12px', color: '#d4cfc9' }}>{Math.round((totalSelected / SECTIONS.length) * 100)}%</span>
              </div>
              <div style={{ height: '3px', background: '#1c1917', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#14b8a6', borderRadius: '99px', width: `${(totalSelected / SECTIONS.length) * 100}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
              {SECTIONS.map(section => (
                <div key={section.number}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{section.number}</span>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: scores[section.number] ? '#ffffff' : '#d4cfc9' }}>{section.title}</h2>
                    {scores[section.number] && (
                      <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#14b8a6' }}>
                        {scores[section.number] === 1 ? '1' : scores[section.number] === 2 ? '2' : '3'} / 3
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {section.rows.map(row => {
                      const selected = scores[section.number] === row.score
                      const scoreColor = row.score === 1 ? '#ef4444' : row.score === 2 ? '#f59e0b' : '#14b8a6'
                      return (
                        <button
                          key={row.score}
                          onClick={() => selectScore(section.number, row.score)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '14px',
                            background: selected ? `rgba(${row.score === 1 ? '239,68,68' : row.score === 2 ? '245,158,11' : '20,184,166'},0.08)` : '#111110',
                            border: `1.5px solid ${selected ? scoreColor : '#1c1917'}`,
                            borderRadius: '12px', padding: '14px 16px',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                            background: selected ? `rgba(${row.score === 1 ? '239,68,68' : row.score === 2 ? '245,158,11' : '20,184,166'},0.15)` : '#1c1917',
                            border: `1.5px solid ${selected ? scoreColor : '#2c2826'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700, color: selected ? scoreColor : '#57534e',
                          }}>
                            {row.score}
                          </div>
                          <p style={{ fontSize: '14px', color: selected ? '#ffffff' : '#a8a29e', lineHeight: 1.55, flex: 1 }}>
                            {row.desc}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep('email')}
              disabled={!allSelected}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                background: allSelected ? '#14b8a6' : '#1c1917',
                color: allSelected ? '#0c0a09' : '#57534e',
                fontSize: '15px', fontWeight: 700, cursor: allSelected ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
              }}
            >
              {allSelected ? 'See My Result' : `Complete all ${SECTIONS.length} sections to continue`}
            </button>
          </>
        )}

        {/* ─── EMAIL STEP ─── */}
        {step === 'email' && (
          <>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ width: '32px', height: '3px', background: '#14b8a6', marginBottom: '20px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '12px' }}>
                Where should we send your result?
              </h2>
              <p style={{ fontSize: '15px', color: '#a8a29e', lineHeight: 1.6 }}>
                Your body state and what it means for your training and fat loss.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#a8a29e', fontWeight: 500, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Kade"
                  style={{
                    width: '100%', padding: '14px 16px', background: '#111110',
                    border: '1.5px solid #1c1917', borderRadius: '10px',
                    color: 'white', fontSize: '15px', outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#a8a29e', fontWeight: 500, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  onKeyDown={e => e.key === 'Enter' && submitEmail()}
                  style={{
                    width: '100%', padding: '14px 16px', background: '#111110',
                    border: '1.5px solid #1c1917', borderRadius: '10px',
                    color: 'white', fontSize: '15px', outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {error && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '16px' }}>{error}</p>}

            <button
              onClick={submitEmail}
              disabled={submitting || !firstName.trim() || !email.trim()}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                background: '#14b8a6', color: '#0c0a09',
                fontSize: '15px', fontWeight: 700,
                cursor: submitting || !firstName.trim() || !email.trim() ? 'not-allowed' : 'pointer',
                opacity: submitting || !firstName.trim() || !email.trim() ? 0.6 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {submitting ? 'Loading...' : 'Show My Result'}
            </button>

            <p style={{ fontSize: '12px', color: '#57534e', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
              No spam. Your result is shown instantly. You can unsubscribe any time.
            </p>

            <button
              onClick={() => setStep('scoring')}
              style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#57534e', fontSize: '13px', cursor: 'pointer' }}
            >
              Go back
            </button>
          </>
        )}

        {/* ─── RESULT STEP ─── */}
        {step === 'result' && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ width: '32px', height: '3px', background: result.color, marginBottom: '20px' }} />
              <p style={{ fontSize: '13px', color: '#a8a29e', marginBottom: '8px' }}>
                {firstName}, your score is
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '64px', fontWeight: 900, color: result.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{total}</span>
                <span style={{ fontSize: '20px', color: '#57534e', fontWeight: 600 }}>/ 15</span>
              </div>
              <div style={{
                display: 'inline-block', padding: '6px 16px', borderRadius: '99px',
                background: result.bg, border: `1px solid ${result.border}`,
                fontSize: '13px', fontWeight: 700, color: result.color, marginBottom: '24px',
              }}>
                {result.label}
              </div>
              <p style={{ fontSize: '15px', color: '#d4cfc9', lineHeight: 1.7 }}>{result.desc}</p>
            </div>

            {/* Score breakdown */}
            <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Your scores</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SECTIONS.map(section => {
                  const s = scores[section.number]
                  const c = s === 1 ? '#ef4444' : s === 2 ? '#f59e0b' : '#14b8a6'
                  return (
                    <div key={section.number} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#a8a29e' }}>{section.title}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3].map(n => (
                          <div key={n} style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: n === s ? `rgba(${s === 1 ? '239,68,68' : s === 2 ? '245,158,11' : '20,184,166'},0.15)` : '#1c1917',
                            border: `1.5px solid ${n === s ? c : '#2c2826'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: 700, color: n === s ? c : '#3c3835',
                          }}>
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: '#0d2d29', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '14px', padding: '28px 28px 24px' }}>
              {source === 'founder' ? (
                <>
                  <p style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.3 }}>
                    You now know which state your body is in.
                  </p>
                  <p style={{ fontSize: '14px', color: '#99d6d0', lineHeight: 1.7, marginBottom: '24px' }}>
                    That is the starting point. The Founding Client Program builds on it. Complete the application and your body state will be on file before we speak.
                  </p>
                  <a
                    href="https://performance.bodyrecode.au/check-in?source=founder_program"
                    style={{
                      display: 'block', width: '100%', padding: '16px', borderRadius: '10px',
                      background: '#14b8a6', color: '#0c0a09',
                      fontSize: '15px', fontWeight: 700, textAlign: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    Apply for the Founding Client Program
                  </a>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.3 }}>
                    Whatever your score, the next step is the same.
                  </p>
                  <p style={{ fontSize: '14px', color: '#99d6d0', lineHeight: 1.7, marginBottom: '24px' }}>
                    Run your Performance Check-In. It takes 3 minutes, it is free, and it tells you exactly what your body needs right now based on how you are actually functioning.
                  </p>
                  <a
                    href="/performance-check-in"
                    style={{
                      display: 'block', width: '100%', padding: '16px', borderRadius: '10px',
                      background: '#14b8a6', color: '#0c0a09',
                      fontSize: '15px', fontWeight: 700, textAlign: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    Run your Performance Check-In
                  </a>
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
