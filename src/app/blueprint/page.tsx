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
    desc: 'Every part of this is built around your specific pattern. Training intensity, nutrition timing, weekly coaching, biology lessons, all built for the same pattern. Not a generic template with a few tweaks.',
  },
  {
    icon: Dumbbell,
    title: '6-week training programme',
    timing: 'Day 1',
    featured: false,
    desc: 'Three sessions a week across three phases. Effort targets, finisher rules, and rest times set for your pattern. Gym, home with dumbbells, or bodyweight. Every session has a version for your setup.',
  },
  {
    icon: Salad,
    title: 'Nutrition framework',
    timing: 'Day 1',
    featured: false,
    desc: 'Whole foods, structured around what your pattern actually needs. Portion guidance, meal timing, training-day tweaks. No tracking. No calorie counting. No cutting things out.',
  },
  {
    icon: BookOpen,
    title: '5 biology lessons',
    timing: 'Weekly',
    featured: false,
    desc: 'One per week. Cortisol, insulin, testosterone, thyroid, sleep. Each lesson explains the hormone driving your pattern, why the programme is built the way it is, and what to expect this phase. A note for your specific pattern in every lesson.',
  },
  {
    icon: FileText,
    title: 'Weekly coaching notes',
    timing: 'Every week',
    featured: true,
    desc: 'A note from me each week, written for your pattern. What is changing inside your body. What to expect this week. Where to put your focus. Twenty-four different notes across the four patterns and six weeks.',
  },
  {
    icon: BarChart3,
    title: 'Weekly Check-In',
    timing: 'Every week',
    featured: false,
    desc: 'Tracking across 8 body markers, right in your portal. Shows what is moving and what still needs work. Your answers feed back in so the plan adjusts as your body responds.',
  },
  {
    icon: Compass,
    title: 'Midpoint reflection',
    timing: 'Week 3',
    featured: false,
    desc: 'A structured check at the halfway point. Four questions for your pattern to surface what has already changed before the Adapt phase steps up. Adjusts the back half if your body has moved faster or slower than expected.',
  },
  {
    icon: ArrowRight,
    title: 'Straight into the Membership',
    timing: 'Week 6',
    featured: false,
    desc: 'Week 6 flows straight into the Body Recode Membership. Everything about your pattern carries across. No gap between stages. Optional, skip it if you do not want it.',
  },
]

const PATTERNS = [
  {
    name: 'Stress-Stored',
    colour: '#DC2626',
    driver: 'Cortisol driver',
    signal: 'Abdominal fat, morning puffiness, afternoon crashes. Wired and tired.',
    correction: 'The Blueprint takes stress off first. Sleep matters more than training here. Your body lets go of the holding pattern, and fat starts to move.',
  },
  {
    name: 'Insulin-Drift',
    colour: '#B7791F',
    driver: 'Insulin driver',
    signal: 'Full-body softening, carb cravings, post-meal fatigue, energy variability through the day.',
    correction: 'The Blueprint times your carbs to a tight window after training. Blood sugar steadies, insulin starts working properly again, and the softness reverses.',
  },
  {
    name: 'Estrogen-Shift',
    colour: '#8b5cf6',
    driver: 'Oestrogen driver',
    signal: 'Hip and thigh storage, water retention, cycle irregularity, mood variability.',
    correction: 'The Blueprint breaks the under-eating cycle that makes this pattern worse. It adjusts around your cycle the whole way through. Recovery is the lever that moves it.',
  },
  {
    name: 'Androgen-Decline',
    colour: '#1B6DFC',
    driver: 'Testosterone driver',
    signal: 'Reduced muscle tone, reduced drive, capacity slipping despite consistent effort.',
    correction: 'The Blueprint protects your muscle by managing load and putting recovery first. Testosterone starts working properly again. Drive and capacity come back.',
  },
]

const PHASES = [
  {
    number: '01',
    name: 'Regulate',
    weeks: 'Weeks 1-2',
    desc: 'Take the load off your specific pattern. Get sleep, training, and food into a rhythm your body can actually handle. Stop piling stress onto a system that is already struggling.',
  },
  {
    number: '02',
    name: 'Adapt',
    weeks: 'Weeks 3-4',
    desc: 'Now that your body can respond, the work steps up. Energy lifts. Strength comes back. Fat starts moving the way your biology actually allows.',
  },
  {
    number: '03',
    name: 'Embed',
    weeks: 'Weeks 5-6',
    desc: 'Lock in the new normal. The changes become the way your body runs by default. You are ready to keep going without a gap.',
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
          <img src={logoUrl()} width="160" alt={brand().name} style={{ display: 'block' }} />
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
            You&apos;ve done the work.
            <br />
            <span style={{ color: '#1B6DFC' }}>Your body hasn&apos;t moved.</span>
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
            Here&apos;s what almost no programme accounts for: bodies stall for different reasons. Yours has a specific pattern behind it, a specific reason it is holding on. A plan that does not know that pattern cannot fix it. Worse, the standard plan pushes harder on the exact thing keeping you stuck. Same plan everyone gets. On you, it backfires.
          </p>
          <p style={{ fontSize: '19px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '40px' }}>
            The 6-Week Body Rewire is built the opposite way. First we find your pattern, a 2-minute read if you do not already know it. Then six weeks shaped entirely around it. Training set to you. Nutrition timed to you. A coaching note written for you, every week. By Week 6 the thing holding your fat loss is gone, and your body is finally ready to build. $97.
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
          The Challenge found your pattern.
        </h2>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, color: '#999999', marginBottom: '28px' }}>
          The Blueprint fixes it.
        </h2>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '18px' }}>
          Fourteen days took enough pressure off your body to see it clearly. The Day 7 Check-In and Day 14 Result showed you which of the four patterns is holding your fat loss. That was the diagnosis.
        </p>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '28px' }}>
          Knowing your pattern is not the same as fixing it. The 6-Week Body Rewire is six weeks of focused work, built around your specific pattern. Training, nutrition timing, weekly coaching notes, and biology lessons, all built around the same pattern. Your body is still Depleted, but now the work is aimed straight at what is holding you.
        </p>
        <div style={{
          background: 'rgba(27, 109, 252,0.08)', border: '1px solid rgba(27, 109, 252,0.2)',
          borderRadius: '12px', padding: '20px 22px',
        }}>
          <p style={{ fontSize: '16px', color: '#1A1A1A', fontWeight: 700, margin: 0, lineHeight: 1.55 }}>
            New here and skipped the Challenge? No problem. A quick two-question check finds your pattern before your portal opens. Same result, same programme.
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
            Generic programmes push on the exact thing that is stuck.
          </h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '18px' }}>
            When a body stalls, it is stuck in a holding pattern. But that holding pattern is not the same for everyone. Cortisol-driven storage is nothing like insulin-driven storage, which is nothing like oestrogen-driven storage. What a Stress-Stored body needs to unstick is the opposite of what an Insulin-Drift body needs. Same plan, opposite result.
          </p>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '28px' }}>
            A generic programme gives everyone the same intensity, the same meal timing, the same number of sets. When your body has a specific pattern holding it, that one-size plan either does nothing or pulls the knot tighter. The Blueprint is built around your specific pattern instead. Training intensity, nutrition timing, weekly coaching, biology lessons. Four versions, because the plan has to match the pattern.
          </p>
          <div style={{
            background: 'rgba(27, 109, 252, 0.1)', border: '1px solid rgba(27, 109, 252, 0.25)',
            borderRadius: '12px', padding: '20px 22px',
          }}>
            <p style={{ fontSize: '17px', color: '#1A1A1A', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
              Your pattern sets the order. What to take off first. What to add first. How hard to push, and when.
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
          One of these is yours. The Blueprint is built to fix it.
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
            Most programmes push harder on what is already stuck. We take that off first. Then we build to your pattern.
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
            Each phase has a job. The order is not random. It follows how the body actually changes.
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
            Same six-week structure for all four patterns, but everything that matters is set to yours. Here is Week 1 for someone who is Stress-Stored.
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
            Start the fix
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '12px', lineHeight: 1.2, color: '#FFFFFF' }}>
            Six weeks. Built to your pattern. Done.
          </h2>
          <p style={{ fontSize: '16px', color: '#999999', marginBottom: '32px', lineHeight: 1.65 }}>
            One-time $97 AUD. Instant portal access. Do not know your pattern yet? A 2-minute check sorts it before you start.
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
          After two decades of writing training programmes, I kept seeing the same thing. The same programme worked for some bodies, did nothing for others, and made a few worse. Same plan. Different results. The bodies that did not respond were not broken. They had a specific pattern.
        </p>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '28px' }}>
          The 6-Week Body Rewire is built around that one observation. Four versions of the same six-week structure. Each one built around the hormone driving that pattern. The plan matches the pattern.
        </p>

        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5E5',
          borderLeft: '3px solid #1B6DFC',
          borderRadius: '14px', padding: '22px 24px',
        }}>
          <p style={{ fontSize: '16px', color: '#1A1A1A', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
            A generic plan is a guess. A plan built to your pattern is a read on what is actually happening. The Blueprint is that read, built into six weeks of work.
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
            The 6-Week Body Rewire is built for adults still in a Depleted State who now know their pattern. Fourteen days of reset is not enough on its own to bring a body out of Depleted. Six weeks of focused, pattern-specific work is the next step.
          </p>
          <p style={{ fontSize: '15px', color: '#1A1A1A', lineHeight: 1.7, marginBottom: '24px', fontWeight: 700 }}>
            If you are at a different stage, the right starting point is different.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
            {[
              {
                state: 'Don\'t know your pattern yet',
                desc: 'Start with the free 2-minute Body State Scorecard. It reads your state and points you to the free 14-Day Challenge if you are Depleted. By Day 14, the Body Decode Check-In shows you your pattern. Then you come back here.',
                cta: 'Start with the Scorecard',
                href: `${brand().performanceDomain}/scorecard?intent=challenge&source=blueprint_filter`,
              },
              {
                state: 'Past Depleted (Ready State)',
                desc: 'Your body is already responding. You do not need a six-week reset. You need the ongoing system that takes you from responding to really building.',
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
            If you are Depleted and you know your pattern, this is your starting point. Sign up below.
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{ width: '40px', height: '3px', background: '#1B6DFC', marginBottom: '28px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: '20px', color: '#1A1A1A' }}>
          Six concentrated weeks.<br />
          <span style={{ color: '#999999' }}>Your pattern. Fixed.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '36px' }}>
          $97 AUD. Instant portal access. Your pattern is mapped before Week 1. By Week 6 the thing holding your fat loss is gone and your body is ready to build. Then straight into the Membership, if you want it.
        </p>
        <CheckoutForm position="footer" />
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #E5E5E5', padding: '28px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '13px', color: '#999999', margin: 0 }}>
            &copy; {new Date().getFullYear()} {brand().name}. All rights reserved.
                                </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="/privacy" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>Terms</a>
            <a href={`mailto:${brand().supportEmail}`} style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </div>

    </div>
  )
}
