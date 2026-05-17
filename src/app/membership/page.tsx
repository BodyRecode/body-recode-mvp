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
    desc: 'Block A picks up from Blueprint Week 6. Every six weeks a new block unlocks. More demanding movement patterns, more sophisticated programming. Gym, home with dumbbells, or bodyweight. All three versions every session.',
  },
  {
    title: 'Nutrition layer updates each block',
    desc: 'The HABNS foundation stays. Each block adds a new precision layer matched to your pattern. Carb cycling, cycle-aware eating, recovery nutrition protocols.',
  },
  {
    title: 'Monthly coach Loom',
    desc: 'Once a month I review your check-in data and record a personal 3 to 5 minute Loom for you. Not a generic email. Specific to your numbers. What is shifting, what needs adjusting, what to watch for in the next block.',
  },
  {
    title: 'Monthly group Q&A call',
    desc: 'Live once a month. I answer the questions that come up most across the membership that month. Replays available in your portal.',
  },
  {
    title: 'Pattern resource library',
    desc: 'Deep-dive guides built for your specific pattern. Supplement protocols, sleep strategies, stress management tools, and lifestyle adjustments. New material added every block.',
  },
  {
    title: 'Check-in trend dashboard',
    desc: 'Your weekly check-in data visualised over time. Energy, sleep, recovery, fat loss, and mood markers across 6, 12, and 18 weeks. The pattern becomes visible in the data.',
  },
]

const BLOCKS = [
  {
    label: 'Blueprint',
    weeks: 'Weeks 1-6',
    status: 'complete',
    desc: 'Three phases: Regulate, Adapt, Embed. Pattern identified and corrected. Body comes out of compensation. Foundation locked.',
  },
  {
    label: 'Block A - Consolidate',
    weeks: 'Weeks 7-12',
    status: 'active',
    desc: 'Foundation holds under more demanding work. Training progresses to harder movement patterns. Nutrition adds precision through carb timing, cycle-aware strategies, and recovery protocols matched to your pattern.',
  },
  {
    label: 'Block B - Advance',
    weeks: 'Weeks 13-18',
    status: 'upcoming',
    desc: 'Training intensity steps up. Complex movement patterns introduced. Nutrition introduces calorie periodisation across training and rest days. The system handles real load now.',
  },
  {
    label: 'Block C - Refine',
    weeks: 'Weeks 19-24',
    status: 'upcoming',
    desc: 'Peak intensity for the cycle. Pattern reassessment at the end. The data tells us whether to repeat the structure at higher intensity or shift your pattern routing.',
  },
]

const PATTERNS = [
  {
    name: 'Stress-Stored',
    colour: '#ef4444',
    driver: 'Cortisol driver',
    signal: 'Abdominal fat, morning puffiness, afternoon crashes. Wired and tired.',
    blockA: 'Cortisol anchor evening meal introduced. Caffeine cutoff tightened to 10am. Post-training carb window widens as training demand increases. Zone 2 only.',
  },
  {
    name: 'Insulin-Drift',
    colour: '#f59e0b',
    driver: 'Insulin driver',
    signal: 'Full-body softening, carb cravings, post-meal fatigue, energy variability through the day.',
    blockA: 'Formal carb cycling introduced. Training days get more carbs, rest days fruit only. Protein target increases to 2.5 to 3 palms per day. Post-meal walk is non-negotiable.',
  },
  {
    name: 'Estrogen-Shift',
    colour: '#8b5cf6',
    driver: 'Oestrogen driver',
    signal: 'Hip and thigh storage, water retention, cycle irregularity, mood variability.',
    blockA: 'Cycle-aware eating introduced. Follicular phase pushes harder. Luteal phase increases fat and rest-day carbs. Fat quality becomes the primary focus.',
  },
  {
    name: 'Androgen-Decline',
    colour: '#14b8a6',
    driver: 'Testosterone driver',
    signal: 'Reduced muscle tone, reduced drive, capacity slipping despite consistent effort.',
    blockA: 'Protein anchored at 2.0 to 2.2 g/kg. Dietary fat protected (low-fat suppresses testosterone). Magnesium and zinc inputs prioritised. Resistance training stimulus retained, total volume controlled.',
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
            Your body is responding.
            <br />
            <span style={{ color: '#14b8a6' }}>Now compound it.</span>
          </h1>

          <div style={{ width: '48px', height: '3px', background: '#14b8a6', borderRadius: '2px', marginBottom: '24px' }} />

          <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '14px' }}>
            If your body is responding, your fat loss is moving, and your training is producing consistently, you are in a Ready State. The work now is not rescue. It is precision over time.
          </p>
          <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '40px' }}>
            The Body Recode Membership is where that precision lives. Same portal you would have from the Blueprint, plus new training blocks every six weeks, monthly coach review of your numbers, and progression built around your specific pattern.
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
          Most people finish a programme and watch their fat loss stall again. A different app, a different trainer, a different plan that ignores everything their body just taught them. Whatever momentum was built gets reset to zero.
        </p>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '16px' }}>
          The Membership picks up exactly where the Blueprint ended. Your pattern is already identified. Your portal is already open. Block A loads automatically and the progression continues without a gap.
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
          Twenty-four weeks. Four blocks. Pattern reassessment at the end.
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917' }}>{p.name}</span>
                <span style={{ fontSize: '12px', color: '#a8a29e' }}>· {p.driver}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#44403c', lineHeight: 1.6, margin: '0 0 10px', fontWeight: 600 }}>{p.signal}</p>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Block A prescription</p>
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

      {/* IS THIS FOR YOU - STATE FILTER */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Is this for you?
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '20px', color: '#1c1917' }}>
          This is built for Ready State.
        </h2>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '20px' }}>
          The Body Recode Membership is built specifically for adults in a Ready State. Your biology is in flow. The work now is precision and trajectory, not rescue. This is the system that takes you from responding to compounding.
        </p>
        <p style={{ fontSize: '15px', color: '#1c1917', lineHeight: 1.7, marginBottom: '24px', fontWeight: 700 }}>
          If you are in a different state, the right starting point is different.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
          {[
            {
              state: 'Depleted State (5-8)',
              desc: 'Your body is in protection mode. The Membership assumes biology is already responding. Start with the free 14-Day Challenge first. Get out of protection, then come back.',
              cta: 'Start the Free Challenge',
              href: '/challenge',
            },
            {
              state: 'Transitioning State (9-11)',
              desc: 'Your body has capacity but is not converting it yet. The 6-week Blueprint corrects the specific pattern holding the system. Then this Membership becomes the natural next step.',
              cta: 'Start with the Blueprint',
              href: '/blueprint',
            },
            {
              state: "Don't know your state yet?",
              desc: 'Take the 2-minute scorecard first. It tells you which state you are in and which next step is built for you.',
              cta: 'Take the Scorecard',
              href: 'https://performance.bodyrecode.au/scorecard?source=membership_filter',
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
          If you are Ready, your starting point is right here. Sign up below.
        </p>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{ width: '40px', height: '3px', background: '#14b8a6', marginBottom: '28px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px', color: '#1c1917' }}>
          Your body is responding.<br />
          <span style={{ color: '#a8a29e' }}>Now compound it.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#78716c', lineHeight: 1.7, marginBottom: '36px' }}>
          $49 per week. Cancel anytime. Block A loads automatically the moment you join. Pattern continuity carries through from the Blueprint. Your portal is already built.
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
