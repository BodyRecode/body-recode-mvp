'use client'

import { useState } from 'react'

interface Props {
  challengeEnrollmentId: string
  leadId?: string | null
  firstName?: string | null
  lastInitial?: string | null
}

/**
 * Day 14 in-portal feedback capture. Renders below the Body Decode Report on
 * the /challenge/[token]/day-14 portal page (PEAK satisfaction / reflection
 * moment - just after pattern reveal).
 *
 * Two-step:
 *   1. NPS-style "Would you recommend to someone like you?" (0-10)
 *   2. Free-text "What specifically clicked?" prompt
 *
 * Submission triggers a captureFeedback call with permission_status=pending;
 * a separate Inngest job fires the consent email ~24h later.
 */
export function FeedbackDay14Card({ challengeEnrollmentId, leadId, firstName, lastInitial }: Props) {
  const [score, setScore] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (score === null) {
      setError('Please pick a number from 0-10.')
      return
    }
    setStatus('submitting')
    setError(null)
    try {
      const r = await fetch('/api/feedback/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'challenge',
          moment: 'day14_report',
          source: 'challenge_portal_day14',
          challengeEnrollmentId,
          leadId: leadId ?? null,
          firstName: firstName ?? null,
          lastInitial: lastInitial ?? null,
          npsScore: score,
          responseText: text.trim() || null,
        }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        setError(d.message ?? d.error ?? 'Submit failed.')
        setStatus('error')
        return
      }
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '28px 24px', textAlign: 'center', marginTop: 24 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8, letterSpacing: '-0.015em' }}>Thank you.</p>
        <p style={{ fontSize: 14, color: '#A8A29A', lineHeight: 1.55, margin: 0 }}>
          {text.trim().length > 0
            ? 'If you said anything we could share publicly, we will email you in the next day or two to ask permission first.'
            : 'Your score is recorded. Use it well.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '28px 24px', marginTop: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: '#7BB3FF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>One quick read on us</p>
      <h3 style={{ fontSize: 19, fontWeight: 800, color: 'white', marginBottom: 6, letterSpacing: '-0.02em', lineHeight: 1.25 }}>Would you recommend this read to someone like you?</h3>
      <p style={{ fontSize: 13, color: '#A8A29A', marginBottom: 16, lineHeight: 1.55 }}>0 = definitely not. 10 = absolutely. Pick the number that fits.</p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {Array.from({ length: 11 }, (_, n) => (
          <button key={n} onClick={() => setScore(n)} style={{
            minWidth: 38, padding: '8px 0', borderRadius: 8,
            background: score === n ? '#1B6DFC' : 'rgba(255,255,255,0.06)',
            color: score === n ? 'white' : '#A8A29A',
            border: `1px solid ${score === n ? '#1B6DFC' : 'rgba(255,255,255,0.15)'}`,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>{n}</button>
        ))}
      </div>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 6 }}>
        Optional: what specifically clicked?
      </label>
      <p style={{ fontSize: 12, color: '#A8A29A', marginBottom: 8, lineHeight: 1.5 }}>One or two sentences is fine. We will ask permission before sharing anything publicly.</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="The part where..."
        maxLength={500}
        rows={3}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', color: 'white',
          border: '1px solid rgba(255,255,255,0.15)', fontSize: 14,
          fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          lineHeight: 1.55,
        }}
      />
      <p style={{ fontSize: 11, color: '#6B6762', textAlign: 'right', margin: '4px 2px 14px' }}>{text.length}/500</p>

      {error && <p style={{ fontSize: 13, color: '#FCA5A5', marginBottom: 12 }}>{error}</p>}

      <button
        onClick={submit}
        disabled={status === 'submitting' || score === null}
        style={{
          width: '100%', padding: 14, borderRadius: 10, border: 'none',
          background: status === 'submitting' || score === null ? 'rgba(27,109,252,0.4)' : '#1B6DFC',
          color: 'white', fontSize: 15, fontWeight: 700, letterSpacing: '0.01em',
          cursor: status === 'submitting' || score === null ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'submitting' ? 'Submitting...' : 'Send'}
      </button>
    </div>
  )
}
