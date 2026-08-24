'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'

const BLUE = '#1B6DFC'

/**
 * The landing page explainer slot.
 *
 * Amanda has not delivered it yet. A bare <video> pointing at a missing object
 * renders as a dead black rectangle with no explanation, which reads as a broken
 * page rather than an unfinished one, so this shows a branded placeholder until
 * the file exists and swaps itself the moment it does.
 *
 * Detection is done by the browser: if the object 404s the video fires `error`
 * and we fall back. That keeps the swap automatic on upload with no redeploy,
 * which is the whole reason these live in Supabase storage rather than public/.
 */
export default function DecodeExplainer({
  src,
  poster,
  eyebrow = 'Ninety seconds',
  title = 'How the read works',
}: {
  src: string
  poster?: string
  eyebrow?: string
  title?: string
}) {
  const [failed, setFailed] = useState(false)

  // Fallback matches the kit's VideoComingSoon treatment so the slot reads as
  // part of the page rather than a hole in it.
  if (failed) {
    return (
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, #1A1A1A 0%, #0B1F3F 100%)',
        border: '1px solid rgba(27,109,252,0.35)', borderRadius: '14px', aspectRatio: '16 / 9',
        marginBottom: '32px', overflow: 'hidden', display: 'flex', alignItems: 'center',
        justifyContent: 'center', boxShadow: '0 10px 30px -8px rgba(27,109,252,0.35)',
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.25) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', textAlign: 'center', padding: '24px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(27,109,252,0.18)', border: '1.5px solid rgba(255,255,255,0.4)', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={26} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: '4px' }} />
          </div>
          <p style={{ fontSize: '12px', fontWeight: 800, color: '#7BB3FF', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px' }}>{eyebrow}</p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.015em', margin: '0 0 6px', lineHeight: 1.25 }}>{title}</p>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#8A8A8E', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Coming soon</p>
        </div>
      </div>
    )
  }

  return (
    <video
      src={src}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        display: 'block',
        borderRadius: '14px',
        marginBottom: '32px',
        background: '#000000',
        aspectRatio: '16 / 9',
        objectFit: 'cover',
      }}
    />
  )
}
