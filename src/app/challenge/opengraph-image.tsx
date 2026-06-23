import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "You're training. You're eating clean. The fat won't move. The 14-Day Body Decode reads your body first. Free."
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
        {/* Subtle Signal Blue radial accent top-right */}
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

        {/* Top row: logo + Free badge */}
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
              Free 14-Day Challenge
            </div>
          </div>
        </div>

        {/* Centre: headline + sub */}
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
              fontSize: '76px',
              fontWeight: 900,
              color: '#1A1A1A',
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              marginBottom: '28px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div>You&apos;re training. You&apos;re eating clean.</div>
            <div>The fat won&apos;t move.</div>
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
            The 14-Day Body Decode reads your body first.
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
              Built by Kade Dunstone
            </div>
            <div style={{ fontSize: '15px', color: '#6B6B6B' }}>
              Sports Scientist · Business Entrepreneur · Body Recode Founder
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
            bodyrecode.au/challenge
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
