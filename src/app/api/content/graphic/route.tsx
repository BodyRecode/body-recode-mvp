import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// GET /api/content/graphic?text=...&style=quote|statement|question&sub=...
// Returns a 1080x1080 PNG graphic in Body Recode brand style

async function getLogoData(req: NextRequest): Promise<string> {
  const baseUrl = new URL(req.url).origin
  const res = await fetch(`${baseUrl}/logo-teal.png`)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:image/png;base64,${base64}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get('text') ?? ''
  const sub = searchParams.get('sub') ?? ''
  const style = searchParams.get('style') ?? 'quote'

  const logoSrc = await getLogoData(request)

  // Truncate text for display
  const displayText = text.length > 120 ? text.slice(0, 117) + '...' : text

  if (style === 'statement') {
    return new ImageResponse(
      (
        <div
          style={{
            width: '1080px',
            height: '1080px',
            background: '#0c0a09',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '100px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Teal accent bar */}
          <div style={{ width: '48px', height: '4px', background: '#14b8a6', marginBottom: '48px' }} />

          {/* Main text */}
          <div
            style={{
              fontSize: displayText.length > 80 ? '52px' : '64px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              maxWidth: '880px',
            }}
          >
            {displayText}
          </div>

          {/* Sub text */}
          {sub && (
            <div
              style={{
                fontSize: '28px',
                color: '#a8a29e',
                marginTop: '40px',
                fontWeight: 400,
                lineHeight: 1.5,
                maxWidth: '800px',
              }}
            >
              {sub}
            </div>
          )}

          {/* Logo bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="Body Recode"
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '100px',
              height: '36px',
              objectFit: 'contain',
            }}
          />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  if (style === 'question') {
    return new ImageResponse(
      (
        <div
          style={{
            width: '1080px',
            height: '1080px',
            background: '#111827',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '100px',
            fontFamily: 'sans-serif',
            textAlign: 'center',
          }}
        >
          {/* Large teal question mark accent */}
          <div style={{ fontSize: '80px', color: '#14b8a6', fontWeight: 700, marginBottom: '32px', lineHeight: 1 }}>?</div>

          {/* Main text */}
          <div
            style={{
              fontSize: displayText.length > 80 ? '50px' : '60px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              maxWidth: '880px',
            }}
          >
            {displayText}
          </div>

          {/* Sub text */}
          {sub && (
            <div
              style={{
                fontSize: '26px',
                color: '#a8a29e',
                marginTop: '36px',
                fontWeight: 400,
                lineHeight: 1.5,
                maxWidth: '780px',
              }}
            >
              {sub}
            </div>
          )}

          {/* Logo bottom centre */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="Body Recode"
            style={{
              position: 'absolute',
              bottom: '60px',
              height: '36px',
              objectFit: 'contain',
            }}
          />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // Default: quote card
  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1080px',
          background: '#1c1917',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '100px',
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}
      >
        {/* Opening quote mark */}
        <div style={{ fontSize: '120px', color: '#14b8a6', fontWeight: 700, lineHeight: 0.8, marginBottom: '32px', opacity: 0.6 }}>&ldquo;</div>

        {/* Main text */}
        <div
          style={{
            fontSize: displayText.length > 80 ? '50px' : '60px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.35,
            letterSpacing: '-0.01em',
            maxWidth: '880px',
          }}
        >
          {displayText}
        </div>

        {/* Divider */}
        <div style={{ width: '60px', height: '2px', background: '#14b8a6', margin: '48px auto 0' }} />

        {/* Logo bottom centre */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Body Recode"
          style={{
            position: 'absolute',
            bottom: '60px',
            height: '36px',
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
