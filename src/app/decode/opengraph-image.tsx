import { ImageResponse } from 'next/og'
import { brand } from '@/config/tenant'

/**
 * Link preview for /decode.
 *
 * Matters more than usual here: the live scorecard follow-up sequence now links
 * this page from four of its five emails, and a shared or forwarded link with
 * no card looks broken.
 *
 * Says what it IS, not just the hook, for the same reason the page does. The
 * whole point of the 24 Aug copy pass was that "your read" means nothing to
 * someone who has never heard of us, and a preview card is the most cold
 * surface there is.
 */

export const runtime = 'edge'
export const alt = "The Body Decode. A free assessment: two minutes of questions, then a written report naming which of four causes is behind your body not responding."
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '68px 72px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
            <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: BLUE, display: 'flex' }} />
            <div style={{ fontSize: '22px', fontWeight: 700, color: BLUE, letterSpacing: '3px', display: 'flex' }}>
              FREE · THE BODY DECODE
            </div>
          </div>

          <div style={{ fontSize: '76px', fontWeight: 800, color: INK, letterSpacing: '-3.2px', lineHeight: 1.03, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex' }}>You&apos;re training. You&apos;re eating well.</div>
            <div style={{ display: 'flex', color: BLUE }}>And the fat won&apos;t move.</div>
          </div>

          <div style={{ width: '76px', height: '5px', background: BLUE, borderRadius: '3px', margin: '34px 0 30px', display: 'flex' }} />

          <div style={{ fontSize: '29px', color: '#4A4A4A', lineHeight: 1.45, maxWidth: '900px', display: 'flex' }}>
            A free assessment. Two minutes of questions, then a written report naming which of four common causes is behind it, and the three things that shift it.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            {['2 min of questions', '5 short videos', 'No card'].map(t => (
              <div
                key={t}
                style={{
                  display: 'flex',
                  fontSize: '21px',
                  fontWeight: 600,
                  color: INK,
                  background: 'rgba(27,109,252,0.08)',
                  border: '1px solid rgba(27,109,252,0.25)',
                  borderRadius: '999px',
                  padding: '11px 22px',
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div style={{ fontSize: '23px', fontWeight: 700, color: '#8A8A8A', letterSpacing: '1px', display: 'flex' }}>
            {brand().name.toUpperCase()}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
