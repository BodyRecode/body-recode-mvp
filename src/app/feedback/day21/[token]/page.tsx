'use client'

import { useEffect, useState, use as usePromise } from 'react'

interface EnrollmentPreview {
  id: string
  firstName: string | null
  lastInitial: string | null
  leadId: string | null
}

export default function Day21FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = usePromise(params)
  const [enrollment, setEnrollment] = useState<EnrollmentPreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nps, setNps] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/feedback/day21-enrollment/${token}`).then(async r => {
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        setLoadError(d.error ?? 'Could not load.')
      } else {
        setEnrollment(await r.json())
      }
      setLoading(false)
    }).catch(e => {
      setLoadError(e instanceof Error ? e.message : 'Network error')
      setLoading(false)
    })
  }, [token])

  async function submit() {
    if (nps === null) {
      setError('Please pick a number from 0-10.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/feedback/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'challenge',
          moment: 'day21_email',
          source: 'day21_feedback_email',
          challengeEnrollmentId: enrollment?.id ?? null,
          leadId: enrollment?.leadId ?? null,
          firstName: enrollment?.firstName ?? null,
          lastInitial: enrollment?.lastInitial ?? null,
          npsScore: nps,
          responseText: text.trim() || null,
        }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        setError(d.message ?? d.error ?? 'Submit failed.')
        setSubmitting(false)
        return
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
      setSubmitting(false)
    }
  }

  const wrapStyle: React.CSSProperties = { minHeight: '100vh', background: '#FAFAFA', padding: '60px 24px', fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif' }
  const cardStyle: React.CSSProperties = { maxWidth: 580, margin: '0 auto', background: 'white', border: '1px solid #E5E5E5', borderRadius: 16, padding: '40px 32px' }

  if (loading) return <div style={wrapStyle}><div style={cardStyle}><p style={{ color: '#6B6B6B' }}>Loading...</p></div></div>
  if (loadError) return <div style={wrapStyle}><div style={cardStyle}><p style={{ color: '#dc2626' }}>{loadError}</p></div></div>
  if (!enrollment) return null

  if (done) {
    return <div style={wrapStyle}><div style={cardStyle}>
      <p style={{ color: '#1B6DFC', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Got it</p>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', marginBottom: 12, letterSpacing: '-0.02em' }}>Thank you, {enrollment.firstName ?? 'there'}.</h1>
      <p style={{ color: '#3A3A3A', lineHeight: 1.6, marginBottom: 8 }}>
        {text.trim().length > 0
          ? 'If what you said could work as a testimonial, we will email you in a day or two to ask permission first. You decide how it gets attributed.'
          : 'Your score is recorded. It helps us calibrate the engine for the next person.'}
      </p>
    </div></div>
  }

  return <div style={wrapStyle}><div style={cardStyle}>
    <p style={{ color: '#1B6DFC', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Day 21 feedback · 30 seconds</p>
    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A', marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
      How did the 14 days land?
    </h1>
    <p style={{ color: '#3A3A3A', lineHeight: 1.6, marginBottom: 24 }}>A week on, you have more honest read than you did at Day 14. Pick a number, optionally write one sentence.</p>

    <p style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Would you recommend this to someone like you?</p>
    <p style={{ color: '#6B6B6B', fontSize: 13, marginBottom: 12 }}>0 = definitely not. 10 = absolutely.</p>

    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
      {Array.from({ length: 11 }, (_, n) => (
        <button key={n} onClick={() => setNps(n)} style={{
          minWidth: 42, padding: '10px 0', borderRadius: 8,
          background: nps === n ? '#1B6DFC' : '#FFFFFF',
          color: nps === n ? 'white' : '#1A1A1A',
          border: `1.5px solid ${nps === n ? '#1B6DFC' : '#D4D4D4'}`,
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>{n}</button>
      ))}
    </div>

    <p style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Optional: in a sentence, what is the one thing you would tell them?</p>
    <p style={{ color: '#6B6B6B', fontSize: 13, marginBottom: 8 }}>If you say something we could share publicly, we will email you separately to ask permission first.</p>
    <textarea
      value={text}
      onChange={e => setText(e.target.value)}
      placeholder="The part where..."
      maxLength={500}
      rows={3}
      style={{
        width: '100%', padding: '12px 14px', borderRadius: 10,
        background: 'white', color: '#1A1A1A',
        border: '1px solid #D4D4D4', fontSize: 14,
        fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
        lineHeight: 1.55,
      }}
    />
    <p style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'right', margin: '4px 2px 16px' }}>{text.length}/500</p>

    {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

    <button
      onClick={submit}
      disabled={submitting || nps === null}
      style={{
        width: '100%', padding: 14, borderRadius: 10, border: 'none',
        background: submitting || nps === null ? 'rgba(27,109,252,0.4)' : '#1B6DFC',
        color: 'white', fontSize: 15, fontWeight: 700,
        cursor: submitting || nps === null ? 'not-allowed' : 'pointer',
      }}
    >
      {submitting ? 'Submitting...' : 'Send'}
    </button>
  </div></div>
}
