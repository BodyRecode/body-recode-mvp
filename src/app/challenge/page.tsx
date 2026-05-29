'use client'

import { useState, useRef } from 'react'
import { Dumbbell, Salad, Sunrise, Moon, FileText, Video, Activity, LineChart, ChevronRight, Zap } from 'lucide-react'

function SignupForm({ position, teal, darkBg }: { position: string; teal?: boolean; darkBg?: boolean }) {
  const [form, setForm] = useState({ first_name: '', email: '', phone: '', gender: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.email.trim() || !form.phone.trim() || !form.gender) return
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
        background: 'rgba(27, 109, 252,0.08)',
        border: '1px solid rgba(27, 109, 252,0.3)',
        borderRadius: '16px',
        padding: '32px 28px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'rgba(27, 109, 252,0.15)', border: '1px solid rgba(27, 109, 252,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B6DFC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          You are in.
        </p>
        <p style={{ fontSize: '15px', color: '#1056D6', lineHeight: 1.6, margin: 0 }}>
          Check your email for portal access. Daily coaching messages will arrive on your phone. Day 1 starts now.
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '15px 16px', borderRadius: '10px',
    border: teal ? '1px solid rgba(27, 109, 252,0.3)' : '1px solid #D4D4D4',
    background: teal ? 'rgba(255,255,255,0.7)' : '#ffffff',
    color: '#1A1A1A', fontSize: '15px', outline: 'none',
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
      <select
        value={form.gender}
        onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
        required
        style={{
          ...inputStyle,
          color: form.gender ? '#1A1A1A' : '#999999',
          appearance: 'none',
          backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2378716c\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'/></svg>")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 16px center',
          backgroundSize: '12px',
          paddingRight: '40px',
        }}
      >
        <option value="" disabled>Biological sex (required for accurate pattern read)</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="prefer_not_to_say">Prefer not to say</option>
      </select>
      {error && (
        <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || !form.first_name.trim() || !form.email.trim() || !form.phone.trim() || !form.gender}
        style={{
          width: '100%', padding: '17px', borderRadius: '10px', border: 'none',
          background: submitting ? 'rgba(27, 109, 252,0.6)' : '#1B6DFC',
          color: '#ffffff', fontSize: '16px', fontWeight: 800,
          cursor: submitting ? 'not-allowed' : 'pointer',
          letterSpacing: '0.01em', transition: 'background 0.2s',
          boxSizing: 'border-box',
        }}
      >
        {submitting ? 'Starting your challenge...' : 'Start My Free 14-Day Challenge'}
      </button>
      <p style={{ fontSize: '12px', color: darkBg ? '#999999' : '#999999', textAlign: 'center', margin: 0 }}>
        Free. No credit card. Instant portal access.
      </p>
      <p style={{ fontSize: '12px', color: darkBg ? '#999999' : '#999999', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
        By signing up you agree to our{' '}
        <a href="/privacy" style={{ color: darkBg ? '#6B9BFC' : '#1056D6', textDecoration: 'underline' }}>Privacy Policy</a>
        {' '}and{' '}
        <a href="/terms" style={{ color: darkBg ? '#6B9BFC' : '#1056D6', textDecoration: 'underline' }}>Terms</a>.
        You will receive challenge emails from Body Recode.
      </p>
    </form>
  )
}

const WHAT_YOU_GET = [
  {
    icon: LineChart,
    title: 'Body Decode Result',
    timing: 'Day 14',
    desc: 'Delivered automatically the moment you finish the Check-In. Your state. Why fat loss has stalled. The specific pattern your body is locked in. And the three things to actually do next.',
    featured: true,
  },
  {
    icon: Activity,
    title: 'Body Decode Check-In',
    timing: 'Day 7',
    desc: 'The full read. Eight biological markers, scored. Tells you exactly where your body sits, whether you are still Depleted, moving into Transitioning, or already Ready, and which pattern is holding the system.',
    featured: true,
  },
  {
    icon: Video,
    title: 'Week One Progress Session',
    timing: 'Day 5',
    desc: 'Thirty minutes of me walking you through what your body has been doing for the first five days, why, and what to look for in week two.',
    featured: false,
  },
  {
    icon: FileText,
    title: 'Daily Coaching Notes',
    timing: 'Every day',
    desc: 'One note from me each morning inside your portal. What is happening in your body that day, what to expect, and what to actually pay attention to. Sixty seconds.',
    featured: false,
  },
  {
    icon: Dumbbell,
    title: '14-Day Training Plan',
    timing: 'Day 1',
    desc: 'Built for a body in a Depleted State, not a body that is already responding. Lower intensity by design. The job is to pull load, not add it.',
    featured: false,
  },
  {
    icon: Salad,
    title: 'Nutrition Guide',
    timing: 'Day 1',
    desc: 'Predictable food, predictable timing. The goal is to signal safety to a body that has been in protection mode. Not a diet. Not a deficit. A reset of the inputs.',
    featured: false,
  },
  {
    icon: Sunrise,
    title: 'Morning Reset Sequence',
    timing: 'Day 1',
    desc: 'The first 20 minutes of your day set the cortisol curve for everything that follows. This sequence brings cortisol down, not up. Five minutes, done before coffee.',
    featured: false,
  },
  {
    icon: Moon,
    title: 'Evening Rhythm Sequence',
    timing: 'Day 1',
    desc: 'Sleep is where depleted recovery happens. This is the sequence that gets your body into the deep recovery state it needs to start releasing, not just resting.',
    featured: false,
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
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* Nav */}
      <div style={{ padding: '20px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <img src="https://bodyrecode.au/logo-black.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Teal glow top-right */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-120px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Teal glow bottom-left */}
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 64px' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.25)',
            borderRadius: '99px', padding: '7px 16px', marginBottom: '20px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1B6DFC' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Free 14-Day Challenge
            </span>
          </div>

          {/* Founder byline */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '28px',
          }}>
            <img
              src="/kade.jpg"
              alt="Kade Dunstone"
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                objectFit: 'cover', objectPosition: 'top center',
                border: '1px solid #E5E5E5',
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.3 }}>
                Built by Kade Dunstone
              </p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.3 }}>
                Human Movement Scientist · Business Entrepreneur · Body Recode Founder
              </p>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(44px, 8vw, 68px)',
            fontWeight: 900,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            color: '#1A1A1A',
            marginBottom: '24px',
          }}>
            You're training. You're eating clean.
            <br />
            <span style={{ color: '#1B6DFC' }}>The fat won't move.</span>
          </h1>

          {/* Divider line */}
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '32px' }} />

          {/* Explainer video */}
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            background: '#1A1A1A',
            borderRadius: '14px',
            marginBottom: '32px',
            overflow: 'hidden',
            border: '1px solid #2C2C2C',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          }}>
            <video
              src="/challenge-explainer.mp4"
              controls
              autoPlay
              muted
              playsInline
              preload="auto"
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
            />
          </div>

          <p style={{ fontSize: '19px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '14px' }}>
            Most people assess fat loss by effort. But effort can stay high while your body shifts into protection mode and resists fat loss by design.
          </p>
          <p style={{ fontSize: '19px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '40px' }}>
            The 14-Day Body Decode reads your body first. By Day 14 you know which of four patterns is holding it, and exactly what to do next. Free.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
            {[
              { value: '14', label: 'Days' },
              { value: 'Free', label: 'No credit card' },
              { value: 'Day 1', label: 'Instant access' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#ffffff', border: '1px solid #E5E5E5',
                borderRadius: '12px', padding: '16px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#1B6DFC', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: '#999999', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div ref={formRef}>
            <SignupForm position="hero" />
          </div>
        </div>
      </div>

      {/* SYMPTOMS */}
      <div style={{ maxWidth: '680px', margin: '64px auto 0', padding: '72px 24px', borderTop: '1px solid #E5E5E5' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          What you have been feeling
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '6px', color: '#1A1A1A' }}>
          These are not failures.
        </h2>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, color: '#999999', marginBottom: '28px' }}>
          They are signals.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderTop: '1px solid #E5E5E5' }}>
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
              padding: '18px 0',
              borderBottom: '1px solid #E5E5E5',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'rgba(27, 109, 252, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Zap size={14} strokeWidth={2.5} color="#1B6DFC" />
              </div>
              <p style={{ fontSize: '16px', color: '#3A3A3A', margin: 0, lineHeight: 1.4 }}>{item}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginTop: '32px', marginBottom: 0 }}>
          Every signal on this list points to one thing. Your body is in protection mode. Fat loss is the first thing the body shuts down under protection. Effort does not fix it. Conditions do.
        </p>
      </div>

      {/* REAL PROBLEM */}
      <div style={{
        background: '#F3F7FF',
        borderTop: '1px solid rgba(27, 109, 252,0.2)',
        borderBottom: '1px solid rgba(27, 109, 252,0.2)',
        marginTop: '72px',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            The real problem
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: '#1A1A1A' }}>
            Your body has stopped losing fat. Here is why.
          </h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '18px' }}>
            Your body has shifted into a state where it is actively resisting the inputs that used to work. Cortisol elevates. Metabolism suppresses. Fat goes to the storage zones, mainly stomach and waist, and stays there. The system is hanging on to everything because nothing in the environment is telling it that it is safe to release.
          </p>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '28px' }}>
            This is exactly why what you have tried before stopped producing. Whoever wrote that program was not reading your body. The standard answer of more training and less food is the wrong answer for a body in this state. Pushing harder confirms the threat. The harder you push, the tighter your body holds.
          </p>
          <div style={{
            background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.25)',
            borderRadius: '12px', padding: '20px 22px',
          }}>
            <p style={{ fontSize: '17px', color: '#1A1A1A', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
              The solution is not more effort. It is the right conditions for your body to come out of protection mode and start releasing again.
            </p>
          </div>
        </div>
      </div>

      {/* WHAT YOU GET */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
          What you walk away with
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '10px', color: '#1A1A1A' }}>
          By Day 14, you have your result.
        </h2>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '36px' }}>
          Plus 14 days of structure that gets your body to the point where it can be read.
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

      {/* RESULT PREVIEW */}
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
            What your Day 14 result looks like.
          </h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '36px' }}>
            You finish the Check-In. Within minutes you receive a personalised report. One of four patterns. Why fat loss has stalled in your specific case. Three actions to take in week two.
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
                Your Body Decode Result
              </p>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                Sample
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '28px 26px' }}>
              {/* Pattern row */}
              <div style={{ marginBottom: '22px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Your Biological Pattern
                </p>
                <p style={{ fontSize: '24px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.015em', lineHeight: 1.15 }}>
                  Stress-Stored Pattern
                </p>
                <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '6px 0 0', fontStyle: 'italic' }}>
                  One of four. Yours is determined by your Day 7 Check-In.
                </p>
              </div>

              {/* Why */}
              <div style={{ marginBottom: '22px', paddingTop: '22px', borderTop: '1px solid #E5E5E5' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Why fat loss has stalled
                </p>
                <p style={{ fontSize: '14px', color: '#3A3A3A', lineHeight: 1.7, margin: 0 }}>
                  Cortisol and adrenaline are keeping your system in a state of low-grade alert, which signals your body to hold fat around the midsection as an energy reserve...
                </p>
              </div>

              {/* Actions */}
              <div style={{ paddingTop: '22px', borderTop: '1px solid #E5E5E5' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Your three actions for week two
                </p>
                {[
                  'Sleep is your highest leverage point. Cortisol resets overnight. Prioritise sleep quality above everything else this week.',
                  'Keep training intensity moderate. Hard sessions spike cortisol further and can slow progress in this pattern.',
                  'Eat breakfast within 60 minutes of waking. This supports your morning cortisol curve and begins the process of hormonal regulation for the day.',
                ].map((action, i) => (
                  <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: i < 2 ? '12px' : 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#1B6DFC', minWidth: '20px', fontFamily: 'monospace', paddingTop: '2px' }}>
                      0{i + 1}
                    </span>
                    <p style={{ fontSize: '13px', color: '#3A3A3A', margin: 0, lineHeight: 1.65, flex: 1 }}>{action}</p>
                  </div>
                ))}
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
        {/* subtle Signal Blue radial accent */}
        <div style={{
          position: 'absolute', top: '-200px', right: '-200px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.15) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Start the read
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '12px', lineHeight: 1.2, color: '#FFFFFF' }}>
            Fourteen days. No deficit. No high intensity. Just the read.
          </h2>
          <p style={{ fontSize: '16px', color: '#999999', marginBottom: '32px', lineHeight: 1.65 }}>
            Free to join. Instant portal access. Daily coaching messages start the moment you sign up.
          </p>
          <SignupForm position="mid" darkBg />
        </div>
      </div>

      {/* ABOUT */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
          The coach behind Body Recode
        </p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '28px', color: '#1A1A1A' }}>
          I built this from my own Depleted State.
        </h2>

        {/* Photo */}
        <div style={{
          position: 'relative', borderRadius: '18px', overflow: 'hidden',
          marginBottom: '28px',
          boxShadow: '0 0 0 1px rgba(27, 109, 252,0.15), 0 24px 48px rgba(0,0,0,0.12)',
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
            <p style={{ fontSize: '13px', color: '#1B6DFC', margin: 0, fontWeight: 600 }}>
              Founder, Body Recode · Human Movement Scientist · Business Entrepreneur · National and International Competitor
            </p>
          </div>
        </div>

        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '24px' }}>
          After two decades competing nationally and internationally in fitness, my body collapsed under personal stress in a way training and discipline could not explain. The patterns I had to learn to come back out of that became Body Recode.
        </p>
        <div style={{
          background: '#ffffff', border: '1px solid #E5E5E5',
          borderLeft: '3px solid #1B6DFC',
          borderRadius: '14px', padding: '22px 24px',
        }}>
          <p style={{ fontSize: '16px', color: '#1A1A1A', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
            I built this challenge for the Depleted State specifically. That is the state I came out of. It is the state I can read and bring people out of more reliably than anything else.
          </p>
        </div>
      </div>

      {/* IS THIS FOR YOU - STATE FILTER */}
      <div style={{
        background: '#F7F7F7',
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Is this for you?
          </p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: '#1A1A1A' }}>
            This is built for a Depleted State.
          </h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '20px' }}>
            The 14-Day Body Decode Challenge is built specifically for adults in a Depleted State. If your scorecard came back 5-8, this is your starting point. If you have not taken the scorecard yet, the symptoms above will tell you whether you are in the right place.
          </p>
          <p style={{ fontSize: '15px', color: '#1A1A1A', lineHeight: 1.7, marginBottom: '24px', fontWeight: 700 }}>
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
                desc: 'Your biology is already in position to respond. You do not need a reset. You need the ongoing precision system that takes you from responding to compounding.',
                cta: 'See the Membership',
                href: '/membership',
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
            If you are Depleted, your starting point is right here. Sign up below.
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{ width: '40px', height: '3px', background: '#1B6DFC', marginBottom: '28px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px', color: '#1A1A1A' }}>
          Fourteen days.<br />
          <span style={{ color: '#999999' }}>Then you know.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '36px' }}>
          Free. Daily structure. A coach watching the markers that matter. By Day 14 you know exactly which state your body is in, what is holding it, and exactly what to do next. That is the cheapest, fastest answer I can give you right now.
        </p>
        <SignupForm position="footer" />
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
