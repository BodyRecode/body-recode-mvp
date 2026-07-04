'use client'

/**
 * B-roll canvas: Cortisol 24-hour curve
 *
 * White canvas matching the other /broll explainer canvases (Signal Blue
 * accent on white, big headline). Screen-recordable cutaway for Blueprint
 * education Lesson 1 (Cortisol), Scene 1:
 *
 *   "It peaks 30 to 45 minutes after you wake, declines through the day,
 *    and drops low by evening so melatonin can take over."
 *
 * URL: /broll/cortisol-curve (noindex - see /broll/layout.tsx)
 */

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const MUTED = '#6B6B6B'

const CURVE = 'M140,360 C200,300 250,120 300,100 C380,90 440,190 520,250 C620,320 680,340 740,360 C840,395 900,415 940,430 C1010,450 1050,462 1080,470'
const AREA = `${CURVE} L1080,500 L140,500 Z`

export default function CortisolCurvePage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: INK,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '80px 64px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.1) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: BLUE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 20px' }}>
          Cortisol · 24-hour rhythm
        </p>
        <h1 style={{ fontSize: '68px', fontWeight: 900, color: INK, letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 20px' }}>
          The daily cortisol curve.
        </h1>
        <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, margin: '0 0 40px', maxWidth: '820px' }}>
          It peaks 30 to 45 minutes after you wake, declines through the day, and drops low by evening so melatonin can take over.
        </p>

        <svg viewBox="0 0 1200 560" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="ccArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity="0.12" />
              <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
            </linearGradient>
          </defs>

          <line x1="140" y1="500" x2="1080" y2="500" stroke="#E5E5E5" strokeWidth="2" />
          <path d={AREA} fill="url(#ccArea)" />
          <path d={CURVE} fill="none" stroke={BLUE} strokeWidth="4" strokeLinecap="round" />

          {/* Wake */}
          <circle cx="140" cy="360" r="7" fill={BLUE} />
          <text x="140" y="536" fill={MUTED} fontSize="19" fontWeight="700" textAnchor="middle" letterSpacing="0.12em">WAKE</text>

          {/* Peak */}
          <circle cx="300" cy="100" r="8" fill={BLUE} />
          <text x="300" y="58" fill={INK} fontSize="26" fontWeight="800" textAnchor="middle">PEAK</text>
          <text x="300" y="84" fill={MUTED} fontSize="17" fontWeight="500" textAnchor="middle">30-45 min after waking</text>

          {/* mid */}
          <text x="670" y="298" fill={MUTED} fontSize="18" fontWeight="500" textAnchor="middle" fontStyle="italic">declines through the day</text>

          {/* Evening */}
          <circle cx="1080" cy="470" r="7" fill={BLUE} />
          <text x="1080" y="536" fill={INK} fontSize="19" fontWeight="800" textAnchor="middle" letterSpacing="0.04em">LOW BY EVENING</text>
          <text x="1080" y="560" fill={MUTED} fontSize="16" fontWeight="500" textAnchor="middle">melatonin takes over</text>
        </svg>
      </div>
    </div>
  )
}
