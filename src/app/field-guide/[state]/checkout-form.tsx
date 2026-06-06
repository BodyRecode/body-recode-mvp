'use client'

import { useState } from 'react'

export default function FieldGuideCheckoutForm({
  productId,
  price,
  initialEmail,
  source,
  state,
}: {
  productId: string
  price: number
  initialEmail: string
  source: string
  state: string
}) {
  const [email, setEmail] = useState(initialEmail)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/digital-assets/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, email: email.trim(), source }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to start checkout.')
        setSubmitting(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error — try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #1B6DFC',
      borderRadius: '14px',
      padding: '28px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, #1B6DFC, #8b5cf6)',
      }} />

      <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
        Get the Guide
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '36px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.03em' }}>
          ${price}
        </span>
        <span style={{ fontSize: '14px', color: '#6B6B6B' }}>AUD · one-time · PDF + portal reader</span>
      </div>

      <p style={{ fontSize: '13px', color: '#6B6B6B', marginTop: 0, marginBottom: '24px', lineHeight: 1.6 }}>
        Instant delivery. Arrives in your inbox within minutes. No account creation required.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(null) }}
          placeholder="Your email"
          required
          disabled={submitting}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            padding: '12px 14px', marginBottom: '12px',
            background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: '8px',
            fontSize: '14px', color: '#1A1A1A',
            fontFamily: 'inherit',
          }}
        />

        {error && (
          <p style={{ fontSize: '12px', color: '#DC2626', margin: '0 0 12px' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            display: 'block', width: '100%',
            padding: '14px 22px', borderRadius: '10px', border: 'none',
            background: submitting ? '#999999' : '#1B6DFC',
            color: '#FFFFFF', fontSize: '15px', fontWeight: 800,
            cursor: submitting ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {submitting ? 'Redirecting to checkout...' : `Get the ${state.charAt(0).toUpperCase() + state.slice(1)} Field Guide — $${price}`}
        </button>
      </form>

      <p style={{ fontSize: '12px', color: '#999999', marginTop: '14px', marginBottom: 0, textAlign: 'center' }}>
        Secure checkout via Stripe.
      </p>
    </div>
  )
}
