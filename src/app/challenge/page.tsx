'use client'

// /challenge — objection-led landing page. Real, consented client voices
// (Razia, Amanda) drawn faithfully from their check-ins; all medication/health
// detail excluded. Training is offered gym + at-home (see training-plan.tsx).

import { useState, useRef, useEffect } from 'react'
import { normalisePhone } from '@/lib/phone'
import { InboxNote } from '@/components/inbox-note'
import { Dumbbell, Salad, Sunrise, Moon, FileText, Video, Activity, LineChart, Zap, Award, Gauge, ShieldCheck, Check, X, Lock, ChevronDown } from 'lucide-react'
import { isProductLive } from '@/lib/product-launch'
import { WaitlistCTA } from '@/components/product-waitlist-cta'
import { coach, logoUrl, brand } from '@/config/tenant'

function SignupForm({ position, teal, darkBg }: { position: string; teal?: boolean; darkBg?: boolean }) {
  if (!isProductLive('challenge')) {
    return <WaitlistCTA product="challenge" productName="14-Day Body Decode Challenge" position={position} darkBg={darkBg} />
  }
  const [waveFull, setWaveFull] = useState(false)
  const [waveLabel, setWaveLabel] = useState('Wave 1')
  const [nextWaveLabel, setNextWaveLabel] = useState('the next wave')
  useEffect(() => {
    let cancelled = false
    fetch('/api/challenge/wave-status').then(r => r.json()).then(data => {
      if (cancelled) return
      if (data.isFull) {
        setWaveFull(true)
        setWaveLabel(data.current?.label ?? 'this wave')
        setNextWaveLabel(data.nextWave?.label ?? 'the next wave')
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])
  if (waveFull) {
    return <WaitlistCTA
      product="challenge"
      productName={`14-Day Body Decode Challenge - ${nextWaveLabel}`}
      position={position}
      darkBg={darkBg}
      eyebrow={`${waveLabel} is full`}
      headline={`Join the waitlist for ${nextWaveLabel}`}
      copy="Doors reopen in days. Drop your details and you will be the first to know when the next wave opens. No payment. Free 14 days."
    />
  }
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', gender: '' })
  // Only judge once there is enough typed to judge, so the field does not go
  // red on the first keystroke.
  const phoneProbe = form.phone.replace(/\D/g, '').length >= 6 ? normalisePhone(form.phone) : null
  const phoneError = phoneProbe && !phoneProbe.ok ? phoneProbe.error : null
  const [smsOptIn, setSmsOptIn] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [portalToken, setPortalToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [utms, setUtms] = useState<Record<string, string>>({})

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const captured: Record<string, string> = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      const v = p.get(key)
      if (v) captured[key] = v
    }
    setUtms(captured)

    // Arrivals from the scorecard carry their details across. The scorecard is
    // the first gate, so by this point they have already given us all of this -
    // asking twice is the friction that makes a two-step funnel feel like two
    // front doors. The email in particular has to match, because the enrol API
    // links to the existing lead on email and that link is what lets them skip
    // the Day 0 intake and start on day one.
    if (p.get('from') === 'scorecard') {
      setForm(f => ({
        ...f,
        first_name: p.get('first') || f.first_name,
        last_name: p.get('last') || f.last_name,
        email: p.get('email') || f.email,
        phone: p.get('phone') || f.phone,
      }))
    }
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !normalisePhone(form.phone).ok || !form.gender) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/challenge/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sms_opt_in: smsOptIn, position, ...utms }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'wave_full') {
          setWaveFull(true)
          if (data.message) setError(null)
          setSubmitting(false)
          return
        }
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      // Straight in. The enrol API hands back the portal token, and we used to
      // throw it away and tell people to go and find an email - an inbox hop, a
      // spam folder and a delay sitting between the keenest moment they will
      // ever have and the first thing we ask of them. The welcome email still
      // goes out as the way back in later.
      setPortalToken(data.token ?? null)
      setDone(true)
      if (data.token) {
        setTimeout(() => { window.location.href = `/challenge/${data.token}` }, 1200)
      }
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
        {portalToken ? (
          <>
            <p style={{ fontSize: '15px', color: '#1056D6', lineHeight: 1.6, margin: '0 0 16px' }}>
              Opening your portal now. First up is a short scorecard that reads your starting point, then your 14 days begin.
            </p>
            <a href={`/challenge/${portalToken}`} style={{
              display: 'block', padding: '14px', borderRadius: '10px', background: '#1B6DFC',
              color: '#FFFFFF', fontSize: '15px', fontWeight: 800, textDecoration: 'none',
              marginBottom: '12px',
            }}>
              Take me in now →
            </a>
            <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6, margin: '0 0 14px' }}>
              We have emailed you the same link, so you can get back in any time.
            </p>
            <InboxNote />
          </>
        ) : (
          <>
            <p style={{ fontSize: '15px', color: '#1056D6', lineHeight: 1.6, margin: '0 0 12px' }}>
              Check your email for your portal link. The first thing inside is a quick scorecard that reads your starting point - then your 14 days begin.
            </p>
            <InboxNote />
          </>
        )}
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
        <input type="text" placeholder="First name" value={form.first_name}
          onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required style={inputStyle} />
        <input type="text" placeholder="Last name" value={form.last_name}
          onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required style={inputStyle} />
      </div>
      <input type="email" placeholder="Email address" value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={inputStyle} />
      {/* The whole Challenge runs on SMS, so a number that cannot receive one
          means the participant silently gets none of it. Validated here for a
          fast answer and again on the server, which is authoritative. */}
      <input type="tel" inputMode="tel" autoComplete="tel"
        placeholder="Mobile number (daily portal nudge + Day 5, Day 7, and Day 14 reminders)" value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required
        style={{ ...inputStyle, ...(phoneError ? { borderColor: '#dc2626' } : {}) }} />
      {phoneError && (
        <p style={{ fontSize: '12.5px', color: '#dc2626', margin: '-6px 0 0', lineHeight: 1.5 }}>{phoneError}</p>
      )}
      <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} required
        style={{
          ...inputStyle,
          color: form.gender ? '#1A1A1A' : '#999999',
          appearance: 'none',
          backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2378716c\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'/></svg>")',
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '12px', paddingRight: '40px',
        }}>
        <option value="" disabled>Biological sex (required for accurate pattern read)</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="prefer_not_to_say">Prefer not to say</option>
      </select>
      <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12.5px', color: darkBg ? '#B4BAC3' : '#4a4640', cursor: 'pointer', lineHeight: 1.5 }}>
        <input type="checkbox" checked={smsOptIn} onChange={e => setSmsOptIn(e.target.checked)} style={{ marginTop: '3px', accentColor: '#1B6DFC' }} />
        <span>{coach().firstName} can text me about the challenge (reply STOP to opt out).</span>
      </label>
      {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>}
      <button type="submit"
        disabled={submitting || !form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !normalisePhone(form.phone).ok || !form.gender}
        style={{
          width: '100%', padding: '17px', borderRadius: '10px', border: 'none',
          background: submitting ? 'rgba(27, 109, 252,0.6)' : '#1B6DFC',
          color: '#ffffff', fontSize: '16px', fontWeight: 800,
          cursor: submitting ? 'not-allowed' : 'pointer', letterSpacing: '0.01em', transition: 'background 0.2s', boxSizing: 'border-box',
        }}>
        {submitting ? 'Starting your challenge...' : 'Start My Free 14-Day Challenge'}
      </button>
      {/* SHARPEN: risk reversal made explicit right under the button */}
      <p style={{ fontSize: '12px', color: '#999999', textAlign: 'center', margin: 0 }}>
        Free to start. No credit card. Cancel any time. Your data stays yours.
      </p>
      <p style={{ fontSize: '12px', color: '#999999', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
        By signing up you agree to our{' '}
        <a href="/privacy" style={{ color: darkBg ? '#6B9BFC' : '#1056D6', textDecoration: 'underline' }}>Privacy Policy</a>
        {' '}and{' '}
        <a href="/terms" style={{ color: darkBg ? '#6B9BFC' : '#1056D6', textDecoration: 'underline' }}>Terms</a>.
        {' '}You will receive challenge emails from {brand().name}.
      </p>
    </form>
  )
}

const WHAT_YOU_GET = [
  { icon: LineChart, title: 'Body Decode Result', timing: 'Day 14', featured: true,
    desc: 'Released on Day 14. Your state. Why fat loss has stalled. The specific pattern your body is locked in. And the three things to actually do next.' },
  { icon: Activity, title: 'Body Decode Check-In', timing: 'Day 7', featured: true,
    desc: 'The Day 7 read. Eight biological markers, scored. Tells you exactly how your body is responding through Week One, and what to focus on for Week Two. Your pattern read is held for the Day 14 Body Decode Report.' },
  { icon: Video, title: 'Week One Progress Session', timing: 'Day 5', featured: false,
    desc: 'A focused session walking you through what your body has been doing for the first five days, why rhythm beats restriction, and what to focus on through Week Two.' },
  { icon: FileText, title: 'Daily Coaching Notes', timing: 'Every day', featured: false,
    desc: 'One note from me each morning inside your portal. What is happening in your body that day, what to expect, and what to actually pay attention to. Sixty seconds.' },
  { icon: Dumbbell, title: '14-Day Training Plan', timing: 'Day 1', featured: false,
    desc: 'Built for a body in a Depleted State, not a body that is already responding. Lower intensity by design, the job is to pull load, not add it. Every session comes two ways, in the gym or at home with a backpack, a band and a chair, so you can start wherever you are.' },
  { icon: Salad, title: 'Nutrition Guide', timing: 'Day 1', featured: false,
    desc: 'Predictable food, predictable timing. The goal is to signal safety to a body that has been in protection mode. Not a diet. Not a deficit. A reset of the inputs.' },
  { icon: Sunrise, title: 'Morning Reset Sequence', timing: 'Day 1', featured: false,
    desc: 'The first 20 minutes of your day set the cortisol curve for everything that follows. This sequence brings cortisol down, not up. Five minutes, done before coffee.' },
  { icon: Moon, title: 'Evening Rhythm Sequence', timing: 'Day 1', featured: false,
    desc: 'Sleep is where depleted recovery happens. This is the sequence that gets your body into the deep recovery state it needs to start releasing, not just resting.' },
]

// Real client voices, drawn faithfully from each client's own check-in language,
// used with consent (approved 2026-07-17), first-name attribution.
// DELIBERATELY EXCLUDES all medication, menopause and health-condition detail
// (Amanda's GLP-1/Vyvanse/PMDD references; Razia's wk8 shortness-of-breath note).
// These are STATE-change wins, not body-composition claims — consistent with the
// Depleted-state doctrine that the state shifts before the fat does.
const CLIENT_VOICES = [
  {
    quote: "After my very first sessions I felt completely fatigued and slept most of the weekend. It's improved a lot since then. The sessions feel easier now, and I'm planning my weeks well and handling them much better.",
    name: 'Razia',
    meta: 'Coaching client · week 8',
    stateShift: '',
  },
  {
    quote: "Cutting back the wine was genuinely hard at the start and I knew it would take real discipline. Ten weeks in, it's none. And the muscle soreness I used to avoid actually feels good now.",
    name: 'Amanda',
    meta: 'Coaching client · 11 weeks in',
    // Factual coach-side read (not Amanda's words): her latest check-in moved
    // her out of a Depleted State into a Transitioning State. This is the exact
    // arc the page argues — the state shifts before the fat does.
    stateShift: 'Depleted → Transitioning',
  },
]

// FAQ content, in BR voice. Equipment + medical answers confirmed by Kade 2026-07-18.
const FAQS = [
  {
    q: 'How much time does this take each day?',
    a: 'Small. A sixty-second coaching note each morning, your normal meals timed a little differently, and short sessions built to be low-intensity. This is not a bootcamp. The work is precision, not volume.',
  },
  {
    q: 'Do I need a gym?',
    a: 'No, you can do this either way. Every session comes in two versions: a gym version with loaded lifts, and an at-home version that needs only a loaded backpack, a resistance band, and a chair or stairs. Follow whichever suits you, and switch any time. The load stays deliberately moderate either way. The point of these two weeks is to pull load off a depleted body, not train it to failure.',
  },
  {
    q: 'I am in perimenopause or menopause, or on medication like a GLP-1. Does this still apply?',
    a: 'Yes. This challenge is built for exactly this kind of body, one where hormones and medications are part of the picture. The read accounts for your biological sex and where you are, which is why it asks. It does not replace medical advice, and nothing here asks you to change your medication.',
  },
  {
    q: 'Is 14 days really enough to change my body?',
    a: 'Fourteen days is enough to read your body and start the shift, not to finish it. That is the honest answer. What you walk away with is your state, the exact pattern holding you, and your next three actions. That is the map. The change follows the map.',
  },
  {
    q: 'What happens after the 14 days?',
    a: 'You keep your Day 14 result. If you want to keep going, there is a paid next step, the Blueprint, at $97. If you do not, you still leave knowing more about your body than most programs ever tell you. Nothing auto-charges.',
  },
  {
    q: 'Is my information private?',
    a: 'Yes. Your data is yours. It is used to read your body and coach you, and nothing else.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #E5E5E5' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        background: 'none', border: 'none', padding: '20px 0', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.4 }}>{q}</span>
        <ChevronDown size={18} strokeWidth={2.5} color="#1B6DFC" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 20px' }}>{a}</p>}
    </div>
  )
}

export default function ChallengePage() {
  const c = coach()
  const formRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Phone-first responsive helpers (inline styles can't hold media queries) */}
      <style>{`
        @media (max-width: 560px) {
          .br-3col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Nav */}
      <div style={{ padding: '20px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <img src={logoUrl()} width="160" alt={brand().name} style={{ display: 'block' }} />
        </div>
      </div>

      {/* ================= HERO ================= */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27, 109, 252,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '-100px', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27, 109, 252,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.25)', borderRadius: '99px', padding: '7px 16px', marginBottom: '20px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1B6DFC' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Free 14-Day Challenge</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <img src="/kade.jpg" alt={c.fullName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'top center', border: '1px solid #E5E5E5', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.3 }}>Built by {c.fullName}</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.3 }}>{c.credentials}</p>
            </div>
          </div>

          <h1 style={{ fontSize: 'clamp(44px, 8vw, 68px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.05, color: '#1A1A1A', marginBottom: '24px' }}>
            You're training. You're eating clean.
            <br />
            <span style={{ color: '#1B6DFC' }}>The fat won't move.</span>
          </h1>

          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '32px' }} />

          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#1A1A1A', borderRadius: '14px', marginBottom: '32px', overflow: 'hidden', border: '1px solid #2C2C2C', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }}>
            <video src="/challenge-explainer.mp4" controls autoPlay muted playsInline preload="auto"
              controlsList="nodownload noplaybackrate" disablePictureInPicture onContextMenu={(e) => e.preventDefault()}
              style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
          </div>

          <p style={{ fontSize: '19px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '14px' }}>
            Most people assess fat loss by effort. But effort can stay high while your body shifts into protection mode and resists fat loss by design.
          </p>
          <p style={{ fontSize: '19px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '40px' }}>
            The 14-Day Body Decode reads your body first. By Day 14 you know which of four patterns is holding it, and exactly what to do next. Free.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
            {[{ value: '14', label: 'Days' }, { value: 'Free', label: 'No credit card' }, { value: 'Day 1', label: 'Instant access' }].map(stat => (
              <div key={stat.label} style={{ background: '#ffffff', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#1B6DFC', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: '#999999', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* NEW: gym-access qualifier, surfaced BEFORE sign-up so no one enrols who can't do the plan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', background: '#F7F7F7', border: '1px solid #E5E5E5', borderRadius: '10px', padding: '11px 14px', marginBottom: '16px' }}>
            <Dumbbell size={16} strokeWidth={2.2} color="#1B6DFC" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: '#4A4A4A', margin: 0, fontWeight: 600, lineHeight: 1.4 }}>
              You will need somewhere to train. Every session comes in a gym version and an at-home version (a loaded backpack, a band, and a chair).
            </p>
          </div>

          <div ref={formRef}><SignupForm position="hero" /></div>

          {/* NEW: proof strip directly under the hero CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', flexWrap: 'wrap', marginTop: '22px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: '#6B6B6B', fontWeight: 600 }}>
              <ShieldCheck size={15} strokeWidth={2.5} color="#1B6DFC" /> Built by a Sports Scientist
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: '#6B6B6B', fontWeight: 600 }}>
              <Gauge size={15} strokeWidth={2.5} color="#1B6DFC" /> Reads 8 biological markers
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: '#6B6B6B', fontWeight: 600 }}>
              <Activity size={15} strokeWidth={2.5} color="#1B6DFC" /> One of four named patterns
            </span>
          </div>
        </div>
      </div>

      {/* ================= SYMPTOMS (keep) ================= */}
      <div style={{ maxWidth: '680px', margin: '64px auto 0', padding: '72px 24px', borderTop: '1px solid #E5E5E5' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>What you have been feeling</p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '6px', color: '#1A1A1A' }}>These are not failures.</h2>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, color: '#999999', marginBottom: '28px' }}>They are signals.</h2>
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
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid #E5E5E5' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(27, 109, 252, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

      {/* ================= MECHANISM (SHARPEN: science made loud) ================= */}
      <div style={{ background: '#F3F7FF', borderTop: '1px solid rgba(27, 109, 252,0.2)', borderBottom: '1px solid rgba(27, 109, 252,0.2)', marginTop: '72px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>The real problem</p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: '#1A1A1A' }}>Your body has stopped losing fat. Here is why.</h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '18px' }}>
            Your body has shifted into a state where it works against the things that used to work. It holds on, recovery takes longer, and fat settles around the middle and stays, because nothing is telling it that it is safe to let go. What is causing that is not the same in everyone. Three of the four common causes push fat to the same place, which is why where it sits tells you almost nothing on its own, and why guessing is how most plans end up aimed at the wrong thing.
          </p>

          {/* NEW: the three-step physiology chain, made visual (stacks on mobile) */}
          <div className="br-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '24px 0 28px' }}>
            {[
              { k: 'Trigger', v: 'Something shifts. Load, hormones or fuel' },
                { k: 'Response', v: 'The body stops adapting and starts protecting' },
                { k: 'Result', v: 'Fat settles into storage and holds' },
            ].map(step => (
              <div key={step.k} style={{ background: '#ffffff', border: '1px solid rgba(27,109,252,0.2)', borderRadius: '12px', padding: '16px 14px' }}>
                <p style={{ fontSize: '10px', fontWeight: 800, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>{step.k}</p>
                <p style={{ fontSize: '13px', color: '#3A3A3A', margin: 0, lineHeight: 1.5 }}>{step.v}</p>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.25)', borderRadius: '12px', padding: '20px 22px' }}>
            <p style={{ fontSize: '17px', color: '#1A1A1A', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
              The solution is not more effort. It is the right conditions for your body to come out of protection mode and start releasing again.
            </p>
          </div>
        </div>
      </div>

      {/* ================= NEW: WHY WHAT YOU TRIED FAILED ================= */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>Why the last attempt didn&apos;t stick</p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '28px', color: '#1A1A1A' }}>
          The standard answer is the wrong answer for a depleted body.
        </h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={{ background: '#FFF5F5', border: '1px solid #F3D4D4', borderRadius: '14px', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#F3D4D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} strokeWidth={3} color="#C0392B" />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#8B2E22', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>The usual playbook</p>
            </div>
            <p style={{ fontSize: '16px', color: '#5A3A36', lineHeight: 1.65, margin: 0 }}>
              Train harder. Eat less. Push through. To a body already in protection mode, that reads as more threat. Cortisol climbs, the system holds tighter, and the harder you push the less it moves.
            </p>
          </div>
          <div style={{ background: '#F0F7FF', border: '1px solid rgba(27,109,252,0.25)', borderRadius: '14px', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(27,109,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={15} strokeWidth={3} color="#1B6DFC" />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#1056D6', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>The Body Decode approach</p>
            </div>
            <p style={{ fontSize: '16px', color: '#284066', lineHeight: 1.65, margin: 0 }}>
              Read the body first. Take the threat away. Restore the conditions. Fat release is a response, not a reward for effort. Bring the body out of protection mode and it starts letting go on its own.
            </p>
          </div>
        </div>
      </div>

      {/* ================= NEW: PROOF / WHY YOU CAN TRUST THE READ ================= */}
      <div style={{ background: '#1A1A1A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-160px', left: '-160px', width: '460px', height: '460px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.16) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>Why you can trust this</p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '10px', color: '#FFFFFF' }}>This is a read, not a guess.</h2>
          <p style={{ fontSize: '16px', color: '#B4BAC3', lineHeight: 1.7, marginBottom: '28px' }}>
            The challenge is free, but the method behind it is not casual. Here is what your result is built on.
          </p>

          {/* NEW: compact founder beat — the strongest proof BR owns right now,
              lifted up to the proof moment (full story still lives in About below). */}
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '20px 22px', marginBottom: '28px' }}>
            <img src="/kade-11.jpg" alt={c.fullName} style={{ width: '68px', height: '68px', borderRadius: '12px', objectFit: 'cover', objectPosition: 'top center', flexShrink: 0, filter: 'grayscale(1)' }} />
            <div>
              <p style={{ fontSize: '16px', color: '#FFFFFF', fontWeight: 500, lineHeight: 1.6, margin: '0 0 8px', fontStyle: 'italic' }}>
                &ldquo;I did not read this in a textbook. My own body collapsed under stress in a way training could not explain. The way back out is what became this method.&rdquo;
              </p>
              <p style={{ fontSize: '12.5px', color: '#8A93A0', margin: 0, fontWeight: 600 }}>
                {c.fullName} · Founder, {brand().name} · Sports Scientist
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
            {[
              { icon: Award, title: 'Built by a Sports Scientist', desc: 'Two decades competing nationally and internationally, on a Sports Science foundation. This is a trained read of your physiology, not generic advice.' },
              { icon: Gauge, title: 'Read from eight biological markers', desc: 'Your Day 7 Check-In scores eight markers of how your body is actually responding, not how hard you are trying. The read follows the biology.' },
              { icon: ShieldCheck, title: 'One of four defined patterns', desc: 'Every result names a specific pattern with the exact reasons fat loss has stalled and the exact actions to take next. No vague advice.' },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.title} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px 22px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(27,109,252,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} strokeWidth={2} color="#4D8DFF" />
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 5px' }}>{item.title}</p>
                    <p style={{ fontSize: '13.5px', color: '#B4BAC3', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Real, consented client voices. The framing line turns the absence of
              body-comp before/afters into a doctrine point rather than a gap. */}
          <p style={{ fontSize: '15px', color: '#B4BAC3', lineHeight: 1.7, marginBottom: '16px' }}>
            Real words from clients in their early weeks. Notice what moves first. Energy, capacity, rhythm. In a depleted body the state shifts before the fat does, and that is exactly the order you should expect.
          </p>
          <div style={{ display: 'grid', gap: '12px' }}>
            {CLIENT_VOICES.map(v => (
              <div key={v.name} style={{ background: 'rgba(27,109,252,0.08)', border: '1px solid rgba(77,141,255,0.35)', borderRadius: '14px', padding: '22px 24px' }}>
                {v.stateShift && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(16,160,100,0.14)', border: '1px solid rgba(16,160,100,0.35)', borderRadius: '999px', padding: '5px 12px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#4FD6A0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>State progress · {v.stateShift}</span>
                  </div>
                )}
                <p style={{ fontSize: '16.5px', color: '#FFFFFF', lineHeight: 1.6, margin: '0 0 12px', fontWeight: 500, fontStyle: 'italic' }}>
                  &ldquo;{v.quote}&rdquo;
                </p>
                <p style={{ fontSize: '13px', color: '#8A93A0', margin: 0, fontWeight: 600 }}>
                  {v.name} · {v.meta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= WHAT YOU GET (keep) ================= */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>What you walk away with</p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '10px', color: '#1A1A1A' }}>By Day 14, you have your result.</h2>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '36px' }}>Plus 14 days of structure that gets your body to the point where it can be read.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {WHAT_YOU_GET.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} style={{ background: '#FFFFFF', border: item.featured ? '1px solid #1B6DFC' : '1px solid #E5E5E5', borderLeft: item.featured ? '3px solid #1B6DFC' : '1px solid #E5E5E5', borderRadius: '12px', padding: '20px 22px', display: 'flex', gap: '18px', alignItems: 'flex-start', boxShadow: item.featured ? '0 1px 3px rgba(27, 109, 252, 0.06)' : 'none' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: item.featured ? '#1B6DFC' : 'rgba(27, 109, 252, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} strokeWidth={2} color={item.featured ? '#FFFFFF' : '#1B6DFC'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.005em' }}>{item.title}</p>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: item.featured ? '#1056D6' : '#6B6B6B', background: item.featured ? 'rgba(27, 109, 252, 0.1)' : '#F5F5F5', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.timing}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ================= RESULT PREVIEW (keep) ================= */}
      <div style={{ background: '#F7F7F7', borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>Sample preview</p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '10px', color: '#1A1A1A' }}>What your Day 14 result looks like.</h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '36px' }}>You take the Check-In on Day 7. By Day 14, the full Body Decode Report drops. One of four patterns. Your readiness, which is what decides whether a plan works or backfires. Why fat loss has stalled in your specific case. Three actions to take next.</p>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }}>
            <div style={{ background: '#1A1A1A', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Your Body Decode Result</p>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Sample</p>
            </div>
            <div style={{ padding: '28px 26px' }}>
              <div style={{ marginBottom: '22px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Your Biological Pattern</p>
                <p style={{ fontSize: '24px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.015em', lineHeight: 1.15 }}>Stress-Stored Pattern</p>
                <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '6px 0 0', fontStyle: 'italic' }}>One of four. Read from your Day 7 Check-In. Released on Day 14.</p>
              </div>
              <div style={{ marginBottom: '22px', paddingTop: '22px', borderTop: '1px solid #E5E5E5' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Why fat loss has stalled</p>
                <p style={{ fontSize: '14px', color: '#3A3A3A', lineHeight: 1.7, margin: 0 }}>Cortisol and adrenaline are keeping your system in a state of low-grade alert, which signals your body to hold fat around the midsection as an energy reserve...</p>
              </div>
              <div style={{ paddingTop: '22px', borderTop: '1px solid #E5E5E5' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Your three actions for week two</p>
                {[
                  'Sleep is where the most changes for the least effort. Prioritise sleep quality above everything else this week.',
                  'Keep training intensity moderate. Hard sessions spike cortisol further and can slow progress in this pattern.',
                  'Eat breakfast within 60 minutes of waking. This supports your morning cortisol curve and begins the process of hormonal regulation for the day.',
                ].map((action, i) => (
                  <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: i < 2 ? '12px' : 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#1B6DFC', minWidth: '20px', fontFamily: 'monospace', paddingTop: '2px' }}>0{i + 1}</span>
                    <p style={{ fontSize: '13px', color: '#3A3A3A', margin: 0, lineHeight: 1.65, flex: 1 }}>{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= NEW: MID CTA (re-added — high-intent moment after the sample result) ================= */}
      <div style={{ background: '#F3F7FF', borderTop: '1px solid rgba(27, 109, 252,0.2)', borderBottom: '1px solid rgba(27, 109, 252,0.2)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>Start the read</p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '12px', lineHeight: 1.2, color: '#1A1A1A' }}>
            That result is 14 days away.
          </h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', marginBottom: '28px', lineHeight: 1.65 }}>
            No deficit. No high intensity. Just the read, and daily structure to get your body to the point where it can be read. Day 1 starts the moment you sign up.
          </p>
          <SignupForm position="mid" teal />
        </div>
      </div>

      {/* ================= NEW: WHY IT'S FREE ================= */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>Why it costs nothing</p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: '#1A1A1A' }}>Why would I give this away?</h2>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '18px' }}>
          Because the hardest part of this work is getting someone to believe their body can change before they have felt it move. The 14-day read is where you feel it. That is worth more to me than a sign-up fee.
        </p>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '0' }}>
          If you want to keep going after your result, there is a paid next step, the Blueprint, at $97. If you do not, you still walk away knowing your state, your pattern, and your next three actions. No card to start. Nothing auto-charges. I would rather earn the next step than hide it.
        </p>
      </div>

      {/* ================= ABOUT / AUTHORITY (keep + sharpen) ================= */}
      <div style={{ background: '#F7F7F7', borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>The coach behind {brand().name}</p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '28px', color: '#1A1A1A' }}>I built this from my own Depleted State.</h2>
          <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', marginBottom: '28px', boxShadow: '0 0 0 1px rgba(27, 109, 252,0.15), 0 24px 48px rgba(0,0,0,0.12)' }}>
            <img src="/kade-11.jpg" alt={c.fullName} style={{ width: '100%', display: 'block', aspectRatio: '4 / 5', objectFit: 'cover', objectPosition: 'top center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(12,10,9,0.88) 100%)' }} />
            <div style={{ position: 'absolute', bottom: '22px', left: '24px', right: '24px' }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '0 0 3px' }}>{c.fullName}</p>
              <p style={{ fontSize: '13px', color: '#1B6DFC', margin: 0, fontWeight: 600 }}>Founder, {brand().name} · Sports Scientist · Business Entrepreneur · National and International Competitor</p>
            </div>
          </div>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '24px' }}>
            After two decades competing nationally and internationally in fitness, my body collapsed under personal stress in a way training and discipline could not explain. The patterns I had to learn to come back out of that became {brand().name}.
          </p>
          <div style={{ background: '#ffffff', border: '1px solid #E5E5E5', borderLeft: '3px solid #1B6DFC', borderRadius: '14px', padding: '22px 24px' }}>
            <p style={{ fontSize: '16px', color: '#1A1A1A', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
              I built this challenge for the Depleted State specifically. That is the state I came out of. It is the state I can read and bring people out of more reliably than anything else.
            </p>
          </div>
        </div>
      </div>

      {/* ================= NEW: FAQ ================= */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '88px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>Before you decide</p>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '28px', color: '#1A1A1A' }}>The questions people ask most.</h2>
        <div style={{ borderTop: '1px solid #E5E5E5' }}>
          {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </div>

      {/* ================= IS THIS FOR YOU (keep) ================= */}
      <div style={{ background: '#F7F7F7', borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '72px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Is this for you?</p>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '24px', color: '#1A1A1A' }}>This is built for a body that has stopped responding.</h2>
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '20px' }}>
            Most women who start the 14-Day Body Decode Challenge have been doing the right things for a while and getting less back for it. Of the women we have assessed, about a third have nothing spare, half are somewhere in the middle, and fewer than one in five could handle a hard plan today. The fourteen days work out which one you are before anyone writes you a plan, so you do not need to know before you start.
          </p>
          {/* NEW: gym requirement restated as a qualifier in the fit section */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#ffffff', border: '1px solid #E5E5E5', borderLeft: '3px solid #1B6DFC', borderRadius: '12px', padding: '16px 18px', marginBottom: '24px' }}>
            <Dumbbell size={18} strokeWidth={2.2} color="#1B6DFC" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '14px', color: '#3A3A3A', margin: 0, lineHeight: 1.55 }}>
              <strong style={{ color: '#1A1A1A' }}>Gym or home, your call.</strong> Every session comes two ways: a gym version with loaded lifts, and an at-home version that needs only a loaded backpack, a resistance band, and a chair or stairs. You do not need a gym membership to start.
            </p>
          </div>

          <p style={{ fontSize: '15px', color: '#1A1A1A', lineHeight: 1.7, marginBottom: '24px', fontWeight: 700 }}>If you are in a different state, the right starting point is different.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
            {[
              { state: 'Transitioning State (9-11)', desc: 'Your body has capacity but is not producing consistently. The $37 Body Decode Report is the faster fit. It tells you exactly which bottleneck is holding the system before you add any input.', cta: 'Get the Report', href: '/buy-report' },
              { state: 'Ready State (12-15)', desc: 'Your biology is already in position to respond. You do not need a reset. You need the ongoing precision system that takes you from responding to compounding.', cta: 'See the Membership', href: '/membership' },
              { state: "Don't know your state yet?", desc: 'Take the 2-minute scorecard first. It tells you which state you are in and which next step is built for you.', cta: 'Take the Scorecard', href: `${brand().performanceDomain}/scorecard?source=challenge_filter` },
            ].map(row => (
              <div key={row.state} style={{ background: '#ffffff', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '18px 20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#1056D6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.state}</p>
                <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.6, marginBottom: '14px' }}>{row.desc}</p>
                <a href={row.href} style={{ display: 'inline-block', fontSize: '13px', fontWeight: 700, color: '#1B6DFC', textDecoration: 'none', borderBottom: '1px solid #1B6DFC', paddingBottom: '2px' }}>{row.cta} →</a>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '17px', color: '#1A1A1A', fontWeight: 700, lineHeight: 1.5, margin: 0 }}>If you are Depleted, your starting point is right here. Sign up below.</p>
        </div>
      </div>

      {/* ================= FINAL CTA (keep + risk reversal) ================= */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{ width: '40px', height: '3px', background: '#1B6DFC', marginBottom: '28px', borderRadius: '2px' }} />
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px', color: '#1A1A1A' }}>
          Fourteen days.<br /><span style={{ color: '#999999' }}>Then you know.</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.7, marginBottom: '28px' }}>
          Free. Daily structure. A coach watching the markers that matter. By Day 14 you know exactly which state your body is in, what is holding it, and exactly what to do next. That is the cheapest, fastest answer I can give you right now.
        </p>
        {/* NEW: explicit risk-reversal row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginBottom: '32px' }}>
          {['No credit card to start', 'Cancel any time', 'Your data stays yours', 'Instant portal access'].map(r => (
            <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#4A4A4A', fontWeight: 600 }}>
              <Lock size={13} strokeWidth={2.5} color="#1B6DFC" /> {r}
            </span>
          ))}
        </div>
        <SignupForm position="footer" />
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #E5E5E5', padding: '28px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '13px', color: '#999999', margin: 0 }}>&copy; {new Date().getFullYear()} {brand().name}. All rights reserved.</p>
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
