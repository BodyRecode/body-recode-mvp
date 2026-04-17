'use client'

import { useState, useRef } from 'react'

function SignupForm({ position }: { position: string }) {
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
        border: '1px solid rgba(20,184,166,0.3)',
        borderRadius: '16px',
        padding: '32px 28px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'rgba(20,184,166,0.15)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          You are in.
        </p>
        <p style={{ fontSize: '14px', color: '#99d6d0', lineHeight: 1.6, margin: 0 }}>
          Check your email for your welcome message and portal access. Day 1 starts now.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input
        type="text"
        placeholder="First name"
        value={form.first_name}
        onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
        required
        style={{
          width: '100%', padding: '14px 16px', borderRadius: '10px',
          border: '1px solid #2a2826', background: '#1c1917',
          color: '#ffffff', fontSize: '15px', outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <input
        type="email"
        placeholder="Email address"
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        required
        style={{
          width: '100%', padding: '14px 16px', borderRadius: '10px',
          border: '1px solid #2a2826', background: '#1c1917',
          color: '#ffffff', fontSize: '15px', outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || !form.first_name.trim() || !form.email.trim()}
        style={{
          width: '100%', padding: '16px', borderRadius: '10px', border: 'none',
          background: '#14b8a6', color: '#0c0a09',
          fontSize: '15px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.6 : 1, boxSizing: 'border-box',
          letterSpacing: '0.01em',
        }}
      >
        {submitting ? 'Starting your challenge...' : 'Start My Free 14-Day Challenge'}
      </button>
      <p style={{ fontSize: '12px', color: '#57534e', textAlign: 'center', margin: 0 }}>
        Free. No credit card. Instant access.
      </p>
    </form>
  )
}

export default function ChallengePage() {
  const formRef = useRef<HTMLDivElement>(null)

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const s = {
    page: {
      minHeight: '100vh',
      background: '#0c0a09',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    } as React.CSSProperties,
    inner: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '0 24px',
    } as React.CSSProperties,
    section: {
      padding: '64px 0',
      borderBottom: '1px solid #1c1917',
    } as React.CSSProperties,
    label: {
      fontSize: '11px',
      fontWeight: 700,
      color: '#14b8a6',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      marginBottom: '16px',
    },
    h2: {
      fontSize: '26px',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.25,
      color: '#ffffff',
      marginBottom: '16px',
    } as React.CSSProperties,
    body: {
      fontSize: '16px',
      color: '#a8a29e',
      lineHeight: 1.7,
      marginBottom: '16px',
    } as React.CSSProperties,
    card: {
      background: '#111110',
      border: '1px solid #1c1917',
      borderRadius: '14px',
      padding: '20px 24px',
    } as React.CSSProperties,
  }

  return (
    <div style={s.page}>

      {/* Nav */}
      <div style={{ borderBottom: '1px solid #1c1917', padding: '20px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width="100" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      {/* Hero */}
      <div style={{ ...s.section, borderBottom: 'none', paddingBottom: '0' }}>
        <div style={s.inner}>
          <div style={{ width: '32px', height: '3px', background: '#14b8a6', marginBottom: '28px' }} />
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 38px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '20px',
            color: '#ffffff',
          }}>
            Your body is not broken.<br />
            It is stuck in the wrong state.
          </h1>
          <p style={{ fontSize: '18px', color: '#a8a29e', lineHeight: 1.65, marginBottom: '12px' }}>
            You are doing the work. You are not getting the result. That is not a discipline problem. That is a biology problem.
          </p>
          <p style={{ fontSize: '18px', color: '#a8a29e', lineHeight: 1.65, marginBottom: '40px' }}>
            The 14-Day Body Decode Challenge is a structured reset designed to lower biological noise, stabilise your energy, and let your body start responding again.
          </p>
          {/* Stats strip */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' as const }}>
            {[
              { value: '14', label: 'Days' },
              { value: 'Free', label: 'No credit card' },
              { value: 'Day 1', label: 'Instant access' },
            ].map(stat => (
              <div key={stat.label} style={{
                flex: '1 1 80px', background: '#111110', border: '1px solid #1c1917',
                borderRadius: '12px', padding: '16px 20px',
              }}>
                <p style={{ fontSize: '20px', fontWeight: 900, color: '#14b8a6', margin: '0 0 2px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                <p style={{ fontSize: '12px', color: '#57534e', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div ref={formRef}>
            <SignupForm position="hero" />
          </div>
        </div>
      </div>

      {/* What you have been feeling */}
      <div style={{ ...s.section, marginTop: '64px' }}>
        <div style={s.inner}>
          <p style={s.label}>What you have been feeling</p>
          <h2 style={s.h2}>These are not failures. They are signals.</h2>
          <p style={s.body}>
            If you have been experiencing any of this, your biology is asking for something different, not more effort.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
            {[
              'Waking up puffy or swollen',
              'Energy that crashes in the afternoon',
              'Tired even after a full night of sleep',
              'Training consistently with no visible change',
              'Appetite and cravings that feel out of control',
              'A body that feels harder and harder to manage',
              'Constantly starting over',
            ].map(item => (
              <div key={item} style={{ ...s.card, display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#14b8a6', flexShrink: 0 }} />
                <p style={{ fontSize: '15px', color: '#d4cfc9', margin: 0, lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The real problem */}
      <div style={s.section}>
        <div style={s.inner}>
          <p style={s.label}>The real problem</p>
          <h2 style={s.h2}>Your biology is protecting you, not resisting you.</h2>
          <p style={s.body}>
            Most people who struggle with their body are not lacking discipline. They are stuck in patterns their biology cannot stabilise on its own.
          </p>
          <p style={s.body}>
            When your rhythm collapses, inflammation rises, fluid retention increases, energy becomes unpredictable, and your body shifts into protection mode. Pushing harder makes it worse, not better.
          </p>
          <p style={{ ...s.body, color: '#d4cfc9', fontWeight: 600 }}>
            The solution is not more effort. It is the right environment for your system to recalibrate.
          </p>
        </div>
      </div>

      {/* Why this works */}
      <div style={s.section}>
        <div style={s.inner}>
          <p style={s.label}>Why this works</p>
          <h2 style={s.h2}>Small structure creates measurable change.</h2>
          <p style={s.body}>
            The 14-Day Body Decode Challenge lowers biological noise through predictable structure. You are not overhauling your entire life. You are moving through a steady rhythm of intentional movement, simple whole foods, morning grounding, and evening downshifting.
          </p>
          <p style={s.body}>
            When your system experiences consistency, it recalibrates. The inflammation settles. The fluid drops. The energy stabilises. Your body starts responding again.
          </p>
          <p style={{ ...s.body, color: '#d4cfc9', fontWeight: 600 }}>
            This is a rhythm reset, not an intensity challenge.
          </p>
        </div>
      </div>

      {/* What you get */}
      <div style={s.section}>
        <div style={s.inner}>
          <p style={s.label}>What is inside the 14 days</p>
          <h2 style={s.h2}>Everything delivered to your portal on Day 1.</h2>
          <p style={s.body}>
            No external apps. No WhatsApp groups. Everything lives in your challenge portal, accessible the moment you sign up.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '28px' }}>
            {[
              { title: '14-Day Training Plan', desc: 'Session-by-session structure designed to lower tension, stabilise energy, and support recovery. Not high intensity.' },
              { title: 'Nutrition Guide', desc: 'Simple whole foods, predictable meal timing, and digestion-friendly choices that calm your system rather than overwhelm it.' },
              { title: 'Morning Reset Sequence', desc: 'A short morning protocol to prime your nervous system and set a stable rhythm for the day.' },
              { title: 'Evening Rhythm Sequence', desc: 'An evening wind-down sequence to support sleep quality and overnight recovery.' },
              { title: 'Daily Coaching Notes', desc: 'Short daily notes delivered inside your portal each morning for 14 days. Context, focus, and guidance for each day of the challenge.' },
              { title: 'Mini Hormone Quiz', desc: 'Complete on Day 7 inside your portal. Helps identify the patterns shaping your biology.' },
              { title: 'Mini Hormone Report', desc: 'Your personalised quiz result delivered automatically. Your first look at what your body is telling you.' },
            ].map(item => (
              <div key={item.title} style={s.card}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#14b8a6', marginBottom: '6px', letterSpacing: '0.01em' }}>
                  {item.title}
                </p>
                <p style={{ fontSize: '14px', color: '#78716c', lineHeight: 1.6, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mid-page CTA */}
      <div style={{ ...s.section, background: '#0d2d29', border: 'none' }}>
        <div style={s.inner}>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '24px', lineHeight: 1.3 }}>
            14 days. No pressure. Just clarity.
          </p>
          <SignupForm position="mid" />
        </div>
      </div>

      {/* About Kade */}
      <div style={s.section}>
        <div style={s.inner}>
          <p style={s.label}>The coach behind Body Recode</p>
          <h2 style={s.h2}>Built from the same reset that helped me rebuild.</h2>

          {/* Photo */}
          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '28px' }}>
            <img
              src="/kade.jpg"
              alt="Kade Dunstone — Body Recode"
              style={{ width: '100%', display: 'block', filter: 'brightness(0.92)' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(12,10,9,0.95) 0%, rgba(12,10,9,0.4) 60%, transparent 100%)',
              padding: '32px 24px 20px',
            }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                Kade Dunstone
              </p>
              <p style={{ fontSize: '13px', color: '#14b8a6', margin: 0, fontWeight: 600 }}>
                Founder, Body Recode · Exercise Scientist · National and International Competitor
              </p>
            </div>
          </div>

          <p style={s.body}>
            Body Recode was built during one of the hardest seasons of my life. My relationship ended, I stepped away from the business I had built, and the structure I had relied on disappeared overnight.
          </p>
          <p style={s.body}>
            My body changed fast. I woke puffy. I held fat in new places. My appetite shifted. My energy dropped. And none of it made sense, because I had spent decades in fitness and competed nationally and internationally. This was not a knowledge problem.
          </p>
          <p style={s.body}>
            It was biology. My hormones, sleep, nervous system, and appetite were reacting to instability. Pushing harder made everything worse.
          </p>
          <p style={{ ...s.body, color: '#d4cfc9' }}>
            When I simplified everything and gave my body the right environment, it recalibrated. The patterns from that season became the foundation of Body Recode. This challenge is built from the same structure that helped me come back.
          </p>
        </div>
      </div>

      {/* Who this is for */}
      <div style={s.section}>
        <div style={s.inner}>
          <p style={s.label}>Who this is for</p>
          <h2 style={s.h2}>This challenge is for adults who are done pushing harder.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', marginBottom: '28px' }}>
            {[
              'You are doing the work and your body is not responding',
              'You want to feel more like yourself again',
              'You want stable energy without relying on caffeine',
              'You want to break the restart cycle for good',
              'You are not looking for extreme dieting or high-intensity programs',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p style={{ fontSize: '15px', color: '#d4cfc9', margin: 0, lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ ...s.section, borderBottom: 'none', paddingBottom: '80px' }}>
        <div style={s.inner}>
          <div style={{ width: '32px', height: '3px', background: '#14b8a6', marginBottom: '24px' }} />
          <h2 style={{ ...s.h2, fontSize: '28px' }}>
            Rebuild your rhythm.<br />Let your body respond again.
          </h2>
          <p style={{ ...s.body, marginBottom: '32px' }}>
            When your rhythm returns, your system becomes more responsive and your body begins to shift. This challenge gives your biology the environment it needs to settle and reset.
          </p>
          <SignupForm position="footer" />
        </div>
      </div>

    </div>
  )
}
