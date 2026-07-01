'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { brand, coach } from '@/config/tenant'

const INCLUDED: { eyebrow: string; title: string; body: string }[] = [
  {
    eyebrow: 'Part 1',
    title: 'What your body state means biologically',
    body: 'The mechanism underneath your score. Not symptoms - the system. Why your biology has settled into the pattern it is in.',
  },
  {
    eyebrow: 'Part 2',
    title: 'The specific drivers behind your current result',
    body: 'Section-by-section walk-through of your scorecard. Each driver named, ranked, and tied to the lived experience it produces.',
  },
  {
    eyebrow: 'Part 3',
    title: 'What is quietly making fat loss or performance harder',
    body: 'The hidden tax. The things in your training, eating, sleep and stress that keep adding cost without ever showing up as the obvious problem.',
  },
  {
    eyebrow: 'Part 4',
    title: 'What needs to change first, and why',
    body: 'The exact order to unstick the pattern. Not a long list of habits - a sequence that respects the dependency chain your biology actually runs on.',
  },
]

export default function GetReportPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = brand()
  const c = coach()

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
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={`${t.marketingDomain}${t.logoUrlLight}`} width="160" alt={t.name} style={{ display: 'block' }} />
          <Link href={`${t.performanceDomain}/scorecard`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={13} />
            Back to scorecard
          </Link>
        </div>
      </div>

      {/* Hero with Signal Blue radial glow */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '56px 24px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Body Decode Report · $37
          </p>
          <h1 style={{
            fontSize: 'clamp(30px, 5.5vw, 44px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '8px 0 18px', color: '#1A1A1A', lineHeight: 1.05,
          }}>
            Why your body has stopped losing fat,
            <br />
            <span style={{ color: '#1B6DFC' }}>and the order to fix it.</span>
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '24px' }} />
          <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            A written breakdown of your scorecard. The specific physiology behind your score, the fat-storage pattern your body is locked in, what is quietly making it worse, and the exact order to unstick it. Delivered to your inbox in minutes.
          </p>
        </div>
      </div>

      {/* What is inside — 4 numbered parts */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px',
          padding: '28px 28px 22px', boxShadow: '0 1px 4px rgba(27, 109, 252, 0.04)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            What is inside the report
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {INCLUDED.map(item => (
              <div key={item.title} style={{
                background: '#FAFAFA', border: '1px solid #EEEEEE',
                borderLeft: '3px solid #1B6DFC', borderRadius: '10px',
                padding: '14px 16px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                  {item.eyebrow}
                </p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                  {item.title}
                </p>
                <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email + checkout card */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid rgba(27, 109, 252, 0.3)',
          borderRadius: '14px', padding: '28px',
          boxShadow: '0 4px 16px rgba(27, 109, 252, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#1B6DFC', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              One-time · $37 AUD
            </p>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: 0 }}>
              Delivered in minutes
            </p>
          </div>
          <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.3 }}>
            Enter the email you used for your scorecard.
          </p>
          <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, marginBottom: '20px' }}>
            We tie the report to your scorecard result, so it reads against your specific score and state. Use the same email you submitted on the scorecard.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              style={{
                width: '100%', padding: '16px 18px', background: '#FFFFFF',
                border: '1.5px solid #D4D4D4', borderRadius: '10px',
                color: '#1A1A1A', fontSize: '15px', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: '100%', padding: '18px', borderRadius: '12px', border: 'none',
                background: loading || !email.trim() ? '#E5E5E5' : '#1B6DFC',
                color: loading || !email.trim() ? '#999999' : '#FFFFFF',
                fontSize: '15px', fontWeight: 800, cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                letterSpacing: '0.01em',
                boxShadow: loading || !email.trim() ? 'none' : '0 4px 16px rgba(27, 109, 252, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              {loading ? 'Loading…' : 'Get my Body Decode Report · $37'}
            </button>
          </form>
          <p style={{ fontSize: '11px', color: '#999999', textAlign: 'center', marginTop: '14px', lineHeight: 1.5 }}>
            Secure checkout via Stripe. Yours to keep. The starting point for your free strategy call.
          </p>
        </div>
      </div>

      {/* Founder byline */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{
          background: '#FAFAFA', border: '1px solid #EEEEEE',
          borderRadius: '14px', padding: '18px 22px',
          display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
        }}>
          <img
            src={c.photoUrl}
            alt={c.fullName}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              objectFit: 'cover', objectPosition: 'top center',
              border: '1px solid #E5E5E5', flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.3 }}>
              Built by {c.fullName}
            </p>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: 0, lineHeight: 1.45 }}>
              Sports Scientist · Business Entrepreneur · Body Recode Founder
            </p>
          </div>
        </div>
      </div>

      {/* Footer · scorecard link */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
          Have not completed the scorecard yet?{' '}
          <a href={`${t.performanceDomain}/scorecard`} style={{ color: '#1B6DFC', textDecoration: 'underline', fontWeight: 700 }}>
            Take it here first
          </a>
          {' '} (2 minutes, free).
        </p>
      </div>

    </div>
  )
}
