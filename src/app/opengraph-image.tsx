import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Body Recode™ | Biological Interpretation Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Helix */}
        <img
          src="https://bodyrecode.au/helix-icon.png"
          style={{
            position: 'absolute',
            right: '-40px',
            top: '0',
            height: '100%',
            width: 'auto',
            opacity: 0.12,
          }}
        />

        {/* Teal glow top right */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,225,194,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative' }}>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: '#1B6DFC',
              textTransform: 'uppercase',
            }}
          >
            Biological Interpretation Platform
          </div>
          <div
            style={{
              fontSize: '80px',
              fontWeight: 900,
              color: '#1A1A1A',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            Body Recode™
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.5)',
              maxWidth: '580px',
              lineHeight: 1.5,
            }}
          >
            One interpretive engine. Five environments. The IP sits above all of it.
          </div>
          <div
            style={{
              marginTop: '8px',
              fontSize: '16px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.05em',
            }}
          >
            bodyrecode.au
          </div>
        </div>

        {/* Bottom teal line */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '3px',
            background: '#1B6DFC',
            opacity: 0.4,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
