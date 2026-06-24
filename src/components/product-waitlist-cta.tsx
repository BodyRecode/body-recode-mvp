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
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', gender: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Capture the full enrolment dataset once, so launch needs zero re-asking.
  // All fields required (mirrors the live enrol form: first/last/email/phone/gender).
  const canSubmit = !!form.first_name.trim() && !!form.last_name.trim()
    && !!form.email.trim() && form.email.includes('@')
    && !!form.phone.trim() && !!form.gender

  async function join(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('submitting')
    setError(null)
    try {
      const res = await fetch('/api/product-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          first_name: form.first_name.trim() || null,
          last_name: form.last_name.trim() || null,
          phone: form.phone.trim() || null,
          gender: form.gender || null,
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
        <input type="text" placeholder="First name" value={form.first_name} required
          onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} style={inputStyle} />
        <input type="text" placeholder="Last name" value={form.last_name} required
          onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} style={inputStyle} />
      </div>
      <input type="email" placeholder="Email address" value={form.email} required
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
      <div>
        <input type="tel" placeholder="Mobile number" value={form.phone} required
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
        <p style={{ fontSize: '11px', color: subText, margin: '6px 2px 0', lineHeight: 1.5 }}>
          We&apos;ll text you the moment the {productName} opens, plus your daily reminders once you start.
        </p>
      </div>
      <select
        value={form.gender} required
        onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
        style={{ ...inputStyle, color: form.gender ? '#1A1A1A' : '#999999', appearance: 'auto' }}
      >
        <option value="" disabled>Biological sex</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="prefer_not_to_say">Prefer not to say</option>
      </select>
      {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>}
      <button type="submit" disabled={status === 'submitting' || !canSubmit}
        style={{
          width: '100%', padding: '17px', borderRadius: '10px', border: 'none',
          background: status === 'submitting' || !canSubmit ? 'rgba(27,109,252,0.6)' : '#1B6DFC',
          color: '#ffffff', fontSize: '16px', fontWeight: 800,
          cursor: status === 'submitting' || !canSubmit ? 'not-allowed' : 'pointer',
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
