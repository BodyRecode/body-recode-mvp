'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dna, Dumbbell, Salad, BookOpen, FileText, BarChart3, Compass, ArrowRight } from 'lucide-react'
import { isProductLive } from '@/lib/product-launch'
import { WaitlistCTA } from '@/components/product-waitlist-cta'
import { coach, logoUrl, brand } from '@/config/tenant'

function CheckoutForm({ position, teal, darkBg }: { position: string; teal?: boolean; darkBg?: boolean }) {
  // Pre-launch: capture waitlist instead of Stripe checkout until NEXT_PUBLIC_BLUEPRINT_LIVE=true.
  if (!isProductLive('blueprint')) {
    return <WaitlistCTA product="blueprint" productName="6-Week Body Rewire Blueprint" position={position} darkBg={darkBg} />
  }
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
    border: teal ? '1px solid rgba(27, 109, 252,0.3)' : '1px solid #D4D4D4',
    background: teal ? 'rgba(255,255,255,0.7)' : '#ffffff',
    color: '#1A1A1A', fontSize: '15px', outline: 'none',
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
          background: loading ? 'rgba(27, 109, 252,0.6)' : '#1B6DFC',
          color: '#ffffff', fontSize: '16px', fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.01em', transition: 'background 0.2s',
          boxSizing: 'border-box',
        }}
      >
        {loading ? 'Redirecting to checkout...' : 'Start the 6-Week Body Rewire · $97 AUD'}
      </button>
      <p style={{ fontSize: '12px', color: darkBg ? '#999999' : '#999999', textAlign: 'center', margin: 0 }}>
        Secure checkout via Stripe. Instant portal access on payment.
      </p>
    </form>
  )
}

const WHAT_YOU_GET = [
  {
    icon: Dna,
    title: 'Pattern-specific programme',
    timing: 'Day 1',
    featured: true,
    desc: 'Every part of this programme is calibrated to your specific pattern. Training intensity, nutrition timing, weekly coaching, biology lessons all read the same pattern. Not a generic template with adjustments.',
  },
  {
    icon: Dumbbell,
    title: '6-week training programme',
    timing: 'Day 1',
    featured: false,
    desc: 'Three sessions a week across three phases. Pattern-specific RIR targets, finisher rules, and rest intervals. Gym, home with dumbbells, or bodyweight. Every session has a version for your setup.',
  },
  {
    icon: Salad,
    title: 'Nutrition framework',
    timing: 'Day 1',
    featured: false,
    desc: 'Whole foods structured around your pattern\'s demand curve. Portion guidance, meal timing, training-day adaptations. No tracking. No calorie counting. No restriction.',
  },
  {
    icon: BookOpen,
    title: '5 biology lessons',
    timing: 'Weekly',
    featured: false,
    desc: 'One per week. Cortisol, insulin, testosterone, thyroid, sleep. Each lesson explains the hormone driving your pattern, why this programme is structured the way it is, and what to expect this phase. Pattern-specific callout in every lesson.',
  },
  {
    icon: FileText,
    title: 'Weekly coaching notes',
    timing: 'Every week',
    featured: true,
    desc: 'A note from me each week, written for your pattern specifically. What is shifting biologically. What to expect this week. Where to put your attention. Twenty-four unique notes across the four patterns and six weeks.',
  },
  {
    icon: BarChart3,
    title: 'Weekly Check-In',
    timing: 'Every week',
    featured: false,
    desc: 'In-portal tracking across 8 biological markers. Tracks what is moving and what still needs work. The data feeds your pattern read so the work can be calibrated as the system responds.',
  },
  {
    icon: Compass,
    title: 'Midpoint reflection',
    timing: 'Week 3',
    featured: false,
    desc: 'Structured review at the halfway point. Four pattern-specific questions to surface what has already shifted before the Adapt phase intensifies. Recalibrates the back half if your body has moved faster or slower than expected.',
  },
  {
    icon: ArrowRight,
    title: 'Ascension to the Membership',
    timing: 'Week 6',
    featured: false,
    desc: 'Week 6 bridges directly into the Body Recode Membership. Your pattern continuity carries through. No gap between stages. Optional, skip if you do not want it.',
  },
]

const PATTERNS = [
  {
    name: 'Stress-Stored',
    colour: '#DC2626',
    driver: 'Cortisol driver',
    signal: 'Abdominal fat, morning puffiness, afternoon crashes. Wired and tired.',
    correction: 'The Blueprint pulls stress load first. Sleep outranks training. The system comes out of compensation, and fat starts releasing.',
  },
  {
    name: 'Insulin-Drift',
    colour: '#B7791F',
    driver: 'Insulin driver',
    signal: 'Full-body softening, carb cravings, post-meal fatigue, energy variability through the day.',
    correction: 'The Blueprint times carbs to a narrow post-session window. Blood sugar stabilises and insulin signalling rebuilds. The softening reverses.',
  },
  {
    name: 'Estrogen-Shift',
    colour: '#8b5cf6',
    driver: 'Oestrogen driver',
    signal: 'Hip and thigh storage, water retention, cycle irregularity, mood variability.',
    correction: 'The Blueprint stops the restriction cycle that makes this pattern worse. Cycle-aware adjustments throughout. Recovery is the lever.',
  },
  {
    name: 'Androgen-Decline',
    colour: '#1B6DFC',
    driver: 'Testosterone driver',
    signal: 'Reduced muscle tone, reduced drive, capacity slipping despite consistent effort.',
    correction: 'The Blueprint protects muscle by controlling load and prioritising recovery. Testosterone signalling rebuilds. Drive and capacity return.',
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
  const c = coach()
  const formRef = useRef<HTMLDivElement>(null)

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* Nav */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <img src={logoUrl()} width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-120px', right: '-120px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 64px' }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.25)',
            borderRadius: '99px', padding: '7px 16px', marginBottom: '20px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1B6DFC' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              6-Week Body Rewire Blueprint
            </span>
          </div>

          {/* Founder byline */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '28px',
          }}>
            <img
              src="/kade.jpg"
              alt={c.fullName}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                objectFit: 'cover', objectPosition: 'top center',
                border: '1px solid #E5E5E5',
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.3 }}>
                Built by {c.fullName}
              </p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.3 }}>
                {c.credentials}
              </p>
            </div>
          </div>

          <h1 style={{
            fontSize: 'clamp(44px, 8vw, 68px)',
            fontWeight: 900,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            color: '#1A1A1A',
            marginBottom: '24px',
          }}>
            Knowing your pattern
            <br />
            <span style={{ color: '#1B6DFC' }}>is not correcting it.</span>
          </h1>

          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '32px' }} />

          {/* Explainer video placeholder. Branded video frame with a play
              button + "Coming soon" treatment — reads as intentional
              production-in-progress, not as broken. Previous bare
              "Placeholder. Production in progress" text was removed
              because it read as unfinished; this branded surface keeps
              the visual anchor in the hero while honestly signalling
              the asset isn't live yet. Replace this block with the real
              <video> element + poster image when production delivers. */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #1A1A1A 0%, #0B1F3F 100%)',
            border: '1px solid rgba(27,109,252,0.35)',
            borderRadius: '14px',
            aspectRatio: '16 / 9',
            marginBottom: '32px',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px -8px rgba(27,109,252,0.35)',
          }}>
            {/* Soft glow */}
            <div style={{
              position: 'absolute', top: '-100px', right: '-100px',
              width: '380px', height: '380px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(27,109,252,0.25) 0%, transparent 65%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: '-100px', left: '-100px',
              width: '300px', height: '300px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(27,109,252,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Inner content */}
            <div style={{ position: 'relative', textAlign: 'center', padding: '24px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(27,109,252,0.18)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                margin: '0 auto 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFFFFF" style={{ marginLeft: '4px' }}>
                  <polygon points="6,4 22,12 6,20" />
                </svg>
              </div>
              <p style={{ fontSize: '12px', fontWeight: 800, color: '#7BB3FF', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Explainer · 3 minutes
              </p>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.015em', margin: '0 0 6px', lineHeight: 1.25 }}>
                How the 6-Week Rewire works
              </p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8A8A8E', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                Coming soon
              </p>
            </div>
          </div>

          <p style={{ fontSize: '19px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '14px' }}>
            Most people, once they know their pattern, look for the right programme. But programmes that do not read your pattern cannot correct your pattern. They prescribe into the same compensation that stalled you before.
          </p>
          <p style={{ fontSize: '19px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '40px' }}>
            The 6-Week Body Rewire is six weeks of focused corrective work built specifically for your pattern. Training calibrated. Nutrition timed. Weekly coaching written for your pattern. By Week 6 the pattern is corrected and your body is ready to compound. $97.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
            {[
              { value: '6', label: 'Weeks' },
              { value: '$97', label: 'One-time' },
              { value: 'Day 1', label: 'Instant access' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#ffffff', border: '1px solid #E5E5E5',
                borderRadius: '12px', padding: '16px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#1B6DFC', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: '#999999', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div ref={formRef}>
            <CheckoutForm position="hero" />
          </div>
        </div>
      </div>

      {/* BRIDGE FROM CHALLENGE */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px 0', borderTop: '1px solid #E5E5E5' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Where the challenge left off
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '8px', color: '#1A1A1A' }}>
          The Challenge identified the pattern.
        </h2>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, color: '#999999', marginBottom: '28px' }}>
          The Blueprint corrects it.
        </h2>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '18px' }}>
          Fourteen days lowered the load enough for your body to be read. The Day 7 Check-In and Day 14 Result told you which of four patterns is holding your fat loss. That is the diagnostic.
        </p>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '28px' }}>
          Knowing the pattern is not correcting it. The 6-Week Body Rewire is focused corrective work, six weeks, built around your specific pattern. The training emphasis, nutrition timing, weekly coaching notes, and biology lessons all read the same pattern. Your body is still Depleted, but now the work is targeted.
        </p>
        <div style={{
          background: 'rgba(27, 109, 252,0.08)', border: '1px solid rgba(27, 109, 252,0.2)',
          borderRadius: '12px', padding: '20px 22px',
        }}>
          <p style={{ fontSize: '16px', color: '#1A1A1A', fontWeight: 700, margin: 0, lineHeight: 1.55 }}>
            If you skipped the Challenge and came straight here, a two-question pattern assessment runs before your portal opens. Same routing, same programme.
          </p>
        </div>
      </div>

      {/* MECHANISM */}
      <div style={{
        background: '#F3F7FF',
        borderTop: '1px solid rgba(27, 109, 252, 0.2)',
        borderBottom: '1px solid rgba(27, 109, 252, 0.2)',
        marginTop: '72px',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Why the standard answer fails
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: '#1A1A1A' }}>
            Generic programmes prescribe into compensation.
          </h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '18px' }}>
            Every body that has stalled is in some form of compensation. But the compensation is not generic. Cortisol-driven storage looks different to insulin-driven storage looks different to oestrogen-driven storage. The signal a Stress-Stored body needs to come out of compensation is the opposite of what an Insulin-Drift body needs. Same prescription, opposite effect.
          </p>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '28px' }}>
            Generic programmes prescribe the same intensity, the same nutrition timing, the same set count to every body. When your body has a specific pattern holding it, that uniform prescription either does nothing or makes the compensation tighter. The Blueprint is built around your specific pattern. Training intensity, nutrition timing, weekly coaching, biology lessons. Four pattern variants because the prescription has to match the pattern.
          </p>
          <div style={{
            background: 'rgba(27, 109, 252, 0.1)', border: '1px solid rgba(27, 109, 252, 0.25)',
            borderRadius: '12px', padding: '20px 22px',
          }}>
            <p style={{ fontSize: '17px', color: '#1A1A1A', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
              The pattern determines the order. Which stressor to pull first. Which input to add first. Which intensity to hold.
            </p>
          </div>
        </div>
      </div>

      {/* PATTERNS */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px 0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          The four patterns
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: '#1A1A1A' }}>
          One of these is yours. The Blueprint corrects it directly.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PATTERNS.map(p => (
            <div key={p.name} style={{
              background: '#ffffff', border: '1px solid #E5E5E5',
              borderLeft: `4px solid ${p.colour}`,
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#1A1A1A' }}>{p.name}</span>
                <span style={{ fontSize: '12px', color: '#999999' }}>· {p.driver}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#3A3A3A', lineHeight: 1.6, margin: '0 0 8px', fontWeight: 600 }}>{p.signal}</p>
              <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, margin: 0 }}>{p.correction}</p>
            </div>
          ))}
        </div>
      </div>

      {/* EDGE LINE */}
      <div style={{
        background: '#1A1A1A',
        position: 'relative',
        overflow: 'hidden',
        marginTop: '72px',
      }}>
        <div style={{
          position: 'absolute', top: '-200px', right: '-200px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.15) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
            The difference
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 38px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, color: '#FFFFFF', margin: 0 }}>
            Most programmes prescribe into compensation. We pull the compensation first, then prescribe to your pattern.
          </h2>
        </div>
      </div>

      {/* THREE PHASES */}
      <div style={{
        background: '#F7F7F7',
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            The three phases
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '10px', color: '#1A1A1A' }}>
            Regulate. Adapt. Embed.
          </h2>
          <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '32px' }}>
            Each phase has a specific biological purpose. The progression is not arbitrary. It follows how the body actually adapts.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PHASES.map((phase, i) => (
              <div key={phase.name} style={{
                background: '#ffffff', border: '1px solid #E5E5E5',
                borderRadius: '12px', padding: '20px 22px',
                display: 'flex', gap: '18px', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: '13px', fontWeight: 800, color: '#1B6DFC',
                }}>
                  {phase.number}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A' }}>{phase.name}</span>
                    <span style={{ fontSize: '12px', color: '#999999', fontWeight: 600 }}>{phase.weeks}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.65, margin: 0 }}>{phase.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHAT YOU GET */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          What is inside
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '10px', color: '#1A1A1A' }}>
          Everything you need, in one portal.
        </h2>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '28px' }}>
          No external apps. No separate downloads. Everything lives in your Blueprint portal from the moment you purchase.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {WHAT_YOU_GET.map(item => {
            const Icon = item.icon
            return (
              <div key={item.title} style={{
                background: '#FFFFFF',
                border: item.featured ? '1px solid #1B6DFC' : '1px solid #E5E5E5',
                borderLeft: item.featured ? '3px solid #1B6DFC' : '1px solid #E5E5E5',
                borderRadius: '12px',
                padding: '20px 22px',
                display: 'flex', gap: '18px', alignItems: 'flex-start',
                boxShadow: item.featured ? '0 1px 3px rgba(27, 109, 252, 0.06)' : 'none',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: item.featured ? '#1B6DFC' : 'rgba(27, 109, 252, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={20} strokeWidth={2} color={item.featured ? '#FFFFFF' : '#1B6DFC'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.005em' }}>
                      {item.title}
                    </p>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: item.featured ? '#1056D6' : '#6B6B6B',
                      background: item.featured ? 'rgba(27, 109, 252, 0.1)' : '#F5F5F5',
                      padding: '3px 8px', borderRadius: '4px',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {item.timing}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SAMPLE PREVIEW */}
      <div style={{
        background: '#F7F7F7',
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Sample preview
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '10px', color: '#1A1A1A' }}>
            What your Week 1 looks like.
          </h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '36px' }}>
            Same six-week structure across all four patterns, but every variable that matters is calibrated to yours. Here is Week 1 for a Stress-Stored buyer.
          </p>

          {/* Mockup card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5E5',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
          }}>
            {/* Card header */}
            <div style={{
              background: '#1A1A1A',
              padding: '16px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                Your Blueprint · Week 1 of 6
              </p>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                Sample
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '28px 26px' }}>
              {/* Pattern banner */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderLeft: '4px solid #DC2626',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '22px',
              }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  Your pattern
                </p>
                <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                  Stress-Stored Pattern
                </p>
              </div>

              {/* Coaching note */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: '#1B6DFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={16} strokeWidth={2.5} color="#FFFFFF" />
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                    Week 1 coaching note
                  </p>
                </div>
                <p style={{ fontSize: '14px', color: '#3A3A3A', lineHeight: 1.7, margin: 0 }}>
                  This week is about removing load, not adding it. Your cortisol has been elevated for a while and the first thing your body needs is a clear signal that the pressure is coming down. The training is intentionally controlled. The meal structure is consistent. That is the work.
                </p>
              </div>

              {/* Session + lesson */}
              <div style={{ paddingTop: '22px', borderTop: '1px solid #E5E5E5', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: 'rgba(27, 109, 252, 0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Dumbbell size={14} strokeWidth={2.5} color="#1B6DFC" />
                    </div>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                      Session A
                    </p>
                  </div>
                  <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.55, margin: 0 }}>
                    Strength base. RIR 3 throughout. Skip the Session B finisher. Rest 90 seconds minimum between sets.
                  </p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: 'rgba(27, 109, 252, 0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <BookOpen size={14} strokeWidth={2.5} color="#1B6DFC" />
                    </div>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                      Lesson 1
                    </p>
                  </div>
                  <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.55, margin: 0 }}>
                    Cortisol and the stress response. Why the entire structure of your programme is designed to bring this curve back down.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MID CTA */}
      <div style={{
        background: '#1A1A1A',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-200px', right: '-200px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.15) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Start the correction
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '12px', lineHeight: 1.2, color: '#FFFFFF' }}>
            Six weeks. Pattern-specific. Done.
          </h2>
          <p style={{ fontSize: '16px', color: '#999999', marginBottom: '32px', lineHeight: 1.65 }}>
            One-time $97 AUD. Instant portal access. Pattern assessment runs in 2 minutes if you skipped the Challenge.
          </p>
          <CheckoutForm position="mid" darkBg />
        </div>
      </div>

      {/* FOUNDER */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Why pattern-specific
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '28px', color: '#1A1A1A' }}>
          Two decades writing programmes. One observation.
        </h2>

        {/* Photo */}
        <div style={{
          position: 'relative', borderRadius: '18px', overflow: 'hidden',
          marginBottom: '28px',
          boxShadow: '0 0 0 1px rgba(27, 109, 252, 0.15), 0 24px 48px rgba(0,0,0,0.12)',
        }}>
          <img
            src="/kade-11.jpg"
            alt={c.fullName}
            style={{
              width: '100%', display: 'block',
              // Source is 561x701 (4:5). Match the frame so the image
              // renders in full with no cropping — nothing gets cut.
              // top-center is the safety net for any future crop.
              aspectRatio: '4 / 5',
              objectFit: 'cover', objectPosition: 'top center',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, rgba(12,10,9,0.88) 100%)',
          }} />
          <div style={{ position: 'absolute', bottom: '22px', left: '24px', right: '24px' }}>
            <p style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 3px' }}>{c.fullName}</p>
            <p style={{ fontSize: '13px', color: '#1B6DFC', margin: 0, fontWeight: 600 }}>
              {c.credentials}
            </p>
          </div>
        </div>

        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '18px' }}>
          After two decades of writing training programmes, I kept watching the same thing. Programmes worked for some bodies, did nothing for others, made some worse. Same prescription. Different outcomes. The bodies that did not respond were not broken. They had a specific pattern.
        </p>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '28px' }}>
          The 6-Week Body Rewire is built around that observation. Four pattern variants of the same six-week structure. Each calibrated to the hormone driving that pattern. The prescription matches the pattern.
        </p>

        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5E5',
          borderLeft: '3px solid #1B6DFC',
          borderRadius: '14px', padding: '22px 24px',
        }}>
          <p style={{ fontSize: '16px', color: '#1A1A1A', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
            Generic prescription is a guess. Pattern-specific prescription is a read. The Blueprint is the read made into a programme.
          </p>
        </div>
      </div>

      {/* IS THIS FOR YOU - STATE FILTER */}
      <div style={{
        background: '#F7F7F7',
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Is this for you?
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: '#1A1A1A' }}>
            Still Depleted. Pattern identified.
          </h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '20px' }}>
            The 6-Week Body Rewire is built for adults still in a Depleted State who now know their pattern. Fourteen days of structured reset is not enough to bring a body out of Depleted. Six weeks of focused pattern-specific correction is the next dose.
          </p>
          <p style={{ fontSize: '15px', color: '#1A1A1A', lineHeight: 1.7, marginBottom: '24px', fontWeight: 700 }}>
            If you are at a different stage, the right starting point is different.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
            {[
              {
                state: 'No pattern read yet',
                desc: 'Start with the free 2-minute Body State Scorecard. It captures your state and routes you into the free 14-Day Challenge if you are Depleted. By Day 14 of the Challenge your pattern is identified through the Body Decode Check-In. Then you come back here.',
                cta: 'Start with the Scorecard',
                href: `${brand().performanceDomain}/scorecard?intent=challenge&source=blueprint_filter`,
              },
              {
                state: 'Past Depleted (Ready State)',
                desc: 'Your biology is already responding. You do not need a six-week corrective block. You need the ongoing precision system that takes you from responding to compounding.',
                cta: 'See the Membership',
                href: '/membership',
              },
              {
                state: "Don't know your state yet?",
                desc: 'Take the 2-minute scorecard first. It tells you which state you are in and which next step is built for you.',
                cta: 'Take the Scorecard',
                href: `${brand().performanceDomain}/scorecard?source=blueprint_filter`,
              },
            ].map(row => (
              <div key={row.state} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '12px',
                padding: '18px 20px',
              }}>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#1056D6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {row.state}
                </p>
                <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.6, marginBottom: '14px' }}>
                  {row.desc}
                </p>
                <a href={row.href} style={{
                  display: 'inline-block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1B6DFC',
                  textDecoration: 'none',
                  borderBottom: '1px solid #1B6DFC',
                  paddingBottom: '2px',
                }}>
                  {row.cta} →
                </a>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '17px', color: '#1A1A1A', fontWeight: 700, lineHeight: 1.5, margin: 0 }}>
            If you are Depleted with your pattern read, your starting point is right here. Sign up below.
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{ width: '40px', height: '3px', background: '#1B6DFC', marginBottom: '28px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: '20px', color: '#1A1A1A' }}>
          Six concentrated weeks.<br />
          <span style={{ color: '#999999' }}>Your pattern. The correction.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '36px' }}>
          $97 AUD. Instant portal access. Your pattern is mapped before Week 1. By Week 6 the pattern is corrected and your body is ready to compound. Then continuity through the Membership, if you want it.
        </p>
        <CheckoutForm position="footer" />
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #E5E5E5', padding: '28px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '13px', color: '#999999', margin: 0 }}>
            &copy; {new Date().getFullYear()} Body Recode. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="/privacy" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>Terms</a>
            <a href="mailto:info@bodyrecode.au" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </div>

    </div>
  )
}
