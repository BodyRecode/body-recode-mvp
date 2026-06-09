'use client'

/**
 * Generic free-text input + Add-to-checkout for engine-driven deep-dives.
 *
 * Used by any bolt_on_ai product where the buyer provides text before
 * purchase (member_question -> question, member_custom_block -> constraints,
 * future similar shapes). Configured per product via props.
 *
 * Pre-purchase capture flow:
 *   1. Buyer types in textarea
 *   2. Hits the action button
 *   3. POST /api/digital-assets/checkout with { question: trimmed } - we
 *      keep the field name 'question' on the wire because the webhook lifts
 *      it onto raw.question, and the orchestrator dispatches based on
 *      engine_call NOT the field name. The orchestrator reads raw.constraints
 *      OR raw.question for member_custom_block.
 *      Cleaner long-term: add `input_field` to the wire payload; not worth
 *      doing for two products today.
 */

import { useState } from 'react'

const MAX_CHARS = 480
const MIN_CHARS = 8

export default function InputBuy({
  productId,
  email,
  source,
  price,
  inputLabel,
  inputPlaceholder,
  buttonLabel,
  fieldName,
}: {
  productId: string
  email: string
  source: string
  price: number
  inputLabel: string
  inputPlaceholder: string
  buttonLabel: string
  /** 'question' for member_question, 'constraints' for member_custom_block. */
  fieldName: 'question' | 'constraints'
}) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = value.trim()
  const ready = trimmed.length >= MIN_CHARS

  async function handleClick() {
    if (!ready) {
      setError(`Write at least ${MIN_CHARS} characters first.`)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/digital-assets/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, email, source, [fieldName]: trimmed }),
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
        {inputLabel}
      </label>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value.slice(0, MAX_CHARS))}
        maxLength={MAX_CHARS}
        placeholder={inputPlaceholder}
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
          {submitting ? 'Loading...' : `${buttonLabel}  →`}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 12, color: '#DC2626', margin: '10px 0 0', textAlign: 'right' }}>{error}</p>
      )}
    </div>
  )
}
