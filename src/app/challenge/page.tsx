'use client'

import { useState, useRef } from 'react'

function SignupForm({ position, dark }: { position: string; dark?: boolean }) {
  const [form, setForm] = useState({ first_name: '', email: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.email.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/challenge/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, position }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{
        background: '#0d2d29',
        border: '1px solid rgba(20,184,166,0.4)',
        borderRadius: '16px',
        padding: '32px 28px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          You are in.
        </p>
        <p style={{ fontSize: '15px', color: '#99d6d0', lineHeight: 1.6, margin: 0 }}>
          Check your email for your welcome message and portal access. Day 1 starts now.
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '15px 16px', borderRadius: '10px',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #2a2826',
    background: dark ? 'rgba(255,255,255,0.07)' : '#1c1917',
    color: '#ffffff', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="First name"
          value={form.first_name}
          onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
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
      {error && (
        <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || !form.first_name.trim() || !form.email.trim()}
        style={{
          width: '100%', padding: '17px', borderRadius: '10px', border: 'none',
          background: submitting ? 'rgba(20,184,166,0.6)' : '#14b8a6',
          color: '#0c0a09', fontSize: '16px', fontWeight: 800,
          cursor: submitting ? 'not-allowed' : 'pointer',
          letterSpacing: '0.01em', transition: 'background 0.2s',
          boxSizing: 'border-box',
        }}
      >
        {submitting ? 'Starting your challenge...' : 'Start My Free 14-Day Challenge'}
      </button>
      <p style={{ fontSize: '12px', color: dark ? 'rgba(255,255,255,0.35)' : '#57534e', textAlign: 'center', margin: 0 }}>
        Free. No credit card. Instant portal access.
      </p>
    </form>
  )
}

const WHAT_YOU_GET = [
  {
    icon: '🏋️',
    title: '14-Day Training Plan',
    desc: 'Session-by-session structure to lower tension, stabilise energy, and support recovery. Not high intensity.',
  },
  {
    icon: '🥗',
    title: 'Nutrition Guide',
    desc: 'Simple whole foods and predictable meal timing that calms your system rather than overwhelms it.',
  },
  {
    icon: '☀️',
    title: 'Morning Reset Sequence',
    desc: 'A short morning protocol to prime your nervous system and set a stable rhythm for the day.',
  },
  {
    icon: '🌙',
    title: 'Evening Rhythm Sequence',
    desc: 'A wind-down routine to support sleep quality and overnight recovery.',
  },
  {
    icon: '📋',
    title: 'Daily Coaching Notes',
    desc: 'Short daily notes delivered inside your portal each morning. Context and focus for every day of the challenge.',
  },
  {
    icon: '🧬',
    title: 'Mini Hormone Quiz',
    desc: 'Complete on Day 7 inside your portal. Identifies the patterns shaping your biology.',
  },
  {
    icon: '📊',
    title: 'Mini Hormone Report',
    desc: 'Your personalised quiz result delivered automatically. Your first look at what your body is telling you.',
  },
]

export default function ChallengePage() {
  const formRef = useRef<HTMLDivElement>(null)

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0c0a09',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* Nav */}
      <div style={{ padding: '20px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width="100" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Teal glow top-right */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-120px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Teal glow bottom-left */}
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 64px' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.25)',
            borderRadius: '99px', padding: '7px 16px', marginBottom: '32px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#14b8a6' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Free 14-Day Challenge
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 7vw, 54px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.08,
            marginBottom: '24px',
          }}>
            Your body is not broken.
            <br />
            <span style={{ color: '#14b8a6' }}>It is stuck in the wrong state.</span>
          </h1>

          {/* Divider line */}
          <div style={{ width: '48px', height: '3px', background: '#14b8a6', borderRadius: '2px', marginBottom: '24px' }} />

          <p style={{ fontSize: '19px', color: '#a8a29e', lineHeight: 1.7, marginBottom: '14px' }}>
            You are doing the work. You are not getting the result. That is not a discipline problem. That is a biology problem.
          </p>
          <p style={{ fontSize: '19px', color: '#a8a29e', lineHeight: 1.7, marginBottom: '40px' }}>
            The 14-Day Body Decode Challenge is a structured reset designed to lower biological noise, stabilise your energy, and let your body start responding again.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
            {[
              { value: '14', label: 'Days' },
              { value: 'Free', label: 'No credit card' },
              { value: 'Day 1', label: 'Instant access' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#111110', border: '1px solid #1c1917',
                borderRadius: '12px', padding: '16px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#14b8a6', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: '#57534e', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div ref={formRef}>
            <SignupForm position="hero" />
          </div>
        </div>
      </div>

      {/* SYMPTOMS */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px', borderTop: '1px solid #1c1917', marginTop: '64px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          What you have been feeling
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '8px' }}>
          These are not failures.
        </h2>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, color: '#57534e', marginBottom: '24px' }}>
          They are signals.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderTop: '1px solid #1c1917' }}>
          {[
            'Waking up puffy or swollen',
            'Energy that crashes in the afternoon',
            'Tired even after a full night of sleep',
            'Training consistently with no visible change',
            'Appetite and cravings that feel out of control',
            'A body that feels harder and harder to manage',
            'Constantly starting over',
          ].map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px 0',
              borderBottom: '1px solid #1c1917',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>⚡</span>
              <p style={{ fontSize: '16px', color: '#d4cfc9', margin: 0, lineHeight: 1.4 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* REAL PROBLEM */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1f1d 0%, #0f1a19 100%)',
        borderTop: '1px solid rgba(20,184,166,0.15)',
        borderBottom: '1px solid rgba(20,184,166,0.15)',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            The real problem
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '20px' }}>
            Your biology is protecting you, not resisting you.
          </h2>
          <p style={{ fontSize: '16px', color: '#a8a29e', lineHeight: 1.7, marginBottom: '16px' }}>
            Most people who struggle with their body are not lacking discipline. They are stuck in patterns their biology cannot stabilise on its own.
          </p>
          <p style={{ fontSize: '16px', color: '#a8a29e', lineHeight: 1.7, marginBottom: '24px' }}>
            When your rhythm collapses, inflammation rises, fluid retention increases, energy becomes unpredictable, and your body shifts into protection mode. Pushing harder makes it worse, not better.
          </p>
          <div style={{
            background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)',
            borderRadius: '12px', padding: '20px 22px',
          }}>
            <p style={{ fontSize: '17px', color: '#ffffff', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
              The solution is not more effort. It is the right environment for your system to recalibrate.
            </p>
          </div>
        </div>
      </div>

      {/* WHAT YOU GET */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          What is inside
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '8px' }}>
          Everything delivered to your portal on Day 1.
        </h2>
        <p style={{ fontSize: '16px', color: '#78716c', lineHeight: 1.7, marginBottom: '28px' }}>
          No external apps. No WhatsApp groups. Everything lives in your challenge portal from the moment you sign up.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {WHAT_YOU_GET.map((item, i) => (
            <div key={item.title} style={{
              background: '#111110',
              border: '1px solid #1c1917',
              borderRadius: '12px',
              padding: '18px 20px',
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
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                  {item.title}
                </p>
                <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.6, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MID CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #0d2d29 0%, #0a2320 100%)',
        borderTop: '1px solid rgba(20,184,166,0.2)',
        borderBottom: '1px solid rgba(20,184,166,0.2)',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '64px 24px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.25 }}>
            14 days. No pressure. Just clarity.
          </h2>
          <p style={{ fontSize: '16px', color: '#99d6d0', marginBottom: '28px', lineHeight: 1.6 }}>
            Free to join. Instant access. Start whenever you are ready.
          </p>
          <SignupForm position="mid" dark />
        </div>
      </div>

      {/* ABOUT */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          The coach behind Body Recode
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '24px' }}>
          Built from the same reset that helped me rebuild.
        </h2>

        {/* Photo */}
        <div style={{
          position: 'relative', borderRadius: '18px', overflow: 'hidden',
          marginBottom: '28px',
          boxShadow: '0 0 0 1px rgba(20,184,166,0.12), 0 24px 48px rgba(0,0,0,0.5)',
        }}>
          <img
            src="/kade.jpg"
            alt="Kade Dunstone"
            style={{ width: '100%', display: 'block', maxHeight: '460px', objectFit: 'cover', objectPosition: 'top center', filter: 'brightness(0.9)' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, rgba(12,10,9,0.92) 100%)',
          }} />
          <div style={{ position: 'absolute', bottom: '22px', left: '24px', right: '24px' }}>
            <p style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '0 0 3px' }}>Kade Dunstone</p>
            <p style={{ fontSize: '13px', color: '#14b8a6', margin: 0, fontWeight: 600 }}>
              Founder, Body Recode · Exercise Scientist · National and International Competitor
            </p>
          </div>
        </div>

        <p style={{ fontSize: '16px', color: '#a8a29e', lineHeight: 1.7, marginBottom: '16px' }}>
          Body Recode was built during one of the hardest seasons of my life. My relationship ended, I stepped away from the business I had built, and the structure I had relied on disappeared overnight.
        </p>
        <p style={{ fontSize: '16px', color: '#a8a29e', lineHeight: 1.7, marginBottom: '16px' }}>
          My body changed fast. I woke puffy. I held fat in new places. My appetite shifted. My energy dropped. None of it made sense after decades in fitness competing nationally and internationally. This was not a knowledge problem.
        </p>
        <p style={{ fontSize: '16px', color: '#a8a29e', lineHeight: 1.7, marginBottom: '24px' }}>
          It was biology. My hormones, sleep, nervous system, and appetite were reacting to instability. Pushing harder made everything worse.
        </p>
        <div style={{
          background: '#111110', border: '1px solid #1c1917',
          borderLeft: '3px solid #14b8a6',
          borderRadius: '14px', padding: '20px 22px',
        }}>
          <p style={{ fontSize: '16px', color: '#d4cfc9', fontWeight: 600, lineHeight: 1.65, margin: 0 }}>
            When I simplified everything and gave my body the right environment, it recalibrated. The patterns from that season became the foundation of Body Recode. This challenge is built from the same structure that helped me come back.
          </p>
        </div>
      </div>

      {/* WHO THIS IS FOR */}
      <div style={{
        background: '#111110',
        borderTop: '1px solid #1c1917',
        borderBottom: '1px solid #1c1917',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Who this is for
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '24px' }}>
            For adults who are done pushing harder and getting less.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'You are doing the work and your body is not responding',
              'You want to feel more like yourself again',
              'You want stable energy without relying on caffeine',
              'You want to break the restart cycle for good',
              'You are not looking for extreme dieting or high-intensity programs',
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
                <p style={{ fontSize: '16px', color: '#d4cfc9', margin: 0, lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{ width: '40px', height: '3px', background: '#14b8a6', marginBottom: '28px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px' }}>
          Rebuild your rhythm.<br />
          <span style={{ color: '#57534e' }}>Let your body respond again.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#78716c', lineHeight: 1.7, marginBottom: '36px' }}>
          When your rhythm returns, your system becomes more responsive and your body begins to shift. This challenge gives your biology the environment it needs to settle and reset.
        </p>
        <SignupForm position="footer" />
      </div>

    </div>
  )
}
