'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

function CheckoutForm({ teal }: { teal?: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/extension/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim() }),
      })
      const data = await res.json()
      if (data.url) router.push(data.url)
      else { setError('Something went wrong. Please try again.'); setLoading(false) }
    } catch { setError('Something went wrong. Please try again.'); setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '15px 16px', borderRadius: '10px',
    border: teal ? '1px solid rgba(20,184,166,0.3)' : '1px solid #d6d3d1',
    background: teal ? 'rgba(255,255,255,0.7)' : '#ffffff',
    color: '#1c1917', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="text" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={inputStyle} />
        <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={inputStyle} />
      </div>
      {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>}
      <button type="submit" disabled={loading || !form.name.trim() || !form.email.trim()} style={{
        width: '100%', padding: '17px', borderRadius: '10px', border: 'none',
        background: loading ? 'rgba(20,184,166,0.6)' : '#14b8a6',
        color: '#ffffff', fontSize: '16px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxSizing: 'border-box',
      }}>
        {loading ? 'Redirecting to checkout...' : 'Get the Extension - $197 AUD'}
      </button>
      <p style={{ fontSize: '12px', color: '#a8a29e', textAlign: 'center', margin: 0 }}>Secure checkout via Stripe. One-time payment.</p>
    </form>
  )
}

const WHAT_YOU_GET = [
  { title: '12 weeks of progressive programming', desc: 'Block A (Consolidate, Weeks 1-6) followed by Block B (Advance, Weeks 7-12). Each block builds on the last. Same pattern-driven approach.' },
  { title: 'Pattern-specific training', desc: 'Same three-session structure. Gym, home with dumbbells, or bodyweight - all three equipment modes every session. Pattern rules carry forward from the Blueprint.' },
  { title: 'Nutrition precision layer', desc: 'Block A adds carb cycling, meal anchoring, and pattern-specific protocols. Block B introduces calorie periodisation.' },
  { title: 'Weekly check-in tracking', desc: '8 biological markers tracked every week. The same check-in system you used in the Blueprint.' },
  { title: 'Weekly coaching notes', desc: '12 weeks of pattern-specific coaching notes. What to focus on, what to expect, and where to push.' },
  { title: 'Pattern resource library', desc: 'Deep-dive guides for your biological pattern - supplement protocols, biology explanations, and lifestyle tools.' },
]

export default function ExtensionPage() {
  const formRef = useRef<HTMLDivElement>(null)
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', color: '#1c1917', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: '99px', padding: '7px 16px', marginBottom: '32px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#14b8a6' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>90-Day Body Rewire Extension</span>
        </div>

        <h1 style={{ fontSize: 'clamp(34px, 7vw, 50px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.08, color: '#1c1917', marginBottom: '24px' }}>
          Not ready for the membership.<br /><span style={{ color: '#14b8a6' }}>Keep going anyway.</span>
        </h1>

        <div style={{ width: '48px', height: '3px', background: '#14b8a6', borderRadius: '2px', marginBottom: '24px' }} />

        <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '14px' }}>
          The Blueprint built your foundation. But six weeks is not long enough to embed the changes permanently - especially when life interrupted along the way.
        </p>
        <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '40px' }}>
          The 90-Day Extension gives you 12 more weeks of progressive, pattern-specific programming - without the ongoing subscription commitment.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
          {[{ value: '12', label: 'Weeks' }, { value: '$197', label: 'One-time' }, { value: 'Day 1', label: 'Instant access' }].map(s => (
            <div key={s.label} style={{ background: '#ffffff', border: '1px solid #e7e5e0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: 900, color: '#14b8a6', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: '#a8a29e', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div ref={formRef}><CheckoutForm /></div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px 72px', borderTop: '1px solid #e7e5e0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '72px 0 12px' }}>What is included</p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '28px', color: '#1c1917' }}>Everything in your portal from Day 1.</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '48px' }}>
          {WHAT_YOU_GET.map((item, i) => (
            <div key={i} style={{ background: '#ffffff', border: '1px solid #e7e5e0', borderRadius: '12px', padding: '18px 20px', display: 'flex', gap: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px', fontWeight: 800, color: '#14b8a6' }}>{i + 1}</div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', marginBottom: '4px' }}>{item.title}</p>
                <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#f5f4f0', border: '1px solid #e7e5e0', borderRadius: '12px', padding: '24px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', marginBottom: '8px' }}>How it connects to the membership</p>
          <p style={{ fontSize: '14px', color: '#78716c', lineHeight: 1.7, margin: 0 }}>
            The Extension covers Blocks A and B. If you join the membership afterwards, you pick up at Block C - no repeated content, no backtracking. The Extension is a stepping stone, not a detour.
          </p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e7e5e0', padding: '28px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '13px', color: '#a8a29e', margin: 0 }}>&copy; {new Date().getFullYear()} Body Recode. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="/privacy" style={{ fontSize: '13px', color: '#78716c', textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" style={{ fontSize: '13px', color: '#78716c', textDecoration: 'none' }}>Terms</a>
            <a href="mailto:info@bodyrecode.au" style={{ fontSize: '13px', color: '#78716c', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </div>
    </div>
  )
}
