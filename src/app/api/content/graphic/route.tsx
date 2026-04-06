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

async function getPhotoData(req: NextRequest): Promise<string> {
  const baseUrl = new URL(req.url).origin
  const res = await fetch(`${baseUrl}/kade.jpg`)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:image/jpeg;base64,${base64}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get('text') ?? ''
  const sub = searchParams.get('sub') ?? ''
  const label = searchParams.get('label') ?? ''
  const accent = searchParams.get('accent') ?? 'teal' // teal | red | amber
  const style = searchParams.get('style') ?? 'quote'
  const n = parseInt(searchParams.get('n') ?? '1', 10) // slide number for carousel-slide

  const accentColor = accent === 'red' ? '#ef4444' : accent === 'amber' ? '#f59e0b' : '#14b8a6'

  const isPhotoStyle = style === 'photo-split' || style === 'photo-quote' || style === 'photo-right' || style === 'photo-top'
  const photoSrc = isPhotoStyle ? await getPhotoData(request) : ''

  const logoSrc = await getLogoData(request)

  // Logo only — centred on dark background
  if (style === 'logo-only') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ width: '520px', objectFit: 'contain' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

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

  // Style 1: Photo left, text right
  if (style === 'photo-split') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', display: 'flex', fontFamily: 'sans-serif' }}>
          {/* Photo left half */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} style={{ width: '480px', height: '1080px', objectFit: 'cover', objectPosition: 'center top', flexShrink: 0 }} alt="" />
          {/* Dark overlay fade */}
          <div style={{ position: 'absolute', left: '360px', top: 0, width: '120px', height: '1080px', background: 'linear-gradient(to right, transparent, #0c0a09)' }} />
          {/* Text right half */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 80px 80px 60px' }}>
            <div style={{ width: '40px', height: '4px', background: '#14b8a6', marginBottom: '32px' }} />
            {label && <div style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '20px' }}>{label}</div>}
            <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '28px' }}>{displayText}</div>
            {sub && <div style={{ fontSize: '22px', color: '#a8a29e', lineHeight: 1.6, fontWeight: 400 }}>{sub}</div>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', right: '80px', height: '72px', objectFit: 'contain' }} />
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // Style 2: Dark card with photo inset bottom-right, text dominant
  if (style === 'photo-quote') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '100px', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '40px', height: '4px', background: '#14b8a6', marginBottom: '32px' }} />
            {label && <div style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '20px' }}>{label}</div>}
            <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '780px' }}>{displayText}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Body Recode" style={{ height: '72px', objectFit: 'contain' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc} style={{ width: '320px', height: '400px', objectFit: 'cover', objectPosition: 'center top', borderRadius: '12px', border: '2px solid #1c1917' }} alt="" />
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // Style 3: Photo top (head visible), dark text panel bottom
  if (style === 'photo-top') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', position: 'relative', display: 'flex', fontFamily: 'sans-serif' }}>
          {/* Image scaled to 720px wide (= 1080px tall exactly), centred horizontally */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* Image centred within text-width column (920px), scaled down so person appears smaller */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} style={{ position: 'absolute', top: 0, left: '240px', width: '600px', height: '900px' }} alt="" />
          {/* Dark panel covers bottom ~460px, hides image below face */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '1080px', height: '460px', background: '#0c0a09', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '36px 80px 48px' }}>
            <div style={{ width: '40px', height: '4px', background: '#14b8a6', marginBottom: '20px' }} />
            {label && <div style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>{label}</div>}
            <div style={{ fontSize: '44px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '14px' }}>{displayText}</div>
            {sub && <div style={{ fontSize: '21px', color: '#a8a29e', lineHeight: 1.5 }}>{sub.length > 100 ? sub.slice(0, 97) + '...' : sub}</div>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '36px', right: '80px', height: '72px', objectFit: 'contain' }} />
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // Style 3b: Text left, photo right (portrait strip, full height)
  if (style === 'photo-right') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', display: 'flex', fontFamily: 'sans-serif' }}>
          {/* Text left */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px 80px 80px' }}>
            <div style={{ width: '40px', height: '4px', background: '#14b8a6', marginBottom: '32px' }} />
            {label && <div style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '20px' }}>{label}</div>}
            <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '28px' }}>{displayText}</div>
            {sub && <div style={{ fontSize: '22px', color: '#a8a29e', lineHeight: 1.6, fontWeight: 400 }}>{sub}</div>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '80px', height: '72px', objectFit: 'contain' }} />
          </div>
          {/* Photo right — portrait, full height, crops from centre */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} style={{ width: '480px', height: '1080px', objectFit: 'cover', flexShrink: 0 }} alt="" />
          {/* Fade on left edge of photo — mirrors photo-split exactly */}
          <div style={{ position: 'absolute', left: '600px', top: 0, width: '120px', height: '1080px', background: 'linear-gradient(to right, #0c0a09, transparent)' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
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

  // ── SCORECARD CTA ─────────────────────────────────────────────
  // Sunday diagnostic post — shows all 3 states, drives to scorecard
  if (style === 'scorecard-cta') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px', fontFamily: 'sans-serif' }}>

          {/* Label */}
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '28px' }}>Body State Scorecard</div>

          {/* Headline */}
          <div style={{ fontSize: '68px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.02em', maxWidth: '880px', marginBottom: '48px' }}>
            {displayText || 'Your body is operating in one of three states right now.'}
          </div>

          {/* Three states stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '52px' }}>
            {[
              { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', label: 'Depleted', desc: 'Protection mode. Adding more makes it worse.' },
              { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'Transitioning', desc: 'Mixed signals. Something is blocking your response.' },
              { color: '#14b8a6', bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.25)', label: 'Ready', desc: 'Your biology is in a position to respond.' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '20px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '18px 24px' }}>
                <div style={{ width: '4px', height: '36px', background: s.color, borderRadius: '2px', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: s.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '22px', color: '#d4cfc9', fontWeight: 400 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.4)', borderRadius: '100px', padding: '16px 36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#14b8a6' }}>Find out which state you're in</div>
              <div style={{ fontSize: '20px', color: '#14b8a6' }}>→</div>
            </div>
            <div style={{ fontSize: '20px', color: '#a8a29e', letterSpacing: '0.04em' }}>Free · 2 min · Link in bio</div>
          </div>

          {/* Logo bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '100px', height: '36px', objectFit: 'contain' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // ── FOUNDER PROGRAM ─────────────────────────────────────────────
  // Deep teal background, 20 spots badge, application/trade language
  if (style === 'founder') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0a1f1f', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px', fontFamily: 'sans-serif' }}>

          {/* Subtle teal top border */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '1080px', height: '4px', background: 'linear-gradient(to right, #14b8a6, transparent)' }} />

          {/* 20 spots badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.35)', borderRadius: '100px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#14b8a6' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Founding Client Program</div>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#a8a29e', letterSpacing: '0.06em' }}>20 spots only</div>
          </div>

          {/* Headline */}
          <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '880px', marginBottom: '32px' }}>
            {displayText || 'This isn\'t a discount. It\'s a trade.'}
          </div>

          {/* Sub copy */}
          {sub && (
            <div style={{ fontSize: '26px', color: '#a8a29e', lineHeight: 1.6, fontWeight: 400, maxWidth: '820px', marginBottom: '52px' }}>{sub}</div>
          )}

          {/* Trade detail box */}
          <div style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '12px', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '820px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ fontSize: '22px', color: '#14b8a6', marginTop: '2px' }}>↓</div>
              <div style={{ fontSize: '24px', color: '#d4cfc9', lineHeight: 1.5 }}>Half the standard fee — in exchange for documented participation in a structured case study process.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ fontSize: '22px', color: '#14b8a6', marginTop: '2px' }}>↓</div>
              <div style={{ fontSize: '24px', color: '#d4cfc9', lineHeight: 1.5 }}>Application only. Not everyone will be selected.</div>
            </div>
          </div>

          {/* Logo bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '100px', height: '36px', objectFit: 'contain' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // ── CAROUSEL HOOK ─────────────────────────────────────────────
  // Slide 1 — big bold hook, swipe indicator
  if (style === 'carousel-hook') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
          {/* Left teal border stripe */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: '8px', height: '1080px', background: '#14b8a6' }} />

          {/* Label */}
          {label && (
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '28px' }}>{label}</div>
          )}

          {/* Hook headline */}
          <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '880px', marginBottom: '40px' }}>{displayText}</div>

          {/* Sub copy */}
          {sub && (
            <div style={{ fontSize: '26px', color: '#a8a29e', lineHeight: 1.55, fontWeight: 400, maxWidth: '800px' }}>{sub}</div>
          )}

          {/* Swipe indicator */}
          <div style={{ position: 'absolute', bottom: '70px', right: '100px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#78716c', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Swipe</div>
            <div style={{ fontSize: '22px', color: '#14b8a6', fontWeight: 700 }}>→</div>
          </div>

          {/* Logo bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '100px', height: '36px', objectFit: 'contain' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // ── CAROUSEL SLIDE ─────────────────────────────────────────────
  // Interior numbered slide — point + supporting copy
  if (style === 'carousel-slide') {
    const slideNum = String(n).padStart(2, '0')
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
          {/* Left teal border stripe */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: '8px', height: '1080px', background: '#14b8a6' }} />

          {/* Slide number */}
          <div style={{ fontSize: '100px', fontWeight: 800, color: '#14b8a6', lineHeight: 1, marginBottom: '40px', letterSpacing: '-0.04em', opacity: 0.25 }}>{slideNum}</div>

          {/* Point headline */}
          <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '880px', marginBottom: '36px' }}>{displayText}</div>

          {/* Supporting copy */}
          {sub && (
            <div style={{ fontSize: '26px', color: '#a8a29e', lineHeight: 1.6, fontWeight: 400, maxWidth: '820px' }}>{sub}</div>
          )}

          {/* Logo bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '100px', height: '36px', objectFit: 'contain' }} />

          {/* Slide number small bottom right */}
          <div style={{ position: 'absolute', bottom: '68px', right: '100px', fontSize: '14px', fontWeight: 600, color: '#78716c', letterSpacing: '0.08em' }}>{slideNum}</div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // ── CAROUSEL CTA ─────────────────────────────────────────────
  // Final slide — drives to scorecard or check-in
  if (style === 'carousel-cta') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c0a09', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '100px', fontFamily: 'sans-serif', textAlign: 'center' }}>
          {/* Left teal border stripe */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: '8px', height: '1080px', background: '#14b8a6' }} />

          {/* Teal accent bar */}
          <div style={{ width: '48px', height: '4px', background: '#14b8a6', marginBottom: '48px' }} />

          {/* CTA headline */}
          <div style={{ fontSize: '64px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.02em', maxWidth: '880px', marginBottom: '32px' }}>
            {displayText || 'Find out which state your body is in.'}
          </div>

          {/* Sub copy */}
          {sub && (
            <div style={{ fontSize: '26px', color: '#a8a29e', lineHeight: 1.55, fontWeight: 400, maxWidth: '700px', marginBottom: '56px' }}>{sub}</div>
          )}

          {/* CTA pill */}
          <div style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.4)', borderRadius: '100px', padding: '18px 48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.01em' }}>
              {label || 'Take the Body State Scorecard'}
            </div>
            <div style={{ fontSize: '22px', color: '#14b8a6' }}>→</div>
          </div>

          <div style={{ fontSize: '16px', color: '#78716c', marginTop: '24px', letterSpacing: '0.04em' }}>Link in bio</div>

          {/* Logo bottom centre */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', height: '36px', objectFit: 'contain' }} />
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
            background: '#0c0a09',
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
