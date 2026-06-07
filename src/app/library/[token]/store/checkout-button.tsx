'use client'

import { useState } from 'react'

export default function BoltOnCheckoutButton({
  productId,
  email,
  source,
}: {
  productId: string
  email: string
  source: string
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/digital-assets/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, email, source }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to start checkout.')
        setSubmitting(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error - try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ textAlign: 'right' }}>
      <button
        onClick={handleClick}
        disabled={submitting}
        style={{
          padding: '10px 16px', borderRadius: '8px', border: 'none',
          background: submitting ? '#999999' : '#1B6DFC',
          color: '#FFFFFF', fontSize: '13px', fontWeight: 800,
          cursor: submitting ? 'wait' : 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {submitting ? 'Loading...' : 'Add  →'}
      </button>
      {error && (
        <p style={{ fontSize: '11px', color: '#DC2626', margin: '6px 0 0' }}>{error}</p>
      )}
    </div>
  )
}
