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
        {loading ? 'Redirecting to checkout...' : 'Start the Rewire - $97 AUD'}
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
    desc: 'Every part of this programme is built around your specific pattern. Not a generic template with adjustments. The training, nutrition, and weekly notes all read the same pattern.',
  },
  {
    icon: '🏋️',
    title: '6-week training blueprint',
    desc: 'Progressive sessions across three phases, matched to your pattern. Gym, home with dumbbells, or no equipment. Every session has a version for your setup.',
  },
  {
    icon: '🥗',
    title: 'Nutrition framework',
    desc: 'Whole foods structured around your pattern\'s demand curve. Portion guidance, meal timing, early-training adaptation. No tracking, no calorie counting, no restriction.',
  },
  {
    icon: '📚',
    title: '5 biology education lessons',
    desc: 'Understand the hormone driving your pattern, why this programme is structured the way it is, and what to expect each phase. Sequenced for your pattern specifically.',
  },
  {
    icon: '📋',
    title: 'Weekly coaching notes',
    desc: 'A coaching note each week, written for your pattern. What is shifting, what to expect, and where to put your attention.',
  },
  {
    icon: '📊',
    title: 'Weekly check-in form',
    desc: 'In-portal tracking across 8 biological markers, every week. Tracks what is moving and what still needs work. Updates your pattern read as the system responds.',
  },
  {
    icon: '🔍',
    title: 'Midpoint reflection',
    desc: 'Structured review at Week 3. Assesses what is working, surfaces what is not, and recalibrates the back half if your body has moved faster or slower than expected.',
  },
  {
    icon: '→',
    title: 'Ascension to Stage 3',
    desc: 'Week 6 bridges directly into the Body Rebuild Membership. No gap between stages, your pattern continuity carries through. Skip if you do not want it.',
  },
]

const PATTERNS = [
  {
    name: 'Stress-Stored',
    colour: '#ef4444',
    driver: 'Cortisol and adrenaline run the system',
    focus: 'Fat sits stubbornly in the stomach and waist. Energy runs on adrenaline. The Blueprint pulls stress load first, then training and nutrition land properly.',
  },
  {
    name: 'Metabolic-Drift',
    colour: '#f59e0b',
    driver: 'Insulin and blood sugar are unstable',
    focus: 'Cravings, energy dips, fat that will not shift despite the work. The Blueprint times carbs around actual demand, stabilises blood sugar all day, and the fat starts releasing.',
  },
  {
    name: 'Hormonal-Shift',
    colour: '#8b5cf6',
    driver: 'Reproductive hormones are out of sync',
    focus: 'Body composition that fights everything you try. Energy that swings without warning. The Blueprint runs at consistency over intensity. No restriction. Recovery is the lever.',
  },
  {
    name: 'System-Overload',
    colour: '#14b8a6',
    driver: 'The nervous system is overloaded',
    focus: 'You feel tired but wired. Recovery never lands. The Blueprint pulls total demand, controls RIR, and rebuilds capacity from the floor up.',
  },
]

const PHASES = [
  {
    number: '01',
    name: 'Regulate',
    weeks: 'Weeks 1-2',
    desc: 'Lower the load on your specific pattern. Bring sleep, training, and eating into a structure your body can actually metabolise. Stop adding noise to a system that is already compensating.',
  },
  {
    number: '02',
    name: 'Adapt',
    weeks: 'Weeks 3-4',
    desc: 'Progressive load applied to a system that can now respond. Energy lifts. Strength returns. Fat starts moving in the way your biology actually allows.',
  },
  {
    number: '03',
    name: 'Embed',
    weeks: 'Weeks 5-6',
    desc: 'Consolidate the new baseline. The corrective work becomes the way your body operates by default. Ready to move to ongoing prescription without a gap.',
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
              6-Week Body Rewire Blueprint
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
            Your body is functional.
            <br />
            <span style={{ color: '#14b8a6' }}>But it is not producing.</span>
          </h1>

          <div style={{ width: '48px', height: '3px', background: '#14b8a6', borderRadius: '2px', marginBottom: '24px' }} />

          <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '14px' }}>
            This is Transitioning State. Your body has capacity but is not converting it. Sleep, training, food. Everything is going in. Fat loss, energy, performance. Nothing is coming back.
          </p>
          <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '40px' }}>
            The Rewire Blueprint is 6 weeks of corrective work built around the specific pattern holding your body in compensation. From the Challenge result or via the pattern assessment on entry. By Week 6 the system is producing again.
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
          The Challenge pulled the load.
        </h2>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, color: '#a8a29e', marginBottom: '24px' }}>
          The Blueprint corrects the pattern.
        </h2>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '16px' }}>
          Fourteen days of structured reset gave your body the chance to come out of protection mode. The system stabilised. Your Day 7 Check-In and Day 14 Result identified the specific pattern that has been holding your body in compensation.
        </p>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '24px' }}>
          Stabilising is not correcting. The Blueprint is six weeks of direct work against that pattern. The training emphasis, nutrition structure, and weekly coaching notes are all built around it. Not a generic template with minor adjustments.
        </p>
        <div style={{
          background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: '12px', padding: '20px 22px',
        }}>
          <p style={{ fontSize: '16px', color: '#1c1917', fontWeight: 700, margin: 0, lineHeight: 1.55 }}>
            If you skipped the Challenge and came straight here, a two-question pattern assessment runs before your portal opens. Same routing, same programme.
          </p>
        </div>
      </div>

      {/* PATTERNS */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px 0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          The four patterns
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '24px', color: '#1c1917' }}>
          One of these is what is holding your body in compensation. The Blueprint corrects it directly.
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
                <span style={{ fontSize: '12px', color: '#a8a29e' }}>- {p.driver}</span>
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
            Each phase has a specific biological purpose. The progression is not arbitrary. It follows how the body actually adapts.
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
            Six weeks. Pattern-specific. Done.
          </h2>
          <p style={{ fontSize: '16px', color: '#0f766e', marginBottom: '28px', lineHeight: 1.6 }}>
            One-time $97. Instant portal access. Pattern assessment runs in 2 minutes if you skipped the Challenge.
          </p>
          <CheckoutForm position="mid" teal />
        </div>
      </div>

      {/* IS THIS FOR YOU - STATE FILTER */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Is this for you?
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '20px', color: '#1c1917' }}>
          This is built for Transitioning State.
        </h2>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '20px' }}>
          The Rewire Blueprint is built specifically for adults in a Transitioning State. Your body has capacity but is not converting it. The specific pattern holding the system is what gets corrected here.
        </p>
        <p style={{ fontSize: '15px', color: '#1c1917', lineHeight: 1.7, marginBottom: '24px', fontWeight: 700 }}>
          If you are in a different state, the right starting point is different.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
          {[
            {
              state: 'Depleted State (5-8)',
              desc: 'Your body is in protection mode. It is not stable enough yet to be read or corrected. Start with the free 14-Day Challenge. By Day 14 you will know whether you are ready for the Blueprint.',
              cta: 'Start the Free Challenge',
              href: '/challenge',
            },
            {
              state: 'Ready State (12-15)',
              desc: 'Your biology is already in flow. You do not need a six-week corrective block. You need ongoing prescription with a coach watching the numbers.',
              cta: 'See the Membership',
              href: '/membership',
            },
            {
              state: "Don't know your state yet?",
              desc: 'Take the 2-minute scorecard first. It tells you which state you are in and which next step is built for you.',
              cta: 'Take the Scorecard',
              href: 'https://performance.bodyrecode.au/scorecard?source=blueprint_filter',
            },
          ].map(row => (
            <div key={row.state} style={{
              background: '#ffffff',
              border: '1px solid #e7e5e0',
              borderRadius: '12px',
              padding: '18px 20px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#0f766e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {row.state}
              </p>
              <p style={{ fontSize: '14px', color: '#57534e', lineHeight: 1.6, marginBottom: '14px' }}>
                {row.desc}
              </p>
              <a href={row.href} style={{
                display: 'inline-block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#14b8a6',
                textDecoration: 'none',
                borderBottom: '1px solid #14b8a6',
                paddingBottom: '2px',
              }}>
                {row.cta} →
              </a>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '17px', color: '#1c1917', fontWeight: 700, lineHeight: 1.5, margin: 0 }}>
          If you are Transitioning, your starting point is right here. Sign up below.
        </p>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{ width: '40px', height: '3px', background: '#14b8a6', marginBottom: '28px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px', color: '#1c1917' }}>
          Six weeks.<br />
          <span style={{ color: '#a8a29e' }}>The pattern corrects.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#78716c', lineHeight: 1.7, marginBottom: '36px' }}>
          $97. Instant portal access. Your pattern is mapped before Week 1. By Week 6 the system is producing again. Then continuity through the Membership, if you want it.
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
