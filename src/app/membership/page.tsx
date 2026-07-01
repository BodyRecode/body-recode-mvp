'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Salad, Video, Users, Library, LineChart, BarChart3, FileText } from 'lucide-react'
import { isProductLive } from '@/lib/product-launch'
import { WaitlistCTA } from '@/components/product-waitlist-cta'
import { coach, logoUrl, brand } from '@/config/tenant'

function CheckoutForm({ position, teal, darkBg }: { position: string; teal?: boolean; darkBg?: boolean }) {
  // Pre-launch: capture waitlist instead of Stripe checkout until NEXT_PUBLIC_MEMBERSHIP_LIVE=true.
  if (!isProductLive('membership')) {
    return <WaitlistCTA product="membership" productName="Body Recode Membership" position={position} darkBg={darkBg} />
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
        {loading ? 'Redirecting to checkout...' : 'Join the Membership · $49 per week'}
      </button>
      <p style={{ fontSize: '12px', color: darkBg ? '#999999' : '#999999', textAlign: 'center', margin: 0 }}>
        Secure checkout via Stripe. Billed weekly. Cancel anytime.
      </p>
    </form>
  )
}

const WHAT_YOU_GET = [
  {
    icon: Video,
    title: 'Monthly coach Loom',
    timing: 'Monthly',
    featured: true,
    desc: 'Once a month I review your check-in data and record a personal 3 to 5 minute Loom for you. Not a generic email. Specific to your numbers. What is shifting, what needs adjusting, what to watch for in the next block.',
  },
  {
    icon: Dumbbell,
    title: 'Progressive training blocks',
    timing: 'Every 6 weeks',
    featured: true,
    desc: 'Block A picks up from your locked foundation. Every six weeks a new block unlocks. More demanding movement patterns, more sophisticated programming. Gym, home with dumbbells, or bodyweight. All three versions every session.',
  },
  {
    icon: Salad,
    title: 'Nutrition layer updates',
    timing: 'Every block',
    featured: false,
    desc: 'The HABNS foundation stays. Each block adds a new precision layer matched to your pattern. Carb cycling, cycle-aware eating, recovery nutrition protocols.',
  },
  {
    icon: Users,
    title: 'Monthly group Q&A call',
    timing: 'Monthly',
    featured: false,
    desc: 'Live once a month. I answer the questions that come up most across the membership that month. Replays available in your portal.',
  },
  {
    icon: Library,
    title: 'Pattern resource library',
    timing: 'Growing',
    featured: false,
    desc: 'Deep-dive guides built for your specific pattern. Supplement protocols, sleep strategies, stress management tools, and lifestyle adjustments. New material added every block.',
  },
  {
    icon: LineChart,
    title: 'Check-in trend dashboard',
    timing: 'Weekly',
    featured: false,
    desc: 'Your weekly check-in data visualised over time. Energy, sleep, recovery, fat loss, and mood markers across 6, 12, and 18 weeks. The arc becomes visible in the data.',
  },
]

const BLOCKS = [
  {
    label: 'Foundation',
    weeks: 'Pattern locked',
    status: 'complete',
    desc: 'Your pattern is identified and the body is out of acute compensation. Via the 6-Week Blueprint if you have done it, or calibrated from your intake if you are starting here. Locked before Block A either way.',
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
    colour: '#DC2626',
    driver: 'Cortisol driver',
    signal: 'Abdominal fat, morning puffiness, afternoon crashes. Wired and tired.',
    blockA: 'Cortisol anchor evening meal introduced. Caffeine cutoff tightened to 10am. Post-training carb window widens as training demand increases. Zone 2 only.',
  },
  {
    name: 'Insulin-Drift',
    colour: '#B7791F',
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
    colour: '#1B6DFC',
    driver: 'Testosterone driver',
    signal: 'Reduced muscle tone, reduced drive, capacity slipping despite consistent effort.',
    blockA: 'Protein anchored at 2.0 to 2.2 g/kg. Dietary fat protected (low-fat suppresses testosterone). Magnesium and zinc inputs prioritised. Resistance training stimulus retained, total volume controlled.',
  },
]

export default function MembershipPage() {
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
              Body Recode Membership
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
            You do the work.
            <br />
            The results come.
            <br />
            <span style={{ color: '#1B6DFC' }}>They never last.</span>
          </h1>

          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '32px' }} />

          {/* Explainer video placeholder. Branded video frame with a play
              button + "Coming soon" treatment — reads as intentional
              production-in-progress, not as broken. Mirrors the
              treatment on /blueprint and /challenge. Replace this block
              with the real <video> element + poster image when
              production delivers. */}
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
                How the Membership works
              </p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8A8A8E', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                Coming soon
              </p>
            </div>
          </div>

          <p style={{ fontSize: '19px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '14px' }}>
            Most programmes deliver the work for a fixed window. Six weeks. Twelve weeks. Three months. The window closes, the structure disappears, and the body slowly returns to where it was.
          </p>
          <p style={{ fontSize: '19px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '40px' }}>
            The Body Recode Membership is the infrastructure for the long arc. Block by block. Pattern continuity. A monthly Loom from me reading your check-in data. $49 per week. Cancel anytime.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
            {[
              { value: '6-week', label: 'Rotating blocks' },
              { value: '$49', label: 'Per week' },
              { value: 'Cancel', label: 'Anytime' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#ffffff', border: '1px solid #E5E5E5',
                borderRadius: '12px', padding: '16px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#1B6DFC', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: '#4A4A4A', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div ref={formRef}>
            <CheckoutForm position="hero" />
          </div>
        </div>
      </div>

      {/* WHAT THIS IS */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px 0', borderTop: '1px solid #E5E5E5' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
          What this is
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '14px', color: '#1A1A1A' }}>
          Not a restart. A continuation.
        </h2>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '24px' }}>
          If you have done the Blueprint, the Membership picks up exactly where it ended. If you are starting here, your intake locks your pattern first, then Block A begins. Either way your portal opens and the progression continues without a gap.
        </p>
        <div style={{
          background: 'rgba(27, 109, 252,0.08)', border: '1px solid rgba(27, 109, 252,0.2)',
          borderRadius: '12px', padding: '20px 22px',
        }}>
          <p style={{ fontSize: '16px', color: '#1A1A1A', fontWeight: 700, margin: 0, lineHeight: 1.55 }}>
            This is not a content library you subscribe to. It is an ongoing coaching system that uses your weekly check-in data to track whether the work is landing.
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
            Why this works
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: '#1A1A1A' }}>
            State shift is a months-long arc, not a six-week event.
          </h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '18px' }}>
            Correcting the pattern brings the body out of acute compensation, whether that happens in the Blueprint or in your first weeks here. But moving from Depleted to Transitioning takes months of consistent inputs landing on a stable system. Moving from Transitioning to Ready takes longer. The arc that follows pattern correction needs infrastructure.
          </p>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '28px' }}>
            Block A is calibrated to a body still consolidating. Block B steps up the load as the body comes online. Block C compounds. Pattern continuity carries every block. Your weekly check-in data calibrates the work as your state shifts. This is what most subscriptions miss. They deliver content. The Membership delivers calibration.
          </p>
          <div style={{
            background: 'rgba(27, 109, 252, 0.1)', border: '1px solid rgba(27, 109, 252, 0.25)',
            borderRadius: '12px', padding: '20px 22px',
          }}>
            <p style={{ fontSize: '17px', color: '#1A1A1A', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
              Most subscriptions are content libraries. This is an ongoing coaching system that uses your data to calibrate the work as your state shifts.
            </p>
          </div>
        </div>
      </div>

      {/* PROGRESSION */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px 0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
          The progression
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '28px', color: '#1A1A1A' }}>
          Twenty-four weeks. Four blocks. Pattern reassessment at the end.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {BLOCKS.map((block) => (
            <div key={block.label} style={{
              background: '#ffffff', border: '1px solid #E5E5E5',
              borderLeft: `4px solid ${block.status === 'complete' ? '#999999' : block.status === 'active' ? '#1B6DFC' : '#E5E5E5'}`,
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: block.status === 'complete' ? '#999999' : '#1A1A1A' }}>{block.label}</span>
                <span style={{ fontSize: '12px', color: '#4A4A4A' }}>{block.weeks}</span>
                {block.status === 'complete' && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#4A4A4A', background: '#F7F7F7', padding: '2px 8px', borderRadius: '99px' }}>Complete</span>
                )}
                {block.status === 'active' && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1056D6', background: 'rgba(27, 109, 252,0.1)', padding: '2px 8px', borderRadius: '99px' }}>Starts here</span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, margin: 0 }}>{block.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* WHAT YOU GET */}
      <div style={{
        background: '#F7F7F7',
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5',
        marginTop: '72px',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            What is included
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '10px', color: '#1A1A1A' }}>
            Six things. All inside your portal.
          </h2>
          <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '28px' }}>
            No external apps. No separate logins. Everything lives in the portal you already know.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {WHAT_YOU_GET.map((item) => {
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
            Most subscriptions deliver content. This one delivers calibration.
          </h2>
        </div>
      </div>

      {/* PATTERN BLOCK A PREVIEW */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px 0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Block A by pattern
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: '#1A1A1A' }}>
          What changes in your first membership block.
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
                <span style={{ fontSize: '12px', color: '#4A4A4A' }}>· {p.driver}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#3A3A3A', lineHeight: 1.6, margin: '0 0 10px', fontWeight: 600 }}>{p.signal}</p>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#1056D6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Block A prescription</p>
              <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, margin: 0 }}>{p.blockA}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MID CTA */}
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
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Start the long arc
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '12px', lineHeight: 1.2, color: '#FFFFFF' }}>
            Same portal. Block by block. Calibrated to your data.
          </h2>
          <p style={{ fontSize: '16px', color: '#999999', marginBottom: '32px', lineHeight: 1.65 }}>
            $49 per week. Cancel anytime. Your pattern continuity carries through. Block A loads from your locked foundation the moment you join.
          </p>
          <CheckoutForm position="mid" darkBg />
        </div>
      </div>

      {/* FOUNDER */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Why an ongoing system
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '28px', color: '#1A1A1A' }}>
          The gains people lose are the gains they had no system to keep.
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
              // Source kade-11 is 561x701 (4:5). Match the frame so the
              // image renders in full — head + body, nothing cropped.
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
          Over two decades of coaching, the same pattern. People do a programme. Get good results. Then go back to guessing. The system that produced the gains is gone the day the programme ends. Six months later they are back where they started.
        </p>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '28px' }}>
          The Membership is the answer to that observation. The gains stay because the system that produces them continues. Block by block. Calibrated to your data. Pattern continuity through every block.
        </p>

        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5E5',
          borderLeft: '3px solid #1B6DFC',
          borderRadius: '14px', padding: '22px 24px',
        }}>
          <p style={{ fontSize: '16px', color: '#1A1A1A', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
            The compound effect requires infrastructure. The Membership is the infrastructure.
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
            For anyone with their pattern read, anywhere on the state arc.
          </h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '20px' }}>
            The Membership is the long-arc infrastructure. It works whether you are still consolidating out of Depleted, building through Transitioning, or compounding in Ready. The Block A nutrition and training calibrate to where you are. Pattern continuity carries through.
          </p>
          <p style={{ fontSize: '15px', color: '#1A1A1A', lineHeight: 1.7, marginBottom: '24px', fontWeight: 700 }}>
            What you do need first: your pattern. If you have not had your pattern read yet, the right starting point is different.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
            {[
              {
                state: 'No pattern read yet',
                desc: 'Start with the free 2-minute Body State Scorecard. It captures your state and routes you into the free 14-Day Challenge if you are Depleted. Day 7 Check-In identifies your pattern. Day 14 Result tells you which one. Then come back here ready.',
                cta: 'Start with the Scorecard',
                href: `${brand().performanceDomain}/scorecard?intent=challenge&source=membership_filter`,
              },
              {
                state: 'Want focused six weeks first',
                desc: 'The 6-Week Body Rewire Blueprint is concentrated pattern correction. $97 one-time. By Week 6 the pattern is corrected and the Membership becomes the natural ascension.',
                cta: 'Start with the Blueprint',
                href: '/blueprint',
              },
              {
                state: "Don't know your state yet?",
                desc: 'Take the 2-minute scorecard first. It tells you which state you are in and which next step is built for you.',
                cta: 'Take the Scorecard',
                href: `${brand().performanceDomain}/scorecard?source=membership_filter`,
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
            If your pattern is read, your starting point is right here. Sign up below.
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{ width: '40px', height: '3px', background: '#1B6DFC', marginBottom: '28px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: '20px', color: '#1A1A1A' }}>
          The long arc.<br />
          <span style={{ color: '#4A4A4A' }}>Block by block. Calibrated to your data.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '36px' }}>
          $49 per week. Cancel anytime. Block A loads from your locked foundation the moment you join. A monthly Loom from me reading your check-in data. The infrastructure for the state shift.
        </p>
        <CheckoutForm position="footer" />
        <p style={{ fontSize: '13px', color: '#4A4A4A', marginTop: '20px', lineHeight: 1.6 }}>
          Already a Blueprint member? Your portal upgrades automatically on sign-up, no new login. New here? Your portal opens on sign-up and Block A calibrates from your intake.
        </p>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #E5E5E5', padding: '28px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '13px', color: '#4A4A4A', margin: 0 }}>
            &copy; {new Date().getFullYear()} Body Recode. All rights reserved.
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
