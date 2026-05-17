'use client'

import { useState, useRef } from 'react'

function SignupForm({ position, teal }: { position: string; teal?: boolean }) {
  const [form, setForm] = useState({ first_name: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.email.trim() || !form.phone.trim()) return
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
        background: 'rgba(20,184,166,0.08)',
        border: '1px solid rgba(20,184,166,0.3)',
        borderRadius: '16px',
        padding: '32px 28px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p style={{ fontSize: '20px', fontWeight: 800, color: '#1c1917', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          You are in.
        </p>
        <p style={{ fontSize: '15px', color: '#0f766e', lineHeight: 1.6, margin: 0 }}>
          Check your email for portal access. Daily coaching messages will arrive on your phone. Day 1 starts now.
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '15px 16px', borderRadius: '10px',
    border: teal ? '1px solid rgba(20,184,166,0.3)' : '1px solid #d6d3d1',
    background: teal ? 'rgba(255,255,255,0.7)' : '#ffffff',
    color: '#1c1917', fontSize: '15px', outline: 'none',
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
      <input
        type="tel"
        placeholder="Mobile number (for daily coaching messages)"
        value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        required
        style={inputStyle}
      />
      {error && (
        <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || !form.first_name.trim() || !form.email.trim() || !form.phone.trim()}
        style={{
          width: '100%', padding: '17px', borderRadius: '10px', border: 'none',
          background: submitting ? 'rgba(20,184,166,0.6)' : '#14b8a6',
          color: '#ffffff', fontSize: '16px', fontWeight: 800,
          cursor: submitting ? 'not-allowed' : 'pointer',
          letterSpacing: '0.01em', transition: 'background 0.2s',
          boxSizing: 'border-box',
        }}
      >
        {submitting ? 'Starting your challenge...' : 'Start My Free 14-Day Challenge'}
      </button>
      <p style={{ fontSize: '12px', color: '#a8a29e', textAlign: 'center', margin: 0 }}>
        Free. No credit card. Instant portal access.
      </p>
      <p style={{ fontSize: '12px', color: '#a8a29e', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
        By signing up you agree to our{' '}
        <a href="/privacy" style={{ color: '#0f766e', textDecoration: 'underline' }}>Privacy Policy</a>
        {' '}and{' '}
        <a href="/terms" style={{ color: '#0f766e', textDecoration: 'underline' }}>Terms</a>.
        You will receive challenge emails from Body Recode.
      </p>
    </form>
  )
}

const WHAT_YOU_GET = [
  {
    icon: '🏋️',
    title: '14-Day Training Plan',
    desc: 'Built for a body in a Depleted State, not a body that is already responding. Lower intensity by design. The job is to pull load, not add it.',
  },
  {
    icon: '🥗',
    title: 'Nutrition Guide',
    desc: 'Predictable food, predictable timing. The goal is to signal safety to a body that has been in protection mode. Not a diet. Not a deficit. A reset of the inputs.',
  },
  {
    icon: '☀️',
    title: 'Morning Reset Sequence',
    desc: 'The first 20 minutes of your day set the cortisol curve for everything that follows. This sequence brings cortisol down, not up. Five minutes, done before coffee.',
  },
  {
    icon: '🌙',
    title: 'Evening Rhythm Sequence',
    desc: 'Sleep is where depleted recovery happens. This is the sequence that gets your body into the deep recovery state it needs to start releasing, not just resting.',
  },
  {
    icon: '📋',
    title: 'Daily Coaching Notes',
    desc: 'One note from me each morning inside your portal. What is happening in your body that day, what to expect, and what to actually pay attention to. Sixty seconds.',
  },
  {
    icon: '🎥',
    title: 'Week One Progress Session',
    desc: 'Unlocks Day 5. Thirty minutes of me walking you through what your body has been doing for the first five days, why, and what to look for in week two.',
  },
  {
    icon: '🧬',
    title: 'Body Decode Check-In',
    desc: 'Unlocks Day 7. The full read. Eight biological markers, scored. Tells you exactly where your body sits, whether you are still Depleted, moving into Transitioning, or already Ready, and which pattern is holding the system.',
  },
  {
    icon: '📊',
    title: 'Body Decode Result',
    desc: 'Delivered automatically the moment you finish the Check-In. Your state. Why fat loss has stalled. The specific pattern your body is locked in. And the three things to actually do next.',
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
      background: '#fafaf9',
      color: '#1c1917',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* Nav */}
      <div style={{ padding: '20px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Teal glow top-right */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-120px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Teal glow bottom-left */}
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 64px' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)',
            borderRadius: '99px', padding: '7px 16px', marginBottom: '32px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#14b8a6' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Free 14-Day Challenge
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 7vw, 54px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.08,
            color: '#1c1917',
            marginBottom: '24px',
          }}>
            You're training. You're eating clean.
            <br />
            <span style={{ color: '#14b8a6' }}>The fat won't move.</span>
          </h1>

          {/* Divider line */}
          <div style={{ width: '48px', height: '3px', background: '#14b8a6', borderRadius: '2px', marginBottom: '24px' }} />

          <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '14px' }}>
            There is a specific reason your body has stopped responding to effort. It is not a discipline problem. It is biology. Your body has shifted into protection mode, and protection mode resists fat loss by design.
          </p>
          <p style={{ fontSize: '19px', color: '#57534e', lineHeight: 1.7, marginBottom: '40px' }}>
            If your energy is on the floor, you are relying on caffeine to function, and fat loss has been stalled for months, your body is in a Depleted State. The 14-Day Body Decode Challenge is built specifically for this. Fourteen days to lower the load, settle your system, and bring your body back online enough to be read properly. By Day 14 you know exactly what it needs next.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
            {[
              { value: '14', label: 'Days' },
              { value: 'Free', label: 'No credit card' },
              { value: 'Day 1', label: 'Instant access' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#ffffff', border: '1px solid #e7e5e0',
                borderRadius: '12px', padding: '16px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#14b8a6', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: '#a8a29e', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div ref={formRef}>
            <SignupForm position="hero" />
          </div>
        </div>
      </div>

      {/* SYMPTOMS */}
      <div style={{ maxWidth: '680px', margin: '64px auto 0', padding: '72px 24px', borderTop: '1px solid #e7e5e0' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          What you have been feeling
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '8px', color: '#1c1917' }}>
          These are not failures.
        </h2>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, color: '#a8a29e', marginBottom: '24px' }}>
          They are signals.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderTop: '1px solid #e7e5e0' }}>
          {[
            'Waking up puffy or swollen and unable to explain it',
            'Energy crashes by mid-afternoon despite a full night of sleep',
            'Caffeine has stopped working the way it used to',
            'Training consistently for months with no visible result',
            'Fat sitting in new places, especially stomach and waist',
            'Appetite and cravings that feel completely out of control',
            'Third or fourth attempt and watching it not land again',
          ].map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px 0',
              borderBottom: '1px solid #e7e5e0',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>⚡</span>
              <p style={{ fontSize: '16px', color: '#44403c', margin: 0, lineHeight: 1.4 }}>{item}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginTop: '32px', marginBottom: 0 }}>
          Every signal on this list points to one thing. Your body is in protection mode. Fat loss is the first thing the body shuts down under protection. Effort does not fix it. Conditions do.
        </p>
      </div>

      {/* REAL PROBLEM */}
      <div style={{
        background: '#f0fdfb',
        borderTop: '1px solid rgba(20,184,166,0.2)',
        borderBottom: '1px solid rgba(20,184,166,0.2)',
        marginTop: '72px',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            The real problem
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '20px', color: '#1c1917' }}>
            Your body has stopped losing fat. Here is why.
          </h2>
          <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '16px' }}>
            Most people whose fat loss has stalled are not lacking discipline. Their body has shifted into a state where it is actively resisting the inputs that used to work. This is biology, not weakness.
          </p>
          <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '16px' }}>
            At this level of stress and depletion, the body runs on cortisol. Metabolism gets suppressed. Fat goes to the storage zones, mainly stomach and waist, and stays there. The system is hanging on to everything because nothing in the environment is telling it that it is safe to release. Pushing harder confirms the threat. The harder you push, the tighter it holds.
          </p>
          <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '24px' }}>
            This is exactly why what you have tried before stopped producing. Whoever wrote that program was not reading your body. They were prescribing into a Depleted system. The standard answer of more training and less food is the wrong answer for a body in this state. It makes the depletion worse, not better.
          </p>
          <div style={{
            background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)',
            borderRadius: '12px', padding: '20px 22px',
          }}>
            <p style={{ fontSize: '17px', color: '#1c1917', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
              The solution is not more effort. It is the right conditions for your body to come out of protection mode and start releasing again.
            </p>
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
          No external apps. Everything lives in your challenge portal from the moment you sign up.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {WHAT_YOU_GET.map((item) => (
            <div key={item.title} style={{
              background: '#ffffff',
              border: '1px solid #e7e5e0',
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
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', marginBottom: '4px' }}>
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
        background: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
        borderTop: '1px solid rgba(20,184,166,0.25)',
        borderBottom: '1px solid rgba(20,184,166,0.25)',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '64px 24px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.25, color: '#134e4a' }}>
            Fourteen days. No deficit. No high intensity. Just the read.
          </h2>
          <p style={{ fontSize: '16px', color: '#0f766e', marginBottom: '28px', lineHeight: 1.6 }}>
            Free to join. Instant portal access. Daily coaching messages start the moment you sign up.
          </p>
          <SignupForm position="mid" teal />
        </div>
      </div>

      {/* ABOUT */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          The coach behind Body Recode
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '24px', color: '#1c1917' }}>
          Built from the same reset that helped me rebuild.
        </h2>

        {/* Photo */}
        <div style={{
          position: 'relative', borderRadius: '18px', overflow: 'hidden',
          marginBottom: '28px',
          boxShadow: '0 0 0 1px rgba(20,184,166,0.15), 0 24px 48px rgba(0,0,0,0.12)',
        }}>
          <img
            src="/kade.jpg"
            alt="Kade Dunstone"
            style={{ width: '100%', display: 'block', maxHeight: '460px', objectFit: 'cover', objectPosition: 'top center' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, rgba(12,10,9,0.88) 100%)',
          }} />
          <div style={{ position: 'absolute', bottom: '22px', left: '24px', right: '24px' }}>
            <p style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '0 0 3px' }}>Kade Dunstone</p>
            <p style={{ fontSize: '13px', color: '#14b8a6', margin: 0, fontWeight: 600 }}>
              Founder, Body Recode · Exercise Scientist · National and International Competitor
            </p>
          </div>
        </div>

        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '16px' }}>
          Body Recode was built during one of the hardest seasons of my life. My relationship ended, I stepped away from the business I had built, and the structure I had relied on disappeared overnight.
        </p>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '16px' }}>
          My body changed fast. I woke puffy. I held fat in new places. My appetite shifted. My energy dropped. None of it made sense after decades in fitness competing nationally and internationally. This was not a knowledge problem.
        </p>
        <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '24px' }}>
          It was biology. My hormones, sleep, nervous system, and appetite were reacting to instability. Pushing harder made everything worse.
        </p>
        <div style={{
          background: '#ffffff', border: '1px solid #e7e5e0',
          borderLeft: '3px solid #14b8a6',
          borderRadius: '14px', padding: '20px 22px',
        }}>
          <p style={{ fontSize: '16px', color: '#1c1917', fontWeight: 600, lineHeight: 1.65, margin: 0 }}>
            When I simplified everything and gave my body the right environment, it recalibrated. The patterns from that season became the foundation of Body Recode. I built this challenge for the Depleted State specifically because that is the state I came out of, and it is the state I can read and bring people out of more reliably than anything else.
          </p>
        </div>
      </div>

      {/* IS THIS FOR YOU - STATE FILTER */}
      <div style={{
        background: '#f5f4f0',
        borderTop: '1px solid #e7e5e0',
        borderBottom: '1px solid #e7e5e0',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Is this for you?
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '20px', color: '#1c1917' }}>
            This is built for a Depleted State.
          </h2>
          <p style={{ fontSize: '16px', color: '#57534e', lineHeight: 1.7, marginBottom: '20px' }}>
            The 14-Day Body Decode Challenge is built specifically for adults in a Depleted State. If your scorecard came back 5-8, this is your starting point. If you have not taken the scorecard yet, the symptoms above will tell you whether you are in the right place.
          </p>
          <p style={{ fontSize: '15px', color: '#1c1917', lineHeight: 1.7, marginBottom: '24px', fontWeight: 700 }}>
            If you are in a different state, the right starting point is different.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
            {[
              {
                state: 'Transitioning State (9-11)',
                desc: 'Your body has capacity but is not producing consistently. The $37 Body Decode Report is the faster fit. It tells you exactly which bottleneck is holding the system before you add any input.',
                cta: 'Get the Report',
                href: '/buy-report',
              },
              {
                state: 'Ready State (12-15)',
                desc: 'Your biology is already in position to respond. You do not need a reset. You need prescription. Apply for coaching.',
                cta: 'Apply for Coaching',
                href: '/book-a-conversation',
              },
              {
                state: "Don't know your state yet?",
                desc: 'Take the 2-minute scorecard first. It tells you which state you are in and which next step is built for you.',
                cta: 'Take the Scorecard',
                href: 'https://performance.bodyrecode.au/scorecard?source=challenge_filter',
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
            If you are Depleted, your starting point is right here. Sign up below.
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{ width: '40px', height: '3px', background: '#14b8a6', marginBottom: '28px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px', color: '#1c1917' }}>
          Fourteen days.<br />
          <span style={{ color: '#a8a29e' }}>Then you know.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#78716c', lineHeight: 1.7, marginBottom: '36px' }}>
          Free. Daily structure. A coach watching the markers that matter. By Day 14 you know exactly which state your body is in, what is holding it, and exactly what to do next. That is the cheapest, fastest answer I can give you right now.
        </p>
        <SignupForm position="footer" />
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
