'use client'

import { useEffect, useState, use as usePromise } from 'react'

interface EnrollmentPreview {
  id: string
  firstName: string | null
  lastInitial: string | null
  leadId: string | null
}

export default function ChallengeChurnFeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = usePromise(params)
  const [enrollment, setEnrollment] = useState<EnrollmentPreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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
    if (text.trim().length < 10) {
      setError('Please write at least a short sentence.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/feedback/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'churn',
          moment: 'challenge_non_completion',
          source: 'day14_fallback_email',
          challengeEnrollmentId: enrollment?.id ?? null,
          leadId: enrollment?.leadId ?? null,
          firstName: enrollment?.firstName ?? null,
          lastInitial: enrollment?.lastInitial ?? null,
          responseText: text.trim(),
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
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', marginBottom: 12, letterSpacing: '-0.02em' }}>Thank you for being honest{enrollment.firstName ? `, ${enrollment.firstName}` : ''}.</h1>
      <p style={{ color: '#3A3A3A', lineHeight: 1.6 }}>What you said does the heavy lifting for the next person. It will not be shared publicly without us asking permission separately.</p>
    </div></div>
  }

  return <div style={wrapStyle}><div style={cardStyle}>
    <p style={{ color: '#6B6B6B', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>30 seconds · honest</p>
    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.25 }}>What got in the way?</h1>
    <p style={{ color: '#3A3A3A', lineHeight: 1.6, marginBottom: 20 }}>You started the 14-Day Body Decode and did not complete the Check-In. No judgement - life moves. The single most useful thing for the next person is hearing what tripped you up.</p>

    <p style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>In a sentence or two:</p>
    <textarea
      value={text}
      onChange={e => setText(e.target.value)}
      placeholder="The week got away from me when..."
      maxLength={600}
      rows={5}
      style={{
        width: '100%', padding: '12px 14px', borderRadius: 10,
        background: 'white', color: '#1A1A1A',
        border: '1px solid #D4D4D4', fontSize: 14,
        fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
        lineHeight: 1.55,
      }}
    />
    <p style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'right', margin: '4px 2px 16px' }}>{text.length}/600</p>

    {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

    <button
      onClick={submit}
      disabled={submitting || text.trim().length < 10}
      style={{
        width: '100%', padding: 14, borderRadius: 10, border: 'none',
        background: submitting || text.trim().length < 10 ? 'rgba(27,109,252,0.4)' : '#1B6DFC',
        color: 'white', fontSize: 15, fontWeight: 700,
        cursor: submitting || text.trim().length < 10 ? 'not-allowed' : 'pointer',
      }}
    >
      {submitting ? 'Submitting...' : 'Send'}
    </button>

    <p style={{ color: '#6B6B6B', fontSize: 12, lineHeight: 1.5, marginTop: 16 }}>If you would like a Kade-personally response, just reply to the email instead. He reads them all.</p>
  </div></div>
}
