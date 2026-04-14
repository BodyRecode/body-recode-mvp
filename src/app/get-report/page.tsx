'use client'

import { useState } from 'react'

export default function GetReportPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/scorecard-report/checkout-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '480px', width: '100%', padding: '40px 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <img src="/logo-teal.png" alt="Body Recode" style={{ height: '80px', marginBottom: '48px', display: 'block', margin: '0 auto 48px' }} />
          <div style={{ width: '32px', height: '3px', background: '#14b8a6', margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '12px' }}>
            Body Decode Report
          </h1>
          <p style={{ fontSize: '15px', color: '#a8a29e', lineHeight: 1.7 }}>
            A personalised written breakdown of your Body State Scorecard result. What is working against you right now, and exactly what to stop and start doing.
          </p>
        </div>

        <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'What your body state means biologically',
              'The specific drivers behind your current result',
              'What is making fat loss or performance harder right now',
              'What needs to change first and why',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '5px', height: '5px', background: '#14b8a6', borderRadius: '50%', marginTop: '8px', flexShrink: 0 }} />
                <p style={{ fontSize: '14px', color: '#a8a29e', lineHeight: 1.6, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '14px', padding: '28px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#57534e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
            $37 AUD
          </p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '20px' }}>
            Enter the email you used for your scorecard to get your report.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              style={{
                width: '100%', padding: '14px 16px', background: '#0c0a09',
                border: '1.5px solid #1c1917', borderRadius: '10px',
                color: 'white', fontSize: '15px', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: '100%', padding: '16px', borderRadius: '10px', border: 'none',
                background: loading || !email.trim() ? '#1c1917' : '#14b8a6',
                color: loading || !email.trim() ? '#57534e' : '#0c0a09',
                fontSize: '15px', fontWeight: 700, cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {loading ? 'Loading...' : 'Get my Body Decode Report — $37'}
            </button>
          </form>
          <p style={{ fontSize: '12px', color: '#57534e', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
            Delivered to your inbox within minutes of payment.
          </p>
        </div>

        <p style={{ fontSize: '13px', color: '#3c3835', textAlign: 'center', marginTop: '24px' }}>
          Have not completed the scorecard yet?{' '}
          <a href="https://performance.bodyrecode.au/scorecard" style={{ color: '#57534e', textDecoration: 'underline' }}>
            Take it here first.
          </a>
        </p>

      </div>
    </div>
  )
}
