'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PHASES = [
  {
    number: '01',
    name: 'Regulate',
    weeks: 'Weeks 1-2',
    description: 'Re-establish biological rhythm. Structure your sleep, eating, and training patterns to lower system noise and create a stable foundation for adaptation.',
    colour: '#14b8a6',
  },
  {
    number: '02',
    name: 'Adapt',
    weeks: 'Weeks 3-4',
    description: 'Apply progressive load against a stabilised system. This is where the biological shift happens — energy, strength, and body composition all begin to move.',
    colour: '#14b8a6',
  },
  {
    number: '03',
    name: 'Embed',
    weeks: 'Weeks 5-6',
    description: 'Lock in the new baseline. Refine movement quality, consolidate recovery habits, and prepare for the next stage — the Body Rebuild Membership.',
    colour: '#14b8a6',
  },
]

const PATTERNS = [
  { name: 'Stress-Stored', colour: '#ef4444', driver: 'Cortisol and adrenaline' },
  { name: 'Metabolic-Drift', colour: '#f59e0b', driver: 'Insulin and blood sugar timing' },
  { name: 'Hormonal-Shift', colour: '#8b5cf6', driver: 'Reproductive hormone signalling' },
  { name: 'System-Overload', colour: '#14b8a6', driver: 'Nervous system load' },
]

const INCLUDES = [
  { title: 'Pattern-specific programme', desc: 'Training and nutrition built around your biological pattern, not a generic template.' },
  { title: '6-week training blueprint', desc: 'Progressive sessions across three phases. Moderate intensity that drives adaptation without spiking the wrong hormones.' },
  { title: 'HABS nutrition framework', desc: 'The same nutrition structure used in 1:1 coaching. Simplified, sustainable, pattern-aligned.' },
  { title: '5 biology education lessons', desc: 'Understand what is driving your pattern and why the programme is structured the way it is.' },
  { title: 'Weekly coaching notes', desc: 'A coaching note each week that speaks directly to your pattern and what to focus on.' },
  { title: 'Weekly check-in form', desc: 'In-platform progress tracking across 8 biological markers. See what is shifting and what still needs work.' },
  { title: 'Midpoint reflection', desc: 'A structured review at Week 3 to assess progress and recalibrate if needed.' },
  { title: 'Ascension path', desc: 'Week 6 bridges directly to the Body Rebuild Membership — the next stage of the system.' },
]

export default function BlueprintPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/blueprint/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (data.url) {
        router.push(data.url)
      } else {
        setError('Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fafaf9', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #e7e5e4', padding: '20px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <img src="https://bodyrecode.au/logo-dark.png" width={120} alt="Body Recode" />
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: '#0c0a09', padding: '80px 24px 72px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#14b8a620', border: '1px solid #14b8a640', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Stage 2 — Rewire</span>
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', margin: '0 0 20px', lineHeight: 1.15 }}>
            6-Week Body Rewire Blueprint
          </h1>
          <p style={{ fontSize: 18, color: '#a8a29e', lineHeight: 1.75, margin: '0 0 40px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            A structured 6-week programme built around your biological pattern. Not a generic plan. Built for exactly what your body is doing and why.
          </p>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Duration', value: '6 Weeks' },
              { label: 'Price', value: '$97 AUD' },
              { label: 'Access', value: 'Instant' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

        {/* Pattern section */}
        <div style={{ padding: '64px 0 48px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1c1917', margin: '0 0 12px' }}>Built around your pattern</h2>
          <p style={{ fontSize: 16, color: '#78716c', margin: '0 0 36px', lineHeight: 1.75, maxWidth: 600 }}>
            Your Body Decode Check-In identified which of four biological patterns is most active in your body. The Rewire Blueprint picks up exactly where the challenge left off.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {PATTERNS.map(p => (
              <div key={p.name} style={{ background: '#fff', border: `1px solid #e7e5e4`, borderTop: `3px solid ${p.colour}`, borderRadius: 10, padding: '20px 20px 18px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1c1917', marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: '#78716c' }}>{p.driver}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#a8a29e', marginTop: 16 }}>
            If you are joining directly without completing the challenge, a short 2-question pattern assessment runs before your portal opens.
          </p>
        </div>

        {/* Phases */}
        <div style={{ padding: '0 0 64px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1c1917', margin: '0 0 36px' }}>Three phases. One system.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {PHASES.map(phase => (
              <div key={phase.name} style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, padding: '28px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{phase.weeks}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: '#d4d0cc', fontWeight: 700 }}>{phase.number}</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#1c1917' }}>{phase.name}</span>
                </div>
                <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.7, margin: 0 }}>{phase.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Includes */}
        <div style={{ padding: '0 0 64px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1c1917', margin: '0 0 36px' }}>What is included</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
            {INCLUDES.map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 14, background: '#fff', border: '1px solid #e7e5e4', borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#14b8a620', border: '1px solid #14b8a640', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#14b8a6" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: '#78716c', lineHeight: 1.65 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signup form */}
        <div style={{ padding: '0 0 80px' }}>
          <div style={{ background: '#0c0a09', borderRadius: 16, padding: '48px 40px', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Start the Rewire</h2>
            <p style={{ fontSize: 14, color: '#78716c', margin: '0 0 32px' }}>$97 AUD. One-time. Instant access.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ padding: '14px 16px', background: '#1c1917', border: '1px solid #292524', borderRadius: 8, color: '#fff', fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ padding: '14px 16px', background: '#1c1917', border: '1px solid #292524', borderRadius: 8, color: '#fff', fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
              {error && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '15px', background: '#14b8a6', color: '#0c0a09', fontWeight: 700, fontSize: 15, borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Redirecting...' : 'Get instant access — $97'}
              </button>
            </form>
            <p style={{ fontSize: 12, color: '#57534e', margin: '20px 0 0' }}>
              Secure checkout via Stripe. You will be redirected to complete payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
