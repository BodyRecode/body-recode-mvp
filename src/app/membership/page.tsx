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
      const res = await fetch('/api/membership/checkout', {
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
        {loading ? 'Redirecting to checkout...' : 'Join the Membership - $49/week'}
      </button>
      <p style={{ fontSize: '12px', color: '#a8a29e', textAlign: 'center', margin: 0 }}>
        Secure checkout via Stripe. Billed weekly. Cancel anytime.
      </p>
    </form>
  )
}

const WHAT_YOU_GET = [
  {
    title: 'Progressive training blocks',
    desc: 'Block A picks up from Blueprint Week 6. Every six weeks a new block unlocks with more demanding movement patterns. Gym, home with dumbbells, or bodyweight - all three versions every session.',
  },
  {
    title: 'Nutrition layer updates each block',
    desc: 'The HABNS foundation stays. Each block adds a new precision layer - carb cycling, cycle-aware eating, recovery nutrition protocols - matched to your pattern.',
  },
  {
    title: 'Monthly coach Loom',
    desc: 'Once a month, Kade reviews your check-in data and records a personal 3-5 minute Loom response. Not a generic email. Specific to your numbers - what is shifting, what needs adjusting.',
  },
  {
    title: 'Monthly group Q&A call',
    desc: 'Live once a month. Kade answers the questions that come up most across the membership. Replays available in your portal.',
  },
  {
    title: 'Pattern resource library',
    desc: 'Deep-dive guides built for your biological pattern. Supplement protocols, sleep strategies, stress management tools, and lifestyle adjustments. Grows every block.',
  },
  {
    title: 'Check-in trend dashboard',
    desc: 'Your weekly check-in data visualised over time. See energy, sleep, recovery, and mood markers across 6, 12, and 18 weeks. The pattern becomes visible in the data.',
  },
]

const BLOCKS = [
  {
    label: 'Blueprint',
    weeks: 'Weeks 1-6',
    status: 'complete',
    desc: 'Three phases: Regulate, Adapt, Embed. Pattern identified and corrected at the foundation level.',
  },
  {
    label: 'Block A - Consolidate',
    weeks: 'Weeks 7-12',
    status: 'active',
    desc: 'Foundation locked in. Training progresses to more demanding movement patterns. Nutrition adds precision - carb cycling, cycle-aware strategies, recovery protocols.',
  },
  {
    label: 'Block B - Advance',
    weeks: 'Weeks 13-18',
    status: 'upcoming',
    desc: 'Training intensity increases. More complex movement patterns. Nutrition introduces calorie periodisation across training and rest days.',
  },
  {
    label: 'Block C - Refine',
    weeks: 'Weeks 19-24',
    status: 'upcoming',
    desc: 'Peak intensity for the cycle. Pattern re-assessment at the end of Block C. The system continues or shifts based on what the data shows.',
  },
]

const PATTERNS = [
  {
    name: 'Stress-Stored',
    colour: '#ef4444',
    blockA: 'Cortisol anchor evening meal introduced. Caffeine cutoff tightened to 10am. Post-training carb window widens as training demand increases. Zone 2 only.',
  },
  {
    name: 'Metabolic-Drift',
    colour: '#f59e0b',
    blockA: 'Formal carb cycling introduced - training days get more carbs, rest days fruit only. Protein target increases to 2.5-3 palms per day. Post-meal walk is non-negotiable.',
  },
  {
    name: 'Hormonal-Shift',
    colour: '#8b5cf6',
    blockA: 'Cycle-aware eating introduced. Follicular phase pushes harder. Luteal phase increases fat and rest-day carbs. Fat quality becomes the primary focus.',
  },
  {
    name: 'System-Overload',
    colour: '#14b8a6',
    blockA: 'Targeted recovery micronutrients from food - magnesium, zinc, iron, B vitamins. Pre-sleep nutrition protocol introduced. Check-in data determines when demand increases.',
  },
]

export default function MembershipPage() {
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
              Body Recode Membership
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
            The Blueprint worked.
            <br />
            <span style={{ color: '#14b8a6' }}>Now keep going.</span>
          </h1>

          <div style={{ width: '48px', height: '3px', background: '#14b8a6', borderRadius: '2px', marginBottom: '24px' }} />

          <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '14px' }}>
            Six weeks showed you what changes when training and nutrition are built around your biology. The membership is where that work compounds.
          </p>
          <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '40px' }}>
            Same pattern. Same portal. New blocks every six weeks - with a coach watching your numbers.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
            {[
              { value: '6-week', label: 'Rotating blocks' },
              { value: '$49', label: 'Per week' },
              { value: 'Cancel', label: 'Anytime' },
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

      {/* WHAT THIS IS */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px 0', borderTop: '1px solid #e7e5e0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          What this is
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '8px', color: '#1c1917' }}>
          Not a restart. A continuation.
        </h2>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '16px' }}>
          Most people finish a programme and go back to guessing. A different app, a different trainer, a different plan that has nothing to do with what their body actually showed them.
        </p>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '16px' }}>
          The membership picks up exactly where the Blueprint ended. Your pattern is already identified. Your portal is already open. Block A loads automatically and your progression continues without interruption.
        </p>
        <div style={{
          background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: '12px', padding: '20px 22px',
        }}>
          <p style={{ fontSize: '16px', color: '#1c1917', fontWeight: 700, margin: 0, lineHeight: 1.55 }}>
            This is not a content library you subscribe to. It is an ongoing coaching system that uses your weekly check-in data to track whether the work is landing.
          </p>
        </div>
      </div>

      {/* PROGRESSION */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px 0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          The progression
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '28px', color: '#1c1917' }}>
          24 weeks of structured progression. Then it resets with new data.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {BLOCKS.map((block) => (
            <div key={block.label} style={{
              background: '#ffffff', border: '1px solid #e7e5e0',
              borderLeft: `4px solid ${block.status === 'complete' ? '#a8a29e' : block.status === 'active' ? '#14b8a6' : '#e7e5e0'}`,
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: block.status === 'complete' ? '#a8a29e' : '#1c1917' }}>{block.label}</span>
                <span style={{ fontSize: '12px', color: '#a8a29e' }}>{block.weeks}</span>
                {block.status === 'complete' && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#a8a29e', background: '#f5f4f0', padding: '2px 8px', borderRadius: '99px' }}>Complete</span>
                )}
                {block.status === 'active' && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f766e', background: 'rgba(20,184,166,0.1)', padding: '2px 8px', borderRadius: '99px' }}>Starts here</span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.6, margin: 0 }}>{block.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* WHAT YOU GET */}
      <div style={{
        background: '#f5f4f0',
        borderTop: '1px solid #e7e5e0',
        borderBottom: '1px solid #e7e5e0',
        marginTop: '72px',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            What is included
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '8px', color: '#1c1917' }}>
            Six things. All inside your portal.
          </h2>
          <p style={{ fontSize: '16px', color: '#78716c', lineHeight: 1.7, marginBottom: '28px' }}>
            No external apps. No separate logins. Everything lives in the portal you already know.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {WHAT_YOU_GET.map((item, i) => (
              <div key={item.title} style={{
                background: '#ffffff', border: '1px solid #e7e5e0',
                borderRadius: '12px', padding: '18px 20px',
                display: 'flex', gap: '16px', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: '12px', fontWeight: 800, color: '#14b8a6',
                }}>
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', marginBottom: '4px' }}>{item.title}</p>
                  <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PATTERN BLOCK A PREVIEW */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px 0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Block A by pattern
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '24px', color: '#1c1917' }}>
          What changes in your first membership block.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PATTERNS.map(p => (
            <div key={p.name} style={{
              background: '#ffffff', border: '1px solid #e7e5e0',
              borderLeft: `4px solid ${p.colour}`,
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', marginBottom: '6px' }}>{p.name}</p>
              <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.6, margin: 0 }}>{p.blockA}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MID CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
        borderTop: '1px solid rgba(20,184,166,0.25)',
        borderBottom: '1px solid rgba(20,184,166,0.25)',
        marginTop: '72px',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '64px 24px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.25, color: '#134e4a' }}>
            Same portal. Deeper work.
          </h2>
          <p style={{ fontSize: '16px', color: '#0f766e', marginBottom: '28px', lineHeight: 1.6 }}>
            $49 per week. Cancel anytime. Your Blueprint data stays with you.
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
          For people who want to keep the momentum.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            'You finished the Blueprint and felt the difference',
            'You want to know what happens when you go deeper into your pattern',
            'You want a coach reviewing your numbers, not just a portal to log into',
            'You want progression that makes sense - not arbitrary plan changes',
            'You are not looking for a quick fix that stops when the weeks run out',
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
          The pattern is identified.<br />
          <span style={{ color: '#a8a29e' }}>Now go deeper into it.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#78716c', lineHeight: 1.7, marginBottom: '36px' }}>
          The membership picks up exactly where the Blueprint ended. Your pattern is already identified. Your portal is already built. Block A starts the moment you join.
        </p>
        <CheckoutForm position="footer" />
        <p style={{ fontSize: '13px', color: '#a8a29e', marginTop: '20px', lineHeight: 1.6 }}>
          Already a Blueprint member? Your portal upgrades automatically on sign-up. No new token or login required.
        </p>
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
