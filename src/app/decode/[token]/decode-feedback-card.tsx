'use client'

import { useState } from 'react'

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const MUTED = '#6B6B6B'

/**
 * Feedback capture for The Body Decode, in two distinct moments.
 *
 * WHY THIS EXISTS. The Challenge ran for two months and its central number
 * (Day 1 to Day 14 losing 14 of 15) was only reconstructed afterwards, from
 * gates that happened to log. Portal visits were logged nowhere at all. The
 * cohort that starts on the ad restart is the first evidence either way about
 * whether this offer lands, and it has to instrument itself rather than be
 * reverse-engineered in October.
 *
 * TWO MOMENTS, MEASURING DIFFERENT THINGS. Do not collapse them.
 *
 *   `decode_read`  — fires right under her read, the moment she first sees it.
 *                    Accuracy 1-5: DID THE DIAGNOSIS LAND? This is the product's
 *                    core claim and the one thing no funnel metric can tell us.
 *                    A high completion rate on a read that does not sound like
 *                    her is a worse result than a low one, because it means we
 *                    are confidently wrong.
 *
 *   `decode_day5`  — fires at the end of day 5. NPS plus free text: did the
 *                    whole thing deliver? This is the satisfaction read, and it
 *                    is only meaningful from people who got there.
 *
 * Stage stays `'challenge'` deliberately. The Body Decode writes the same
 * `challenge_enrollments` rows, the stage enum is a DB type, and a migration to
 * add a value would buy nothing: the two moments already separate the products
 * cleanly for analysis, and `source` carries the surface.
 */

type Moment = 'read' | 'day5'

interface Props {
  challengeEnrollmentId: string
  leadId?: string | null
  firstName?: string | null
  moment: Moment
}

const COPY: Record<Moment, { heading: string; sub: string; scaleLabel: string; low: string; high: string; textPrompt: string }> = {
  read: {
    heading: 'Does this sound like you?',
    sub: 'Be honest, including if it does not. A read that misses is more useful to us than a polite yes, and it is the only way we find out we are wrong.',
    scaleLabel: 'How accurate does it feel?',
    low: 'Not me at all',
    high: 'That is exactly it',
    textPrompt: 'What did it get right, or what did it miss?',
  },
  day5: {
    heading: 'Was that worth your five days?',
    sub: 'One number and a sentence, and it genuinely shapes what happens next.',
    scaleLabel: 'Would you point someone like you at this?',
    low: 'Not a chance',
    high: 'Definitely',
    textPrompt: 'What was the most useful part, or what was missing?',
  },
}

export function DecodeFeedbackCard({ challengeEnrollmentId, leadId, firstName, moment }: Props) {
  const [score, setScore] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const copy = COPY[moment]
  // The read moment is a 1-5 accuracy scale, day 5 is a 0-10 recommendation
  // scale. Different questions, so deliberately different instruments.
  const scale = moment === 'read' ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  async function submit() {
    if (score === null) {
      setError('Pick a number first.')
      return
    }
    setStatus('submitting')
    setError(null)
    try {
      const r = await fetch('/api/feedback/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'challenge',
          moment: moment === 'read' ? 'decode_read' : 'decode_day5',
          source: moment === 'read' ? 'decode_portal_read' : 'decode_portal_day5',
          challengeEnrollmentId,
          leadId: leadId ?? null,
          firstName: firstName ?? null,
          // Accuracy and NPS are separate columns. Writing the read's answer
          // into npsScore would silently pollute every satisfaction average we
          // ever compute.
          accuracyScore: moment === 'read' ? score : null,
          npsScore: moment === 'day5' ? score : null,
          responseText: text.trim() || null,
        }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        setError(d.message ?? d.error ?? 'That did not send. Try again?')
        setStatus('error')
        return
      }
      setStatus('done')
    } catch {
      setError('That did not send. Try again?')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div style={{ background: 'rgba(27,109,252,0.06)', border: '1px solid rgba(27,109,252,0.25)', borderRadius: '14px', padding: '22px 24px' }}>
        <p style={{ fontSize: '16px', fontWeight: 800, color: INK, margin: '0 0 6px' }}>Thank you, that is genuinely useful.</p>
        <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.65, margin: 0 }}>
          {moment === 'read'
            ? 'If it missed, that tells us more than if it landed. Kade reads these.'
            : 'If we ever want to quote you on it we will email and ask first. You can say no and nothing changes.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px 26px' }}>
      <p style={{ fontSize: '18px', fontWeight: 800, color: INK, letterSpacing: '-0.015em', margin: '0 0 8px' }}>
        {copy.heading}
      </p>
      <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.65, margin: '0 0 20px' }}>{copy.sub}</p>

      <p style={{ fontSize: '11px', fontWeight: 800, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>
        {copy.scaleLabel}
      </p>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {scale.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => { setScore(n); setError(null) }}
            aria-pressed={score === n}
            style={{
              flex: '1 1 auto', minWidth: '40px', padding: '11px 0', borderRadius: '9px',
              border: score === n ? `1.5px solid ${BLUE}` : '1px solid #DDDDDD',
              background: score === n ? BLUE : '#FFFFFF',
              color: score === n ? '#FFFFFF' : INK,
              fontSize: '15px', fontWeight: 800, cursor: 'pointer',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: MUTED, marginBottom: '20px' }}>
        <span>{copy.low}</span>
        <span>{copy.high}</span>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={copy.textPrompt}
        rows={3}
        style={{
          width: '100%', padding: '13px 14px', borderRadius: '10px', border: '1px solid #DDDDDD',
          fontSize: '15px', color: INK, fontFamily: 'inherit', resize: 'vertical',
          boxSizing: 'border-box', marginBottom: '14px',
        }}
      />

      {error && <p style={{ fontSize: '13.5px', color: '#DC2626', margin: '0 0 12px' }}>{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={status === 'submitting'}
        style={{
          width: '100%', padding: '15px', borderRadius: '11px', border: 'none',
          background: BLUE, color: '#FFFFFF', fontSize: '15.5px', fontWeight: 800,
          cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
          opacity: status === 'submitting' ? 0.6 : 1,
        }}
      >
        {status === 'submitting' ? 'Sending...' : 'Send'}
      </button>
    </div>
  )
}
