import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// GET /api/content/graphic?text=...&style=quote|statement|question&sub=...
// Returns a 1080x1080 PNG graphic in Body Recode brand style

async function getLogoData(req: NextRequest): Promise<string> {
  const baseUrl = new URL(req.url).origin
  const res = await fetch(`${baseUrl}/logo-black.png`)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:image/png;base64,${base64}`
}

// Photo library — pass ?photo=N to pick from /public/ (1-8 currently live)
// 1-7: kade-1 through kade-7 (1080x1080 square headshots from IMG_2561-2567)
// 8: kade-8 (1080x1350 tall portrait)
// 0 / omitted: kade.jpg (original, kept for back-compat)
async function getPhotoData(req: NextRequest, photoIndex: number): Promise<string> {
  const baseUrl = new URL(req.url).origin
  const filename =
    photoIndex >= 1 && photoIndex <= 8 ? `kade-${photoIndex}.jpg` : 'kade.jpg'
  const res = await fetch(`${baseUrl}/${filename}`)
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
  const format = searchParams.get('format') ?? 'square' // square | story
  const n = parseInt(searchParams.get('n') ?? '1', 10) // slide number for carousel-slide
  const taken = parseInt(searchParams.get('taken') ?? '0', 10) // founder: positions taken

  const accentColor = accent === 'red' ? '#DC2626' : accent === 'amber' ? '#B7791F' : '#1B6DFC'

  const isPhotoStyle = style === 'photo-split' || style === 'photo-quote' || style === 'photo-right' || style === 'photo-top' || style === 'photo-overlay'
  const photoIndex = parseInt(searchParams.get('photo') ?? '0', 10)
  const photoSrc = isPhotoStyle ? await getPhotoData(request, photoIndex) : ''

  const logoSrc = await getLogoData(request)

  // Logo only — centred on dark background
  if (style === 'logo-only') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ width: '700px', objectFit: 'contain' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // Truncate text for display
  const displayText = text.length > 140 ? text.slice(0, 137) + '...' : text

  function hookSize(len: number) {
    if (len <= 40) return '68px'
    if (len <= 60) return '60px'
    if (len <= 80) return '52px'
    if (len <= 120) return '46px'
    return '40px'
  }

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
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', fontFamily: 'sans-serif' }}>
          {/* Photo left half */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} style={{ width: '480px', height: '1080px', objectFit: 'cover', objectPosition: 'center top', flexShrink: 0 }} alt="" />
          {/* Dark overlay fade */}
          <div style={{ position: 'absolute', left: '360px', top: 0, width: '120px', height: '1080px', background: 'linear-gradient(to right, transparent, #FFFFFF)' }} />
          {/* Text right half */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 80px 80px 60px' }}>
            <div style={{ width: '40px', height: '4px', background: '#1B6DFC', marginBottom: '32px' }} />
            {label && <div style={{ fontSize: '38px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '20px' }}>{label}</div>}
            <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '28px' }}>{displayText}</div>
            {sub && <div style={{ fontSize: '52px', color: '#6B6B6B', lineHeight: 1.5, fontWeight: 400 }}>{sub}</div>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', right: '80px', height: '80px', objectFit: 'contain' }} />
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
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '100px', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '40px', height: '4px', background: '#1B6DFC', marginBottom: '32px' }} />
            {label && <div style={{ fontSize: '38px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '20px' }}>{label}</div>}
            <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '780px' }}>{displayText}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Body Recode" style={{ height: '80px', objectFit: 'contain' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc} style={{ width: '320px', height: '400px', objectFit: 'cover', objectPosition: 'center top', borderRadius: '12px', border: '2px solid #E5E5E5' }} alt="" />
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
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', position: 'relative', display: 'flex', fontFamily: 'sans-serif' }}>
          {/* Image scaled to 720px wide (= 1080px tall exactly), centred horizontally */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* Image centred within text-width column (920px), scaled down so person appears smaller */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} style={{ position: 'absolute', top: 0, left: '240px', width: '600px', height: '900px' }} alt="" />
          {/* Dark panel covers bottom ~460px, hides image below face */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '1080px', height: '460px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '36px 80px 48px' }}>
            <div style={{ width: '40px', height: '4px', background: '#1B6DFC', marginBottom: '20px' }} />
            {label && <div style={{ fontSize: '38px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>{label}</div>}
            <div style={{ fontSize: '44px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '14px' }}>{displayText}</div>
            {sub && <div style={{ fontSize: '38px', color: '#6B6B6B', lineHeight: 1.45 }}>{sub.length > 80 ? sub.slice(0, 77) + '...' : sub}</div>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '36px', right: '80px', height: '80px', objectFit: 'contain' }} />
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // Style 3c: Full-bleed photo background with centred text overlay.
  // Mirrors the Chase Life Consulting style: bold serif hook + lighter body, dark gradient for legibility, handle bottom centre.
  // Supports format=square (1080x1080) or format=story (1080x1920).
  if (style === 'photo-overlay') {
    const isStory = format === 'story'
    const W = 1080
    const H = isStory ? 1920 : 1080
    const handle = label || '@kadedunstone'
    return new ImageResponse(
      (
        <div style={{ width: `${W}px`, height: `${H}px`, position: 'relative', display: 'flex', fontFamily: 'sans-serif', overflow: 'hidden' }}>
          {/* Full-bleed photo background */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} style={{ position: 'absolute', top: 0, left: 0, width: `${W}px`, height: `${H}px`, objectFit: 'cover' }} alt="" />
          {/* Soft gradient — heavy only at the very edges, photo stays visible */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: `${W}px`, height: `${H}px`, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.0) 25%, rgba(0,0,0,0.0) 75%, rgba(0,0,0,0.45) 100%)' }} />
          {/* Soft radial darken behind the centre text block only — keeps photo clear elsewhere */}
          <div style={{ position: 'absolute', top: '38%', left: '8%', width: '84%', height: '24%', background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.0) 75%)' }} />
          {/* Centre text block */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: `${W}px`, height: `${H}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '80px 100px', textAlign: 'center' }}>
            {/* Bold serif hook (matches example style) */}
            <div style={{ fontSize: hookSize(displayText.length), fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15, letterSpacing: '0.005em', maxWidth: '880px', fontFamily: 'Georgia, serif', textShadow: '0 3px 24px rgba(0,0,0,0.85)' }}>
              {displayText}
            </div>
            {/* Lighter body copy below */}
            {sub && (
              <div style={{ fontSize: '34px', color: '#F5F5F5', lineHeight: 1.55, fontWeight: 400, maxWidth: '780px', marginTop: '36px', textShadow: '0 2px 18px rgba(0,0,0,0.85)' }}>
                {sub}
              </div>
            )}
          </div>
          {/* Handle bottom centre */}
          <div style={{ position: 'absolute', bottom: '50px', left: 0, width: `${W}px`, display: 'flex', justifyContent: 'center' }}>
            <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.85)', fontWeight: 500, letterSpacing: '0.04em', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>{handle}</div>
          </div>
        </div>
      ),
      { width: W, height: H }
    )
  }

  // Style 3b: Text left, photo right (portrait strip, full height)
  if (style === 'photo-right') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', fontFamily: 'sans-serif' }}>
          {/* Text left */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px 80px 80px' }}>
            <div style={{ width: '40px', height: '4px', background: '#1B6DFC', marginBottom: '32px' }} />
            {label && <div style={{ fontSize: '38px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '20px' }}>{label}</div>}
            <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '28px' }}>{displayText}</div>
            {sub && <div style={{ fontSize: '52px', color: '#6B6B6B', lineHeight: 1.5, fontWeight: 400 }}>{sub}</div>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '80px', height: '80px', objectFit: 'contain' }} />
          </div>
          {/* Photo right — portrait, full height, crops from centre */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} style={{ width: '480px', height: '1080px', objectFit: 'cover', flexShrink: 0 }} alt="" />
          {/* Fade on left edge of photo — mirrors photo-split exactly */}
          <div style={{ position: 'absolute', left: '600px', top: 0, width: '120px', height: '1080px', background: 'linear-gradient(to right, #FFFFFF, transparent)' }} />
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
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
          {/* Teal accent bar */}
          <div style={{ width: '48px', height: '4px', background: '#1B6DFC', marginBottom: '36px' }} />
          {/* Label */}
          {label && (
            <div style={{ fontSize: '38px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '24px' }}>
              {label}
            </div>
          )}
          {/* Headline */}
          <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#1A1A1A', lineHeight: 1.15, letterSpacing: '-0.025em', maxWidth: '880px', marginBottom: '36px' }}>
            {displayText}
          </div>
          {/* Body copy */}
          {displaySub && (
            <div style={{ fontSize: '52px', color: '#6B6B6B', lineHeight: 1.5, maxWidth: '820px', fontWeight: 400 }}>
              {displaySub}
            </div>
          )}
          {/* Logo bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '100px', height: '80px', objectFit: 'contain' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // Body state card — left coloured border, state label, headline, description
  if (style === 'body-state') {
    const displaySub = sub.length > 220 ? sub.slice(0, 217) + '...' : sub
    const resp = new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
          {/* Inner card with left border — fixed size so logo position is identical across all three cards */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            borderLeft: `6px solid ${accentColor}`,
            padding: '60px 64px 140px 64px',
            display: 'flex', flexDirection: 'column',
            height: '760px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* State label */}
            {label && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
                <div style={{ fontSize: '38px', fontWeight: 700, color: accentColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {label}
                </div>
              </div>
            )}
            {/* Headline */}
            <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '820px', marginBottom: '32px' }}>
              {displayText}
            </div>
            {/* Description */}
            {displaySub && (
              <div style={{ fontSize: '38px', color: '#3A3A3A', lineHeight: 1.55, maxWidth: '800px', fontWeight: 400 }}>
                {displaySub}
              </div>
            )}
            {/* Logo — absolutely anchored to bottom-left of card, same position on all three */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '48px', left: '64px', height: '80px', objectFit: 'contain' }} />
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
    resp.headers.set('Cache-Control', 'no-store, max-age=0')
    return resp
  }

  // ── SCORECARD CTA ─────────────────────────────────────────────
  // Sunday diagnostic post — shows all 3 states, drives to scorecard
  if (style === 'scorecard-cta') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '80px 100px', fontFamily: 'sans-serif' }}>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Label */}
            <div style={{ fontSize: '38px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '24px' }}>Body State Scorecard</div>

            {/* Headline */}
            <div style={{ fontSize: '62px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.15, letterSpacing: '-0.02em', maxWidth: '880px', marginBottom: '36px' }}>
              {displayText || 'Your body is operating in one of three states right now.'}
            </div>

            {/* Three states stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
              {[
                { color: '#DC2626', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', label: 'Depleted', desc: 'Protection mode. Adding more makes it worse.' },
                { color: '#B7791F', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'Transitioning', desc: 'Mixed signals. Something is blocking your response.' },
                { color: '#1B6DFC', bg: 'rgba(27,109,252,0.08)', border: 'rgba(27,109,252,0.25)', label: 'Ready', desc: 'Your biology is in a position to respond.' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '20px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '16px 24px' }}>
                  <div style={{ width: '4px', height: '36px', background: s.color, borderRadius: '2px', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '38px', fontWeight: 700, color: s.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' }}>{s.label}</div>
                    <div style={{ fontSize: '26px', color: '#3A3A3A', fontWeight: 400 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(27,109,252,0.12)', border: '1px solid rgba(27,109,252,0.4)', borderRadius: '100px', padding: '16px 36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#1B6DFC' }}>Find out which state you're in</div>
                <div style={{ fontSize: '32px', color: '#1B6DFC' }}>→</div>
              </div>
              <div style={{ fontSize: '36px', color: '#6B6B6B', letterSpacing: '0.04em' }}>Free · 2 min · Link in bio</div>
            </div>
          </div>

          {/* Logo sits below all content, never overlaps */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ height: '80px', objectFit: 'contain', alignSelf: 'flex-start' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // ── FOUNDER PROGRAM ─────────────────────────────────────────────
  // Scarcity-focused: big number, progress bar, minimal copy
  if (style === 'founder') {
    const takenPct = taken > 0 ? Math.round((taken / 20) * 880) : 0
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#0c1614', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '90px 100px', fontFamily: 'sans-serif', position: 'relative' }}>

          {/* Top teal border */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '1080px', height: '4px', background: 'linear-gradient(to right, #1B6DFC, transparent)' }} />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '70px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B6DFC' }} />
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Founding Client Program</div>
            </div>

            {/* Big number */}
            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div style={{ fontSize: taken > 0 ? '260px' : '180px', fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: '-0.04em' }}>{taken > 0 ? String(taken) : '20'}</div>
              {taken > 0 ? <div style={{ fontSize: '100px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '24px' }}>/20</div> : <div style={{ display: 'none' }} />}
            </div>

            {/* Label under number */}
            <div style={{ fontSize: '48px', fontWeight: 600, color: taken > 0 ? '#DC2626' : '#6B6B6B', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '56px' }}>
              {taken > 0 ? 'positions taken' : 'positions available'}
            </div>

            {/* Progress bar */}
            <div style={{ width: '880px', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '56px', display: 'flex' }}>
              <div style={{ width: taken > 0 ? `${takenPct}px` : '0px', height: '8px', background: '#DC2626', borderRadius: '4px' }} />
            </div>

            {/* Single line of copy */}
            <div style={{ fontSize: '42px', color: '#6B6B6B', fontWeight: 400, lineHeight: 1.5, maxWidth: '820px' }}>
              {taken > 0 ? `${String(20 - taken)} positions remaining. When they fill, the founding rate closes permanently.` : 'Half the standard rate. Application only. 20 positions.'}
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ height: '72px', objectFit: 'contain', alignSelf: 'flex-start' }} />
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
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
          {/* Left teal border stripe */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: '8px', height: '1080px', background: '#1B6DFC' }} />

          {/* Label */}
          {label && (
            <div style={{ fontSize: '38px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '28px' }}>{label}</div>
          )}

          {/* Hook headline */}
          <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '880px', marginBottom: '40px' }}>{displayText}</div>

          {/* Sub copy */}
          {sub && (
            <div style={{ fontSize: '52px', color: '#6B6B6B', lineHeight: 1.5, fontWeight: 400, maxWidth: '800px' }}>{sub}</div>
          )}

          {/* Swipe indicator */}
          <div style={{ position: 'absolute', bottom: '76px', right: '100px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '26px', fontWeight: 600, color: '#6B6B6B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Swipe</div>
            <div style={{ fontSize: '30px', color: '#1B6DFC', fontWeight: 700 }}>→</div>
          </div>

          {/* Logo bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '100px', height: '80px', objectFit: 'contain' }} />
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
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
          {/* Left teal border stripe */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: '8px', height: '1080px', background: '#1B6DFC' }} />

          {/* Slide number */}
          <div style={{ fontSize: '100px', fontWeight: 800, color: '#1B6DFC', lineHeight: 1, marginBottom: '40px', letterSpacing: '-0.04em', opacity: 0.25 }}>{slideNum}</div>

          {/* Point headline */}
          <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '880px', marginBottom: '36px' }}>{displayText}</div>

          {/* Supporting copy */}
          {sub && (
            <div style={{ fontSize: '52px', color: '#6B6B6B', lineHeight: 1.5, fontWeight: 400, maxWidth: '820px' }}>{sub}</div>
          )}

          {/* Logo bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', left: '100px', height: '80px', objectFit: 'contain' }} />

          {/* Slide number small bottom right */}
          <div style={{ position: 'absolute', bottom: '76px', right: '100px', fontSize: '26px', fontWeight: 600, color: '#6B6B6B', letterSpacing: '0.08em' }}>{slideNum}</div>
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
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '100px', fontFamily: 'sans-serif', textAlign: 'center' }}>
          {/* Left teal border stripe */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: '8px', height: '1080px', background: '#1B6DFC' }} />

          {/* Teal accent bar */}
          <div style={{ width: '48px', height: '4px', background: '#1B6DFC', marginBottom: '48px' }} />

          {/* CTA headline */}
          <div style={{ fontSize: '64px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.15, letterSpacing: '-0.02em', maxWidth: '880px', marginBottom: '32px' }}>
            {displayText || 'Find out which state your body is in.'}
          </div>

          {/* Sub copy */}
          {sub && (
            <div style={{ fontSize: '52px', color: '#6B6B6B', lineHeight: 1.5, fontWeight: 400, maxWidth: '700px', marginBottom: '56px' }}>{sub}</div>
          )}

          {/* CTA pill */}
          <div style={{ background: 'rgba(27,109,252,0.12)', border: '1px solid rgba(27,109,252,0.4)', borderRadius: '100px', padding: '22px 52px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.01em' }}>
              {label || 'Take the Body State Scorecard'}
            </div>
            <div style={{ fontSize: '36px', color: '#1B6DFC' }}>→</div>
          </div>

          <div style={{ fontSize: '28px', color: '#6B6B6B', marginTop: '24px', letterSpacing: '0.04em' }}>Link in bio</div>

          {/* Logo bottom centre */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ position: 'absolute', bottom: '60px', height: '80px', objectFit: 'contain' }} />
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
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '100px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Teal accent bar */}
          <div style={{ width: '48px', height: '4px', background: '#1B6DFC', marginBottom: '48px' }} />

          {/* Main text */}
          <div
            style={{
              fontSize: fontSize(displayText.length),
              fontWeight: 700,
              color: '#1A1A1A',
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
                fontSize: '52px',
                color: '#6B6B6B',
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
              height: '120px',
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
            background: '#FFFFFF',
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
          <div style={{ fontSize: '80px', color: '#1B6DFC', fontWeight: 700, marginBottom: '32px', lineHeight: 1 }}>?</div>

          {/* Main text */}
          <div
            style={{
              fontSize: fontSize(displayText.length),
              fontWeight: 700,
              color: '#1A1A1A',
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
                fontSize: '52px',
                color: '#6B6B6B',
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
              height: '120px',
              objectFit: 'contain',
            }}
          />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // ── AUTHORITY ─────────────────────────────────────────────
  // Clean dark card — teal accent bar, label, bold headline
  if (style === 'authority') {
    return new ImageResponse(
      (
        <div style={{ width: '1080px', height: '1080px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '100px', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '48px', height: '4px', background: '#1B6DFC', marginBottom: '36px' }} />
            {label && <div style={{ fontSize: '38px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '24px' }}>{label}</div>}
            <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '880px' }}>{displayText}</div>
            {sub && <div style={{ fontSize: '52px', color: '#6B6B6B', lineHeight: 1.5, fontWeight: 400, maxWidth: '820px', marginTop: '32px' }}>{sub}</div>}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Body Recode" style={{ height: '110px', objectFit: 'contain', alignSelf: 'flex-start' }} />
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  // ── PERSONAL BRAND ─────────────────────────────────────────────
  // Dark, minimal, one strong line. Handle at bottom. No logo.
  // Supports format=square (1080x1080) or format=story (1080x1920)
  if (style === 'personal') {
    const isStory = format === 'story'
    const W = 1080
    const H = isStory ? 1920 : 1080

    return new ImageResponse(
      (
        <div style={{ width: `${W}px`, height: `${H}px`, background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '100px', fontFamily: 'sans-serif', position: 'relative' }}>
          {/* Subtle left border accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: `${H}px`, background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            {/* Optional context label */}
            {label && (
              <div style={{ fontSize: '26px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '48px' }}>{label}</div>
            )}

            {/* Main quote */}
            <div style={{ fontSize: fontSize(displayText.length), fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '880px' }}>
              {displayText}
            </div>

            {/* Sub line */}
            {sub && (
              <div style={{ fontSize: '42px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontWeight: 400, maxWidth: '820px', marginTop: '40px' }}>{sub}</div>
            )}
          </div>

          {/* Handle at bottom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '2px', background: 'rgba(255,255,255,0.5)' }} />
            <div style={{ fontSize: '28px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>@kade_dunstone_</div>
          </div>
        </div>
      ),
      { width: W, height: H }
    )
  }

  // ── AI CO-FOUNDER METHOD ───────────────────────────────────────
  // Deep navy/indigo gradient. Indigo accent eyebrow pill. White quote.
  // URL footer with stroke. Mirrors aicofoundermethod.com visual.
  // Supports format=square (1080x1080) or format=story (1080x1920).
  if (style === 'aicm') {
    const isStory = format === 'story'
    const W = 1080
    const H = isStory ? 1920 : 1080

    // Bigger headline scale, especially for story format where the canvas is tall.
    function aicmHeadlineSize(len: number) {
      if (isStory) {
        if (len <= 40) return '120px'
        if (len <= 60) return '100px'
        if (len <= 80) return '88px'
        if (len <= 100) return '76px'
        if (len <= 120) return '66px'
        return '58px'
      }
      // square
      if (len <= 40) return '92px'
      if (len <= 60) return '76px'
      if (len <= 80) return '66px'
      if (len <= 100) return '58px'
      if (len <= 120) return '50px'
      return '44px'
    }

    return new ImageResponse(
      (
        <div style={{ width: `${W}px`, height: `${H}px`, background: 'linear-gradient(135deg, #0f0e2e 0%, #1e1b4b 50%, #2d2a6e 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: isStory ? '120px 90px' : '90px 80px', fontFamily: 'sans-serif', position: 'relative' }}>

          {/* Subtle radial glow top-right for visual texture */}
          <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(129, 140, 248, 0.18) 0%, rgba(129, 140, 248, 0) 70%)', display: 'flex' }} />

          {/* Top: brand pill */}
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 26px', background: 'rgba(167, 139, 250, 0.14)', border: '1px solid rgba(167, 139, 250, 0.45)', borderRadius: '999px', fontSize: '26px', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              AI Co-Founder Method
            </div>
          </div>

          {/* Centred main quote with quote mark accent */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, marginTop: isStory ? '60px' : '20px' }}>
            {/* Large stylised opening quote mark as visual anchor */}
            <div style={{ fontSize: isStory ? '180px' : '140px', fontWeight: 700, color: '#818cf8', lineHeight: 0.7, marginBottom: isStory ? '40px' : '24px', opacity: 0.45, fontFamily: 'serif', display: 'flex' }}>
              &ldquo;
            </div>

            {/* Optional context label */}
            {label && label !== 'AI CO-FOUNDER METHOD' && (
              <div style={{ fontSize: '26px', fontWeight: 600, color: 'rgba(196, 181, 253, 0.65)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '32px' }}>{label}</div>
            )}

            <div style={{ fontSize: aicmHeadlineSize(displayText.length), fontWeight: 800, color: '#1A1A1A', lineHeight: 1.15, letterSpacing: '-0.025em', maxWidth: '900px', display: 'flex' }}>
              {displayText}
            </div>

            {sub && (
              <div style={{ fontSize: '40px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.5, fontWeight: 400, maxWidth: '820px', marginTop: '40px', display: 'flex' }}>{sub}</div>
            )}
          </div>

          {/* Footer with stronger treatment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '2px', background: '#818cf8', display: 'flex' }} />
            <div style={{ fontSize: '30px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em' }}>aicofoundermethod.com</div>
          </div>
        </div>
      ),
      { width: W, height: H }
    )
  }

  // Default: quote card
  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1080px',
          background: '#E5E5E5',
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
        <div style={{ fontSize: '120px', color: '#1B6DFC', fontWeight: 700, lineHeight: 0.8, marginBottom: '32px', opacity: 0.6 }}>&ldquo;</div>

        {/* Main text */}
        <div
          style={{
            fontSize: fontSize(displayText.length),
            fontWeight: 700,
            color: '#1A1A1A',
            lineHeight: 1.35,
            letterSpacing: '-0.01em',
            maxWidth: '880px',
          }}
        >
          {displayText}
        </div>

        {/* Divider */}
        <div style={{ width: '60px', height: '2px', background: '#1B6DFC', margin: '48px auto 0' }} />

        {/* Logo bottom centre */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Body Recode"
          style={{
            position: 'absolute',
            bottom: '60px',
            height: '110px',
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
