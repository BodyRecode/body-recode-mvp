import { ImageResponse } from 'next/og'
import { logoUrl, brand } from '@/config/tenant'

export const runtime = 'edge'
export const alt = 'B-Roll Canvas: Blueprint Six-Week Journey. Production utility page for the Body Rewire Blueprint explainer video.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
          padding: '64px',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(27, 109, 252, 0.1) 0%, transparent 65%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <img
            src={logoUrl()}
            width={200}
            alt={brand().name}
            style={{ display: 'block' }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              borderRadius: '99px',
              background: '#1A1A1A',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#1B6DFC',
              }}
            />
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              B-Roll Canvas
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#1B6DFC',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}
          >
            Blueprint Explainer Video
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 900,
              color: '#1A1A1A',
              lineHeight: 1.0,
              letterSpacing: '-0.035em',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div>The Six-Week Journey</div>
          </div>
          <div
            style={{
              width: '72px',
              height: '4px',
              background: '#1B6DFC',
              borderRadius: '2px',
              marginBottom: '24px',
            }}
          />
          <div
            style={{
              fontSize: '26px',
              fontWeight: 500,
              color: '#4A4A4A',
              lineHeight: 1.4,
              maxWidth: '1000px',
            }}
          >
            Three production zones: Day 1 portal opens, Week 3 midpoint reflection, Week 6 pattern corrected.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            paddingTop: '24px',
            borderTop: '1px solid #E5E5E5',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#6B6B6B',
              fontStyle: 'italic',
            }}
          >
            Internal production page · noindex
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#1B6DFC',
            }}
          >
            bodyrecode.au/broll/blueprint-six-weeks
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
