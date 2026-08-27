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
/**
 * Who is talking, shown under the player.
 *
 * A woman meets Kade on the landing page (the Hero carries his name and
 * credentials), signs up, and then on day 1 a different person starts talking
 * to her about her own report. Nothing on the page said who that was: the
 * lesson slot rendered with an eyebrow and the day title and no attribution at
 * all, while Kade's day 5 close sat under a "Kade, to close" label. So the one
 * face she had not met was the only one that went unnamed.
 *
 * This lives on the PAGE rather than in the script deliberately. It shows on
 * every day at no recording cost, it is there before the videos land, and the
 * wording can change later without a re-shoot.
 */
function Byline({ name, role }: { name: string; role: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 2px 0' }}>
      <span aria-hidden style={{
        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
        background: 'rgba(27,109,252,0.10)', border: '1px solid rgba(27,109,252,0.30)',
        color: BLUE, fontSize: '13px', fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{name.charAt(0)}</span>
      <span style={{ fontSize: '13px', color: '#666D7A', lineHeight: 1.45 }}>
        <strong style={{ color: '#141821', fontWeight: 800 }}>{name}</strong>
        <span style={{ margin: '0 6px', color: '#C4C4C4' }}>·</span>
        {role}
      </span>
    </div>
  )
}

export default function DecodeExplainer({
  src,
  poster,
  eyebrow = 'Ninety seconds',
  title = 'How it works',
  byline,
  hideWhenMissing = false,
}: {
  src: string
  poster?: string
  eyebrow?: string
  title?: string
  /** Shown under the player. Omit where the page already names the speaker. */
  byline?: { name: string; role: string }
  /**
   * Render NOTHING rather than a "coming soon" card when the file is missing.
   *
   * For the portal, the placeholder is honest and useful - she is inside the
   * product and a card saying a video is coming tells her something true. On the
   * LANDING PAGE it is the opposite: it sits directly under the headline, so the
   * most prominent thing a stranger arriving from a cold ad sees is a box
   * announcing that the product is not finished. The page reads better with the
   * headline, the copy and the signup form and no video at all until the file
   * lands, at which point it appears on its own with no redeploy.
   */
  hideWhenMissing?: boolean
}) {
  const [failed, setFailed] = useState(false)

  // Fallback matches the kit's VideoComingSoon treatment so the slot reads as
  // part of the page rather than a hole in it.
  if (failed) {
    if (hideWhenMissing) return null
    return (
      <div style={{ marginBottom: '32px' }}>
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, #141821 0%, #0B1F3F 100%)',
        border: '1px solid rgba(27,109,252,0.35)', borderRadius: '14px', aspectRatio: '16 / 9',
        overflow: 'hidden', display: 'flex', alignItems: 'center',
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
      {byline && <Byline {...byline} />}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '32px' }}>
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
          background: '#000000',
          aspectRatio: '16 / 9',
          objectFit: 'cover',
        }}
      />
      {byline && <Byline {...byline} />}
    </div>
  )
}
