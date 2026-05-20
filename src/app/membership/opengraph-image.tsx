import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "State shift is not a six-week event. It is a long arc. The Body Recode Membership is the infrastructure. $49/week."
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
            src="https://bodyrecode.au/logo-black.png"
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
              Membership · $49/week
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
              fontSize: '70px',
              fontWeight: 900,
              color: '#1A1A1A',
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              marginBottom: '28px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div>State shift is not a six-week event.</div>
            <div style={{ color: '#1B6DFC' }}>It is a long arc.</div>
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
              maxWidth: '1000px',
            }}
          >
            The infrastructure for the months-long state shift. Block by block. Calibrated to your data.
          </div>
        </div>

        {/* Bottom row */}
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
              Built by Kade Dunstone
            </div>
            <div style={{ fontSize: '15px', color: '#6B6B6B' }}>
              Human Movement Scientist · Business Entrepreneur · Body Recode Founder
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
            bodyrecode.au/membership
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
