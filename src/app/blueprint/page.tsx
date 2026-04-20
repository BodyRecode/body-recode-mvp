'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

function CheckoutForm({ position, teal }: { position: string; teal?: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/blueprint/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim() }),
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '15px 16px', borderRadius: '10px',
    border: teal ? '1px solid rgba(20,184,166,0.3)' : '1px solid #d6d3d1',
    background: teal ? 'rgba(255,255,255,0.7)' : '#ffffff',
    color: '#1c1917', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
          style={inputStyle}
        />
      </div>
      {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>}
      <button
        type="submit"
        disabled={loading || !form.name.trim() || !form.email.trim()}
        style={{
          width: '100%', padding: '17px', borderRadius: '10px', border: 'none',
          background: loading ? 'rgba(20,184,166,0.6)' : '#14b8a6',
          color: '#ffffff', fontSize: '16px', fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.01em', transition: 'background 0.2s',
          boxSizing: 'border-box',
        }}
      >
        {loading ? 'Redirecting to checkout...' : 'Start the Rewire — $97 AUD'}
      </button>
      <p style={{ fontSize: '12px', color: '#a8a29e', textAlign: 'center', margin: 0 }}>
        Secure checkout via Stripe. Instant portal access on payment.
      </p>
    </form>
  )
}

const WHAT_YOU_GET = [
  {
    icon: '🧬',
    title: 'Pattern-specific programme',
    desc: 'Every part of this programme is built around your biological pattern — not a generic template adapted after the fact.',
  },
  {
    icon: '🏋️',
    title: '6-week training blueprint',
    desc: 'Progressive sessions across three phases matched to your pattern. Gym, home with dumbbells, or no equipment — every session has a version for your setup.',
  },
  {
    icon: '🥗',
    title: 'Nutrition framework',
    desc: 'A whole foods nutrition structure aligned to your pattern. Includes portion guidance, meal timing, and an early morning training adaptation — no tracking or calorie counting required.',
  },
  {
    icon: '📚',
    title: '5 biology education lessons',
    desc: 'Understand the hormone driving your pattern and why the programme is structured the way it is. Sequenced for your pattern.',
  },
  {
    icon: '📋',
    title: 'Weekly coaching notes',
    desc: 'A coaching note each week that speaks directly to your pattern, what to expect, and where to focus your attention.',
  },
  {
    icon: '📊',
    title: 'Weekly check-in form',
    desc: 'In-platform progress tracking across 8 biological markers every week. Tracks what is shifting and what still needs work.',
  },
  {
    icon: '🔍',
    title: 'Midpoint reflection',
    desc: 'A structured review at Week 3 to assess progress, surface what is working, and recalibrate the second half if needed.',
  },
  {
    icon: '→',
    title: 'Ascension to Stage 3',
    desc: 'Week 6 bridges directly to the Body Rebuild Membership — the next stage of the system. No gap between stages.',
  },
]

const PATTERNS = [
  {
    name: 'Stress-Stored',
    colour: '#ef4444',
    driver: 'Cortisol and adrenaline',
    focus: 'Moderate intensity. Sleep as a training variable. Morning cortisol curve support.',
  },
  {
    name: 'Metabolic-Drift',
    colour: '#f59e0b',
    driver: 'Insulin and blood sugar timing',
    focus: 'Carb timing. Post-training nutrition windows. Blood sugar stability all day.',
  },
  {
    name: 'Hormonal-Shift',
    colour: '#8b5cf6',
    driver: 'Reproductive hormone signalling',
    focus: 'Consistency over intensity. No restriction. Recovery is the primary lever.',
  },
  {
    name: 'System-Overload',
    colour: '#14b8a6',
    driver: 'Nervous system load',
    focus: 'RIR-controlled training. Reduced total demand. Simplicity in everything.',
  },
]

const PHASES = [
  {
    number: '01',
    name: 'Regulate',
    weeks: 'Weeks 1-2',
    desc: 'Re-establish biological rhythm. Structure your sleep, eating, and training to lower system noise and create a stable foundation.',
  },
  {
    number: '02',
    name: 'Adapt',
    weeks: 'Weeks 3-4',
    desc: 'Apply progressive load against a stabilised system. Energy, strength, and body composition begin to move.',
  },
  {
    number: '03',
    name: 'Embed',
    weeks: 'Weeks 5-6',
    desc: 'Lock in the new baseline. Consolidate recovery habits and prepare your system for Stage 3.',
  },
]

export default function BlueprintPage() {
  const formRef = useRef<HTMLDivElement>(null)

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafaf9',
      color: '#1c1917',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* Nav */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-120px', right: '-120px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 64px' }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)',
            borderRadius: '99px', padding: '7px 16px', marginBottom: '32px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#14b8a6' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Stage 2 — 6-Week Body Rewire Blueprint
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 7vw, 54px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.08,
            color: '#1c1917',
            marginBottom: '24px',
          }}>
            Your pattern is identified.
            <br />
            <span style={{ color: '#14b8a6' }}>Now correct it.</span>
          </h1>

          <div style={{ width: '48px', height: '3px', background: '#14b8a6', borderRadius: '2px', marginBottom: '24px' }} />

          <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '14px' }}>
            The 14-day challenge identified what your body has been doing and why. The Rewire Blueprint is the next step — 6 weeks built specifically around your biological pattern.
          </p>
          <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '40px' }}>
            Not a generic programme. Not an adapted template. Built from the pattern your body showed you.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
            {[
              { value: '6', label: 'Weeks' },
              { value: '$97', label: 'One-time' },
              { value: 'Day 1', label: 'Instant access' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#ffffff', border: '1px solid #e7e5e0',
                borderRadius: '12px', padding: '16px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#14b8a6', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: '#a8a29e', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div ref={formRef}>
            <CheckoutForm position="hero" />
          </div>
        </div>
      </div>

      {/* BRIDGE FROM CHALLENGE */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px 0', borderTop: '1px solid #e7e5e0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Where the challenge left off
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '8px', color: '#1c1917' }}>
          The challenge lowered the noise.
        </h2>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, color: '#a8a29e', marginBottom: '24px' }}>
          The Blueprint corrects the pattern.
        </h2>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '16px' }}>
          Fourteen days of structured reset gives your biology room to stabilise. But stabilising is not correcting. Your Body Decode result showed you which pattern is most active. The Rewire Blueprint is 6 weeks of direct work against it.
        </p>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '24px' }}>
          The training emphasis, nutrition structure, and weekly coaching notes are all built around your specific pattern — not a generic template with minor adjustments.
        </p>
        <div style={{
          background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: '12px', padding: '20px 22px',
        }}>
          <p style={{ fontSize: '16px', color: '#1c1917', fontWeight: 700, margin: 0, lineHeight: 1.55 }}>
            If you came in directly without completing the challenge, a two-question pattern assessment runs before your portal opens. Same result, same programme.
          </p>
        </div>
      </div>

      {/* PATTERNS */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px 0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          The four patterns
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '24px', color: '#1c1917' }}>
          One of these is yours. The programme is built around it.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PATTERNS.map(p => (
            <div key={p.name} style={{
              background: '#ffffff', border: '1px solid #e7e5e0',
              borderLeft: `4px solid ${p.colour}`,
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917' }}>{p.name}</span>
                <span style={{ fontSize: '12px', color: '#a8a29e' }}>— {p.driver}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.6, margin: 0 }}>{p.focus}</p>
            </div>
          ))}
        </div>
      </div>

      {/* THREE PHASES */}
      <div style={{
        background: '#f5f4f0',
        borderTop: '1px solid #e7e5e0',
        borderBottom: '1px solid #e7e5e0',
        marginTop: '72px',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            The three phases
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '8px', color: '#1c1917' }}>
            Regulate. Adapt. Embed.
          </h2>
          <p style={{ fontSize: '16px', color: '#78716c', lineHeight: 1.7, marginBottom: '32px' }}>
            Each phase has a specific biological purpose. The progression is not arbitrary — it follows how the body actually adapts.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PHASES.map((phase, i) => (
              <div key={phase.name} style={{
                background: '#ffffff', border: '1px solid #e7e5e0',
                borderRadius: '12px', padding: '20px 22px',
                display: 'flex', gap: '18px', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: '13px', fontWeight: 800, color: '#14b8a6',
                }}>
                  {phase.number}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#1c1917' }}>{phase.name}</span>
                    <span style={{ fontSize: '12px', color: '#a8a29e', fontWeight: 600 }}>{phase.weeks}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#78716c', lineHeight: 1.65, margin: 0 }}>{phase.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHAT YOU GET */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          What is inside
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '8px', color: '#1c1917' }}>
          Everything delivered to your portal on Day 1.
        </h2>
        <p style={{ fontSize: '16px', color: '#78716c', lineHeight: 1.7, marginBottom: '28px' }}>
          No external apps. No separate downloads. Everything lives in your Blueprint portal from the moment you purchase.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {WHAT_YOU_GET.map(item => (
            <div key={item.title} style={{
              background: '#ffffff', border: '1px solid #e7e5e0',
              borderRadius: '12px', padding: '18px 20px',
              display: 'flex', gap: '16px', alignItems: 'flex-start',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: '18px',
              }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', marginBottom: '4px' }}>{item.title}</p>
                <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MID CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
        borderTop: '1px solid rgba(20,184,166,0.25)',
        borderBottom: '1px solid rgba(20,184,166,0.25)',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '64px 24px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.25, color: '#134e4a' }}>
            6 weeks. Built around your pattern.
          </h2>
          <p style={{ fontSize: '16px', color: '#0f766e', marginBottom: '28px', lineHeight: 1.6 }}>
            One-time $97. Instant access. Pattern assessment included for direct entry.
          </p>
          <CheckoutForm position="mid" teal />
        </div>
      </div>

      {/* WHO THIS IS FOR */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Who this is for
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '24px', color: '#1c1917' }}>
          For people who want to correct the pattern, not manage it.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            'You completed the challenge and want to take the next step',
            'You know your biological pattern and want a programme built around it',
            'You want structured progression, not a generic plan to adapt yourself',
            'You train at a gym, at home, or with no equipment at all',
            'You want to understand why your body works the way it does',
            'You are ready to move from stabilising to actually correcting',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p style={{ fontSize: '16px', color: '#44403c', margin: 0, lineHeight: 1.6 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{ width: '40px', height: '3px', background: '#14b8a6', marginBottom: '28px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px', color: '#1c1917' }}>
          The pattern is mapped.<br />
          <span style={{ color: '#a8a29e' }}>6 weeks to correct it.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#78716c', lineHeight: 1.7, marginBottom: '36px' }}>
          The Rewire Blueprint picks up exactly where the challenge left off. Your pattern is already identified. Your portal is built around it from Day 1.
        </p>
        <CheckoutForm position="footer" />
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e7e5e0', padding: '28px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '13px', color: '#a8a29e', margin: 0 }}>
            &copy; {new Date().getFullYear()} Body Recode. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="/privacy" style={{ fontSize: '13px', color: '#78716c', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ fontSize: '13px', color: '#78716c', textDecoration: 'none' }}>Terms</a>
            <a href="mailto:info@bodyrecode.au" style={{ fontSize: '13px', color: '#78716c', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </div>

    </div>
  )
}
