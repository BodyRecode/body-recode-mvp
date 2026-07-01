import { ImageResponse } from 'next/og'
import { coach, logoUrl } from '@/config/tenant'

export const runtime = 'edge'
export const alt = "Knowing your pattern is not correcting it. The 6-Week Body Rewire is focused corrective work built specifically for your pattern. $${products().blueprintPrice}."
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const c = coach()
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
        {/* Signal Blue radial accent */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(27, 109, 252, 0.12) 0%, transparent 65%)',
          }}
        />

        {/* Top row: logo + badge */}
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
            alt="Body Recode"
            style={{ display: 'block' }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              borderRadius: '99px',
              background: 'rgba(27, 109, 252, 0.1)',
              border: '1px solid rgba(27, 109, 252, 0.3)',
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
                color: '#1056D6',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              6-Week Body Rewire · $97
            </div>
          </div>
        </div>

        {/* Centre */}
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
              fontSize: '72px',
              fontWeight: 900,
              color: '#1A1A1A',
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              marginBottom: '28px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div>Knowing your pattern</div>
            <div style={{ color: '#1B6DFC' }}>is not correcting it.</div>
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
              fontSize: '28px',
              fontWeight: 500,
              color: '#4A4A4A',
              lineHeight: 1.4,
              maxWidth: '960px',
            }}
          >
            Six weeks of focused corrective work built around your specific pattern.
          </div>
        </div>

        {/* Bottom row: founder + URL */}
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#1A1A1A',
                marginBottom: '4px',
              }}
            >
              Built by {c.fullName}
            </div>
            <div style={{ fontSize: '15px', color: '#6B6B6B' }}>
              {c.credentials}
            </div>
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#1B6DFC',
              letterSpacing: '0.02em',
            }}
          >
            bodyrecode.au/blueprint
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
