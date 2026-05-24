'use client'

import { useState, Suspense, useEffect } from 'react'
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
    color: '#DC2626',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.2)',
    desc: 'Your body is in protection mode. Cortisol is elevated, metabolism is suppressed, and your biology is actively resisting fat loss and performance gains. Pushing harder with more training and less food will make this worse. Your body needs to be brought out of this state first. Prescription without interpretation is the reason you\'re stuck.',
  },
  {
    range: '9 to 11',
    label: 'Transitioning State',
    color: '#B7791F',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    desc: 'Mixed signals. Your body has capacity but it\'s not consistent. Something is limiting your response: sleep, stress, recovery, or a mismatch between your training load and your current biological state. You\'re close, but you need to identify the specific bottleneck before adding more input.',
  },
  {
    range: '12 to 15',
    label: 'Ready State',
    color: '#1B6DFC',
    bg: 'rgba(27,109,252,0.06)',
    border: 'rgba(27,109,252,0.2)',
    desc: 'Your biology is in a position to respond. If fat loss or performance isn\'t happening at this score, the issue is in the prescription. Training, nutrition, or both need to be adjusted. You have the foundation. Now it needs to be optimised.',
  },
]

function getResult(total: number) {
  if (total <= 8) return RESULTS[0]
  if (total <= 11) return RESULTS[1]
  return RESULTS[2]
}

type Step = 'scoring' | 'email' | 'result'

type QualifierAnswer = 'A' | 'B' | 'C' | 'D'

const APPROACH_OPTIONS: { value: QualifierAnswer; label: string }[] = [
  { value: 'A', label: 'I look at what my body is doing and adjust' },
  { value: 'B', label: 'I give it more time and stay consistent' },
  { value: 'C', label: 'I push harder and expect it to break through' },
  { value: 'D', label: 'I get frustrated and want the program changed immediately' },
]

const INVESTMENT_OPTIONS: { value: QualifierAnswer; label: string }[] = [
  { value: 'A', label: 'Yes — ready to invest in 1-on-1 coaching now' },
  { value: 'B', label: 'Within the next 1-3 months' },
  { value: 'C', label: 'Just exploring for now' },
  { value: 'D', label: 'Looking for free resources only' },
]

function ReportUpsell({ firstName, email, score, bodyState, scores }: {
  firstName: string
  email: string
  score: number
  bodyState: string
  scores: Record<string, number>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePurchase() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/scorecard-report/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: firstName, email, score, body_state: bodyState, section_scores: scores }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E5E5',
      borderLeft: '3px solid #1B6DFC',
      borderRadius: '14px',
      padding: '28px 28px 24px',
      boxShadow: '0 1px 4px rgba(27, 109, 252, 0.06)',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>
        Body Decode Report · $37
      </p>
      <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.25 }}>
        Get the full breakdown of what this means for you.
      </p>
      <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '24px' }}>
        A written report covering your exact body state, what is specifically working against you right now, and what to stop and start doing. Delivered to your inbox instantly.
      </p>
      {error && <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '12px' }}>{error}</p>}
      <button
        onClick={handlePurchase}
        disabled={loading}
        style={{
          display: 'block', width: '100%', padding: '16px', borderRadius: '10px',
          background: '#1B6DFC', color: '#FFFFFF',
          fontSize: '15px', fontWeight: 800, textAlign: 'center',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontFamily: 'inherit',
        }}
      >
        {loading ? 'Loading...' : 'Get my Body Decode Report — $37'}
      </button>
    </div>
  )
}

function ScorecardInner() {
  const searchParams = useSearchParams()
  const source = searchParams.get('source') ?? 'other'

  const [scores, setScores] = useState<Record<string, number>>({})
  const [step, setStep] = useState<Step>('scoring')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [approach, setApproach] = useState<QualifierAnswer | null>(null)
  const [investment, setInvestment] = useState<QualifierAnswer | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const totalSelected = Object.keys(scores).length
  const allSelected = totalSelected === SECTIONS.length
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const result = getResult(total)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [step])

  function selectScore(sectionNumber: string, score: number) {
    setScores(s => ({ ...s, [sectionNumber]: score }))
  }

  const canSubmit = !!firstName.trim() && !!lastName.trim() && !!email.trim() && !!approach && !!investment

  async function submitEmail() {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/scorecard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          score: total,
          body_state: result.label,
          source,
          section_scores: scores,
          approach_response: approach,
          investment_readiness: investment,
        }),
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
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/logo-black.png" alt="Body Recode" style={{ height: '64px', width: 'auto', display: 'block' }} />
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px 80px', position: 'relative' }}>

        {/* ─── SCORING STEP ─── */}
        {step === 'scoring' && (
          <>
            {/* Hero — full /challenge landing-page DNA: glows + badge + founder byline + accent headline + stats */}
            <div style={{ position: 'relative', overflow: 'hidden', margin: '0 -24px 24px', padding: '0 24px' }}>
              <div style={{
                position: 'absolute', top: '-140px', right: '-140px',
                width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(27, 109, 252, 0.12) 0%, transparent 65%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', bottom: '0', left: '-100px',
                width: '340px', height: '340px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(27, 109, 252, 0.07) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', padding: '48px 0 24px' }}>

                {/* Badge pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.25)',
                  borderRadius: '99px', padding: '7px 16px', marginBottom: '20px',
                }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1B6DFC' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Body State Scorecard
                  </span>
                </div>

                {/* Founder byline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                  <img
                    src="https://bodyrecode.au/kade.jpg"
                    alt="Kade Dunstone"
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      objectFit: 'cover', objectPosition: 'top center',
                      border: '1px solid #E5E5E5', flexShrink: 0,
                    }}
                  />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.3 }}>
                      Built by Kade Dunstone
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.3 }}>
                      Human Movement Scientist · Business Entrepreneur · Body Recode Founder
                    </p>
                  </div>
                </div>

                {/* Headline — three distinct lines like the /challenge landing page */}
                <h1 style={{
                  fontSize: 'clamp(38px, 7vw, 56px)', fontWeight: 900,
                  letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 22px', color: '#1A1A1A',
                }}>
                  You&apos;re training.
                  <br />
                  You&apos;re eating clean.
                  <br />
                  <span style={{ color: '#1B6DFC' }}>The fat won&apos;t move.</span>
                </h1>

                {/* Divider line */}
                <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '28px' }} />

                {/* Lead paragraphs */}
                <p style={{ fontSize: '18px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '12px' }}>
                  Most people assess fat loss by effort. But effort can stay high while your body shifts into protection mode and resists fat loss by design.
                </p>
                <p style={{ fontSize: '18px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '32px' }}>
                  This scorecard reads your body first. In 2 minutes you know which state you&apos;re in, and what specifically is working against you.
                </p>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  {[
                    { value: '5', label: 'Sections' },
                    { value: '2 min', label: 'To complete' },
                    { value: 'Free', label: 'Instant result' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: '#FFFFFF', border: '1px solid #E5E5E5',
                      borderRadius: '12px', padding: '16px',
                      textAlign: 'center',
                    }}>
                      <p style={{ fontSize: '22px', fontWeight: 900, color: '#1B6DFC', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                      <p style={{ fontSize: '11px', color: '#6B6B6B', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#3A3A3A' }}>{totalSelected} of {SECTIONS.length} sections complete</span>
                <span style={{ fontSize: '12px', color: '#3A3A3A' }}>{Math.round((totalSelected / SECTIONS.length) * 100)}%</span>
              </div>
              <div style={{ height: '3px', background: '#E5E5E5', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#1B6DFC', borderRadius: '99px', width: `${(totalSelected / SECTIONS.length) * 100}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
              {SECTIONS.map(section => (
                <div key={section.number}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{section.number}</span>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.01em', color: '#1A1A1A', margin: 0 }}>{section.title}</h2>
                    {scores[section.number] && (
                      <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#1056D6' }}>
                        {scores[section.number]} / 3
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {section.rows.map(row => {
                      const selected = scores[section.number] === row.score
                      // Score 1 = red (Depleted-ish), 2 = amber (Transitioning), 3 = Signal Blue (Ready)
                      const scoreColor = row.score === 1 ? '#DC2626' : row.score === 2 ? '#B7791F' : '#1056D6'
                      const accentRgba = row.score === 1 ? '239,68,68' : row.score === 2 ? '245,158,11' : '27,109,252'
                      return (
                        <button
                          key={row.score}
                          onClick={() => selectScore(section.number, row.score)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '14px',
                            background: selected ? `rgba(${accentRgba},0.10)` : '#FFFFFF',
                            border: `1.5px solid ${selected ? scoreColor : '#E5E5E5'}`,
                            borderRadius: '12px', padding: '14px 16px',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                            transition: 'all 0.15s ease',
                            fontFamily: 'inherit',
                          }}
                        >
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                            background: selected ? `rgba(${accentRgba},0.18)` : '#F5F5F5',
                            border: `1.5px solid ${selected ? scoreColor : '#D4D4D4'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 800, color: selected ? scoreColor : '#6B6B6B',
                          }}>
                            {row.score}
                          </div>
                          <p style={{
                            fontSize: '14px',
                            color: selected ? scoreColor : '#3A3A3A',
                            fontWeight: selected ? 600 : 500,
                            lineHeight: 1.6, flex: 1, margin: 0,
                          }}>
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
                background: allSelected ? '#1B6DFC' : '#E5E5E5',
                color: allSelected ? '#FFFFFF' : '#999999',
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
            <div style={{ marginBottom: '32px', padding: '40px 0 0' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Almost there
              </p>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 34px)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, color: '#1A1A1A', margin: '0 0 16px' }}>
                Where should we send your result?
              </h2>
              <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '20px' }} />
              <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
                Your body state and what it means for your training and fat loss.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#4A4A4A', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Kade"
                    style={{
                      width: '100%', padding: '14px 16px', background: '#FFFFFF',
                      border: '1.5px solid #D4D4D4', borderRadius: '10px',
                      color: '#1A1A1A', fontSize: '15px', outline: 'none',
                      fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#4A4A4A', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Dunstone"
                    style={{
                      width: '100%', padding: '14px 16px', background: '#FFFFFF',
                      border: '1.5px solid #D4D4D4', borderRadius: '10px',
                      color: '#1A1A1A', fontSize: '15px', outline: 'none',
                      fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#4A4A4A', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  style={{
                    width: '100%', padding: '14px 16px', background: '#FFFFFF',
                    border: '1.5px solid #D4D4D4', borderRadius: '10px',
                    color: '#1A1A1A', fontSize: '15px', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>06</p>
              <h3 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.01em', color: '#1A1A1A', marginBottom: '14px', lineHeight: 1.35 }}>
                When your training or nutrition stops producing results, what is your honest first response?
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {APPROACH_OPTIONS.map(opt => {
                  const selected = approach === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setApproach(opt.value)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '14px',
                        background: selected ? 'rgba(27,109,252,0.10)' : '#FFFFFF',
                        border: `1.5px solid ${selected ? '#1B6DFC' : '#E5E5E5'}`,
                        borderRadius: '12px', padding: '14px 16px',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: selected ? 'rgba(27,109,252,0.18)' : '#F5F5F5',
                        border: `1.5px solid ${selected ? '#1B6DFC' : '#D4D4D4'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 800, color: selected ? '#1056D6' : '#6B6B6B',
                      }}>
                        {opt.value}
                      </div>
                      <p style={{
                        fontSize: '14px',
                        color: selected ? '#1056D6' : '#3A3A3A',
                        fontWeight: selected ? 600 : 500,
                        lineHeight: 1.55, flex: 1, margin: 0,
                      }}>
                        {opt.label}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>07</p>
              <h3 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.01em', color: '#1A1A1A', marginBottom: '14px', lineHeight: 1.35 }}>
                If the scorecard identifies what is blocking your progress, are you in a position to invest in addressing it?
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {INVESTMENT_OPTIONS.map(opt => {
                  const selected = investment === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setInvestment(opt.value)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '14px',
                        background: selected ? 'rgba(27,109,252,0.10)' : '#FFFFFF',
                        border: `1.5px solid ${selected ? '#1B6DFC' : '#E5E5E5'}`,
                        borderRadius: '12px', padding: '14px 16px',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: selected ? 'rgba(27,109,252,0.18)' : '#F5F5F5',
                        border: `1.5px solid ${selected ? '#1B6DFC' : '#D4D4D4'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 800, color: selected ? '#1056D6' : '#6B6B6B',
                      }}>
                        {opt.value}
                      </div>
                      <p style={{
                        fontSize: '14px',
                        color: selected ? '#1056D6' : '#3A3A3A',
                        fontWeight: selected ? 600 : 500,
                        lineHeight: 1.55, flex: 1, margin: 0,
                      }}>
                        {opt.label}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>{error}</p>}

            <button
              onClick={submitEmail}
              disabled={submitting || !canSubmit}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                background: canSubmit ? '#1B6DFC' : '#E5E5E5',
                color: canSubmit ? '#FFFFFF' : '#999999',
                fontSize: '15px', fontWeight: 700,
                cursor: submitting || !canSubmit ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {submitting ? 'Loading...' : 'Show My Result'}
            </button>

            <p style={{ fontSize: '12px', color: '#999999', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
              No spam. Your result is shown instantly. You can unsubscribe any time.
            </p>

            <button
              onClick={() => setStep('scoring')}
              style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#999999', fontSize: '13px', cursor: 'pointer' }}
            >
              Go back
            </button>
          </>
        )}

        {/* ─── RESULT STEP ─── */}
        {step === 'result' && (
          <>
            <div style={{ marginBottom: '32px', padding: '40px 0 0' }}>
              <div style={{ width: '48px', height: '3px', background: result.color, borderRadius: '2px', marginBottom: '20px' }} />
              <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '8px' }}>
                {firstName}, your score is
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '64px', fontWeight: 900, color: result.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{total}</span>
                <span style={{ fontSize: '20px', color: '#6B6B6B', fontWeight: 600 }}>/ 15</span>
              </div>
              <div style={{
                display: 'inline-block', padding: '6px 16px', borderRadius: '99px',
                background: result.bg, border: `1px solid ${result.border}`,
                fontSize: '13px', fontWeight: 700, color: result.color, marginBottom: '24px',
              }}>
                {result.label}
              </div>
              <p style={{ fontSize: '16px', color: '#3A3A3A', lineHeight: 1.7 }}>{result.desc}</p>
            </div>

            {/* Score breakdown */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>Your scores</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SECTIONS.map(section => {
                  const s = scores[section.number]
                  const c = s === 1 ? '#DC2626' : s === 2 ? '#B7791F' : '#1056D6'
                  const accentRgba = s === 1 ? '239,68,68' : s === 2 ? '245,158,11' : '27,109,252'
                  return (
                    <div key={section.number} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 600 }}>{section.title}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3].map(n => (
                          <div key={n} style={{
                            width: '26px', height: '26px', borderRadius: '50%',
                            background: n === s ? `rgba(${accentRgba},0.18)` : '#F5F5F5',
                            border: `1.5px solid ${n === s ? c : '#D4D4D4'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 800, color: n === s ? c : '#6B6B6B',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Primary: Body Decode Report */}
              <ReportUpsell
                firstName={firstName}
                email={email}
                score={total}
                bodyState={result.label}
                scores={scores}
              />

              {/* Secondary: Book a call */}
              <div style={{
                background: '#F7F7F7',
                border: '1px solid #E5E5E5',
                borderRadius: '14px',
                padding: '24px 28px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 8px' }}>
                  Or talk it through
                </p>
                <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.01em', marginBottom: '8px', lineHeight: 1.25 }}>
                  Want to talk through your result?
                </p>
                <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, marginBottom: '20px' }}>
                  Free 30-minute call. We go through exactly what is driving your situation and map out what needs to change first. No pitch.
                </p>
                <a
                  href="https://bodyrecode.au/book"
                  style={{
                    display: 'block', width: '100%', padding: '14px', borderRadius: '10px',
                    background: '#FFFFFF', color: '#1056D6',
                    fontSize: '14px', fontWeight: 800, textAlign: 'center',
                    textDecoration: 'none', border: '1.5px solid rgba(27,109,252,0.4)',
                  }}
                >
                  Book a free call
                </a>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default function ScorecardPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FFFFFF' }} />}>
      <ScorecardInner />
    </Suspense>
  )
}
