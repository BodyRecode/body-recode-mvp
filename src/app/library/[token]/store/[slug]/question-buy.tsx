'use client'

/**
 * Question input + Add-to-checkout for the "A Question for Kade" deep-dive.
 *
 * Used ONLY when the product is bolt_on_ai + engine_call='member_question'.
 * Other bolt-ons use the simpler BoltOnCheckoutButton.
 *
 * Pre-purchase capture: the buyer writes their question here, hits Add,
 * the question rides through Stripe session.metadata.question, and the
 * webhook lifts it onto digital_asset_purchases.raw.question. The
 * orchestrator reads it from there.
 */

import { useState } from 'react'

const MAX_CHARS = 480 // Stripe metadata value limit is 500; leave headroom.
const MIN_CHARS = 8

export default function QuestionBuy({
  productId,
  email,
  source,
  price,
}: {
  productId: string
  email: string
  source: string
  price: number
}) {
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = question.trim()
  const ready = trimmed.length >= MIN_CHARS

  async function handleClick() {
    if (!ready) {
      setError('Write your question first (at least 8 characters).')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/digital-assets/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, email, source, question: trimmed }),
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
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
        Your question
      </label>
      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value.slice(0, MAX_CHARS))}
        maxLength={MAX_CHARS}
        placeholder="What is actually going on with your body right now? Be specific - the more concrete your question, the sharper the response."
        rows={6}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 10,
          padding: '14px 16px', fontSize: 15, lineHeight: 1.6,
          color: '#1A1A1A', resize: 'vertical', minHeight: 140,
          fontFamily: 'inherit',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: '#6B6B6B' }}>
          {trimmed.length}/{MAX_CHARS} characters
        </span>
        <span style={{ fontSize: 12, color: '#6B6B6B' }}>
          Delivered as a personalised PDF in your inbox, typically within 10 minutes.
        </span>
      </div>

      <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A' }}>
          ${price.toFixed(0)}
        </span>
        <button
          onClick={handleClick}
          disabled={submitting || !ready}
          style={{
            padding: '14px 28px', borderRadius: 10, border: 'none',
            background: submitting ? '#999999' : ready ? '#1B6DFC' : '#CCCCCC',
            color: '#FFFFFF', fontSize: 14, fontWeight: 800,
            cursor: submitting ? 'wait' : ready ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
          }}
        >
          {submitting ? 'Loading...' : 'Ask Kade  →'}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 12, color: '#DC2626', margin: '10px 0 0', textAlign: 'right' }}>{error}</p>
      )}
    </div>
  )
}
