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
  const label = searchParams.get('label') ?? ''
  const accent = searchParams.get('accent') ?? 'teal' // teal | red | amber
  const style = searchParams.get('style') ?? 'quote'

  const accentColor = accent === 'red' ? '#ef4444' : accent === 'amber' ? '#f59e0b' : '#14b8a6'

  const logoSrc = await getLogoData(request)

  // Truncate text for display
  const displayText = text.length > 140 ? text.slice(0, 137) + '...' : text

  function fontSize(len: number) {
    if (len <= 40) return '72px'
    if (len <= 60) return '62px'
    if (len <= 80) return '54px'
    if (len <= 100) return '46px'
    if (len <= 120) return '40px'
    return '34px'
  }

  // Scorecard insight card — teal bar, label, big headline, body copy
  if (style === 'insight') {
    const displaySub = sub.length > 180 ? sub.slice(0, 177) + '...' : sub
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
          {/* Teal accent bar */}
          <div style={{ width: '48px', height: '4px', background: '#14b8a6', marginBottom: '36px' }} />
          {/* Label */}
          {label && (
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '24px' }}>
              {label}
            </div>
          )}
          {/* Headline */}
          <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.025em', maxWidth: '880px', marginBottom: '36px' }}>
            {displayText}
          </div>
          {/* Body copy */}
          {displaySub && (
            <div style={{ fontSize: '26px', color: '#a8a29e', lineHeight: 1.6, maxWidth: '820px', fontWeight: 400 }}>
              {displaySub}
            </div>
          )}
          {/* Logo bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '100px', height: '72px', objectFit: 'contain' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // Body state card — left coloured border, state label, headline, description
  if (style === 'body-state') {
    const displaySub = sub.length > 220 ? sub.slice(0, 217) + '...' : sub
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
          {/* Inner card with left border */}
          <div style={{
            background: '#111110',
            borderRadius: '16px',
            borderLeft: `6px solid ${accentColor}`,
            padding: '60px 64px',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* State label + range */}
            {label && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: accentColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {label}
                </div>
              </div>
            )}
            {/* Headline */}
            <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '820px', marginBottom: '32px' }}>
              {displayText}
            </div>
            {/* Description */}
            {displaySub && (
              <div style={{ fontSize: '24px', color: '#d4cfc9', lineHeight: 1.65, maxWidth: '800px', fontWeight: 400 }}>
                {displaySub}
              </div>
            )}
          </div>
          {/* Logo bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '100px', height: '72px', objectFit: 'contain' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

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
              fontSize: fontSize(displayText.length),
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
              fontSize: fontSize(displayText.length),
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
            fontSize: fontSize(displayText.length),
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
