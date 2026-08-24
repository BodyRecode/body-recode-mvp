'use client'

import { useState, useEffect } from 'react'
import { normalisePhone } from '@/lib/phone'
import { InboxNote } from '@/components/inbox-note'

const BLUE = '#1B6DFC'

/**
 * Signup for The Body Decode.
 *
 * Posts to the SAME `/api/challenge/enroll` route the Challenge uses, because
 * the enrolment shape is identical: lead + `challenge_enrollments` row + token.
 * Only the redirect differs. Wave caps, SMS opt-in, duplicate detection and the
 * welcome email all continue to work untouched.
 *
 * Straight into the portal on success. The enrol API hands back the token and
 * the Challenge used to throw it away and tell people to go and find an email,
 * putting an inbox hop and a spam folder between the keenest moment a member
 * will ever have and the first thing we ask of them. The welcome email still
 * sends as the way back in later.
 */
export default function DecodeSignupForm({ position }: { position: string }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', gender: '' })
  const [smsOptIn, setSmsOptIn] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [utms, setUtms] = useState<Record<string, string>>({})

  const phoneProbe = form.phone.replace(/\D/g, '').length >= 6 ? normalisePhone(form.phone) : null
  const phoneError = phoneProbe && !phoneProbe.ok ? phoneProbe.error : null

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const captured: Record<string, string> = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'source']) {
      const v = p.get(key)
      if (v) captured[key] = v
    }
    setUtms(captured)

    // Arrivals from the scorecard carry their details across, so we do not ask
    // twice. The email in particular has to match: the enrol API links to the
    // existing lead on email, and that link is what lets her skip the intake and
    // land straight on her read.
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
        setError(data.message ?? data.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      setDone(true)
      if (data.token) {
        setTimeout(() => { window.location.href = `/decode/${data.token}` }, 1000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{
        background: 'rgba(27,109,252,0.07)', border: '1px solid rgba(27,109,252,0.3)',
        borderRadius: '16px', padding: '30px 26px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '19px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
          You&apos;re in, {form.first_name}.
        </p>
        <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>
          Taking you to the questions now. About ten minutes, then your read.
        </p>
      </div>
    )
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '10px',
    border: '1px solid #D8D8D8', fontSize: '16px', color: '#1A1A1A',
    background: '#FFFFFF', boxSizing: 'border-box',
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
      <div style={{ display: 'flex', gap: '11px' }}>
        <input style={field} placeholder="First name" value={form.first_name} required
          onChange={e => setForm({ ...form, first_name: e.target.value })} />
        <input style={field} placeholder="Last name" value={form.last_name} required
          onChange={e => setForm({ ...form, last_name: e.target.value })} />
      </div>
      <input style={field} type="email" placeholder="Email" value={form.email} required
        onChange={e => setForm({ ...form, email: e.target.value })} />
      <input style={{ ...field, borderColor: phoneError ? '#DC2626' : '#D8D8D8' }}
        type="tel" placeholder="Mobile" value={form.phone} required
        onChange={e => setForm({ ...form, phone: e.target.value })} />
      {phoneError && (
        <p style={{ fontSize: '13px', color: '#DC2626', margin: '-4px 0 0' }}>{phoneError}</p>
      )}

      {/* Biological sex gates which patterns can apply at all: Estrogen-Shift is
          female-only and Androgen-Decline male-only, so without it the read
          cannot be typed correctly. Asked here rather than later because the
          enrol API requires it. */}
      <select style={{ ...field, color: form.gender ? '#1A1A1A' : '#8A8A8A' }} value={form.gender} required
        onChange={e => setForm({ ...form, gender: e.target.value })}>
        <option value="">Biological sex (needed for an accurate read)</option>
        <option value="female">Female</option>
        <option value="male">Male</option>
        {/* Kept, matching /challenge. It degrades the read rather than blocking
            it: without sex, the two hard-gated patterns cannot be assigned and
            typing falls back to the sex-neutral cortisol route. Better a softer
            read than a refused signup. */}
        <option value="prefer_not_to_say">Prefer not to say</option>
      </select>

      <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13.5px', color: '#5A5A5A', lineHeight: 1.55, margin: '4px 0 2px' }}>
        <input type="checkbox" checked={smsOptIn} onChange={e => setSmsOptIn(e.target.checked)} style={{ marginTop: '3px' }} />
        <span>Text me each day&apos;s lesson. One message a day for five days, and you can reply STOP any time.</span>
      </label>

      {error && (
        <p style={{ fontSize: '14px', color: '#DC2626', lineHeight: 1.55, margin: 0 }}>{error}</p>
      )}

      <button type="submit" disabled={submitting} style={{
        width: '100%', padding: '18px', borderRadius: '12px', border: 'none',
        background: BLUE, color: '#FFFFFF', fontSize: '17px', fontWeight: 800,
        cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
      }}>
        {submitting ? 'One moment...' : 'Get my read'}
      </button>

      <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center', margin: '2px 0 0' }}>
        Free. No card. Your read in about ten minutes.
      </p>

      <InboxNote />
    </form>
  )
}
