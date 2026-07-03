'use client'

import { useEffect, useState, use as usePromise } from 'react'
import { brand } from "@/config/tenant";

interface FeedbackPreview {
  id: string
  stage: string
  moment: string
  response_text: string | null
  accuracy_score: number | null
  nps_score: number | null
  first_name: string | null
  last_initial: string | null
  permission_status: string
  permission_granted_at: string | null
  permission_denied_at: string | null
}

export default function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = usePromise(params)
  const [preview, setPreview] = useState<FeedbackPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'granted' | 'denied' | null>(null)
  const [publishAs, setPublishAs] = useState<'first_name' | 'first_last_initial' | 'anonymous'>('first_last_initial')

  useEffect(() => {
    fetch(`/api/feedback/consent/${token}`).then(async r => {
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        setError(d.error ?? 'Could not load.')
      } else {
        setPreview(await r.json())
      }
      setLoading(false)
    }).catch(e => {
      setError(e instanceof Error ? e.message : 'Network error')
      setLoading(false)
    })
  }, [token])

  async function action(act: 'grant' | 'deny') {
    setSubmitting(true)
    try {
      const r = await fetch(`/api/feedback/consent/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: act, publishAs }),
      })
      const d = await r.json()
      if (!r.ok) {
        setError(d.error ?? 'Action failed.')
        setSubmitting(false)
        return
      }
      setDone(act === 'grant' ? 'granted' : 'denied')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
      setSubmitting(false)
    }
  }

  const wrapStyle: React.CSSProperties = { minHeight: '100vh', background: '#FAFAFA', padding: '60px 24px', fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif' }
  const cardStyle: React.CSSProperties = { maxWidth: 560, margin: '0 auto', background: 'white', border: '1px solid #E5E5E5', borderRadius: 16, padding: '40px 32px' }

  if (loading) return <div style={wrapStyle}><div style={cardStyle}><p style={{ color: '#6B6B6B' }}>Loading...</p></div></div>
  if (error) return <div style={wrapStyle}><div style={cardStyle}><p style={{ color: '#dc2626' }}>{error}</p></div></div>
  if (!preview) return null

  // Already actioned previously
  if (preview.permission_status === 'granted' && !done) {
    return <div style={wrapStyle}><div style={cardStyle}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 12 }}>Thanks - already on record</h1>
      <p style={{ color: '#3A3A3A', lineHeight: 1.6 }}>You already gave permission to share this response on {preview.permission_granted_at ? new Date(preview.permission_granted_at).toLocaleDateString('en-AU') : ''}. Nothing more to do.</p>
    </div></div>
  }
  if (preview.permission_status === 'denied' && !done) {
    return <div style={wrapStyle}><div style={cardStyle}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 12 }}>Permission declined</h1>
      <p style={{ color: '#3A3A3A', lineHeight: 1.6 }}>You previously declined to share this response. Nothing has been published.</p>
    </div></div>
  }
  if (done === 'granted') {
    return <div style={wrapStyle}><div style={cardStyle}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 12 }}>Permission granted - thank you</h1>
      <p style={{ color: '#3A3A3A', lineHeight: 1.6, marginBottom: 12 }}>Your words may appear on the {brand().name} website, Instagram, or other marketing surfaces, attributed as: <strong>{publishAs === 'first_name' ? preview.first_name : publishAs === 'first_last_initial' ? `${preview.first_name} ${preview.last_initial ? preview.last_initial + '.' : ''}` : 'Anonymous'}</strong>.</p>
      <p style={{ color: '#6B6B6B', fontSize: 13, lineHeight: 1.5 }}>You can withdraw permission at any time by replying to your original {brand().name} email with &ldquo;withdraw quote&rdquo;.</p>
    </div></div>
  }
  if (done === 'denied') {
    return <div style={wrapStyle}><div style={cardStyle}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 12 }}>Got it - nothing published</h1>
      <p style={{ color: '#3A3A3A', lineHeight: 1.6 }}>Your response remains on our internal records as anonymous coaching feedback. It will not be shared anywhere public.</p>
    </div></div>
  }

  // The actual consent form
  return <div style={wrapStyle}><div style={cardStyle}>
    <p style={{ color: '#1B6DFC', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{brand().name} · Permission to Share</p>
    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', marginBottom: 16, letterSpacing: '-0.02em' }}>Can we share what you wrote?</h1>
    <p style={{ color: '#3A3A3A', lineHeight: 1.6, marginBottom: 20 }}>You recently shared feedback after your {preview.stage === 'challenge' ? '14-Day Body Decode Challenge' : preview.stage}. With your permission, we&apos;d love to use what you said as a testimonial on the {brand().name} website, Instagram, or other marketing.</p>

    <div style={{ background: '#F3E9E1', borderLeft: '3px solid #1B6DFC', borderRadius: 4, padding: '16px 18px', margin: '20px 0', fontStyle: 'italic', color: '#1A1A1A', lineHeight: 1.55 }}>
      &ldquo;{preview.response_text ?? '(no text on file)'}&rdquo;
    </div>

    <p style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>How should we attribute this if shared?</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
      {[
        { v: 'first_name', label: `First name only - "${preview.first_name ?? 'You'}"` },
        { v: 'first_last_initial', label: `First name + last initial - "${preview.first_name ?? 'You'} ${preview.last_initial ? preview.last_initial + '.' : 'X.'}"` },
        { v: 'anonymous', label: 'Anonymous - no name shown' },
      ].map(opt => (
        <label key={opt.v} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', border: `1px solid ${publishAs === opt.v ? '#1B6DFC' : '#E5E5E5'}`, borderRadius: 8, cursor: 'pointer', background: publishAs === opt.v ? '#EFF6FF' : 'white' }}>
          <input type="radio" name="publishAs" value={opt.v} checked={publishAs === opt.v} onChange={() => setPublishAs(opt.v as 'first_name' | 'first_last_initial' | 'anonymous')} />
          <span style={{ fontSize: 14, color: '#1A1A1A' }}>{opt.label}</span>
        </label>
      ))}
    </div>

    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={() => action('grant')} disabled={submitting} style={{ flex: 1, padding: '14px 18px', background: '#1B6DFC', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer' }}>
        {submitting ? 'Saving...' : 'Yes, share it'}
      </button>
      <button onClick={() => action('deny')} disabled={submitting} style={{ flex: 1, padding: '14px 18px', background: 'white', color: '#3A3A3A', border: '1px solid #D4D4D4', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: submitting ? 'wait' : 'pointer' }}>
        No, keep private
      </button>
    </div>

    <p style={{ color: '#6B6B6B', fontSize: 12, lineHeight: 1.5, marginTop: 20 }}>You can withdraw permission at any time by replying to your original {brand().name} email with &ldquo;withdraw quote&rdquo;. We&apos;ll remove it within 48 hours.</p>
  </div></div>
}
