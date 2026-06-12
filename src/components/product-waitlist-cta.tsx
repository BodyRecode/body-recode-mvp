'use client'

import { useState } from 'react'
import type { LaunchProduct } from '@/lib/product-launch'

/**
 * Pre-launch waitlist capture, used in place of the live enroll form /
 * Stripe checkout when a Funnel B product is gated off (see isProductLive).
 *
 * Posts to the existing /api/product-waitlist (same endpoint the scorecard
 * "Coming soon" CTAs use), idempotent on (email, product). All Challenge /
 * Blueprint / Membership interest therefore pools into one product_waitlist
 * table, visible at /dashboard/business/waitlist.
 */
export function WaitlistCTA({
  product,
  productName,
  position = 'hero',
  darkBg = false,
}: {
  product: LaunchProduct
  productName: string
  position?: string
  darkBg?: boolean
}) {
  const [form, setForm] = useState({ name: '', email: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function join(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email.trim() || !form.email.includes('@')) return
    setStatus('submitting')
    setError(null)
    try {
      const res = await fetch('/api/product-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          first_name: form.name.trim() || null,
          product,
          source: `${product}_lp_${position}`,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
      setStatus('done')
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const subText = darkBg ? '#B5CFFC' : '#6B6B6B'

  if (status === 'done') {
    return (
      <div style={{
        background: darkBg ? 'rgba(27,109,252,0.18)' : 'rgba(27,109,252,0.08)',
        border: '1px solid rgba(27,109,252,0.35)',
        borderRadius: '16px', padding: '28px 24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '19px', fontWeight: 800, color: darkBg ? '#FFFFFF' : '#1A1A1A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          You&apos;re on the list.
        </p>
        <p style={{ fontSize: '14px', color: darkBg ? '#B5CFFC' : '#1056D6', lineHeight: 1.6, margin: 0 }}>
          We&apos;ll email you the moment the {productName} opens. You&apos;ll be first in.
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '15px 16px', borderRadius: '10px',
    border: '1px solid #D4D4D4', background: '#ffffff',
    color: '#1A1A1A', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <form onSubmit={join} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{
        display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: '7px',
        background: 'rgba(27,109,252,0.12)', border: '1px solid rgba(27,109,252,0.3)',
        borderRadius: '999px', padding: '5px 12px', marginBottom: '2px',
      }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1B6DFC' }} />
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: darkBg ? '#B5CFFC' : '#1056D6' }}>
          Starting soon
        </span>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="text" placeholder="Your name" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
        <input type="email" placeholder="Email address" value={form.email} required
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
      </div>
      {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>}
      <button type="submit" disabled={status === 'submitting' || !form.email.trim()}
        style={{
          width: '100%', padding: '17px', borderRadius: '10px', border: 'none',
          background: status === 'submitting' ? 'rgba(27,109,252,0.6)' : '#1B6DFC',
          color: '#ffffff', fontSize: '16px', fontWeight: 800,
          cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
          letterSpacing: '0.01em', transition: 'background 0.2s', boxSizing: 'border-box',
        }}>
        {status === 'submitting' ? 'Adding you...' : `Join the ${productName} waitlist`}
      </button>
      <p style={{ fontSize: '12px', color: subText, textAlign: 'center', margin: 0 }}>
        Not live yet. Join the waitlist and you&apos;ll be first in when it opens.
      </p>
    </form>
  )
}
