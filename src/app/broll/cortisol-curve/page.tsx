'use client'

/**
 * B-roll canvas: Cortisol 24-hour curve
 *
 * Designed to be screen-recorded as a white overlay / cutaway for the
 * Blueprint education Lesson 1 (Cortisol and the Stress Response),
 * Scene 1, on the line:
 *
 *   "It peaks 30 to 45 minutes after you wake, declines through the day,
 *    and drops low by evening so melatonin can take over."
 *
 * Off-white curve on dark (per the education graphic-layer rule: white
 * graphics, no blue). Draws on over ~2.4s so a screen recording captures
 * the line building. Single full-viewport visual.
 *
 * URL: /broll/cortisol-curve (noindex - see /broll/layout.tsx)
 */

const INK = '#F2F0E9'
const MUTED = 'rgba(242,240,233,0.55)'
const FAINT = 'rgba(242,240,233,0.12)'

// Cortisol curve: moderate at wake, sharp peak ~30-45 min after waking,
// gradual decline through the day, low by evening.
const CURVE = 'M140,360 C200,300 250,120 300,100 C380,90 440,190 520,250 C620,320 680,340 740,360 C840,395 900,415 940,430 C1010,450 1050,462 1080,470'
const AREA = `${CURVE} L1080,500 L140,500 Z`

export default function CortisolCurveBroll() {
  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0E0E0E', margin: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden', position: 'relative',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drawline { to { stroke-dashoffset: 0; } }
        @keyframes fadein { to { opacity: 1; } }
        .cc-line { stroke-dasharray: 1900; stroke-dashoffset: 1900; animation: drawline 2.4s cubic-bezier(.4,0,.2,1) .3s forwards; }
        .cc-area { opacity: 0; animation: fadein 1.6s ease 1.6s forwards; }
        .cc-wake { opacity: 0; animation: fadein .6s ease .5s forwards; }
        .cc-peak { opacity: 0; animation: fadein .6s ease 1.2s forwards; }
        .cc-eve  { opacity: 0; animation: fadein .6s ease 2.5s forwards; }
        .cc-mid  { opacity: 0; animation: fadein .8s ease 2.0s forwards; }
        .cc-eyebrow { opacity: 0; animation: fadein .8s ease .1s forwards; }
      ` }} />

      <div className="cc-eyebrow" style={{
        fontSize: '15px', fontWeight: 600, letterSpacing: '0.32em', textTransform: 'uppercase',
        color: MUTED, marginBottom: '30px',
      }}>
        Cortisol &nbsp;·&nbsp; 24-hour rhythm
      </div>

      <svg viewBox="0 0 1200 560" style={{ width: 'min(92vw, 1200px)', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="ccArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INK} stopOpacity="0.16" />
            <stop offset="100%" stopColor={INK} stopOpacity="0" />
          </linearGradient>
          <filter id="ccGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* baseline */}
        <line x1="140" y1="500" x2="1080" y2="500" stroke={FAINT} strokeWidth="1.5" />

        {/* area under curve */}
        <path className="cc-area" d={AREA} fill="url(#ccArea)" />

        {/* the curve */}
        <path className="cc-line" d={CURVE} fill="none" stroke={INK} strokeWidth="3.5"
          strokeLinecap="round" filter="url(#ccGlow)" />

        {/* Wake marker */}
        <g className="cc-wake">
          <circle cx="140" cy="360" r="6" fill={INK} />
          <text x="140" y="536" fill={MUTED} fontSize="19" fontWeight="600" textAnchor="middle"
            letterSpacing="0.14em">WAKE</text>
        </g>

        {/* Peak marker */}
        <g className="cc-peak">
          <circle cx="300" cy="100" r="7" fill={INK} />
          <text x="300" y="62" fill={INK} fontSize="24" fontWeight="700" textAnchor="middle"
            letterSpacing="0.02em">PEAK</text>
          <text x="300" y="86" fill={MUTED} fontSize="16" fontWeight="500" textAnchor="middle">
            30-45 min after waking
          </text>
        </g>

        {/* mid decline label */}
        <text className="cc-mid" x="660" y="300" fill={MUTED} fontSize="17" fontWeight="500"
          textAnchor="middle" fontStyle="italic">declines through the day</text>

        {/* Evening marker */}
        <g className="cc-eve">
          <circle cx="1080" cy="470" r="6" fill={INK} />
          <text x="1080" y="536" fill={INK} fontSize="19" fontWeight="700" textAnchor="middle"
            letterSpacing="0.06em">LOW BY EVENING</text>
        </g>
      </svg>

      <div className="cc-eve" style={{ fontSize: '17px', color: MUTED, marginTop: '22px', fontWeight: 500 }}>
        melatonin takes over
      </div>
    </div>
  )
}
